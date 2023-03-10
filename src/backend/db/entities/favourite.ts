import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { Post } from "./post.js"
import { User } from "./user.js"

@Entity("favourites")
@Unique(["user", "post"])
export class Favourite extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: "user_id" })
    user!: User

    @Column("bigint", { nullable: false, name: "user_id" })
    userId!: string

    @ManyToOne(() => Post, { nullable: false })
    @JoinColumn({ name: "post_id" })
    post!: Post

    @Column("bigint", { nullable: false, name: "post_id" })
    postId!: string
}
