ALTER TABLE `sessions` ADD `source` text DEFAULT 'phone' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `watch_detail` text;