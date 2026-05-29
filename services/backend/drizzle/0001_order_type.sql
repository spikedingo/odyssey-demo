CREATE TYPE "public"."order_type" AS ENUM('dine_in', 'takeout', 'delivery');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" "order_type" DEFAULT 'dine_in' NOT NULL;
