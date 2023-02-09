import { MigrationInterface, QueryRunner } from "typeorm"

export class AddOAuthTables1654418977269 implements MigrationInterface {
    name = "AddOAuthTables1654418977269"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "oauth_access_tokens" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "scopes" text array NOT NULL,
                "hashed_access_token" text NOT NULL,
                "local_user_id" bigint NOT NULL,
                "local_application_id" bigint NOT NULL,
                CONSTRAINT "PK_5956b59ddf50246f933275699e3" PRIMARY KEY ("id")
            );
            COMMENT ON COLUMN "oauth_access_tokens"."hashed_access_token" IS 'SHA-256 + Base64'
        `)
        await queryRunner.query(`
            CREATE TABLE "oauth_authorization_codes" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "code" text NOT NULL,
                "redirectURI" text,
                "scopes" text array NOT NULL,
                "local_user_id" bigint NOT NULL,
                "local_application_id" bigint NOT NULL,
                CONSTRAINT "PK_fb91ab932cfbd694061501cc20f" PRIMARY KEY ("code")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "applications"
            ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        `)
        await queryRunner.query(`
            ALTER TABLE "applications"
            ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users" DROP CONSTRAINT "FK_55f831a2761ea40103f8335a165"
        `)
        await queryRunner.query(`
            ALTER TABLE "invites" DROP CONSTRAINT "FK_df6bd3102db6aeb9625dc9ebcba"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users"
            ADD CONSTRAINT "UQ_55f831a2761ea40103f8335a165" UNIQUE ("user_id")
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications" DROP CONSTRAINT "FK_c12bed7c34a8b33d9689947d125"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications"
            ADD CONSTRAINT "UQ_c12bed7c34a8b33d9689947d125" UNIQUE ("application_id")
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users"
            ADD CONSTRAINT "FK_55f831a2761ea40103f8335a165" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "invites"
            ADD CONSTRAINT "FK_df6bd3102db6aeb9625dc9ebcba" FOREIGN KEY ("inviter_user_id") REFERENCES "local_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications"
            ADD CONSTRAINT "FK_c12bed7c34a8b33d9689947d125" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_access_tokens"
            ADD CONSTRAINT "FK_7f1fe39b501171ef1d9771359f3" FOREIGN KEY ("local_user_id") REFERENCES "local_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_access_tokens"
            ADD CONSTRAINT "FK_89e06f799037f765e41f1831ea9" FOREIGN KEY ("local_application_id") REFERENCES "local_applications"("application_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_authorization_codes"
            ADD CONSTRAINT "FK_96d5bbb8651f45fa6a8fa15f0ca" FOREIGN KEY ("local_user_id") REFERENCES "local_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_authorization_codes"
            ADD CONSTRAINT "FK_d8489e27c9f80d5a0f1583f8f4f" FOREIGN KEY ("local_application_id") REFERENCES "local_applications"("application_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "oauth_authorization_codes" DROP CONSTRAINT "FK_d8489e27c9f80d5a0f1583f8f4f"
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_authorization_codes" DROP CONSTRAINT "FK_96d5bbb8651f45fa6a8fa15f0ca"
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_access_tokens" DROP CONSTRAINT "FK_89e06f799037f765e41f1831ea9"
        `)
        await queryRunner.query(`
            ALTER TABLE "oauth_access_tokens" DROP CONSTRAINT "FK_7f1fe39b501171ef1d9771359f3"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications" DROP CONSTRAINT "FK_c12bed7c34a8b33d9689947d125"
        `)
        await queryRunner.query(`
            ALTER TABLE "invites" DROP CONSTRAINT "FK_df6bd3102db6aeb9625dc9ebcba"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users" DROP CONSTRAINT "FK_55f831a2761ea40103f8335a165"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications" DROP CONSTRAINT "UQ_c12bed7c34a8b33d9689947d125"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications"
            ADD CONSTRAINT "FK_c12bed7c34a8b33d9689947d125" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users" DROP CONSTRAINT "UQ_55f831a2761ea40103f8335a165"
        `)
        await queryRunner.query(`
            ALTER TABLE "invites"
            ADD CONSTRAINT "FK_df6bd3102db6aeb9625dc9ebcba" FOREIGN KEY ("inviter_user_id") REFERENCES "local_users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users"
            ADD CONSTRAINT "FK_55f831a2761ea40103f8335a165" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "applications" DROP COLUMN "updated_at"
        `)
        await queryRunner.query(`
            ALTER TABLE "applications" DROP COLUMN "created_at"
        `)
        await queryRunner.query(`
            DROP TABLE "oauth_authorization_codes"
        `)
        await queryRunner.query(`
            DROP TABLE "oauth_access_tokens"
        `)
    }
}
