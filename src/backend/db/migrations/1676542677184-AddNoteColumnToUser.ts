import { MigrationInterface, QueryRunner } from "typeorm"

export class AddNoteColumnToUser1676542677184 implements MigrationInterface {
    name = "AddNoteColumnToUser1676542677184"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "local_users"
            ADD "source_note" text NOT NULL DEFAULT ''
        `)
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "note" text NOT NULL DEFAULT ''
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "note"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users" DROP COLUMN "source_note"
        `)
    }
}
