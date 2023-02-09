import { ContextFromRouter, Router } from "piyo"
import { z } from "zod"

import { dataSource } from "../../db/data-source.js"
import { Post } from "../../db/entities/post.js"
import { User } from "../../db/entities/user.js"
import { apInbox } from "../ap/inbox.js"
import { MIME_ACTIVITY_JSON } from "../constants.js"
import { renderActivityPubPost } from "../views/ap/post.js"
import { renderActivityPubUser, renderActivityPubUserOutbox } from "../views/ap/user.js"

function handleActivityPubUser(ctx: ContextFromRouter<typeof router>, user: User | null) {
    if (user == null) {
        throw ctx.throw(404, "User not found")
    }

    if (user?.localUser == null) {
        throw ctx.redirect(user.uri)
    }

    ctx.body = renderActivityPubUser(user)
    ctx.type = MIME_ACTIVITY_JSON
}

const router = new Router()
router.get("/id/:id", async ctx => {
    const { id } = z
        .object({
            id: z.string(),
        })
        .parse(ctx.params)

    const user = await dataSource.getRepository(User).findOne({
        where: { id },
        relations: ["localUser"],
    })
    if (user?.localUser != null) user.localUser.user = user

    handleActivityPubUser(ctx, user)
})

router.post("/id/:id/inbox", async ctx => {
    const { id } = z
        .object({
            id: z.string(),
        })
        .parse(ctx.params)

    const user = await dataSource.getRepository(User).findOne({
        where: { id },
        relations: ["localUser"],
    })
    if (user == null) {
        throw ctx.throw(404, "User not found")
    }
    if (user.localUser == null) {
        throw ctx.throw(404, "User is not local user")
    }
    if (user.localUser != null) user.localUser.user = user
    return await apInbox(ctx, user?.localUser)
})

router.get("/id/:id/outbox", async ctx => {
    const { id } = z
        .object({
            id: z.string(),
        })
        .parse(ctx.params)

    const user = await dataSource.getRepository(User).findOne({
        where: { id },
        relations: ["localUser"],
    })
    if (user?.localUser != null) user.localUser.user = user

    handleActivityPubUser(ctx, user)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ctx.body = await renderActivityPubUserOutbox(user!)
})

router.get("/id/:uid/statuses/:sid", async ctx => {
    const { uid, sid } = z
        .object({
            uid: z.string(),
            sid: z.string(),
        })
        .parse(ctx.params)

    const user = await dataSource.getRepository(User).findOne({
        where: { id: uid },
    })

    if (user == null) return // 404

    const post = await dataSource.getRepository(Post).findOne({
        where: { id: sid, userID: user.id },
        relations: ["user", "application"],
    })

    if (post == null) return // 404

    ctx.body = renderActivityPubPost(post)
    ctx.type = MIME_ACTIVITY_JSON
})

export default router
