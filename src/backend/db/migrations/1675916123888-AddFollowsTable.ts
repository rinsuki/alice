import { MigrationInterface, QueryRunner } from "typeorm"

export class AddFollowsTable1675916123888 implements MigrationInterface {
    name = "AddFollowsTable1675916123888"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "follows" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "uri" text NOT NULL,
                "from_user_id" bigint NOT NULL,
                "to_user_id" bigint NOT NULL,
                CONSTRAINT "UQ_8cfe4be98a644cd808a1e27992f" UNIQUE ("uri"),
                CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a70a5ef71cd5b256fabab2b2e5" ON "follows" ("from_user_id", "to_user_id")
        `)
        await queryRunner.query(`
            ALTER TABLE "follows"
            ADD CONSTRAINT "FK_4c4692c7d9300026d7e00dad8b3" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "follows"
            ADD CONSTRAINT "FK_98a5962ca63d8b4d29ddb89947c" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "follows" DROP CONSTRAINT "FK_98a5962ca63d8b4d29ddb89947c"
        `)
        await queryRunner.query(`
            ALTER TABLE "follows" DROP CONSTRAINT "FK_4c4692c7d9300026d7e00dad8b3"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a70a5ef71cd5b256fabab2b2e5"
        `)
        await queryRunner.query(`
            DROP TABLE "follows"
        `)
    }
}
