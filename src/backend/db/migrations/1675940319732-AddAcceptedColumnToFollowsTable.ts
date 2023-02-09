import { MigrationInterface, QueryRunner } from "typeorm"

export class AddAcceptedColumnToFollowsTable1675940319732 implements MigrationInterface {
    name = "AddAcceptedColumnToFollowsTable1675940319732"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "follows"
            ADD "accepted" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "follows" DROP COLUMN "accepted"
        `)
    }
}
