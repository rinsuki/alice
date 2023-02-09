/* eslint-disable @typescript-eslint/brace-style */
import { MigrationInterface, QueryRunner } from "typeorm"

export class AddManuallyApprovesFollowerColumnToUserTable1675937038975
    implements MigrationInterface
{
    name = "AddManuallyApprovesFollowerColumnToUserTable1675937038975"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "manually_approves_followers" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "manually_approves_followers"
        `)
    }
}
