/*
  Warnings:

  - You are about to drop the `clue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gamesession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `landmark` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `specialcard` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `clue` DROP FOREIGN KEY `Clue_landmarkId_fkey`;

-- DropForeignKey
ALTER TABLE `gamesession` DROP FOREIGN KEY `GameSession_landmarkId_fkey`;

-- DropForeignKey
ALTER TABLE `gamesession` DROP FOREIGN KEY `GameSession_userId_fkey`;

-- DropForeignKey
ALTER TABLE `specialcard` DROP FOREIGN KEY `SpecialCard_ownerId_fkey`;

-- DropTable
DROP TABLE `clue`;

-- DropTable
DROP TABLE `gamesession`;

-- DropTable
DROP TABLE `landmark`;

-- DropTable
DROP TABLE `player`;

-- DropTable
DROP TABLE `specialcard`;
