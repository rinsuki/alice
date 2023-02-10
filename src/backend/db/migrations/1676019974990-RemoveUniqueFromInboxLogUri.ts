import { MigrationInterface, QueryRunner } from "typeorm"

export class RemoveUniqueFromInboxLogUri1676019974990 implements MigrationInterface {
    name = "RemoveUniqueFromInboxLogUri1676019974990"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_06b4dbc8cd39a2ffa8aeb0eb73" ON "inbox_log" ("uri")
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_180a0924bbb80c644436d126ee"
        `)
        await queryRunner.query(`
            ALTER TABLE "inbox_log" DROP CONSTRAINT "UQ_06b4dbc8cd39a2ffa8aeb0eb735"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbox_log"
            ADD CONSTRAINT "UQ_06b4dbc8cd39a2ffa8aeb0eb735" UNIQUE ("uri")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_180a0924bbb80c644436d126ee" ON "inbox_log" ("uri")
            WHERE (was_undoed_by_inbox_log_id IS NULL)
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_06b4dbc8cd39a2ffa8aeb0eb73"
        `)
    }
}
