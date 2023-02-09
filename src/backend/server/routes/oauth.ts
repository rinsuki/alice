import { ContextFromRouter, Router } from "piyo"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { IsNull } from "typeorm"
import { z } from "zod"

import { dataSource } from "../../db/data-source.js"
import { LocalApplication } from "../../db/entities/local-application.js"
import { OAuthAccessToken } from "../../db/entities/oauth-access-token.js"
import { OAuthAuthorizationCode } from "../../db/entities/oauth-authorization-code.js"
import { User } from "../../db/entities/user.js"
import { getCSRFToken, verifyCSRFToken } from "../utils/csrf.js"
import { OAuthError } from "../utils/errors/oauth-error.js"
import { useBody } from "../utils/use-body.js"
import { OAuthAuthorizePage } from "../views/html/pages/oauth/authorize.js"

const router = new Router()

async function appFromContext(ctx: ContextFromRouter<typeof router>) {
    const queryParams = z
        .object({
            client_id: z.string(),
            // not required by RFC 6749, but Mastodon requires it
            redirect_uri: z.string(),
            response_type: z.string(),
            scope: z.string().optional(),
            state: z.string().optional(),
        })
        .parse(ctx.query)

    // TODO: validate scope
    const scope = queryParams.scope ?? "read"

    if (queryParams.response_type !== "code") {
        throw ctx.throw(400, "response_type should be 'code'")
    }

    const app = await dataSource.getRepository(LocalApplication).findOne({
        where: {
            clientID: queryParams.client_id,
        },
        relations: ["application"],
    })

    if (app == null) {
        throw ctx.throw(400, "Invalid client_id")
    }

    if (!app.redirectURIs.includes(queryParams.redirect_uri)) {
        throw ctx.throw(400, "Invalid Redirect URI")
    }

    return {
        app,
        scopes: scope.trim().split(" "),
        state: queryParams.state,
        redirect_uri: queryParams.redirect_uri,
    }
}

router.get("/authorize", async ctx => {
    const { app, scopes } = await appFromContext(ctx)

    ctx.body = `<!DOCTYPE html>\n${renderToStaticMarkup(
        createElement(OAuthAuthorizePage, {
            app,
            siteName: "",
            scopes,
            csrfToken: await getCSRFToken(ctx),
        }),
    )}`
})

router.post("/authorize", async ctx => {
    const { app, scopes, state, redirect_uri } = await appFromContext(ctx)

    const body = await useBody(ctx)
    const parsedBody = z
        .object({
            screen_name: z.string(),
            password: z.string(),
            csrf_token: z.string(),
        })
        .parse(body)

    if (!verifyCSRFToken(ctx, parsedBody.csrf_token)) {
        throw ctx.throw(400, "CSRF Token is invalid")
    }

    const user = await dataSource.getRepository(User).findOne({
        where: {
            screenName: parsedBody.screen_name,
            domain: IsNull(),
        },
        relations: ["localUser"],
    })

    if (user == null) throw ctx.throw(400, "Invalid screen name")
    const { localUser } = user
    if (localUser == null) throw ctx.throw(400, "Invalid user")
    if (!(await localUser.checkPassword(parsedBody.password))) {
        throw ctx.throw(400, "Invalid password")
    }

    const code = new OAuthAuthorizationCode()
    code.localApplication = app
    code.localUser = localUser
    code.redirectURI = redirect_uri
    code.scopes = scopes
    await code.generateCode()
    await dataSource.getRepository(OAuthAuthorizationCode).insert(code)

    const url = new URL(redirect_uri)
    url.searchParams.set("code", code.code)
    if (state != null) {
        url.searchParams.set("state", state)
    }
    ctx.redirect(url.href)
})

router.post("/token", async ctx => {
    const body = await useBody(ctx)
    const parsedBodyFirstStage = z
        .object({
            grant_type: z.string(),
        })
        .parse(body)
    if (parsedBodyFirstStage.grant_type !== "authorization_code") {
        throw new OAuthError("UNSUPPORTED_GRANT_TYPE")
    }
    const parsedBody = z
        .object({
            grant_type: z.literal("authorization_code"),
            code: z.string(),
            redirect_uri: z.string(),
            client_id: z.string(),
            client_secret: z.string(),
        })
        .parse(body)

    const code = await dataSource.getRepository(OAuthAuthorizationCode).findOne({
        where: {
            code: parsedBody.code,
        },
        relations: ["localApplication", "localUser"],
    })

    if (code == null) {
        throw new OAuthError("CODE_NOT_FOUND")
    }

    if (code.redirectURI !== parsedBody.redirect_uri) {
        throw new OAuthError("REDIRECT_URI_MISMATCH")
    }

    if (code.localApplication.clientID !== parsedBody.client_id) {
        throw new OAuthError("ANOTHER_INVALID_GRANT")
    }

    if (!code.localApplication.checkClientSecret(parsedBody.client_secret)) {
        throw new OAuthError("ANOTHER_INVALID_GRANT")
    }

    const token = new OAuthAccessToken()
    token.localApplication = code.localApplication
    token.localUser = code.localUser
    token.scopes = code.scopes
    const access_token = await token.generate()
    await dataSource.getRepository(OAuthAccessToken).insert(token)

    ctx.body = {
        access_token,
        token_type: "Bearer",
        scope: token.scopes.join(" "),
        created_at: token.createdAt.getTime() / 1000,
    }
})

export default router
