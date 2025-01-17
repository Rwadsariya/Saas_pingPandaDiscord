import { FREE_QUOTA, PRO_QUOTA } from "@/config"
import { db } from "@/db"
import { DiscordClient } from "@/lib/discord-client"
import { CATEGORY_NAME_VALIDATOR } from "@/lib/validator/category-validator"
import { time } from "console"
import { color, m } from "motion/react"
import { NextRequest, NextResponse } from "next/server"
import { use } from "react"
import { z } from "zod"

const REQUEST_VALIDATOR = z
  .object({
    category: CATEGORY_NAME_VALIDATOR,
    fields: z.record(z.string().or(z.number()).or(z.boolean()).optional()),
    description: z.string().optional(),
  })
  .strict()

export const POST = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      )
    }

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "Invalid authorization header, Expected 'Bearer [API-key]'",
        },
        { status: 401 }
      )
    }

    const apiKey = authHeader.split(" ")[1]

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        {
          message: "Invalid API KEY, Expected 'Bearer [API-key]'",
        },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: {
        apiKey,
      },
      include: {
        EventCategories: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid API KEY",
        },
        { status: 401 }
      )
    }

    if (!user.discordId) {
      return NextResponse.json(
        {
          message: "Please enter your discord Id in your account setting",
        },
        { status: 403 }
      )
    }

    // Actual LOGIC

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const quota = await db.quota.findUnique({
      where: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
      },
    })

    const quotaLimit =
      user.plan === "FREE"
        ? FREE_QUOTA.maxEventPerMonth
        : PRO_QUOTA.maxEventPerMonth

    if (quota && quota.count >= quotaLimit) {
      return NextResponse.json(
        {
          message:
            "You have reached your Free monthly quota limit, please upgrade to pro plan for more events.",
        },
        { status: 429 }
      )
    }

    const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN)

    const dmChannel = await discord.createDM(user.discordId)

    let requestData: unknown

    try {
      requestData = await req.json()
    } catch (error) {
      return NextResponse.json(
        {
          message: "Invalid JSON request data",
        },
        { status: 400 }
      )
    }

    const validationResult = REQUEST_VALIDATOR.parse(requestData)

    const category = user.EventCategories.find(
      (cate) => cate.name === validationResult.category
    )

    if (!category) {
      return NextResponse.json(
        {
          message: `you don't have a category named ${validationResult.category}`,
        },
        { status: 404 }
      )
    }

    const eventData = {
      title: `${category.emoji || "🔔"} ${
        category.name.charAt(0).toUpperCase() + category.name.slice(1)
      }`,
      description:
        validationResult.description ||
        `A new event has been created in ${category.name} category`,
      color: category.color,
      timestamp: new Date().toISOString(),
      fields: Object.entries(validationResult.fields || {}).map(
        ([key, value]) => {
          return {
            name: key,
            value: String(value),
            inline: true,
          }
        }
      ),
    }

    const event = await db.event.create({
      data: {
        name: category.name,
        formattedMessage: `${eventData.title}\n\n${eventData.description}`,
        userId: user.id,
        fields: validationResult.fields || {},
        eventCategoryId: category.id,
      },
    })

    try {
      await discord.sendEmbed(dmChannel.id, eventData)

      await db.event.update({
        where: {
          id: event.id,
        },
        data: {
          deliveryStatus: "DELIVERED",
        },
      })

      await db.quota.upsert({
        where: {
          userId: user.id,
          month: currentMonth,
          year: currentYear,
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          count: 1,
        },
      })
    } catch (error) {
      await db.event.update({
        where: {
          id: event.id,
        },
        data: {
          deliveryStatus: "FAILED",
        },
      })

      console.log(error)

      return NextResponse.json(
        {
          message: "Failed to send event to discord, Error processing event",
          eventId: event.id,
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json(
      {
        message: "Event created successfully",
        eventId: event.id,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}
