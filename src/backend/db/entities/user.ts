import { Column, Entity, Index, OneToOne, PrimaryColumn } from "typeorm"

import { LOCAL_DOMAIN } from "../../server/constants.js"
import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { LocalUser } from "./local-user.js"

@Entity("users")
@Index(["screenName"], { unique: true, where: "domain IS NULL" })
export class User extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @Column("text", { name: "uri", comment: "like https://alice.example/users/1", nullable: false })
    @Index({ unique: true })
    _uri!: string

    get uri(): string {
        return this.localUser?.uri(this) ?? this._uri
    }

    set uri(value: string) {
        this._uri = value
    }

    @Column("text", { name: "url", nullable: false })
    url!: string

    @Column("text", { nullable: false })
    name!: string

    @Column("citext", { name: "screen_name", nullable: false })
    screenName!: string

    @Column("citext", { nullable: true })
    domain!: string | null

    @OneToOne(() => LocalUser, "user")
    localUser!: LocalUser | null

    @Column("bool", { name: "is_instance_actor", nullable: false })
    isInstanceActor!: boolean

    @Column("bool", { name: "manually_approves_followers", nullable: false, default: false })
    manuallyApprovesFollowers!: boolean

    @Column("text", { name: "public_key_id", nullable: false })
    publicKeyID!: string

    @Column("text", { name: "public_key", nullable: false })
    publicKey!: string

    @Column("text", { name: "inbox_url", nullable: false })
    inboxURL!: string

    @Column("text", { name: "outbox_url", nullable: false })
    outboxURL!: string

    @Column("text", { name: "shared_inbox_url", nullable: true })
    sharedInboxURL!: string | null

    @Column("text", { name: "following_url", nullable: true })
    followingURL!: string | null

    @Column("text", { name: "followers_url", nullable: true })
    followersURL!: string | null

    @Column("bigint", { name: "posts_count", nullable: false, default: "0" })
    postsCount!: string

    @Column("bigint", { name: "following_count", nullable: false, default: "0" })
    followingCount!: string

    @Column("bigint", { name: "followers_count", nullable: false, default: "0" })
    followersCount!: string

    get acct() {
        if (this.domain == null) return this.screenName
        return `${this.screenName}@${this.domain}`
    }

    get fullAcct() {
        if (this.domain != null) return this.acct
        return `${this.screenName}@${LOCAL_DOMAIN}`
    }
}
