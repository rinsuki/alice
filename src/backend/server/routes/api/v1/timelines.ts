import { Router } from "piyo"
import { In } from "typeorm"
import { z } from "zod"

import { dataSource } from "../../../../db/data-source.js"
import { Post } from "../../../../db/entities/post.js"
import { APIError } from "../../../utils/errors/api-error.js"
import { useToken } from "../../../utils/use-token.js"
import { zNumberString } from "../../../utils/z-number-string.js"
import { renderAPIPosts } from "../../../views/api/post.js"

const router = new Router()

router.get("/public", async ctx => {
    const posts = await dataSource.getRepository(Post).find({
        where: { visibility: "public" },
        order: {
            id: "DESC",
        },
        relations: ["user", "application"],
    })

    ctx.body = renderAPIPosts(posts)
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

    ctx.body = renderAPIPosts(posts)
})

export default router
