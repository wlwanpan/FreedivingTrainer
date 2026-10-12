ALTER TABLE `sessions` ADD `contractions` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `training_gestures_seen` integer DEFAULT false NOT NULL;