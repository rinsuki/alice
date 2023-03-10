import { User } from "@/backend/db/entities/user.js"
import { LOCAL_DOMAIN } from "@/backend/shared/environment.js"

export function renderAPIUser(user: User) {
    return {
        id: user.id.toString(),
        username: user.screenName,
        acct: user.acct,
        display_name: user.name,
        created_at: user.createdAt.toISOString(),
        url: user.url,
        followers_count: Number(user.followersCount),
        following_count: Number(user.followingCount),
        statuses_count: Number(user.postsCount),
        note: user.note,
        // TODO: stub
        locked: false,
        avatar: `https://${LOCAL_DOMAIN}/avatars/original/missing.png`,
        avatar_static: `https://${LOCAL_DOMAIN}/avatars/original/missing.png`,
        header: "/headers/original/missing.png",
        header_static: "/headers/original/missing.png",
    }
}
