import { generateKeyPair as generateKeyPairRaw } from "node:crypto"
import { promisify } from "node:util"

import bcrypt from "bcrypt"
import { Check, Column, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from "typeorm"

import { LOCAL_DOMAIN } from "../../server/constants.js"

import { Invite } from "./invite.js"
import { User } from "./user.js"

const generateKeyPair = promisify(generateKeyPairRaw)

@Entity("local_users")
export class LocalUser {
    @PrimaryColumn("bigint", { name: "user_id" })
    userID!: string

    @OneToOne(() => User, user => user.localUser)
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>

    @Column("text", { name: "private_key", nullable: false })
    privateKey!: string

    @Column("text", { name: "hashed_password", nullable: false })
    @Check("hashed_password LIKE '$%' OR hashed_password = 'disabled'::text")
    private hashedPassword!: string

    @OneToOne(() => Invite, { nullable: false })
    @JoinColumn({ name: "invite_id" })
    invite!: Relation<Invite>

    @Column("bigint", { name: "invite_id", nullable: false })
    inviteID!: Invite["id"]

    @Column("boolean", {
        name: "use_screen_name_as_object_id",
        comment: "for accounts that migrated from Mastodon",
    })
    useScreenNameAsObjectID!: boolean

    uri(user: User) {
        if (this.user != null && this.user.id !== user.id)
            throw new Error("USER_MISMATCH_ON_LOCAL_USER_URI")
        let uri = `https://${LOCAL_DOMAIN}/users/`
        if (this.useScreenNameAsObjectID) {
            uri += user.screenName
        } else {
            uri += `id/${user.id}`
        }
        if (user._uri !== uri) throw new Error("LOCAL_USER_OBJECT_ID_MISMATCH")
        return uri
    }

    async setPassword(password: string) {
        const bytes = Buffer.from(password, "utf-8")
        if (bytes.length > 72) throw new Error("PASSWORD_TOO_LONG")
        this.hashedPassword = await bcrypt.hash(password, 10)
    }

    async checkPassword(inputPassword: string) {
        const inputBytes = Buffer.from(inputPassword, "utf-8")
        if (inputBytes.length > 72) throw new Error("PASSWORD_TOO_LONG")
        if (this.hashedPassword === "disabled") throw new Error("PASSWORD_DISABLED")
        return await bcrypt.compare(inputPassword, this.hashedPassword)
    }

    async generateKeypair() {
        if (this.user.uri == null) throw new Error("USER_OBJECT_ID_MISSING")
        const keypair = await generateKeyPair("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: "spki",
                format: "pem",
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
            },
        })
        this.privateKey = keypair.privateKey
        this.user.publicKey = keypair.publicKey
        this.user.publicKeyID = `${this.user.uri}#main-key`
    }
}
