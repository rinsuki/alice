import { MigrationInterface, QueryRunner } from "typeorm"

export class FixFollowersCount1676757817242 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        UPDATE users
            SET followers_count=follow_counts.count
        FROM
        (
            SELECT to_user_id, COUNT(*) as count
            FROM follows
            GROUP BY to_user_id
        ) AS follow_counts
        WHERE id = follow_counts.to_user_id
        `)
        await queryRunner.query(`
        UPDATE users
            SET following_count=follow_counts.count
        FROM
        (
            SELECT from_user_id, COUNT(*) as count
            FROM follows
            GROUP BY from_user_id
        ) AS follow_counts
        WHERE id = follow_counts.from_user_id
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        UPDATE users SET followers_count=0, following_count=0
        `)
    }
}
