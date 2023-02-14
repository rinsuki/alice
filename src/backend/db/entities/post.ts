import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { Application } from "./application.js"
import { User } from "./user.js"

@Entity("posts")
export class Post extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @Column("text", { nullable: false })
    uri!: string

    @Column("text", { nullable: false })
    url!: string

    @Column("text", { nullable: false })
    html!: string

    @Column("text", { nullable: false })
    spoiler!: string

    @Column("text", { nullable: false })
    visibility!: string

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "user_id" })
    user!: User

    @Column("bigint", { name: "user_id", nullable: false })
    userID!: string

    @ManyToOne(() => Application, { nullable: true })
    @JoinColumn({ name: "application_id" })
    application!: Application | null

    @Column("int", { name: "favourites_count", default: 0 })
    favouritesCount!: number
}
