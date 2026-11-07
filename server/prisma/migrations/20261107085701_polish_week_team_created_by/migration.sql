-- AlterTable
ALTER TABLE `purchase_items` ADD COLUMN `created_by` INTEGER NULL;

-- CreateTable
CREATE TABLE `week_team_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `center_id` INTEGER NOT NULL,
    `week_start` DATE NOT NULL,
    `parent_id` INTEGER NOT NULL,
    `assigned_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `week_team_members_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `week_team_members_center_id_week_start_parent_id_key`(`center_id`, `week_start`, `parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `week_team_members` ADD CONSTRAINT `week_team_members_center_id_fkey` FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `week_team_members` ADD CONSTRAINT `week_team_members_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
