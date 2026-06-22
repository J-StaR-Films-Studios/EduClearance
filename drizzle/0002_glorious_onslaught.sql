CREATE TYPE "public"."school_claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."school_claim_type" AS ENUM('existing_school', 'new_school');--> statement-breakpoint
CREATE TABLE "school_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"requested_school_name" text NOT NULL,
	"requested_area" text NOT NULL,
	"requested_address" text NOT NULL,
	"applicant_user_id" text,
	"applicant_name" text NOT NULL,
	"applicant_email" text NOT NULL,
	"official_contact_name" text NOT NULL,
	"official_email" text NOT NULL,
	"official_phone" text NOT NULL,
	"proof_file_name" text NOT NULL,
	"proof_note" text NOT NULL,
	"type" "school_claim_type" NOT NULL,
	"status" "school_claim_status" NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "school_claims" ADD CONSTRAINT "school_claims_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_claims" ADD CONSTRAINT "school_claims_applicant_user_id_users_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_claims_school_id_idx" ON "school_claims" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_claims_applicant_user_id_idx" ON "school_claims" USING btree ("applicant_user_id");--> statement-breakpoint
CREATE INDEX "school_claims_status_idx" ON "school_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "school_claims_type_idx" ON "school_claims" USING btree ("type");