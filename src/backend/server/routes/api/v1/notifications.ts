import { Router } from "piyo"

import { dataSource } from "@/backend/db/data-source.js"
import { Notification } from "@/backend/db/entities/notification.js"
import { APIError } from "@/backend/server/utils/errors/api-error.js"
import { useToken } from "@/backend/server/utils/use-token.js"
import { renderAPINotifications } from "@/backend/server/views/api/notification.js"

const router = new Router()

router.get("/", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")
    const notifications = await dataSource.getRepository(Notification).find({
        relations: ["post", "post.user", "post.application", "user"],
    })

    ctx.body = await renderAPINotifications(notifications, token.localUser)
})

export default router
