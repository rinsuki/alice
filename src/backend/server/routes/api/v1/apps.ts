import { Router } from "piyo"
import { z } from "zod"

import { dataSource } from "../../../../db/data-source.js"
import { Application } from "../../../../db/entities/application.js"
import { LocalApplication } from "../../../../db/entities/local-application.js"
import { JSONError } from "../../../utils/errors/json-error.js"
import { useBody } from "../../../utils/use-body.js"

const router = new Router()

router.post("/", async ctx => {
    const body = z
        .object({
            client_name: z.string(),
            redirect_uris: z.string(),
            scopes: z.string(),
            website: z.string().optional(),
        })
        .parse(await useBody(ctx))
    if (body.website != null) {
        const url = new URL(body.website)
        if (url.protocol !== "https:" && url.protocol !== "http:") {
            throw new JSONError(400, {
                error: "website URL should be HTTP or HTTPS",
            })
        }
    }
    const { localApp, clientSecret } = await LocalApplication.create()
    localApp.application.name = body.client_name
    localApp.application.website = body.website ?? null
    localApp.redirectURIs = body.redirect_uris.trim().split(" ")
    localApp.scopes = body.scopes.trim().split(" ")
    localApp.isSuperApp = false

    // TODO: validate URI/URLs

    await dataSource.transaction(async manager => {
        await manager.getRepository(Application).insert(localApp.application)
        await manager.getRepository(LocalApplication).insert(localApp)
    })

    ctx.body = {
        id: localApp.id.toString(),
        name: localApp.application.name,
        website: localApp.application.website,
        redirect_uri: localApp.redirectURIs.join(" "),
        client_id: localApp.clientID,
        client_secret: clientSecret,
        vapid_key: "",
    }
    ctx.type = "json"
})

export default router
