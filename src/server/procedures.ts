import { db } from "@/db"
import { j } from "./__internals/j"
import { HTTPException } from "hono/http-exception"
import { currentUser } from "@clerk/nextjs/server"

const authMiddleware = j.middleware(async ({c,next})=>{

    const authHeader = c.req.header("Authorization")
    if (authHeader){
        // Bearer <API_KEY>
        const apiKey = authHeader.split(" ")[1]

        const user = await db.user.findUnique({
            where: {
                apiKey
            }
        })

        if(user){
            return next({ user })
        }
        
    }

    const auth = await currentUser()
    if (!auth){
        throw new HTTPException(401,{message:"Unauthorized"})
    }

    const user = await db.user.findUnique({
        where: {
            externalId: auth.id
        }
    })

    if (!user){
        throw new HTTPException(401,{message:"Unauthorized"})
    }

    return next({ user })
})


export const baseProcedure = j.procedure
export const publicProcedure = baseProcedure
export const privateProcedure = publicProcedure.use(authMiddleware)