CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`about` text NOT NULL,
	`favorites` text NOT NULL,
	`updated_at` text NOT NULL
);
