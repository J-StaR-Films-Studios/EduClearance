ALTER TABLE "school_claims" ADD COLUMN "proof_file_type" text;--> statement-breakpoint
ALTER TABLE "school_claims" ADD COLUMN "proof_file_size" integer;--> statement-breakpoint
ALTER TABLE "school_claims" ADD COLUMN "proof_file_data_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");