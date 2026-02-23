-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlightPosition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fr24_id` VARCHAR(191) NOT NULL,
    `hex` VARCHAR(191) NOT NULL,
    `callsign` VARCHAR(191) NULL,
    `lat` DOUBLE NOT NULL,
    `lon` DOUBLE NOT NULL,
    `track` INTEGER NOT NULL,
    `alt` INTEGER NOT NULL,
    `gspeed` INTEGER NOT NULL,
    `vspeed` INTEGER NOT NULL,
    `squawk` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FlightPosition_fr24_id_key`(`fr24_id`),
    INDEX `FlightPosition_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
