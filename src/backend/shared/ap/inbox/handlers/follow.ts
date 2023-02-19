import { EntityManager } from "typeorm"
import { z } from "zod"

import { InboxLog } from "@/backend/db/entities/inbox_log.js"
import { User } from "@/backend/db/entities/user.js"
import { requestFollow } from "@/backend/shared/services/follow.js"

import { CURRENT_INBOX_PROCESSOR_VERSION } from "../constants.js"

export async function handleInboxFollow(manager: EntityManager, log: InboxLog) {
    const followBody = z
        .object({
            actor: z.string(),
            id: z.string(),
            object: z.string(),
            type: z.literal("Follow"),
        })
        .parse(log.body)
    if (followBody.actor !== log.user.uri) throw new Error("FOLLOW_BY_WRONG_ACTOR")
    await requestFollow(
        manager,
        await manager.getRepository(User).findOneOrFail({
            where: { _uri: followBody.actor },
        }),
        await manager.getRepository(User).findOneOrFail({
            where: { _uri: followBody.object },
            relations: ["localUser"],
        }),
        followBody.id,
    )
    log.lastProcessedVersion = CURRENT_INBOX_PROCESSOR_VERSION
    await manager.save(log)
}
