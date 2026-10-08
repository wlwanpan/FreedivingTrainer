CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_type` text NOT NULL,
	`day` text NOT NULL,
	`rounds_completed` integer NOT NULL,
	`rounds_planned` integer NOT NULL,
	`hold_seconds` integer NOT NULL,
	`rest_seconds` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_format` text DEFAULT 'YYYY-MM-DD' NOT NULL,
	`breathe_up_seconds` integer DEFAULT 120 NOT NULL,
	`co2_hold_seconds` integer DEFAULT 90 NOT NULL,
	`co2_rest_start_seconds` integer DEFAULT 120 NOT NULL,
	`co2_rest_step_seconds` integer DEFAULT 15 NOT NULL,
	`co2_rounds` integer DEFAULT 8 NOT NULL,
	`o2_hold_start_seconds` integer DEFAULT 60 NOT NULL,
	`o2_hold_step_seconds` integer DEFAULT 15 NOT NULL,
	`o2_rest_seconds` integer DEFAULT 120 NOT NULL,
	`o2_rounds` integer DEFAULT 8 NOT NULL,
	`updated_at` integer,
	`created_at` integer
);
