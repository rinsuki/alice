import { dataSource } from "@/backend/db/data-source.js"
import { LocalUser } from "@/backend/db/entities/local-user.js"
import { User } from "@/backend/db/entities/user.js"
import { textToHtml } from "@/backend/server/utils/text-parser.js"
import { renderActivityPubUser } from "@/backend/server/views/ap/user.js"

import { ACTIVITYSTREAMS_PUBLIC } from "../constants.js"
import { deliverToEveryone } from "../utils/deliver-to-everyone.js"
import { generateSnowflakeID } from "../utils/generate-snowflake.js"

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
        const userAp = renderActivityPubUser(user)
        const userApContext = userAp["@context"]
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        delete (userAp as any)["@context"]
        const updateId = (await generateSnowflakeID()).toString()
        await deliverToEveryone(manager.queryRunner, localUser.user, {
            "@context": userApContext,
            "id": user.uri + "#updates/" + updateId,
            "actor": user.uri,
            "type": "Update",
            "to": [ACTIVITYSTREAMS_PUBLIC],
            "object": userAp,
        })
        return user
    })
}
