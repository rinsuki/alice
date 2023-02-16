import { ContextFromRouter, Router } from "piyo"

import { asyncRandomBytes } from "@/backend/shared/utils/async-random-bytes.js"

const CSRF_COOKIE_NAME = "alice.csrf"
const CSRF_BYTES = 32

export async function getCSRFToken(ctx: ContextFromRouter<Router>) {
    const currentToken = ctx.cookies.get(CSRF_COOKIE_NAME)
    if (typeof currentToken === "string" && currentToken.length === CSRF_BYTES * 2) {
        return currentToken
    }
    const newToken = await asyncRandomBytes(CSRF_BYTES).then(r => r.toString("hex"))
    ctx.cookies.set(CSRF_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: true,
    })
    return newToken
}

export function verifyCSRFToken(ctx: ContextFromRouter<Router>, token: string) {
    const currentToken = ctx.cookies.get(CSRF_COOKIE_NAME)
    if (typeof currentToken !== "string" || currentToken.length !== CSRF_BYTES * 2) {
        return false
    }
    return currentToken === token
}
