import { createHash, createSign } from "node:crypto"

import { Task } from "graphile-worker"

import { dataSource } from "../../db/data-source.js"
import { User } from "../../db/entities/user.js"
import { ourGot } from "../../server/utils/send-request.js"
import { queueSchema } from "../schema.js"

export const deliverV1: Task = async (rawPayload, helpers) => {
    const payload = queueSchema.deliverV1.parse(rawPayload)
    const senderUser = await dataSource.getRepository(User).findOne({
        where: {
            id: payload.senderUserId,
        },
        relations: ["localUser"],
    })
    const senderLocalUser = senderUser?.localUser
    if (senderUser == null || senderLocalUser == null)
        throw new Error(`SENDER_USER_NOT_FOUND: ${payload.senderUserId}`)
    const targetUser = await dataSource.getRepository(User).findOne({
        where: {
            id: payload.targetUserId,
        },
        select: ["inboxURL", "sharedInboxURL"],
    })
    if (targetUser == null) throw new Error(`TARGET_USER_NOT_FOUND: ${payload.targetUserId}`)
    const jsonBody = Buffer.from(JSON.stringify(payload.activity), "utf-8")
    const url = (payload.useSharedInbox ? targetUser.sharedInboxURL : null) ?? targetUser.inboxURL
    const urlParsed = new URL(url)
    const headers: Record<string, string> = {
        "(request-target)": `post ${urlParsed.pathname}${urlParsed.search}`,
        "digest": `SHA-256=${createHash("sha256").update(jsonBody).digest("base64")}`,
        "host": urlParsed.host,
        "date": new Date().toUTCString(),
    }
    const res = await ourGot({
        url,
        method: "POST",
        headers: {
            ...Object.fromEntries(Object.entries(headers).filter(([k]) => !k.startsWith("("))),
            "Content-Type": "application/activity+json",
            "Signature": Object.entries({
                keyId: senderUser.publicKeyID,
                algorithm: "rsa-sha256",
                headers: Object.keys(headers).join(" "),
                signature: createSign("RSA-SHA256")
                    .update(
                        Object.entries(headers)
                            .map(h => `${h[0]}: ${h[1]}`)
                            .join("\n"),
                    )
                    .sign(senderLocalUser.privateKey, "base64"),
            })
                .map(([k, v]) => k + "=" + JSON.stringify(v))
                .join(","),
        },
        body: jsonBody,
    })
    if (!res.ok) throw new Error(`SERVER_RETURNS_ERROR: ${res.statusCode}`)
}
