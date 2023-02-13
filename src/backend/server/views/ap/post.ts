import { Post } from "../../../db/entities/post.js"
import { ACTIVITYSTREAMS_PUBLIC } from "../../constants.js"

export function renderActivityPubPostActivity(post: Post) {
    const note = renderActivityPubPost(post)
    return {
        "@context": note["@context"],
        "id": note.id + "/activity",
        "type": "Create",
        "actor": note.attributedTo,
        "to": note.to,
        "cc": note.cc,
        "published": note.published,
        "object": note,
    }
}

export function renderActivityPubPostDeleteActivity(post: Post) {
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": post.uri + "#delete",
        "type": "Delete",
        "actor": post.user.uri,
        "to": [ACTIVITYSTREAMS_PUBLIC],
        "object": {
            id: post.uri,
            type: "Tombstone",
        },
    }
}

export function renderActivityPubPost(post: Post) {
    const id = post.uri

    const to = []
    const cc = []

    switch (post.visibility) {
        case "public":
            to.push(ACTIVITYSTREAMS_PUBLIC)
            cc.push(post.user.followersURL)
            break
        case "unlisted":
            to.push(post.user.followersURL)
            cc.push(ACTIVITYSTREAMS_PUBLIC)
            break
        default:
            throw new Error("not supported visibility")
    }

    const generator = post.application && {
        id: post.application.uri,
        type: "Application",
        name: post.application.name,
        url: post.application.website,
    }

    return {
        "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1",
            {
                sensitive: "as:sensitive",
            },
        ],
        id,
        "type": "Note",
        "summary": post.spoiler,
        "inReplyTo": null,
        "published": post.createdAt.toISOString(),
        "content": post.html,
        "attachment": [],
        "tag": [],
        "url": post.url,
        "attributedTo": post.user.uri,
        to,
        cc,
        generator,
        // stub
        "sensitive": false,
    }
}
