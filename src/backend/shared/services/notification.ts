import { EntityManager } from "typeorm"

import { dataSource } from "../../db/data-source.js"
import { Notification } from "../../db/entities/notification.js"
import { generateSnowflakeID } from "../../server/utils/generate-snowflake.js"

export async function createNotification(
    notificationParams: Omit<Notification, "id" | "createdAt" | "updatedAt">,
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
