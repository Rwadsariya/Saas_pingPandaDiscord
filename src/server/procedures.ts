import { auth } from "@clerk/nextjs/server"
import { j } from "./__internals/j"

const authMiddleware = j.middleware(({next})=>{
    const user = {name : "Ron"}
    return next({ user })
})


export const baseProcedure = j.procedure
export const publicProcedure = baseProcedure
export const privateProcedure = publicProcedure.use(authMiddleware)