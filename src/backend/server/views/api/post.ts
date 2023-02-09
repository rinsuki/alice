import { Post } from "../../../db/entities/post.js"

import { renderAPIUser } from "./user.js"

export function renderAPIPosts(posts: Post[]) {
    return posts.map(post => renderAPIPost(post))
}

export function renderAPIPost(post: Post) {
    return {
        id: post.id.toString(),
        created_at: post.createdAt.toISOString(),
        spoiler_text: post.spoiler,
        visibility: post.visibility,
        uri: post.uri,
        url: post.url,
        content: post.html,
        application: post.application?.renderAsAPI(),
        account: renderAPIUser(post.user),
        // TODO: stub
        in_reply_to_id: null,
        in_reply_to_account_id: null,
        sensitive: false,
        replies_count: -1,
        reblogs_count: -1,
        favourites_count: -1,
        edited_at: null,
        favourited: false,
        reblogged: false,
        muted: false,
        bookmarked: false,
        pinned: false,
        reblog: null,
        media_attachments: [],
        mentions: [],
        tags: [],
        emojis: [],
        card: null,
        poll: null,
    }
}
