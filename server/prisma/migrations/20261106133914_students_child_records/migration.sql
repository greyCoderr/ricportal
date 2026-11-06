-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `center_id` INTEGER NOT NULL,
    `school_year` VARCHAR(9) NOT NULL,
    `last_name` VARCHAR(60) NOT NULL,
    `first_name` VARCHAR(60) NOT NULL,
    `middle_name` VARCHAR(60) NULL,
    `gender` ENUM('M', 'F') NOT NULL,
    `birthdate` DATE NOT NULL,
    `weight_kg` DECIMAL(5, 2) NOT NULL,
    `height_cm` DECIMAL(5, 1) NOT NULL,
    `parent_guardian_name` VARCHAR(100) NOT NULL,
    `enrolled_on` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `birth_order` INTEGER NULL,
    `number_of_siblings` INTEGER NULL,
    `religion` VARCHAR(40) NULL,
    `ethnicity` VARCHAR(40) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `students_center_id_school_year_status_idx`(`center_id`, `school_year`, `status`),
    UNIQUE INDEX `students_center_id_school_year_last_name_first_name_birthdat_key`(`center_id`, `school_year`, `last_name`, `first_name`, `birthdate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conference_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `note_date` DATE NOT NULL,
    `note_time` VARCHAR(5) NULL,
    `notes` TEXT NOT NULL,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `conference_notes_student_id_note_date_idx`(`student_id`, `note_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `home_visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `visit_date` DATE NOT NULL,
    `observation` TEXT NOT NULL,
    `parent_info` TEXT NULL,
    `remarks` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `home_visits_student_id_visit_date_idx`(`student_id`, `visit_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `child_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `note_date` DATE NOT NULL,
    `progress_notes` TEXT NOT NULL,
    `created_by` INTEGER NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `child_progress_student_id_note_date_idx`(`student_id`, `note_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_center_id_fkey` FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conference_notes` ADD CONSTRAINT `conference_notes_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `home_visits` ADD CONSTRAINT `home_visits_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `child_progress` ADD CONSTRAINT `child_progress_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
