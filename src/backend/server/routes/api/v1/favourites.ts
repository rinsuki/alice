import { Router } from "piyo"

import { dataSource } from "@/backend/server/../db/data-source.js"
import { Favourite } from "@/backend/server/../db/entities/favourite.js"
import { JSONError } from "@/backend/server/utils/errors/json-error.js"
import { useToken } from "@/backend/server/utils/use-token.js"
import { renderAPIPosts } from "@/backend/server/views/api/post.js"

const router = new Router()

router.get("/", async ctx => {
    const token = await useToken(ctx)
    if (token == null) throw new JSONError(401, { error: "Unauthorized" })
    const favourites = await dataSource.getRepository(Favourite).find({
        where: {
            userId: token.user.id,
        },
        relations: ["post", "post.user", "post.application"],
        order: {
            id: "DESC",
        },
    })

    ctx.body = await renderAPIPosts(
        favourites.map(f => f.post),
        token.localUser,
    )
})

export default router
