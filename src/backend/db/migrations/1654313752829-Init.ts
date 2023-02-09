import { MigrationInterface, QueryRunner } from "typeorm"

export class Init1654313752829 implements MigrationInterface {
    name = "Init1654313752829"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "applications" (
                "id" bigint NOT NULL,
                "uri" text NOT NULL,
                "name" text NOT NULL,
                "website" text,
                CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id")
            );
            COMMENT ON COLUMN "applications"."website" IS 'URL'
        `)
        await queryRunner.query(`
            CREATE TABLE "users" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "uri" text NOT NULL,
                "url" text NOT NULL,
                "name" text NOT NULL,
                "screen_name" citext NOT NULL,
                "domain" citext,
                "is_instance_actor" boolean NOT NULL,
                "public_key_id" text NOT NULL,
                "public_key" text NOT NULL,
                "inbox_url" text NOT NULL,
                "outbox_url" text NOT NULL,
                "shared_inbox_url" text,
                "following_url" text,
                "followers_url" text,
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            );
            COMMENT ON COLUMN "users"."uri" IS 'like https://alice.example/users/1'
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_918f5e11e812c6b06a36f863f9" ON "users" ("uri")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e202db02314c647677d99a2ae7" ON "users" ("screen_name")
            WHERE domain IS NULL
        `)
        await queryRunner.query(`
            CREATE TABLE "local_users" (
                "user_id" bigint NOT NULL,
                "private_key" text NOT NULL,
                "hashed_password" text NOT NULL,
                "use_screen_name_as_object_id" boolean NOT NULL,
                "invite_id" uuid NOT NULL,
                CONSTRAINT "REL_55f831a2761ea40103f8335a16" UNIQUE ("user_id"),
                CONSTRAINT "REL_ef6bb172da692ba47ce3852dab" UNIQUE ("invite_id"),
                CONSTRAINT "CHK_34e8f63ad90ce693febcc398a3" CHECK (
                    hashed_password LIKE '$%'
                    OR hashed_password = 'disabled'::text
                ),
                CONSTRAINT "PK_55f831a2761ea40103f8335a165" PRIMARY KEY ("user_id")
            );
            COMMENT ON COLUMN "local_users"."use_screen_name_as_object_id" IS 'for accounts that migrated from Mastodon'
        `)
        await queryRunner.query(`
            CREATE TABLE "invites" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "comment" text NOT NULL,
                "inviter_user_id" bigint,
                CONSTRAINT "PK_aa52e96b44a714372f4dd31a0af" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "local_applications" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "application_id" bigint NOT NULL,
                "client_id" text NOT NULL,
                "hashed_client_secret" text NOT NULL,
                "redirect_uris" text array NOT NULL,
                "scopes" text array NOT NULL,
                "is_super_app" boolean NOT NULL,
                CONSTRAINT "REL_c12bed7c34a8b33d9689947d12" UNIQUE ("application_id"),
                CONSTRAINT "PK_c12bed7c34a8b33d9689947d125" PRIMARY KEY ("application_id")
            );
            COMMENT ON COLUMN "local_applications"."hashed_client_secret" IS 'SHA-256 + Base64'
        `)
        await queryRunner.query(`
            CREATE TABLE "posts" (
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" bigint NOT NULL,
                "uri" text NOT NULL,
                "url" text NOT NULL,
                "html" text NOT NULL,
                "spoiler" text NOT NULL,
                "user_id" bigint NOT NULL,
                "application_id" bigint,
                CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users"
            ADD CONSTRAINT "FK_55f831a2761ea40103f8335a165" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users"
            ADD CONSTRAINT "FK_ef6bb172da692ba47ce3852dabf" FOREIGN KEY ("invite_id") REFERENCES "invites"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
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
            ALTER TABLE "posts"
            ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "FK_246cfd6b3e91cc44280270f860c" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "posts" DROP CONSTRAINT "FK_246cfd6b3e91cc44280270f860c"
        `)
        await queryRunner.query(`
            ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_applications" DROP CONSTRAINT "FK_c12bed7c34a8b33d9689947d125"
        `)
        await queryRunner.query(`
            ALTER TABLE "invites" DROP CONSTRAINT "FK_df6bd3102db6aeb9625dc9ebcba"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users" DROP CONSTRAINT "FK_ef6bb172da692ba47ce3852dabf"
        `)
        await queryRunner.query(`
            ALTER TABLE "local_users" DROP CONSTRAINT "FK_55f831a2761ea40103f8335a165"
        `)
        await queryRunner.query(`
            DROP TABLE "posts"
        `)
        await queryRunner.query(`
            DROP TABLE "local_applications"
        `)
        await queryRunner.query(`
            DROP TABLE "invites"
        `)
        await queryRunner.query(`
            DROP TABLE "local_users"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e202db02314c647677d99a2ae7"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."IDX_918f5e11e812c6b06a36f863f9"
        `)
        await queryRunner.query(`
            DROP TABLE "users"
        `)
        await queryRunner.query(`
            DROP TABLE "applications"
        `)
    }
}
