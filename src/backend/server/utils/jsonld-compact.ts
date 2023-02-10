import jsonld from "jsonld"

import { ourGot } from "./send-request.js"

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
                const res = await ourGot(url, {
                    headers: {
                        Accept: 'application/activity+json,application/ld+json; profile="https://www.w3.org/ns/activitystreams",application/json,*/*;q=0.1',
                    },
                    responseType: "json",
                })
                if (!res.ok) {
                    console.warn("JSONLD_DOCUMENT_LOADER_FAIL", res.statusCode, url)
                    throw new Error(`HTTP_FAIL_${res.statusCode}}`)
                }
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
