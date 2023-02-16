import { createHash } from "node:crypto"

import { ContextFromRouter, Router } from "piyo"

import { dataSource } from "@/backend/db/data-source.js"
import { OAuthAccessToken } from "@/backend/db/entities/oauth-access-token.js"

const router = new Router()

export async function useToken(ctx: ContextFromRouter<typeof router>) {
    const authorizationHeader = ctx.headers.authorization
    if (authorizationHeader == null) return
    if (!authorizationHeader.startsWith("Bearer ")) return
    const token = authorizationHeader.substring("Bearer ".length)
    const hashedToken = createHash("sha256").update(token).digest("base64")

    const accessToken = await dataSource.getRepository(OAuthAccessToken).findOne({
        where: {
            hashedAccessToken: hashedToken,
        },
        relations: [
            "localUser",
            "localUser.user",
            "localApplication",
            "localApplication.application",
        ],
    })

    if (accessToken == null) return
    return accessToken
}
