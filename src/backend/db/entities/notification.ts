import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

import { Favourite } from "./favourite.js"
import { Follow } from "./follow.js"
import { LocalUser } from "./local-user.js"
import { Post } from "./post.js"
import { User } from "./user.js"

export const allNotificationTypes = [
    "follow",
    "favourite",
    // "follow_request",
    // "mention",
    // "status",
    // "reblog",
    // "poll",
    // "update",
    // "admin.sign_up",
    // "admin.report",
] as const

export type NotificationType = (typeof allNotificationTypes)[number]

// Dear code readers: we are generating checks in later of this file.
@Entity("notifications")
export class Notification extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @ManyToOne(() => LocalUser, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "receiver_id" })
    receiver!: LocalUser

    @Column("character varying", { nullable: false, length: 32 })
    type!: NotificationType

    @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user?: User

    @ManyToOne(() => Post, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "post_id" })
    post?: Post

    @ManyToOne(() => Follow, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "follow_id" })
    follow?: Follow

    @ManyToOne(() => Favourite, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "favourite_id" })
    favourite?: Favourite
}

// CHECK は名前をそのままにダウンタイムなしでルールのみを変更することができないので、
// 別名の CHECK を追加して先に追加してから古い CHECK を削除するという運用をしようと考えています。
// そのため、CHECK の名前に適当に現在の条件を入れる必要があるのです。
// また、この性質から CHECK の名前は不変であることが保証できないので、
// エラーになった CHECK の名前で何かを判断したい時は、
// `CHK:notification_type:${type}:` の prefix で判定するべきです。

const idFields = ["user_id", "post_id", "follow_id", "favourite_id"] as const

const shortIdFields: Record<(typeof idFields)[number], string> = {
    user_id: "u",
    post_id: "p",
    follow_id: "fo",
    favourite_id: "fa",
}

const checks: { [key in NotificationType]: (typeof idFields)[number][] } = {
    follow: ["user_id", "follow_id"],
    favourite: ["user_id", "post_id", "favourite_id"],
}

for (const [type, shouldExistsIds] of Object.entries(checks)) {
    const shouldNotExistsIds = idFields.filter(id => !shouldExistsIds.includes(id))
    const text = `type != '${type}' OR (${[
        ...shouldExistsIds.map(id => `${id} IS NOT NULL`),
        ...shouldNotExistsIds.map(id => `${id} IS NULL`),
    ].join(" AND ")})`
    const shortShouldExistsIds = shouldExistsIds.map(id => shortIdFields[id]).join("")
    const shortShouldNotExistsIds = shouldNotExistsIds.map(id => shortIdFields[id]).join("")
    Check(
        `CHK:notification_type:${type}:v2:${shortShouldExistsIds}:${shortShouldNotExistsIds}`,
        text,
    )(Notification)
}

Check(
    `CHK:notification:type:v1:${allNotificationTypes.length}`,
    allNotificationTypes.map(a => `type = '${a}'`).join(" OR "),
)(Notification)
