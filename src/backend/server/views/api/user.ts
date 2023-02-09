import { User } from "../../../db/entities/user.js"
import { LOCAL_DOMAIN } from "../../constants.js"

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
        // TODO: stub
        note: "<p>Project Alice: noteはまだ未実装</p>",
        locked: false,
        avatar: `https://${LOCAL_DOMAIN}/avatars/original/missing.png`,
        avatar_static: `https://${LOCAL_DOMAIN}/avatars/original/missing.png`,
        header: "/headers/original/missing.png",
        header_static: "/headers/original/missing.png",
    }
}
