import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Relation } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { User } from "./user.js"

/**
 * A follow relationship between two users.
 * FromUser が ToUser をフォローしている (ので FromUser のHTLに ToUser の投稿が流れる)
 */
@Entity("follows")
@Index(["fromUser", "toUser"], { unique: true })
export class Follow extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "from_user_id" })
    fromUser!: Relation<User>

    @Column("bigint", { name: "from_user_id", nullable: false })
    fromUserId!: string

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "to_user_id" })
    toUser!: Relation<User>

    @Column("bigint", { name: "to_user_id", nullable: false })
    toUserId!: string

    @Column("text", { unique: true })
    uri!: string

    @Column("boolean", { nullable: false, default: false })
    accepted!: boolean
}
