import { LocalUser } from "@/backend/db/entities/local-user.js"
import { Notification } from "@/backend/db/entities/notification.js"
import { arrayToMapById } from "@/backend/server/utils/array-to-map-by-id.js"
import { isNotNull } from "@/backend/shared/utils/is-not-null.js"

import { renderAPIPosts } from "./post.js"
import { renderAPIUser } from "./user.js"

export async function renderAPINotifications(
    notifications: Notification[],
    requestUser: LocalUser | undefined,
) {
    const posts = arrayToMapById(
        await renderAPIPosts(notifications.map(n => n.post).filter(isNotNull), requestUser),
        "id",
    )
    return notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        created_at: notification.createdAt.toISOString(),
        account: notification.user != null ? renderAPIUser(notification.user) : undefined,
        status: notification.post != null ? posts.get(notification.post.id) : undefined,
    }))
}

export async function renderAPINotification(
    notification: Notification,
    requestUser: LocalUser | undefined,
) {
    return (await renderAPINotifications([notification], requestUser))[0]
}
