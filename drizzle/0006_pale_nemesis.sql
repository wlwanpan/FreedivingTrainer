PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_format` text DEFAULT 'YYYY-MM-DD' NOT NULL,
	`breathe_up_seconds` integer DEFAULT 60 NOT NULL,
	`training_animation` integer DEFAULT true NOT NULL,
	`co2_hold_seconds` integer DEFAULT 90 NOT NULL,
	`co2_rest_start_seconds` integer DEFAULT 120 NOT NULL,
	`co2_rest_step_seconds` integer DEFAULT 15 NOT NULL,
	`co2_rounds` integer DEFAULT 8 NOT NULL,
	`o2_hold_start_seconds` integer DEFAULT 60 NOT NULL,
	`o2_hold_step_seconds` integer DEFAULT 15 NOT NULL,
	`o2_rest_seconds` integer DEFAULT 120 NOT NULL,
	`o2_rounds` integer DEFAULT 8 NOT NULL,
	`baseline_max_hold_seconds` integer,
	`baseline_contraction_seconds` integer,
	`baseline_tested_at` integer,
	`training_plan` text,
	`training_plan_started_at` integer,
	`custom_plan` text,
	`updated_at` integer,
	`created_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "date_format", "breathe_up_seconds", "training_animation", "co2_hold_seconds", "co2_rest_start_seconds", "co2_rest_step_seconds", "co2_rounds", "o2_hold_start_seconds", "o2_hold_step_seconds", "o2_rest_seconds", "o2_rounds", "baseline_max_hold_seconds", "baseline_contraction_seconds", "baseline_tested_at", "training_plan", "training_plan_started_at", "custom_plan", "updated_at", "created_at") SELECT "id", "date_format", "breathe_up_seconds", "training_animation", "co2_hold_seconds", "co2_rest_start_seconds", "co2_rest_step_seconds", "co2_rounds", "o2_hold_start_seconds", "o2_hold_step_seconds", "o2_rest_seconds", "o2_rounds", "baseline_max_hold_seconds", "baseline_contraction_seconds", "baseline_tested_at", "training_plan", "training_plan_started_at", "custom_plan", "updated_at", "created_at" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;