import { IsNull, Not, QueryRunner } from "typeorm"

import { User } from "../../db/entities/user.js"
import { addJob } from "../../server/utils/add-job.js"

export async function deliverToEveryone(queryRunner: QueryRunner, actor: User, activity: unknown) {
    const users = await queryRunner.manager.getRepository(User).find({
        where: { domain: Not(IsNull()) },
    })
    const sharedInbox = new Set()
    for (const target of users) {
        if (target.sharedInboxURL != null) {
            if (sharedInbox.has(target.sharedInboxURL)) continue
            sharedInbox.add(target.sharedInboxURL)
        }
        await addJob(queryRunner, "deliverV1", {
            activity,
            senderUserId: actor.id,
            targetUserId: target.id,
            useSharedInbox: true,
        })
    }
}
