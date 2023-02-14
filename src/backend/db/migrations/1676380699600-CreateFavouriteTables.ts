import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateFavouriteTables1676380699600 implements MigrationInterface {
    name = "CreateFavouriteTables1676380699600"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "favourites" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "user_id" bigint NOT NULL,
                "post_id" bigint NOT NULL,
                CONSTRAINT "UQ_b109386fecf57cabff6c33bec6b" UNIQUE ("user_id", "post_id"),
                CONSTRAINT "PK_173e5d5cc35490bf1de2d2d3739" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "favourites"
            ADD CONSTRAINT "FK_ffb0866c42b7ff4d6e5131f3dcc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "favourites"
            ADD CONSTRAINT "FK_e52d4cb8b57a700d2a6ee0e67ca" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "favourites" DROP CONSTRAINT "FK_e52d4cb8b57a700d2a6ee0e67ca"
        `)
        await queryRunner.query(`
            ALTER TABLE "favourites" DROP CONSTRAINT "FK_ffb0866c42b7ff4d6e5131f3dcc"
        `)
        await queryRunner.query(`
            DROP TABLE "favourites"
        `)
    }
}
