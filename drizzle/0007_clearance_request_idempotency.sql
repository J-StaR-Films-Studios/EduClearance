ALTER TABLE "clearance_requests" ADD COLUMN "request_key" text;--> statement-breakpoint
ALTER TABLE "clearance_requests" ADD COLUMN "request_fingerprint" text;--> statement-breakpoint
CREATE UNIQUE INDEX "clearance_requests_school_request_key_unique" ON "clearance_requests" USING btree ("incoming_school_id","request_key");