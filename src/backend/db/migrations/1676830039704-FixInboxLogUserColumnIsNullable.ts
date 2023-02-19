import { MigrationInterface, QueryRunner } from "typeorm"

export class FixInboxLogUserColumnIsNullable1676830039704 implements MigrationInterface {
    name = "FixInboxLogUserColumnIsNullable1676830039704"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbox_log"
            ALTER COLUMN "user_id"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbox_log"
            ALTER COLUMN "user_id" DROP NOT NULL
        `)
    }
}
