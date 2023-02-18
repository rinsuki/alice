import { EntityManager } from "typeorm"

import { dataSource } from "@/backend/db/data-source.js"
import { Notification } from "@/backend/db/entities/notification.js"

import { generateSnowflakeID } from "../utils/generate-snowflake.js"

export async function createNotification(
    notificationParams: Omit<Notification, "id" | "receiver" | "createdAt" | "updatedAt">,
    manager: EntityManager = dataSource.manager,
) {
    return await manager.transaction(async manager => {
        if (manager.queryRunner == null) throw new Error("MISSING_QUERY_RUNNER")
        const notification = new Notification()
        Object.assign(notification, notificationParams)
        notification.id = (await generateSnowflakeID()).toString()
        await manager.insert(Notification, notification)
    })
}
