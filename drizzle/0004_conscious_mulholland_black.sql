CREATE TABLE "case_timeline_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"author_user_id" text,
	"author_school_id" text,
	"entry_type" text NOT NULL,
	"body" text NOT NULL,
	"attachment_file_name" text,
	"attachment_file_type" text,
	"attachment_file_size" integer,
	"attachment_data_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_timeline_entries" ADD CONSTRAINT "case_timeline_entries_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_timeline_entries" ADD CONSTRAINT "case_timeline_entries_author_school_id_schools_id_fk" FOREIGN KEY ("author_school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_timeline_entries_entity_idx" ON "case_timeline_entries" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "case_timeline_entries_author_school_id_idx" ON "case_timeline_entries" USING btree ("author_school_id");