CREATE TABLE `heart_rate_samples` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`bpm` integer NOT NULL,
	`recorded_at` integer NOT NULL
);
