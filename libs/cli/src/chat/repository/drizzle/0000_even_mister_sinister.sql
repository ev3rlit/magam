CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL,
	`metadata_json` text
);
--> statement-breakpoint
CREATE INDEX `idx_messages_session_created_at` ON `chat_messages` (`session_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`group_id` text,
	`provider_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_updated_at` ON `chat_sessions` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_group_id` ON `chat_sessions` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_provider_id` ON `chat_sessions` (`provider_id`);--> statement-breakpoint
CREATE TABLE `session_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_session_groups_sort_order` ON `session_groups` (`sort_order`);