import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm"

import { asyncRandomBytes } from "../../server/utils/async-random-bytes.js"
import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { LocalApplication } from "./local-application.js"
import { LocalUser } from "./local-user.js"

@Entity("oauth_authorization_codes")
export class OAuthAuthorizationCode extends EntityWithTimestamps {
    @PrimaryColumn("text")
    code!: string

    @ManyToOne(() => LocalUser, { nullable: false })
    @JoinColumn({ name: "local_user_id" })
    localUser!: LocalUser

    @ManyToOne(() => LocalApplication, { nullable: false })
    @JoinColumn({ name: "local_application_id" })
    localApplication!: LocalApplication

    @Column("text", { nullable: true })
    redirectURI!: string

    @Column("text", { nullable: false, array: true })
    scopes!: string[]

    async generateCode() {
        this.code = await asyncRandomBytes(16).then(c => c.toString("hex"))
    }
}
