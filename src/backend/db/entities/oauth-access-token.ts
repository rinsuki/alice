import { createHash } from "node:crypto"

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm"

import { asyncRandomBytes } from "@/backend/shared/utils/async-random-bytes.js"
import { generateSnowflakeID } from "@/backend/shared/utils/generate-snowflake.js"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { LocalApplication } from "./local-application.js"
import { LocalUser } from "./local-user.js"

@Entity("oauth_access_tokens")
export class OAuthAccessToken extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @ManyToOne(() => LocalUser, { nullable: false })
    @JoinColumn({ name: "local_user_id" })
    localUser!: LocalUser

    @ManyToOne(() => LocalApplication, { nullable: false })
    @JoinColumn({ name: "local_application_id" })
    localApplication!: LocalApplication

    @Column("text", { name: "scopes", array: true, nullable: false })
    scopes!: string[]

    @Column("text", { name: "hashed_access_token", nullable: false, comment: "SHA-256 + Base64" })
    hashedAccessToken!: string

    get user() {
        return this.localUser.user
    }

    get application() {
        return this.localApplication.application
    }

    async generate() {
        this.id = (await generateSnowflakeID()).toString()
        const accessToken = await asyncRandomBytes(32).then(r => r.toString("hex"))
        this.hashedAccessToken = createHash("sha256").update(accessToken).digest("base64")
        return accessToken
    }
}
