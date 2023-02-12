import { IsNull } from "typeorm"

import { dataSource } from "../db/data-source.js"
import { Invite } from "../db/entities/invite.js"
import { User } from "../db/entities/user.js"
import { RE_SN_LOCAL } from "../server/constants.js"
import { LOCAL_DOMAIN } from "../server/environment.js"
import { emptyAsNull } from "../server/utils/empty-as-null.js"

const invite = new Invite()
invite.screenName = emptyAsNull(process.env.ALICE_INVITE_SCREEN_NAME) ?? null
if (invite.screenName != null) {
    if (!RE_SN_LOCAL.test(invite.screenName)) throw new Error("INVALID_SCREEN_NAME")
}
invite.comment = process.env.ALICE_INVITE_COMMENT ?? ""

await dataSource.initialize()
if (invite.screenName != null) {
    const alreadyUser = await dataSource.getRepository(User).findOneBy({
        screenName: invite.screenName,
        domain: IsNull(),
    })
    if (alreadyUser != null) {
        throw new Error("THIS_SCREEN_NAME_IS_ALREADY_REGISTERED")
    }
}
await dataSource.getRepository(Invite).insert(invite)
console.log(`Invite URL: https://${LOCAL_DOMAIN}/invite/${invite.id}`)
