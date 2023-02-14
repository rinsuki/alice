import { MigrationInterface, QueryRunner } from "typeorm"

export class AddFavouriteToNotification1676394585407 implements MigrationInterface {
    name = "AddFavouriteToNotification1676394585407"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD "favourite_id" bigint
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification_type:follow:v2:ufo:pfa" CHECK (
                    type != 'follow'
                    OR (
                        user_id IS NOT NULL
                        AND follow_id IS NOT NULL
                        AND post_id IS NULL
                        AND favourite_id IS NULL
                    )
                )
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification_type:favourite:v2:upfa:fo" CHECK (
                    type != 'favourite'
                    OR (
                        user_id IS NOT NULL
                        AND post_id IS NOT NULL
                        AND favourite_id IS NOT NULL
                        AND follow_id IS NULL
                    )
                )
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification:type:v1:2" CHECK (
                    type = 'follow'
                    OR type = 'favourite'
                )
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_e938c7ee095834bc631daeea6b0" FOREIGN KEY ("favourite_id") REFERENCES "favourites"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification_type:follow:v2:uf:p"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification:type:v1:1"
        `)
        await queryRunner.query(`
            INSERT INTO notifications (id, type, created_at, updated_at, receiver_id, user_id, post_id, favourite_id)
            SELECT f.id, 'favourite', f.created_at, f.updated_at, p.user_id, f.user_id, f.post_id, f.id
            FROM favourites AS f
            JOIN posts AS p ON p.id = f.post_id
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM notifications WHERE type = 'favourite'
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_e938c7ee095834bc631daeea6b0"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification:type:v1:2"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification_type:favourite:v2:upfa:fo"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "CHK:notification_type:follow:v2:ufo:pfa"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP COLUMN "favourite_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification:type:v1:1" CHECK (((type)::text = 'follow'::text))
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "CHK:notification_type:follow:v2:uf:p" CHECK (
                    (
                        ((type)::text <> 'follow'::text)
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
