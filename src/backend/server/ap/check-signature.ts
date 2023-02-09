import { createHash, createVerify } from "node:crypto"

import { ContextFromRouter, Router } from "piyo"

import { dataSource } from "../../db/data-source.js"
import { User } from "../../db/entities/user.js"
import { isNotNull } from "../utils/is-not-null.js"
import { StringParser } from "../utils/string-reader.js"
import { useRawBody } from "../utils/use-body.js"

import { resolveUser } from "./resolve/user.js"

async function checkHTTPDigestHeader(ctx: ContextFromRouter<Router>) {
    const rawBody = await useRawBody(ctx)

    const digestHeader = new Map(
        ctx
            .get("digest")
            .split(",")
            // eslint-disable-next-line prefer-named-capture-group
            .map(a => /^(.+?)=(.+)$/.exec(a.trim()))
            .filter(isNotNull)
            .map(a => [a[1].toLowerCase(), a[2]]),
    )
    if (digestHeader.size < 1) {
        if (ctx.method === "GET" && rawBody.length === 0) return
        throw ctx.throw(
            401,
            "Project Alice requires Digest header for non-GET ActivityPub requests",
        )
    }

    const sha256Hash = digestHeader.get("sha-256")
    if (sha256Hash == null) {
        throw ctx.throw(401, "Project Alice requires SHA-256 to Digest header")
    }
    const bodySHA256 = createHash("sha256").update(rawBody).digest("base64")
    if (bodySHA256 !== sha256Hash) {
        throw ctx.throw(401, "Failed to verify Digest header with request body")
    }
}

export async function verifyHTTPSignatureHeaders(ctx: ContextFromRouter<Router>, headers: string) {
    const headersArray = headers.split(" ")
    const headersSet = new Set(headersArray)
    if (ctx.method === "GET") {
        if (!headersSet.has("host")) {
            throw ctx.throw(401, "Project Alice requires sign to Host header for GET requests")
        }
    } else {
        if (!headersSet.has("digest")) {
            throw ctx.throw(401, "Project Alice requires sign to Digest header for POST requests")
        }
    }
    // TODO: support (created) header
    if (!headersSet.has("date")) {
        throw ctx.throw(401, "Project Alice requires sign to Date header for requests")
    }

    return headersArray
}

export async function checkHTTPSignature(
    ctx: ContextFromRouter<Router>,
    useCache = true,
): Promise<User> {
    // Parse Signature Header (based on draft-cavage-http-signatures-12)
    // https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12#section-3.1

    const signatureHeader = ctx.get("signature")
    if (signatureHeader.length === 0) {
        throw ctx.throw(401, "Project Alice requires Signature header for inbox requests")
    }

    const parser = new StringParser(signatureHeader)
    const authParamsArray = parser.readSharpAuthParam()
    if (authParamsArray == null) {
        throw ctx.throw(401, "Failed to parse Signature header")
    }

    const params = new Map<string, string>()

    for (const { name, value } of authParamsArray) {
        if (params.has(name)) {
            throw ctx.throw(401, "Duplicate parameter")
        }
        params.set(name, value)
    }

    const algorithm = params.get("algorithm")
    if (algorithm == null) {
        throw ctx.throw(401, "Missing algorithm parameter")
    }
    // TODO: support hs2019
    if (algorithm !== "rsa-sha256") {
        throw ctx.throw(401, "Unsupported algorithm")
    }

    const receivedSignature = params.get("signature")
    if (receivedSignature == null) {
        throw ctx.throw(401, "Missing signature parameter")
    }

    const keyId = params.get("keyId")
    if (keyId == null) {
        throw ctx.throw(401, "Missing keyId parameter")
    }

    const userId = await dataSource.getRepository(User).findOne({
        where: { publicKeyID: keyId },
        select: ["_uri"],
    })
    const user = await resolveUser(
        userId?._uri ?? keyId,
        useCache ? "use-cache-if-not-outdated" : "always-refetch",
    )

    // Generate Signature String
    // https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12#section-2.3
    const headers = params.get("headers")
    if (headers == null) {
        throw ctx.throw(401, "Missing headers parameter")
    }
    const headersArray = await verifyHTTPSignatureHeaders(ctx, headers)
    const signatureStringArray = []
    for (const header of headersArray) {
        if (header === "(request-target)") {
            signatureStringArray.push(
                `(request-target): ${ctx.method.toLowerCase()} ${ctx.request.path}${
                    ctx.request.search
                }`,
            )
        } else if (header === "(created)") {
            throw ctx.throw(401, "Unsupported header: (created)")
        } else if (header === "(expires)") {
            throw ctx.throw(401, "Unsupported header: (expires)")
        } else {
            const headerValue = ctx.get(header)
            if (header === "" || headerValue === "") {
                throw ctx.throw(401, "Missing some header")
            }
            signatureStringArray.push(`${header}: ${headerValue}`)
        }
    }

    const signatureString = signatureStringArray.join("\n")
    await checkHTTPDigestHeader(ctx)
    const successVerify = createVerify("RSA-SHA256")
        .update(signatureString)
        .verify(user.publicKey, receivedSignature, "base64")
    if (!successVerify) {
        if (useCache) return await checkHTTPSignature(ctx, false)
        throw ctx.throw(401, "Failed to verify Signature header")
    }

    return user
}
