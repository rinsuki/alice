import { EntityManager } from "typeorm"
import { z } from "zod"

import { InboxLog } from "@/backend/db/entities/inbox_log.js"
import { Post } from "@/backend/db/entities/post.js"
import { createFavourite, removeFavourite } from "@/backend/shared/services/favourite.js"

import { CURRENT_INBOX_PROCESSOR_VERSION } from "../constants.js"

export async function handleInboxLike(manager: EntityManager, log: InboxLog) {
    const likeBody = z
        .object({
            actor: z.string(),
            id: z.string(),
            object: z.string(),
            type: z.literal("Like"),
        })
        .parse(log.body)
    if (likeBody.actor !== log.user.uri) throw new Error("LIKE_BY_WRONG_ACTOR")
    log.lastProcessedVersion = CURRENT_INBOX_PROCESSOR_VERSION
    await manager.save(log)

    const post = await manager.findOne(Post, {
        where: {
            uri: likeBody.object,
        },
    })
    if (post == null) {
        console.warn("Like unknown post", likeBody.object)
        return
    }
    await createFavourite(log.user, post, manager)
}

export async function handleInboxUndoLike(manager: EntityManager, log: InboxLog) {
    const undoLikeBody = z
        .object({
            actor: z.string(),
            id: z.string(),
            object: z.object({
                actor: z.string(),
                id: z.string(),
                object: z.string(),
                type: z.literal("Like"),
            }),
            type: z.literal("Undo"),
        })
        .parse(log.body)
    if (undoLikeBody.actor !== undoLikeBody.object.actor)
        throw new Error("UNDO_LIKE_BY_OTHER_ACTOR")
    if (undoLikeBody.actor !== log.user.uri) throw new Error("UNDO_LIKE_BY_WRONG_ACTOR")
    log.lastProcessedVersion = CURRENT_INBOX_PROCESSOR_VERSION
    await manager.save(log)

    const post = await manager.findOne(Post, {
        where: {
            uri: undoLikeBody.object.object,
        },
    })
    if (post == null) {
        return
    }
    await removeFavourite(log.user, post, manager)
}
