CREATE TABLE `design_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `design_user_created` ON `design_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `homes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`owner_name` text NOT NULL,
	`story` text NOT NULL,
	`config` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `homes_owner_id_unique` ON `homes` (`owner_id`);--> statement-breakpoint
CREATE TABLE `postcards` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`author_id` text NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`theme` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`home_id`) REFERENCES `homes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `postcards_home_created` ON `postcards` (`home_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `postcards_author_created` ON `postcards` (`author_id`,`created_at`);