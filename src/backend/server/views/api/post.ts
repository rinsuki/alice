import { In } from "typeorm"

import { dataSource } from "../../../db/data-source.js"
import { Favourite } from "../../../db/entities/favourite.js"
import { LocalUser } from "../../../db/entities/local-user.js"
import { Post } from "../../../db/entities/post.js"
import { mapKeepLength } from "../../utils/map-keep-length.js"
import { arrayToMapById } from "../../utils/render-and-array-to-map-by-id.js"

import { renderAPIUser } from "./user.js"

interface APIUnauthorizedPost {
    id: string
    created_at: string
    in_reply_to_id: string | null
    in_reply_to_account_id: string | null
    sensitive: boolean
    spoiler_text: string
    visibility: string
    language?: string
    uri: string
    url: string | null
    replies_count: number
    reblogs_count: number
    favourites_count: number
    edited_at: string | null
    content: string
    reblog: null
    account: unknown
    application?: unknown
    media_attachments: unknown[]
    mentions: unknown[]
    tags: unknown[]
    emojis: unknown[]
    card: null
    poll: null
}

interface APIAuthorizedPost extends APIUnauthorizedPost {
    favourited: boolean
    reblogged: boolean
    muted: boolean
    bookmarked: boolean
    /** only my post */
    pinned?: boolean
}

type APIPost = APIUnauthorizedPost | APIAuthorizedPost

export async function renderAPIPosts<P extends Post[]>(
    posts: P,
    requestUser: LocalUser | undefined,
) {
    const requestUserData =
        requestUser != null
            ? {
                  favourites: arrayToMapById(
                      await dataSource.getRepository(Favourite).find({
                          where: { postId: In(posts.map(p => p.id)) },
                          select: ["postId"],
                      }),
                      "postId",
                  ),
              }
            : undefined
    return mapKeepLength(posts, post => {
        const unauthorizedPart = {
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
            reblog: null,
            media_attachments: [],
            mentions: [],
            tags: [],
            emojis: [],
            card: null,
            poll: null,
        } satisfies APIUnauthorizedPost
        if (requestUserData == null) return unauthorizedPart
        return {
            ...unauthorizedPart,
            favourited: requestUserData.favourites.has(post.id),
            // TODO: stub
            reblogged: false,
            muted: false,
            bookmarked: false,
            pinned: false,
        } satisfies APIAuthorizedPost
    }) satisfies APIPost[]
}

export async function renderAPIPost(post: Post, requestUser: LocalUser | undefined) {
    return (await renderAPIPosts([post], requestUser))[0]
}
