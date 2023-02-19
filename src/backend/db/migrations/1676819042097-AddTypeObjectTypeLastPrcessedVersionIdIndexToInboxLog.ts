/* eslint-disable @typescript-eslint/brace-style */
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddTypeObjectTypeLastPrcessedVersionIdIndexToInboxLog1676819042097
    implements MigrationInterface
{
    name = "AddTypeObjectTypeLastPrcessedVersionIdIndexToInboxLog1676819042097"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_7e4e5db201c1e9b472ed3da474" ON "inbox_log" (
                "type",
                "object_type",
                "last_processed_version",
                "id"
            )
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d2d4e0a96bbffb7d0f697146f2"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_d2d4e0a96bbffb7d0f697146f2" ON "inbox_log" ("id", "type", "object_type")
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7e4e5db201c1e9b472ed3da474"
        `)
    }
}
