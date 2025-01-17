import { db } from "@/db"
import { j } from "./__internals/j"
import { HTTPException } from "hono/http-exception"
import { currentUser } from "@clerk/nextjs/server"

const authMiddleware = j.middleware(async ({c,next})=>{

    const authHeader = c.req.header("Cookie")
    console.log(authHeader)
    if (authHeader){
        // Bearer <API_KEY>
        const apiKey = authHeader.split(" ")[1]
        console.log(apiKey)

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
    console.log(auth)
    if (!auth){
        console.log('inside auth')
        throw new HTTPException(401,{message:"Unauthorized"})
    }

    const user = await db.user.findUnique({
        where: {
            externalId: auth.id
        }
    })

    if (!user){
        console.log('inside auth')
        throw new HTTPException(401,{message:"Unauthorized"})
    }

    return next({ user })
})


export const baseProcedure = j.procedure
export const publicProcedure = baseProcedure
export const privateProcedure = publicProcedure.use(authMiddleware)