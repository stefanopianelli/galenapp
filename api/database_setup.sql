-- SQL Dump for GalenicoLab
-- version 1.1 - Added DROP TABLE statements for idempotency

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `galenapp`
--

-- Elimina le tabelle esistenti in ordine inverso per rispettare le foreign key
DROP TABLE IF EXISTS `logs`;
DROP TABLE IF EXISTS `preparation_ingredients`;
DROP TABLE IF EXISTS `preparations`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;


-- --------------------------------------------------------

--
-- Struttura della tabella `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ni` varchar(50) DEFAULT NULL,
  `lot` varchar(100) DEFAULT NULL,
  `expiry` date DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `totalCost` decimal(10,2) DEFAULT NULL,
  `costPerGram` decimal(10,4) DEFAULT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `purity` varchar(50) DEFAULT NULL,
  `receptionDate` date DEFAULT NULL,
  `ddtNumber` varchar(100) DEFAULT NULL,
  `ddtDate` date DEFAULT NULL,
  `firstUseDate` date DEFAULT NULL,
  `minStock` decimal(10,2) DEFAULT 0,
  `disposed` tinyint(1) NOT NULL DEFAULT 0,
  `isExcipient` tinyint(1) NOT NULL DEFAULT 0,
  `isContainer` tinyint(1) NOT NULL DEFAULT 0,
  `isDoping` tinyint(1) NOT NULL DEFAULT 0,
  `isNarcotic` tinyint(1) NOT NULL DEFAULT 0,
  `sdsFile` varchar(255) DEFAULT NULL,
  `technicalSheetFile` varchar(255) DEFAULT NULL,
  `securityData` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Struttura della tabella `preparations`
--

CREATE TABLE `preparations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prepNumber` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `pharmaceuticalForm` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `prepUnit` varchar(20) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `posology` text DEFAULT NULL,
  `date` date DEFAULT NULL,
  `patient` varchar(255) DEFAULT NULL,
  `patientPhone` varchar(50) DEFAULT NULL,
  `doctor` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Bozza',
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `prepType` varchar(50) DEFAULT 'magistrale',
  `notes` text DEFAULT NULL,
  `usage` varchar(100) DEFAULT NULL,
  `operatingProcedures` text DEFAULT NULL,
  `labelWarnings` text DEFAULT NULL,
  `customLabelWarning` text DEFAULT NULL,
  `techOps` text DEFAULT NULL,
  `worksheetItems` text DEFAULT NULL,
  `recipeDate` date DEFAULT NULL,
  `batches` text DEFAULT NULL,
  `pricingData` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prepNumber` (`prepNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Struttura della tabella `preparation_ingredients`
--

CREATE TABLE `preparation_ingredients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `preparationId` int(11) NOT NULL,
  `inventoryId` int(11) NOT NULL,
  `amountUsed` decimal(10,2) NOT NULL,
  `isExcipient` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `preparationId` (`preparationId`),
  KEY `inventoryId` (`inventoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Struttura della tabella `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `settingKey` varchar(255) NOT NULL,
  `settingValue` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settingKey` (`settingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'operator',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Struttura della tabella `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `type` varchar(50) NOT NULL,
  `substance` varchar(255) DEFAULT NULL,
  `ni` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `operator` varchar(255) DEFAULT NULL,
  `preparationId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `preparationId` (`preparationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `preparation_ingredients`
--
ALTER TABLE `preparation_ingredients`
  ADD CONSTRAINT `preparation_ingredients_ibfk_1` FOREIGN KEY (`preparationId`) REFERENCES `preparations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `preparation_ingredients_ibfk_2` FOREIGN KEY (`inventoryId`) REFERENCES `inventory` (`id`);
  
--
-- Limiti per la tabella `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`preparationId`) REFERENCES `preparations` (`id`) ON DELETE SET NULL;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;