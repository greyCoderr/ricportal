-- CreateTable
CREATE TABLE `menu_batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sheet_name` VARCHAR(100) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `pr_no` VARCHAR(30) NOT NULL,
    `pr_date` DATE NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu_days` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_id` INTEGER NOT NULL,
    `feeding_date` DATE NOT NULL,
    `day_no` INTEGER NOT NULL,
    `day_name` VARCHAR(20) NOT NULL,
    `menu_name` VARCHAR(200) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `menu_days_feeding_date_key`(`feeding_date`),
    INDEX `menu_days_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `menu_days` ADD CONSTRAINT `menu_days_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `menu_batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
