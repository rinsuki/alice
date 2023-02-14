import { MigrationInterface, QueryRunner } from "typeorm"

export class AddFavouritesCountToPost1676400274473 implements MigrationInterface {
    name = "AddFavouritesCountToPost1676400274473"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD "favourites_count" integer NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            UPDATE "posts" SET "favourites_count" = (
                SELECT COUNT(*) FROM "favourites" WHERE "favourites"."post_id" = "posts"."id"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "posts" DROP COLUMN "favourites_count"
        `)
    }
}
