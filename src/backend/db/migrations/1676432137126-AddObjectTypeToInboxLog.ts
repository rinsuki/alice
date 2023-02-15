import { MigrationInterface, QueryRunner } from "typeorm"

export class AddObjectTypeToInboxLog1676432137126 implements MigrationInterface {
    name = "AddObjectTypeToInboxLog1676432137126"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbox_log"
            ADD "object_type" character varying GENERATED ALWAYS AS (body->'object'->>'type') STORED
        `)
        await queryRunner.query(
            `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES ($1, $2, $3, $4, $5, $6)
        `,
            [
                "alice_dev",
                "public",
                "inbox_log",
                "GENERATED_COLUMN",
                "object_type",
                "body->'object'->>'type'",
            ],
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "database" = $3
                AND "schema" = $4
                AND "table" = $5
        `,
            ["GENERATED_COLUMN", "object_type", "alice_dev", "public", "inbox_log"],
        )
        await queryRunner.query(`
            ALTER TABLE "inbox_log" DROP COLUMN "object_type"
        `)
    }
}
