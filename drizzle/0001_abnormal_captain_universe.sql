CREATE TABLE `business_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Duu Jato' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`notice` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `closed_dates` (
	`date` text PRIMARY KEY NOT NULL,
	`reason` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weekly_hours` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`enabled` integer NOT NULL,
	`opening` text NOT NULL,
	`closing` text NOT NULL,
	`break_start` text,
	`break_end` text
);
