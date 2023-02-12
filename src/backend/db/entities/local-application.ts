import { createHash } from "node:crypto"

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm"

import { LOCAL_DOMAIN } from "../../server/environment.js"
import { asyncRandomBytes } from "../../server/utils/async-random-bytes.js"
import { generateSnowflakeID } from "../../server/utils/generate-snowflake.js"
import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { Application } from "./application.js"

@Entity("local_applications")
export class LocalApplication extends EntityWithTimestamps {
    @PrimaryColumn("bigint", { name: "application_id" })
    id!: string

    @OneToOne(() => Application, { nullable: false })
    @JoinColumn({ name: "application_id" })
    application!: Application

    @Column("text", { name: "client_id", nullable: false })
    clientID!: string

    @Column("text", {
        name: "hashed_client_secret",
        nullable: false,
        comment: "SHA-256 + Base64",
    })
    hashedClientSecret!: string

    @Column("text", { array: true, name: "redirect_uris", nullable: false })
    redirectURIs!: string[]

    @Column("text", { name: "scopes", array: true, nullable: false })
    scopes!: string[]

    @Column("boolean", { name: "is_super_app" })
    isSuperApp!: boolean

    setClientSecret(clientSecret: string) {
        const hash = createHash("sha256")
        hash.update(clientSecret)
        const hashed = hash.digest("base64")
        this.hashedClientSecret = hashed
    }

    checkClientSecret(clientSecret: string) {
        const hash = createHash("sha256")
        hash.update(clientSecret)
        const hashed = hash.digest("base64")
        return this.hashedClientSecret === hashed
    }

    static async create(): Promise<{
        localApp: LocalApplication
        clientSecret: string
    }> {
        const localApp = new LocalApplication()
        localApp.id = (await generateSnowflakeID()).toString()
        localApp.application = new Application()
        localApp.application.id = localApp.id
        localApp.clientID = await asyncRandomBytes(32).then(r => r.toString("hex"))
        const clientSecret = await asyncRandomBytes(32).then(r => r.toString("hex"))
        localApp.setClientSecret(clientSecret)
        localApp.application.uri = `https://${LOCAL_DOMAIN}/applications/${localApp.id}`

        return {
            localApp,
            clientSecret,
        }
    }
}
