CREATE TABLE "daily_horoscope_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"visitor_id" uuid NOT NULL,
	"id" text NOT NULL,
	"values" jsonb NOT NULL,
	"lagna_index" integer,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_visitor_id_id_pk" PRIMARY KEY("visitor_id","id")
);
--> statement-breakpoint
CREATE INDEX "daily_horoscope_cache_expires_at_idx" ON "daily_horoscope_cache" USING btree ("expires_at");