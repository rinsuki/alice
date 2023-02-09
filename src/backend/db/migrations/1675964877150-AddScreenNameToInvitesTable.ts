import { MigrationInterface, QueryRunner } from "typeorm"

export class AddScreenNameToInvitesTable1675964877150 implements MigrationInterface {
    name = "AddScreenNameToInvitesTable1675964877150"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invites"
            ADD "screen_name" citext
        `)
        await queryRunner.query(`
            ALTER TABLE "invites"
            ADD CONSTRAINT "UQ_1660ae8e44bf97c1ca7038a4f7f" UNIQUE ("screen_name")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invites" DROP CONSTRAINT "UQ_1660ae8e44bf97c1ca7038a4f7f"
        `)
        await queryRunner.query(`
            ALTER TABLE "invites" DROP COLUMN "screen_name"
        `)
    }
}
