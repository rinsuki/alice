import { z } from "zod"

import { dataSource } from "../../../db/data-source.js"
import { User } from "../../../db/entities/user.js"
import { checkMimeIsActivityJson, RE_SN_REMOTE } from "../../constants.js"
import { generateSnowflakeID } from "../../utils/generate-snowflake.js"
import { jsonLDCompact } from "../../utils/jsonld-compact.js"
import { normalizeHost } from "../../utils/normalize-host.js"
import { parseAcctUrl } from "../../utils/parse-acct-url.js"
import { zJsonLdValue } from "../../utils/z-jsonld-value.js"

import { resolveWebfinger } from "./webfinger.js"

const allowedTypes = ["Person", "Application", "Service"]

export const resolveTypes = [
    "prefer-cache-always",
    "use-cache-if-not-outdated",
    "always-refetch",
] as const

export async function resolveUser(document: string, mode: (typeof resolveTypes)[number]) {
    if (mode === "prefer-cache-always" || mode === "use-cache-if-not-outdated") {
        const userRecord = await dataSource.getRepository(User).findOne({
            where: {
                _uri: document,
            },
        })
        if (userRecord != null) {
            let shouldUseCache = mode === "prefer-cache-always"
            if (!shouldUseCache) {
                const diff = Date.now() - userRecord.updatedAt.getTime()
                if (diff < 1000 * 60 * 60) {
                    shouldUseCache = true
                }
            }

            if (shouldUseCache) return userRecord
        }
    }
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const object = await jsonLDCompact(document)
    const objectType = z.object({ type: z.string() }).parse(object).type
    if (!allowedTypes.includes(objectType)) throw new Error("NOT_SUPPORTED_TYPE")

    const parsedObject = z
        .object({
            id: z.string(),
            url: z.string(),
            preferredUsername: zJsonLdValue(),
            name: z.string().optional(),
            publicKey: z.object({
                id: z.string(),
                owner: z.string(),
                publicKeyPem: zJsonLdValue(),
            }),
            inbox: z.string(),
            outbox: z.string(),
            followers: z.string().optional(),
            following: z.string().optional(),
            endpoints: z
                .object({
                    sharedInbox: z.string().optional(),
                })
                .optional(),
            manuallyApprovesFollowers: z.boolean().optional(),
        })
        .parse(object)

    if (parsedObject.id !== parsedObject.publicKey.owner) {
        throw new Error("PUBLIC_KEY_OWNER_MISMATCH")
    }

    let userRecord = await dataSource.getRepository(User).findOne({
        where: {
            _uri: parsedObject.id,
        },
    })

    let shouldInsert = false
    if (userRecord == null) {
        const idUri = new URL(parsedObject.id)
        // 1. Resolve user from WebFinger
        const acctUri = `acct:${parsedObject.preferredUsername}@${idUri.hostname}`
        console.info("resolving", parsedObject.id, acctUri)
        const originWebfinger = await resolveWebfinger(idUri.hostname, acctUri)
        const originWebfingerSubjectAcct = parseAcctUrl(originWebfinger.subject)

        if (originWebfingerSubjectAcct == null) throw new Error("NOT_ACCT")
        console.info("returned_link", parsedObject.id, originWebfinger.links)
        const originWebfingerSelfActivityJson = originWebfinger.links.find(
            l => l.rel === "self" && checkMimeIsActivityJson(l.type ?? ""),
        )
        if (originWebfingerSelfActivityJson == null) {
            throw new Error(`WEBFINGER_LINK_MISSING: ${JSON.stringify({ uri: idUri.href })}`)
        }
        if (originWebfingerSelfActivityJson.href !== parsedObject.id) {
            throw new Error(`WEBFINGER_LINK_MISMATCH: ${JSON.stringify({ uri: idUri.href })}`)
        }
        if (originWebfingerSubjectAcct.host !== idUri.host) {
            // WebFinger host and URI host are different
            const acctWebfinger = await resolveWebfinger(
                originWebfingerSubjectAcct.host,
                originWebfinger.subject,
            )
            if (acctWebfinger.subject !== originWebfinger.subject) {
                // WebFinger subject is different
                throw new Error(
                    `WEBFINGER_SUBJECT_MISMATCH: ${JSON.stringify({ uri: idUri.href })}`,
                )
            }
            const acctWebfingerSelfActivityJson = acctWebfinger.links.find(
                l => l.rel === "self" && checkMimeIsActivityJson(l.type ?? ""),
            )
            if (acctWebfingerSelfActivityJson == null) {
                throw new Error(
                    `WEBFINGER_ACCT_LINK_MISSING: ${JSON.stringify({ uri: idUri.href })}`,
                )
            }
            if (acctWebfingerSelfActivityJson.href !== parsedObject.id) {
                throw new Error(
                    `WEBFINGER_ACCT_LINK_MISMATCH: ${JSON.stringify({ uri: idUri.href })}`,
                )
            }
        }

        userRecord = new User()
        userRecord.id = (await generateSnowflakeID()).toString()
        userRecord.uri = parsedObject.id
        userRecord.url = parsedObject.url
        userRecord.domain = normalizeHost(originWebfingerSubjectAcct.host)
        shouldInsert = true
    }
    if (!RE_SN_REMOTE.test(parsedObject.preferredUsername)) throw new Error("INVALID_USERNAME")
    // TODO: treat Service as robot
    userRecord.isInstanceActor = object.type === "Application"
    userRecord.screenName = parsedObject.preferredUsername
    userRecord.name = parsedObject.name ?? parsedObject.preferredUsername
    userRecord.publicKey = parsedObject.publicKey.publicKeyPem
    userRecord.publicKeyID = parsedObject.publicKey.id
    userRecord.inboxURL = parsedObject.inbox
    userRecord.outboxURL = parsedObject.outbox
    userRecord.followersURL = parsedObject.followers ?? null
    userRecord.followingURL = parsedObject.following ?? null
    userRecord.sharedInboxURL = parsedObject.endpoints?.sharedInbox ?? null
    userRecord.manuallyApprovesFollowers = parsedObject.manuallyApprovesFollowers ?? false

    if (shouldInsert) {
        await dataSource.getRepository(User).insert(userRecord)
    } else {
        await dataSource.getRepository(User).save(userRecord)
    }
    return userRecord
}
