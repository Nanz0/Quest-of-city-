-- DropForeignKey
ALTER TABLE `game` DROP FOREIGN KEY `Game_userId_fkey`;

-- AlterTable
ALTER TABLE `game` MODIFY `userId` VARCHAR(191) NOT NULL;
