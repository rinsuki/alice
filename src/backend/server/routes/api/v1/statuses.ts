import { Router } from "piyo"
import { z } from "zod"

import { dataSource } from "../../../../db/data-source.js"
import { Follow } from "../../../../db/entities/follow.js"
import { Post } from "../../../../db/entities/post.js"
import { User } from "../../../../db/entities/user.js"
import { LOCAL_DOMAIN } from "../../../environment.js"
import { addJob } from "../../../utils/add-job.js"
import { APIError } from "../../../utils/errors/api-error.js"
import { generateSnowflakeID } from "../../../utils/generate-snowflake.js"
import { textToHtml } from "../../../utils/text-parser.js"
import { useBody } from "../../../utils/use-body.js"
import { useToken } from "../../../utils/use-token.js"
import { renderActivityPubPostActivity } from "../../../views/ap/post.js"
import { renderAPIPost } from "../../../views/api/post.js"

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
        throw new Error("oops failed")
    })

    ctx.body = renderAPIPost(post)
})

router.get("/:id", async ctx => {
    const { id } = z.object({ id: z.string() }).parse(ctx.params)
    const post = await dataSource.getRepository(Post).findOne({
        where: { id },
        relations: ["user", "application"],
    })
    if (post == null) throw new APIError(404, "Not found")
    ctx.body = renderAPIPost(post)
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
    })
    ctx.body = renderAPIPost(post) // ???
})

export default router
