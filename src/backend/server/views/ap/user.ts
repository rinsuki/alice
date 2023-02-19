import { dataSource } from "@/backend/db/data-source.js"
import { Post } from "@/backend/db/entities/post.js"
import { User } from "@/backend/db/entities/user.js"

import { renderActivityPubPost } from "./post.js"

export function renderActivityPubUser(user: User) {
    if (user.domain != null) throw new Error("TRY_TO_RENDER_REMOTE_USER_ON_ACTIVITY_PUB")
    return {
        "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
        "id": user.uri,
        "type": "Person",
        "name": user.name,
        "preferredUsername": user.screenName,
        "url": user.url,
        "publicKey": {
            type: "Key",
            id: user.publicKeyID,
            owner: user.uri,
            publicKeyPem: user.publicKey,
        },
        "inbox": user.inboxURL,
        "outbox": user.outboxURL,
        "followers": user.followersURL,
        "following": user.followingURL,
        "endpoints": {
            sharedInbox: user.sharedInboxURL ?? undefined,
        },
        "summary": user.note,
    }
}

export async function renderActivityPubUserOutbox(user: User) {
    if (user.domain != null) throw new Error("TRY_TO_RENDER_REMOTE_USER_ON_ACTIVITY_PUB")

    const posts = await dataSource.getRepository(Post).find({
        where: {
            userID: user.id,
            // TODO: check visibility
        },
        order: {
            id: "DESC",
        },
        relations: ["user", "application"],
    })

    return {
        "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
        "id": user.outboxURL,
        "type": "OrderedCollection",
        "totalItems": posts.length,
        "items": posts.map(post => renderActivityPubPost(post)),
    }
}

export function renderActivityPubUserFollowers(user: User) {
    if (user.domain != null) throw new Error("TRY_TO_RENDER_REMOTE_USER_ON_ACTIVITY_PUB")

    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": user.followersURL,
        "type": "OrderedCollection",
        "totalItems": Number(user.followersCount),
    }
}
