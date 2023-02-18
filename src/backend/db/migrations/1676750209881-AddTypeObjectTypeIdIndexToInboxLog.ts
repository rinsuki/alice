import { MigrationInterface, QueryRunner } from "typeorm"

export class AddTypeObjectTypeIdIndexToInboxLog1676750209881 implements MigrationInterface {
    name = "AddTypeObjectTypeIdIndexToInboxLog1676750209881"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_d2d4e0a96bbffb7d0f697146f2" ON "inbox_log" ("type", "object_type", "id")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d2d4e0a96bbffb7d0f697146f2"
        `)
    }
}
