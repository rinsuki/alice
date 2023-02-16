import { Router } from "piyo"
import { In } from "typeorm"
import { z } from "zod"

import { dataSource } from "@/backend/db/data-source.js"
import { Post } from "@/backend/db/entities/post.js"
import { APIError } from "@/backend/server/utils/errors/api-error.js"
import { useToken } from "@/backend/server/utils/use-token.js"
import { renderAPIPosts } from "@/backend/server/views/api/post.js"
import { zNumberString } from "@/backend/shared/utils/z-number-string.js"

const router = new Router()

router.get("/public", async ctx => {
    const token = await useToken(ctx)
    const posts = await dataSource.getRepository(Post).find({
        where: { visibility: "public" },
        order: {
            id: "DESC",
        },
        relations: ["user", "application"],
    })

    ctx.body = await renderAPIPosts(posts, token?.localUser)
})

router.get("/home", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new APIError(401, "Unauthorized")

    const params = z
        .object({
            min_id: z.optional(z.string()),
            max_id: z.optional(z.string()),
            since_id: z.optional(z.string()),
            limit: z.optional(zNumberString).default(() => "20"),
        })
        .parse(ctx.query)
    console.log(params)

    const posts = await dataSource.getRepository(Post).find({
        where: { userID: In([token.user.id]) },
        order: {
            id: "DESC",
        },
        relations: ["user", "application"],
        take: params.limit,
    })

    ctx.body = await renderAPIPosts(posts, token.localUser)
})

export default router
