import { MigrationInterface, QueryRunner } from "typeorm"

export class AddMissingFields1654427455212 implements MigrationInterface {
    name = "AddMissingFields1654427455212"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "posts_count" bigint NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "following_count" bigint NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "followers_count" bigint NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD "visibility" text NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "posts" DROP COLUMN "visibility"
        `)
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "followers_count"
        `)
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "following_count"
        `)
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "posts_count"
        `)
    }
}
