CREATE TYPE "public"."clearance_request_status" AS ENUM('pending_verification', 'no_platform_record_found', 'previous_school_notified', 'cleared_by_previous_school', 'outstanding_balance_reported', 'disputed', 'no_response', 'previous_school_not_on_platform', 'closed');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'resolved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('unresolved', 'resolved', 'disputed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('school_fees', 'books', 'uniform', 'transport', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('not_sent', 'dashboard', 'whatsapp_generated', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('paystack');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('initialized', 'successful', 'failed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."school_status" AS ENUM('unclaimed', 'pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."search_result" AS ENUM('no_match', 'possible_match', 'confirmed_match');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('platform_admin', 'school_owner', 'school_admin', 'school_staff');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_provider" AS ENUM('paystack', 'manual', 'system');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_type" AS ENUM('credit', 'debit', 'refund', 'adjustment');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_school_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"metadata_json" jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clearance_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"clearance_request_id" text,
	"reporting_school_id" text NOT NULL,
	"student_name" text NOT NULL,
	"student_name_normalized" text NOT NULL,
	"parent_name" text NOT NULL,
	"parent_phone" text NOT NULL,
	"amount_owed" integer NOT NULL,
	"issue_type" "issue_type" NOT NULL,
	"academic_session" text NOT NULL,
	"term" text NOT NULL,
	"note" text NOT NULL,
	"evidence_url" text,
	"status" "issue_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clearance_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"incoming_school_id" text NOT NULL,
	"previous_school_id" text,
	"previous_school_name_snapshot" text NOT NULL,
	"student_name" text NOT NULL,
	"student_name_normalized" text NOT NULL,
	"gender" text,
	"last_class" text,
	"parent_name" text NOT NULL,
	"parent_phone" text NOT NULL,
	"status" "clearance_request_status" NOT NULL,
	"search_result" "search_result" NOT NULL,
	"amount_charged" integer NOT NULL,
	"notification_status" "notification_status" NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"clearance_request_id" text,
	"clearance_issue_id" text,
	"raised_by_school_id" text,
	"reason" text NOT NULL,
	"status" "dispute_status" NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"provider" "payment_provider" DEFAULT 'paystack' NOT NULL,
	"provider_reference" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"status" "payment_status" NOT NULL,
	"metadata_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text,
	"area" text,
	"main_phone" text,
	"clearance_phone" text,
	"contact_email" text,
	"contact_person" text,
	"logo_url" text,
	"status" "school_status" DEFAULT 'unclaimed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"type" "wallet_transaction_type" NOT NULL,
	"amount_kobo" integer NOT NULL,
	"description" text NOT NULL,
	"reference" text NOT NULL,
	"provider" "wallet_transaction_provider" NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"balance_kobo" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_school_id_schools_id_fk" FOREIGN KEY ("actor_school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_issues" ADD CONSTRAINT "clearance_issues_clearance_request_id_clearance_requests_id_fk" FOREIGN KEY ("clearance_request_id") REFERENCES "public"."clearance_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_issues" ADD CONSTRAINT "clearance_issues_reporting_school_id_schools_id_fk" FOREIGN KEY ("reporting_school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_requests" ADD CONSTRAINT "clearance_requests_incoming_school_id_schools_id_fk" FOREIGN KEY ("incoming_school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_requests" ADD CONSTRAINT "clearance_requests_previous_school_id_schools_id_fk" FOREIGN KEY ("previous_school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clearance_requests" ADD CONSTRAINT "clearance_requests_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_clearance_request_id_clearance_requests_id_fk" FOREIGN KEY ("clearance_request_id") REFERENCES "public"."clearance_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_clearance_issue_id_clearance_issues_id_fk" FOREIGN KEY ("clearance_issue_id") REFERENCES "public"."clearance_issues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_school_id_schools_id_fk" FOREIGN KEY ("raised_by_school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_school_id_idx" ON "audit_logs" USING btree ("actor_school_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "clearance_issues_reporting_school_id_idx" ON "clearance_issues" USING btree ("reporting_school_id");--> statement-breakpoint
CREATE INDEX "clearance_issues_clearance_request_id_idx" ON "clearance_issues" USING btree ("clearance_request_id");--> statement-breakpoint
CREATE INDEX "clearance_issues_student_name_normalized_idx" ON "clearance_issues" USING btree ("student_name_normalized");--> statement-breakpoint
CREATE INDEX "clearance_issues_status_idx" ON "clearance_issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clearance_requests_incoming_school_id_idx" ON "clearance_requests" USING btree ("incoming_school_id");--> statement-breakpoint
CREATE INDEX "clearance_requests_previous_school_id_idx" ON "clearance_requests" USING btree ("previous_school_id");--> statement-breakpoint
CREATE INDEX "clearance_requests_student_name_normalized_idx" ON "clearance_requests" USING btree ("student_name_normalized");--> statement-breakpoint
CREATE INDEX "clearance_requests_status_idx" ON "clearance_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disputes_clearance_request_id_idx" ON "disputes" USING btree ("clearance_request_id");--> statement-breakpoint
CREATE INDEX "disputes_clearance_issue_id_idx" ON "disputes" USING btree ("clearance_issue_id");--> statement-breakpoint
CREATE INDEX "disputes_raised_by_school_id_idx" ON "disputes" USING btree ("raised_by_school_id");--> statement-breakpoint
CREATE INDEX "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_school_id_idx" ON "payments" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_reference_unique" ON "payments" USING btree ("provider_reference");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_slug_unique" ON "schools" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "schools_status_idx" ON "schools" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_school_id_idx" ON "users" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "wallet_transactions_school_id_idx" ON "wallet_transactions" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_transactions_reference_unique" ON "wallet_transactions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_school_id_unique" ON "wallets" USING btree ("school_id");