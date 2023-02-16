import { Router } from "piyo"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { Follow } from "@/backend/db/entities/follow.js"
import { Post } from "@/backend/db/entities/post.js"
import { User } from "@/backend/db/entities/user.js"
import { APIError } from "@/backend/server/utils/errors/api-error.js"
import { textToHtml } from "@/backend/server/utils/text-parser.js"
import { useBody } from "@/backend/server/utils/use-body.js"
import { useToken } from "@/backend/server/utils/use-token.js"
import {
    renderActivityPubPostActivity,
    renderActivityPubPostDeleteActivity,
} from "@/backend/server/views/ap/post.js"
import { renderAPIPost } from "@/backend/server/views/api/post.js"
import { LOCAL_DOMAIN } from "@/backend/shared/environment.js"
import { createFavourite, removeFavourite } from "@/backend/shared/services/favourite.js"
import { addJob } from "@/backend/shared/utils/add-job.js"
import { deliverToEveryone } from "@/backend/shared/utils/deliver-to-everyone.js"
import { generateSnowflakeID } from "@/backend/shared/utils/generate-snowflake.js"

const router = new Router()

router.post("/", async ctx => {
    const token = await useToken(ctx)

    if (token == null) throw new APIError(401, "Unauthorized")

    const body = await useBody(ctx)
    const parsedBody = z
        .object({
            // TODO: support media attachments
            status: z.string(),
            // media_ids: z.array(z.string()).optional(),
            visibility: z.string().optional(),
            spoiler_text: z.string().optional(),
        })
        .parse(body)

    const post = new Post()
    post.id = (await generateSnowflakeID()).toString()
    post.uri = `${token.user.uri}/statuses/${post.id}`
    post.url = `https://${LOCAL_DOMAIN}/@${token.user.screenName}/${post.id}`
    post.html = textToHtml(parsedBody.status)
    post.user = token.user
    post.application = token.application
    post.spoiler = parsedBody.spoiler_text ?? ""
    post.visibility = parsedBody.visibility ?? "public"
    if (!["public", "unlisted"].includes(post.visibility)) {
        throw new APIError(400, "Invalid visibility (private/direct is not supported)")
    }

    await dataSource.transaction(async manager => {
        if (manager.queryRunner == null) throw new Error("QUERY_RUNNER_MISSING")
        await manager.getRepository(Post).insert(post)
        await manager.getRepository(User).increment(
            {
                id: token.user.id,
            },
            "postsCount",
            1,
        )
        const followers = await manager.getRepository(Follow).find({
            where: {
                toUserId: token.user.id,
                accepted: true,
            },
            relations: ["fromUser"],
        })
        console.log(
            "publish to",
            followers.map(f => f.fromUser.uri),
        )
        // TODO: move this to job
        // TODO: use shared inbox and dedup by shared inbox url
        for (const follower of followers) {
            await addJob(manager.queryRunner, "deliverV1", {
                activity: renderActivityPubPostActivity(post),
                senderUserId: token.user.id,
                targetUserId: follower.fromUser.id,
                useSharedInbox: false,
            })
        }
    })

    ctx.body = await renderAPIPost(post, token?.localUser)
})

router.get("/:id", async ctx => {
    const token = await useToken(ctx)
    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const post = await dataSource.getRepository(Post).findOne({
        where: { id },
        relations: ["user", "application"],
    })
    if (post == null) throw new APIError(404, "Not found")
    ctx.body = await renderAPIPost(post, token?.localUser)
})

router.delete("/:id", async ctx => {
    const token = await useToken(ctx)

    if (token == null) throw new APIError(401, "Unauthorized")

    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const post = await dataSource.getRepository(Post).findOne({
        where: { id },
        relations: ["user", "application"],
    })
    if (post == null) throw new APIError(404, "Not found")
    if (post.user.id !== token.user.id) throw new APIError(403, "Forbidden")

    await dataSource.transaction(async manager => {
        if (manager.queryRunner == null) throw new Error("QUERY_RUNNER_MISSING")
        await manager.getRepository(Post).delete({
            id,
        })
        await manager.getRepository(User).decrement(
            {
                id: token.user.id,
            },
            "postsCount",
            1,
        )
        await deliverToEveryone(
            manager.queryRunner,
            token.user,
            renderActivityPubPostDeleteActivity(post),
        )
    })
    ctx.body = await renderAPIPost(post, token.localUser) // ???
})

router.post("/:id/favourite", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")
    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const post = await dataSource.getRepository(Post).findOne({
        where: { id },
        relations: ["user", "application"],
    })
    if (post == null) throw new APIError(404, "Not found")
    await dataSource.transaction(async manager => {
        await createFavourite(token.user, post, manager)
    })
    ctx.body = await renderAPIPost(
        await dataSource.getRepository(Post).findOneOrFail({
            where: { id },
            relations: ["user", "application"],
        }),
        token.localUser,
    )
})

router.post("/:id/unfavourite", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")
    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const post = await dataSource.getRepository(Post).findOne({
        where: { id },
        relations: ["user", "application"],
    })
    if (post == null) throw new APIError(404, "Not found")
    await dataSource.transaction(async manager => {
        await removeFavourite(token.user, post, manager)
    })
    ctx.body = await renderAPIPost(
        await dataSource.getRepository(Post).findOneOrFail({
            where: { id },
            relations: ["user", "application"],
        }),
        token.localUser,
    )
})

export default router
