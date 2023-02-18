import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { User } from "./user.js"

@Entity("inbox_log")
@Index(["uri"], { unique: false })
@Index(["type", "objectType", "id"], {})
export class InboxLog extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @Column("jsonb")
    body!: any

    @Column({
        generatedType: "STORED",
        asExpression: "body->>'id'",
    })
    uri!: string

    @Column({
        generatedType: "STORED",
        asExpression: "body->>'type'",
    })
    type!: string

    @Column({
        name: "object_type",
        generatedType: "STORED",
        asExpression: "body->'object'->>'type'",
        nullable: true,
    })
    objectType!: string

    @OneToOne(() => InboxLog, { nullable: true })
    @JoinColumn({ name: "was_undoed_by_inbox_log_id" })
    wasUndoedBy!: InboxLog | null

    @Column("int", { name: "last_processed_version", nullable: true })
    lastProcessedVersion!: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User
}
