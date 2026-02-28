ALTER TABLE "db_connections" ADD COLUMN "type" varchar(20) DEFAULT 'postgresql' NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ADD COLUMN "schema" varchar(100) DEFAULT 'public';