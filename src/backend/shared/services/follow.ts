import { EntityManager } from "typeorm"

import { Follow } from "@/backend/db/entities/follow.js"
import { User } from "@/backend/db/entities/user.js"

import { addJob } from "../utils/add-job.js"
import { generateSnowflakeID } from "../utils/generate-snowflake.js"

import { createNotification } from "./notification.js"

/**
 *
 * @param manager should be in transaction
 * @param fromUser
 * @param toUser
 * @param follow
 */
async function whenAcceptsFollow(
    manager: EntityManager,
    fromUser: User,
    toUser: User,
    follow: Follow,
) {
    await manager.increment(User, { id: fromUser.id }, "followingCount", 1)
    await manager.increment(User, { id: toUser.id }, "followersCount", 1)
    if (toUser.domain == null) {
        await createNotification(
            {
                type: "follow",
                receiverId: toUser.id,
                user: fromUser,
                follow,
            },
            manager,
        )
    }
    if (fromUser.domain != null) {
        await addJob(manager.queryRunner!, "deliverV1", {
            senderUserId: toUser.id,
            targetUserId: fromUser.id,
            useSharedInbox: false,
            activity: {
                "id": `${toUser.uri}#accepts/follows/${follow.id}`,
                "type": "Accept",
                "actor": toUser.uri,
                "object": {
                    id: follow.uri,
                    type: "Follow",
                    actor: fromUser.uri,
                    object: toUser.uri,
                },
                "@context": "https://www.w3.org/ns/activitystreams",
            },
        })
    }
}

export async function requestFollow(
    manager: EntityManager,
    fromUser: User,
    toUser: User,
    uri: string,
) {
    if (toUser.domain != null) throw new Error("FOLLOW_REMOTE_USER_IS_NOT_SUPPORTED")
    return await manager.transaction(async manager => {
        const follow = new Follow()
        follow.id = (await generateSnowflakeID()).toString()
        follow.uri = uri
        follow.fromUserId = fromUser.id
        follow.toUserId = toUser.id
        // TODO: implement follow request
        follow.accepted = true
        await manager.getRepository(Follow).insert(follow)
        if (follow.accepted) {
            await whenAcceptsFollow(manager, fromUser, toUser, follow)
        } else {
            // TODO: implement follow request notification
        }
    })
}

export async function revertFollow(
    manager: EntityManager,
    fromUser: User,
    toUser: User,
    uri: string,
) {
    return await manager.transaction(async manager => {
        const follow = await manager.getRepository(Follow).findOne({
            where: { fromUserId: fromUser.id, toUserId: toUser.id, uri },
            lock: { mode: "pessimistic_write" },
        })
        if (follow == null) {
            console.warn("REVERT_FOLLOW_NOT_FOUND", { fromUser, toUser, uri })
            return
        }
        if (follow.accepted) {
            await manager.decrement(User, { id: fromUser.id }, "followingCount", 1)
            await manager.decrement(User, { id: toUser.id }, "followersCount", 1)
        }
        await manager.getRepository(Follow).delete(follow.id)
    })
}
