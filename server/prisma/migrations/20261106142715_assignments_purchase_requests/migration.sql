-- CreateTable
CREATE TABLE `feeding_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `center_id` INTEGER NOT NULL,
    `feeding_date` DATE NOT NULL,
    `parent_id` INTEGER NOT NULL,
    `assigned_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `feeding_assignments_parent_id_feeding_date_idx`(`parent_id`, `feeding_date`),
    UNIQUE INDEX `feeding_assignments_center_id_feeding_date_parent_id_key`(`center_id`, `feeding_date`, `parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `center_id` INTEGER NOT NULL,
    `feeding_date` DATE NOT NULL,
    `menu_day_id` INTEGER NOT NULL,
    `pr_no` VARCHAR(30) NOT NULL,
    `status` ENUM('OPEN', 'LOCKED', 'NO_FEEDING') NOT NULL DEFAULT 'OPEN',
    `enrolled_count` INTEGER NULL,
    `rate_per_child` DECIMAL(10, 2) NULL,
    `budget` DECIMAL(12, 2) NULL,
    `locked_at` DATETIME(3) NULL,
    `locked_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `purchase_requests_menu_day_id_idx`(`menu_day_id`),
    UNIQUE INDEX `purchase_requests_center_id_feeding_date_key`(`center_id`, `feeding_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_request_id` INTEGER NOT NULL,
    `item_no` INTEGER NOT NULL,
    `description` VARCHAR(80) NOT NULL,
    `unit` VARCHAR(10) NULL,
    `quantity` DECIMAL(10, 3) NULL,
    `unit_cost` DECIMAL(10, 2) NULL,
    `filled_by` INTEGER NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `purchase_items_purchase_request_id_item_no_idx`(`purchase_request_id`, `item_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `feeding_assignments` ADD CONSTRAINT `feeding_assignments_center_id_fkey` FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feeding_assignments` ADD CONSTRAINT `feeding_assignments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_center_id_fkey` FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_requests` ADD CONSTRAINT `purchase_requests_menu_day_id_fkey` FOREIGN KEY (`menu_day_id`) REFERENCES `menu_days`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchase_request_id_fkey` FOREIGN KEY (`purchase_request_id`) REFERENCES `purchase_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
