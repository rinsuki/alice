import { Column, Entity, PrimaryColumn } from "typeorm"

import { EntityWithTimestamps } from "../utils/entity-with-timestamps.js"

@Entity("applications")
export class Application extends EntityWithTimestamps {
    @PrimaryColumn("bigint")
    id!: string

    @Column("text", { nullable: false })
    uri!: string

    @Column("text", { nullable: false })
    name!: string

    @Column("text", { comment: "URL", nullable: true })
    website!: string | null

    renderAsAPI() {
        return {
            name: this.name,
            website: this.website,
        }
    }
}
