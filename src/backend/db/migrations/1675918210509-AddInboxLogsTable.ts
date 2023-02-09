import { MigrationInterface, QueryRunner } from "typeorm"

export class AddInboxLogsTable1675918210509 implements MigrationInterface {
    name = "AddInboxLogsTable1675918210509"

    public async up(queryRunner: QueryRunner): Promise<void> {
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
            ["alice_dev", "public", "inbox_log", "GENERATED_COLUMN", "uri", "body->>'id'"],
        )
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
            ["alice_dev", "public", "inbox_log", "GENERATED_COLUMN", "type", "body->>'type'"],
        )
        await queryRunner.query(`
            CREATE TABLE "inbox_log" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "body" jsonb NOT NULL,
                "uri" character varying GENERATED ALWAYS AS (body->>'id') STORED NOT NULL,
                "type" character varying GENERATED ALWAYS AS (body->>'type') STORED NOT NULL,
                "last_processed_version" integer,
                "was_undoed_by_inbox_log_id" bigint,
                "user_id" bigint,
                CONSTRAINT "UQ_06b4dbc8cd39a2ffa8aeb0eb735" UNIQUE ("uri"),
                CONSTRAINT "REL_b994577882bc943ad902c2153a" UNIQUE ("was_undoed_by_inbox_log_id"),
                CONSTRAINT "PK_4641ba0c02625c0794bc1069d7c" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_180a0924bbb80c644436d126ee" ON "inbox_log" ("uri")
            WHERE was_undoed_by_inbox_log_id IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "inbox_log"
            ADD CONSTRAINT "FK_b994577882bc943ad902c2153a5" FOREIGN KEY ("was_undoed_by_inbox_log_id") REFERENCES "inbox_log"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "inbox_log"
            ADD CONSTRAINT "FK_c2f0192053a9f088a2bcef6d32d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "inbox_log" DROP CONSTRAINT "FK_c2f0192053a9f088a2bcef6d32d"
        `)
        await queryRunner.query(`
            ALTER TABLE "inbox_log" DROP CONSTRAINT "FK_b994577882bc943ad902c2153a5"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_180a0924bbb80c644436d126ee"
        `)
        await queryRunner.query(`
            DROP TABLE "inbox_log"
        `)
        await queryRunner.query(
            `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "database" = $3
                AND "schema" = $4
                AND "table" = $5
        `,
            ["GENERATED_COLUMN", "type", "alice_dev", "public", "inbox_log"],
        )
        await queryRunner.query(
            `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "database" = $3
                AND "schema" = $4
                AND "table" = $5
        `,
            ["GENERATED_COLUMN", "uri", "alice_dev", "public", "inbox_log"],
        )
    }
}
