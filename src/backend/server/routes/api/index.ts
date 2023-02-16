import { Router } from "piyo"

import v1Router from "./v1/index.js"

const router = new Router()
router.all("(.*)", (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*")
    ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
    ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if (ctx.method === "OPTIONS") {
        ctx.status = 200
        return
    }
    return next()
})
router.useRouter("/v1", v1Router)

export default router
