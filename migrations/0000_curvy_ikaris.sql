CREATE TABLE "custodial_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspector_name" text,
	"school" text NOT NULL,
	"date" text NOT NULL,
	"location" text NOT NULL,
	"location_description" text,
	"notes" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspection_id" integer,
	"photo_url" text NOT NULL,
	"thumbnail_url" text,
	"location_lat" text,
	"location_lng" text,
	"location_accuracy" text,
	"location_source" text DEFAULT 'gps',
	"building_id" text,
	"floor" integer,
	"room" text,
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"sync_status" text DEFAULT 'pending',
	"file_size" integer,
	"image_width" integer,
	"image_height" integer,
	"compression_ratio" text,
	"device_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspector_name" text,
	"school" text NOT NULL,
	"date" text NOT NULL,
	"inspection_type" text NOT NULL,
	"location_description" text NOT NULL,
	"room_number" text,
	"location_category" text,
	"building_name" text,
	"building_inspection_id" integer,
	"floors" integer,
	"vertical_horizontal_surfaces" integer,
	"ceiling" integer,
	"restrooms" integer,
	"customer_satisfaction" integer,
	"trash" integer,
	"project_cleaning" integer,
	"activity_support" integer,
	"safety_compliance" integer,
	"equipment" integer,
	"monitoring" integer,
	"notes" text,
	"images" text[],
	"verified_rooms" text[],
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"school" text NOT NULL,
	"month" text NOT NULL,
	"year" integer NOT NULL,
	"pdf_url" text NOT NULL,
	"pdf_file_name" text NOT NULL,
	"extracted_text" text,
	"notes" text,
	"uploaded_by" text,
	"file_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_inspection_id" integer NOT NULL,
	"room_type" text NOT NULL,
	"room_identifier" text,
	"floors" integer,
	"vertical_horizontal_surfaces" integer,
	"ceiling" integer,
	"restrooms" integer,
	"customer_satisfaction" integer,
	"trash" integer,
	"project_cleaning" integer,
	"activity_support" integer,
	"safety_compliance" integer,
	"equipment" integer,
	"monitoring" integer,
	"notes" text,
	"images" text[] DEFAULT '{}',
	"responses" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"photo_id" integer,
	"data" text NOT NULL,
	"retry_count" integer DEFAULT 0,
	"next_retry_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_photo_id_inspection_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."inspection_photos"("id") ON DELETE cascade ON UPDATE no action;