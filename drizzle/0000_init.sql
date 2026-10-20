CREATE TABLE "bands" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"edit_token" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"contact_info" text DEFAULT '' NOT NULL,
	"set_min" integer DEFAULT 25 NOT NULL,
	"members" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inputs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"monitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stage_plot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bringing" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone,
	"touched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bands_edit_token_unique" UNIQUE("edit_token")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Shanghai' NOT NULL,
	"changeover_min" integer DEFAULT 15 NOT NULL,
	"public_id" text NOT NULL,
	"live_status" text DEFAULT 'idle' NOT NULL,
	"live_band_id" text,
	"live_started_at" timestamp with time zone,
	"delay_min" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "gear" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "gear_user_id_kind_pk" PRIMARY KEY("user_id","kind")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_guest" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bands" ADD CONSTRAINT "bands_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gear" ADD CONSTRAINT "gear_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bands_event_idx" ON "bands" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_user_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");