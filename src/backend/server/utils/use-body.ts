import { IncomingMessage } from "node:http"

const rawBodySymbol = Symbol("useBody.receivedRawBody")
const parsedBodySymbol = Symbol("useBody.receivedParsedBody")

export async function useRawBody(
    ctx: {
        req: IncomingMessage & { [rawBodySymbol]?: Buffer }
        throw: (statusCode: number, message: string) => never
    },
    maxLength: number = 8 * 1024 * 1024,
) {
    if (rawBodySymbol in ctx.req && ctx.req[rawBodySymbol] != null) {
        return ctx.req[rawBodySymbol]
    }

    const chunks = []
    let bytes = 0
    for await (const chunk of ctx.req) {
        if (!(chunk instanceof Buffer)) throw new Error("Received Chunk was not a Buffer")
        chunks.push(chunk)
        bytes += chunk.length
        if (bytes > maxLength) {
            return ctx.throw(413, "Request body too large")
        }
    }

    const body = Buffer.concat(chunks)
    ctx.req[rawBodySymbol] = body
    return body
}

export async function useBody(
    ctx: {
        req: IncomingMessage & { [parsedBodySymbol]?: unknown }
        throw: (statusCode: number, message: string) => never
    },
    maxLength: number = 8 * 1024 * 1024,
): Promise<unknown> {
    if (parsedBodySymbol in ctx.req && ctx.req[parsedBodySymbol] != null) {
        return ctx.req[parsedBodySymbol]
    }
    const rawBody = await useRawBody(ctx, maxLength)

    let contentType = ctx.req.headers["content-type"]

    let body: unknown

    if (contentType == null) {
        // hacks for Ice Cubes (which send body parameters as query parameters)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        return (ctx as any).query
    }
    const charsetIsUtf8 = "; charset=UTF-8".toLowerCase()
    if (contentType.toLowerCase().endsWith(charsetIsUtf8)) {
        contentType = contentType.substring(0, contentType.length - charsetIsUtf8.length)
    }
    if (contentType === "application/x-www-form-urlencoded") {
        body = Object.fromEntries(new URLSearchParams(rawBody.toString()))
    } else if (contentType.includes("/json") || contentType.includes("+json")) {
        body = JSON.parse(rawBody.toString())
    } else {
        throw new Error("Unknown Content-Type")
    }

    ctx.req[parsedBodySymbol] = body
    return body
}
