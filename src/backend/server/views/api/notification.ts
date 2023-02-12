import { Notification } from "../../../db/entities/notification.js"

import { renderAPIPost } from "./post.js"
import { renderAPIUser } from "./user.js"

export function renderAPINotification(notification: Notification) {
    return {
        id: notification.id,
        type: notification.type,
        created_at: notification.createdAt.toISOString(),
        account: notification.user != null ? renderAPIUser(notification.user) : undefined,
        status: notification.post != null ? renderAPIPost(notification.post) : undefined,
    }
}
