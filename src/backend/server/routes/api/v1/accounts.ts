import { Router } from "piyo"
import { In, IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { Follow } from "@/backend/db/entities/follow.js"
import { Post } from "@/backend/db/entities/post.js"
import { User } from "@/backend/db/entities/user.js"
import { APIError } from "@/backend/server/utils/errors/api-error.js"
import { useBody } from "@/backend/server/utils/use-body.js"
import { useToken } from "@/backend/server/utils/use-token.js"
import { renderAPILocalUser } from "@/backend/server/views/api/local-user.js"
import { renderAPIPosts } from "@/backend/server/views/api/post.js"
import { renderAPIUser } from "@/backend/server/views/api/user.js"
import { updateLocalUserProfile } from "@/backend/shared/services/user.js"

const router = new Router()

router.get("/verify_credentials", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")

    ctx.body = {
        ...renderAPIUser(token.user),
        source: renderAPILocalUser(token.localUser),
    }
})

router.get("/relationships", async ctx => {
    const query = z
        .object({
            "id[]": z.string().or(z.array(z.string())),
        })
        .parse(ctx.request.query)
    const ids = (typeof query["id[]"] === "string" ? [query["id[]"]] : query["id[]"]).map(id =>
        BigInt(id),
    )

    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")

    const users = await dataSource.getRepository(User).findBy({
        id: In(ids),
    })

    const following = await dataSource.getRepository(Follow).findBy({
        fromUserId: token.user.id,
        toUserId: In(ids),
    })

    const followedBy = await dataSource.getRepository(Follow).findBy({
        fromUserId: In(ids),
        toUserId: token.user.id,
        accepted: true,
    })

    // TODO: check relationships
    ctx.body = users.map(user => ({
        id: user.id,
        following: following.some(follow => follow.toUserId === user.id && follow.accepted),
        showing_reblogs: false,
        notifying: false,
        followed_by: followedBy.some(follow => follow.fromUserId === user.id && follow.accepted),
        blocking: false,
        blocked_by: false,
        muting: false,
        muting_notifications: false,
        requested: following.some(follow => follow.toUserId === user.id && !follow.accepted),
        domain_blocking: false,
        endorsed: false,
        note: "Project Alice: per-user note isn't implemented currently",
    }))
})

router.get("/lookup", async ctx => {
    const { acct } = z.object({ acct: z.string() }).parse(ctx.request.query)
    const user = await dataSource.getRepository(User).findOne({
        where: {
            screenName: acct,
            domain: IsNull(), // TODO: support remote user resolve
        },
    })
    if (user == null) throw new APIError(404, "Record not found")

    ctx.body = renderAPIUser(user)
})

router.patch("/update_credentials", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")
    const params = z
        .object({
            display_name: z.string().optional(),
            note: z.string().optional(),
        })
        .parse(await useBody(ctx))
    const user = await updateLocalUserProfile(token.localUser, {
        displayName: params.display_name,
        note: params.note,
    })

    ctx.body = {
        ...renderAPIUser(user),
        source: renderAPILocalUser(token.localUser),
    }
})

router.get("/:id", async ctx => {
    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const user = await dataSource.getRepository(User).findOneBy({ id })
    if (user == null) throw new APIError(404, "User not found")

    ctx.body = renderAPIUser(user)
})

router.get("/:id/followers", async ctx => {
    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const user = await dataSource.getRepository(User).findOneBy({ id })
    if (user == null) throw new APIError(404, "User not found")

    const follows = await dataSource.getRepository(Follow).find({
        where: {
            toUserId: user.id,
            accepted: true,
        },
        relations: ["fromUser"],
        order: {
            id: "DESC",
        },
    })

    ctx.body = follows.map(follow => renderAPIUser(follow.fromUser))
})

router.get("/:id/statuses", async ctx => {
    const token = await useToken(ctx)
    const query = z
        .object({
            pinned: z.string().optional(),
        })
        .parse(ctx.request.query)

    const user = await dataSource.getRepository(User).findOneBy({
        id: ctx.params.id,
    })

    if (user == null) throw new APIError(404, "User not found")

    if (query.pinned != null) {
        // STUB: currently pinned posts aren't implemented
        ctx.body = []
        return
    }

    const posts = await dataSource.getRepository(Post).find({
        where: {
            userID: user.id,
        },
        order: {
            id: "DESC",
        },
        relations: ["application", "user"],
    })

    ctx.body = await renderAPIPosts(posts, token?.localUser)
})

export default router
