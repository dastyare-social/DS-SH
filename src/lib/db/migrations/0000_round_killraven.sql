CREATE TABLE "links" (
	"id" text PRIMARY KEY NOT NULL,
	"r_path" text NOT NULL,
	"r_to" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"redirects" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "links_id_unique" UNIQUE("id"),
	CONSTRAINT "links_r_path_unique" UNIQUE("r_path")
);
