import { Router } from "piyo"

import { dataSource } from "../../../../db/data-source.js"
import { Notification } from "../../../../db/entities/notification.js"
import { APIError } from "../../../utils/errors/api-error.js"
import { useToken } from "../../../utils/use-token.js"
import { renderAPINotification } from "../../../views/api/notification.js"

const router = new Router()

router.get("/", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")
    const notifications = await dataSource.getRepository(Notification).find({
        relations: ["post", "post.user", "post.application", "user"],
    })

    ctx.body = notifications.map(notification => renderAPINotification(notification))
})

export default router
