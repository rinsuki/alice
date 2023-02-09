import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { LocalUser } from "./local-user.js"

@Entity("invites")
export class Invite extends EntityWithTimestamps {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @ManyToOne(() => LocalUser, { nullable: true })
    @JoinColumn({ name: "inviter_user_id" })
    inviterUser!: Relation<LocalUser | null>

    @Column("text", { nullable: false })
    comment!: string

    @Column("citext", { name: "screen_name", nullable: true, unique: true })
    screenName!: string | null
}
