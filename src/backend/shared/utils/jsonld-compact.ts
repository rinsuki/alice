import fs from "node:fs/promises"

import jsonld from "jsonld"

import { rootDir } from "../environment.js"

import { ourGot } from "./send-request.js"

const preloadedContexts = new Map<string, unknown>()

const preloadStoreDir = rootDir + "/resources/jsonld-preload"
for (const [url, fileName] of JSON.parse(
    await fs.readFile(preloadStoreDir + "/list.json", "utf-8"),
)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/restrict-plus-operands
    const res = JSON.parse(await fs.readFile(preloadStoreDir + "/" + fileName, "utf-8"))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    preloadedContexts.set(url, Object.freeze(res))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function jsonLDCompact(document: any) {
    return await jsonld.compact(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        document,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1",
            {
                manuallyApprovesFollowers: "as:manuallyApprovesFollowers",
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
        {
            base: "",
            async documentLoader(url) {
                const cached = preloadedContexts.get(url)
                if (cached != null) {
                    return {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        document: cached as any,
                        documentUrl: url,
                    }
                }
                console.info("NOT_CACHED_DOCUMENT", url)
                const res = await ourGot(url, {
                    headers: {
                        Accept: 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
                    },
                    responseType: "json",
                })
                return {
                    contextUrl: undefined,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
                    document: res.body as any,
                    documentUrl: res.url,
                }
            },
        },
    )
}
