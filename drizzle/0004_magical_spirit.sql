DROP INDEX `idx_occupied_date_time`;--> statement-breakpoint
ALTER TABLE `occupied_slots` ADD `bay` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_occupied_date_time_bay` ON `occupied_slots` (`date`,`time`,`bay`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `manage_token_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_manage_token` ON `bookings` (`manage_token_hash`);--> statement-breakpoint
ALTER TABLE `business_settings` ADD `capacity` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `cash_entries` ADD `booking_id` text;--> statement-breakpoint
ALTER TABLE `cash_entries` ADD `voided_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cash_booking_active` ON `cash_entries` (`booking_id`) WHERE booking_id IS NOT NULL AND voided_at IS NULL;