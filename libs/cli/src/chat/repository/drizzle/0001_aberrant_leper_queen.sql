PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL,
	`metadata_json` text,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chat_messages`("id", "session_id", "role", "content", "provider_id", "created_at", "metadata_json") SELECT "id", "session_id", "role", "content", "provider_id", "created_at", "metadata_json" FROM `chat_messages`;--> statement-breakpoint
DROP TABLE `chat_messages`;--> statement-breakpoint
ALTER TABLE `__new_chat_messages` RENAME TO `chat_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_messages_session_created_at` ON `chat_messages` (`session_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `__new_chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`group_id` text,
	`provider_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`group_id`) REFERENCES `session_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_chat_sessions`("id", "title", "group_id", "provider_id", "created_at", "updated_at", "archived_at") SELECT "id", "title", "group_id", "provider_id", "created_at", "updated_at", "archived_at" FROM `chat_sessions`;--> statement-breakpoint
DROP TABLE `chat_sessions`;--> statement-breakpoint
ALTER TABLE `__new_chat_sessions` RENAME TO `chat_sessions`;--> statement-breakpoint
CREATE INDEX `idx_sessions_updated_at` ON `chat_sessions` (`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_group_id` ON `chat_sessions` (`group_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_provider_id` ON `chat_sessions` (`provider_id`);