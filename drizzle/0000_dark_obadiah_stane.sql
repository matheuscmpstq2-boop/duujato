CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`duration` integer NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`vehicle` text NOT NULL,
	`plate` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `occupied_slots` (
	`date` text NOT NULL,
	`time` text NOT NULL,
	`booking_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_occupied_date_time` ON `occupied_slots` (`date`,`time`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`duration` integer NOT NULL,
	`price_cents` integer,
	`active` integer DEFAULT true NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL
);
