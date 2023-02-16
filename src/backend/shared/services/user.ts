import { IsNull, Not } from "typeorm"

import { dataSource } from "../../db/data-source.js"
import { LocalUser } from "../../db/entities/local-user.js"
import { User } from "../../db/entities/user.js"
import { ACTIVITYSTREAMS_PUBLIC } from "../../server/constants.js"
import { addJob } from "../../server/utils/add-job.js"
import { generateSnowflakeID } from "../../server/utils/generate-snowflake.js"
import { textToHtml } from "../../server/utils/text-parser.js"
import { renderActivityPubUser } from "../../server/views/ap/user.js"

export async function updateLocalUserProfile(
    localUser: LocalUser,
    params: {
        displayName?: string
        note?: string
    },
) {
    return await dataSource.transaction(async manager => {
        if (manager.queryRunner == null) throw new Error("QueryRunner is null")
        const user = await manager.getRepository(User).findOneOrFail({
            where: { id: localUser.userID },
            lock: { mode: "for_no_key_update" },
        })
        let changed = false
        if (params.displayName != null) {
            changed = true
            user.name = params.displayName
        }
        if (params.note != null) {
            changed = true
            user.note = textToHtml(params.note)
            localUser.sourceNote = params.note
        }
        if (!changed) return user
        await manager.save(user)
        await manager.save(localUser)
        const users = await manager.getRepository(User).find({ where: { domain: Not(IsNull()) } })
        const sharedInbox = new Set()
        const userAp = renderActivityPubUser(user)
        const userApContext = userAp["@context"]
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        delete (userAp as any)["@context"]
        const updateId = (await generateSnowflakeID()).toString()
        for (const target of users) {
            if (target.sharedInboxURL != null) {
                if (sharedInbox.has(target.sharedInboxURL)) continue
                sharedInbox.add(target.sharedInboxURL)
            }
            await addJob(manager.queryRunner, "deliverV1", {
                activity: {
                    "@context": userApContext,
                    "id": user.uri + "#updates/" + updateId,
                    "actor": user.uri,
                    "type": "Update",
                    "to": [ACTIVITYSTREAMS_PUBLIC],
                    "object": userAp,
                },
                senderUserId: localUser.userID,
                targetUserId: target.id,
                useSharedInbox: true,
            })
        }
        return user
    })
}
