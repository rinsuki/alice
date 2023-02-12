import { MigrationInterface, QueryRunner } from "typeorm"

export class AddNotificationTable1676181798830 implements MigrationInterface {
    name = "AddNotificationTable1676181798830"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM('follow')
        `)
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "receiver_id" bigint NOT NULL,
                "user_id" bigint,
                "post_id" bigint,
                "follow_id" bigint,
                CONSTRAINT "CHK:notification_type:follow:uf:p" CHECK (
                    type != 'follow'
                    OR (
                        user_id IS NOT NULL
                        AND follow_id IS NOT NULL
                        AND post_id IS NULL
                    )
                ),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_343c8ee2cd2f4036f2a3423989e" FOREIGN KEY ("receiver_id") REFERENCES "local_users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_ec240232d5de44495354f66e053" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_1e0862a5a63022eaea7cbfd9879" FOREIGN KEY ("follow_id") REFERENCES "follows"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_1e0862a5a63022eaea7cbfd9879"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_ec240232d5de44495354f66e053"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
        `)
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_343c8ee2cd2f4036f2a3423989e"
        `)
        await queryRunner.query(`
            DROP TABLE "notifications"
        `)
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `)
    }
}
