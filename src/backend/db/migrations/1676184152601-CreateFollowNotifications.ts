import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateFollowNotifications1676184152601 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO notifications
                (id, type, created_at, updated_at, receiver_id, user_id, post_id, follow_id)
            SELECT id, 'follow', created_at, NOW(), to_user_id, from_user_id, NULL, id FROM follows
                WHERE id NOT IN (SELECT follow_id FROM notifications WHERE follow_id IS NOT NULL)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM notifications WHERE type = 'follow' AND follow_id IS NOT NULL AND id = follow_id
        `)
    }
}
