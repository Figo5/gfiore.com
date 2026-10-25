CREATE TABLE `github_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text,
	`checked_at` integer,
	`next_refresh_at` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL
);
