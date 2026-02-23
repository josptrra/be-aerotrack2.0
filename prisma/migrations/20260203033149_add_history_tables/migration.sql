/*
  Warnings:

  - You are about to drop the `flightposition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `flightposition`;

-- CreateTable
CREATE TABLE `Flight` (
    `fr24_id` VARCHAR(191) NOT NULL,
    `hex` VARCHAR(191) NOT NULL,
    `callsign` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `firstSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeen` DATETIME(3) NOT NULL,

    PRIMARY KEY (`fr24_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlightPoint` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `flightId` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lon` DOUBLE NOT NULL,
    `track` INTEGER NOT NULL,
    `alt` INTEGER NOT NULL,
    `gspeed` INTEGER NOT NULL,
    `vspeed` INTEGER NOT NULL,
    `squawk` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL,

    INDEX `FlightPoint_flightId_idx`(`flightId`),
    INDEX `FlightPoint_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FlightPoint` ADD CONSTRAINT `FlightPoint_flightId_fkey` FOREIGN KEY (`flightId`) REFERENCES `Flight`(`fr24_id`) ON DELETE CASCADE ON UPDATE CASCADE;
