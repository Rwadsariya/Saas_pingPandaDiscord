import { DashboardPage } from "@/components/dashboard-page";
import { db } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { CategoryPageContent } from "./Category-page-content";

interface PageProps {
    params: {
        name: string | string[] | undefined
    }
}

const Page = async ({ params }: PageProps) => {

    if (typeof params.name !== 'string') {
        return notFound();
    }

    const auth = await currentUser();
    if (!auth) {
        return notFound();
    }

    const user = await db.user.findUnique({
        where: {
            externalId: auth.id
        }
    })

    if (!user) {
        return notFound();
    }

    const category = await db.eventCategory.findUnique({
        where: {
            name_userId: {
                name: params.name,
                userId: user.id
            }
        },
        include: {
            _count: {
              select:{
                events: true
              }
            }
        }
    })

    if (!category) {
        return notFound();
    }

    const hasEvent = category._count.events > 0;

    return (
        <DashboardPage title={`${category.emoji} ${category.name} events`}>
            <CategoryPageContent hasEvent={hasEvent} category={category}>

            </CategoryPageContent>
        </DashboardPage>
    )
}

export default Page;