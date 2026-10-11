CREATE TABLE `baseline_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`max_hold_seconds` integer NOT NULL,
	`contraction_seconds` integer,
	`tested_at` integer NOT NULL
);
