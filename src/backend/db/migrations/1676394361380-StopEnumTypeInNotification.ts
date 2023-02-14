import { MigrationInterface, QueryRunner } from "typeorm"

export class StopEnumTypeInNotification1676394361380 implements MigrationInterface {
    name = "StopEnumTypeInNotification1676394361380"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification_type:follow:v2:uf:p" CHECK (
                    type::text != 'follow'
                    OR (
                        user_id IS NOT NULL
                        AND follow_id IS NOT NULL
                        AND post_id IS NULL
                    )
                )
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification:type:v1:1" CHECK (type::text = 'follow')
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification_type:follow:uf:p"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" ALTER COLUMN "type" TYPE character varying(32)
        `)
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM('follow')
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification:type:v1:1"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification_type:follow:v2:uf:p"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING type::notifications_type_enum
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification_type:follow:uf:p" CHECK (
                    (
                        (type <> 'follow'::notifications_type_enum)
                        OR (
                            (user_id IS NOT NULL)
                            AND (follow_id IS NOT NULL)
                            AND (post_id IS NULL)
                        )
                    )
                )
        `)
    }
}
