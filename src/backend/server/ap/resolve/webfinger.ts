import { z } from "zod"

import { ourGot } from "../../utils/send-request.js"

const zWebfingerRes = z.object({
    subject: z.string(),
    aliases: z.array(z.string()),
    links: z.array(
        z.object({
            rel: z.string().optional(),
            type: z.string().optional(),
            href: z.string().optional(),
        }),
    ),
})

export async function resolveWebfinger(host: string, resource: string) {
    const res = await ourGot({
        url: `https://${host}/.well-known/webfinger`,
        searchParams: {
            resource,
        },
        responseType: "json",
    })

    return zWebfingerRes.parse(res.body)
}
