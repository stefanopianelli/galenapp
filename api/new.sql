-- phpMyAdmin SQL Dump
-- version 4.9.11
-- https://www.phpmyadmin.net/
--
-- Host: db5019179163.hosting-data.io
-- Creato il: Gen 27, 2026 alle 20:06
-- Versione del server: 8.0.36
-- Versione PHP: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbs15060154`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int NOT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_id` varchar(50) DEFAULT NULL,
  `details` text,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `inventory`
--

CREATE TABLE `inventory` (
  `id` int NOT NULL,
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
  `endUseDate` date DEFAULT NULL,
  `disposed` tinyint(1) NOT NULL DEFAULT '0',
  `isExcipient` tinyint(1) NOT NULL DEFAULT '0',
  `isContainer` tinyint(1) NOT NULL DEFAULT '0',
  `isDoping` tinyint(1) NOT NULL DEFAULT '0',
  `isNarcotic` tinyint(1) NOT NULL DEFAULT '0',
  `sdsFile` varchar(255) DEFAULT NULL,
  `technicalSheetFile` varchar(255) DEFAULT NULL,
  `securityData` text,
  `minStock` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `logs`
--

CREATE TABLE `logs` (
  `id` int NOT NULL,
  `date` date NOT NULL,
  `type` varchar(50) NOT NULL,
  `substance` varchar(255) DEFAULT NULL,
  `ni` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `notes` text,
  `operator` varchar(255) DEFAULT NULL,
  `preparationId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `preparations`
--

CREATE TABLE `preparations` (
  `id` int NOT NULL,
  `prepNumber` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `pharmaceuticalForm` varchar(100) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `prepUnit` varchar(20) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `posology` text,
  `date` date DEFAULT NULL,
  `patient` varchar(255) DEFAULT NULL,
  `patientPhone` varchar(50) DEFAULT NULL,
  `doctor` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Bozza',
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `prepType` varchar(50) DEFAULT 'magistrale',
  `notes` text,
  `usage` varchar(100) DEFAULT NULL,
  `operatingProcedures` text,
  `labelWarnings` text,
  `customLabelWarning` text,
  `techOps` text,
  `worksheetItems` text,
  `recipeDate` date DEFAULT NULL,
  `batches` text,
  `pricingData` text,
  `uniformityCheck` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `preparation_ingredients`
--

CREATE TABLE `preparation_ingredients` (
  `id` int NOT NULL,
  `preparationId` int NOT NULL,
  `inventoryId` int NOT NULL,
  `amountUsed` decimal(10,2) NOT NULL,
  `stockDeduction` decimal(10,4) DEFAULT NULL COMMENT 'Quantità effettiva scaricata dal magazzino (inclusa tolleranza)',
  `isExcipient` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `settings`
--

CREATE TABLE `settings` (
  `id` int NOT NULL,
  `settingKey` varchar(255) NOT NULL,
  `settingValue` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `createdAt`) VALUES
(1, 'admin', '$2y$12$ZGgGohQ3PR0d1h4ujBujL.mqCF9/OTZMLgMbXcIHmn.darWW4HU7K', 'admin', '2026-01-06 13:20:36'),
(3, 'farmacista', '$2y$12$DlT644CNLj68Rigif8VHEO5.lVTlx90zwqJkCEeh8AQfJO9.dhAji', 'pharmacist', '2026-01-07 18:52:08'),
(7, 'operatore', '$2y$12$iYghDC4T889K5cHoeJsbMeSifwopALS0RdvJTqmK7VLtzrBJreTna', 'operator', '2026-01-07 18:52:35');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`);

--
-- Indici per le tabelle `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `preparationId` (`preparationId`);

--
-- Indici per le tabelle `preparations`
--
ALTER TABLE `preparations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `prepNumber` (`prepNumber`);

--
-- Indici per le tabelle `preparation_ingredients`
--
ALTER TABLE `preparation_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `preparationId` (`preparationId`),
  ADD KEY `inventoryId` (`inventoryId`);

--
-- Indici per le tabelle `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settingKey` (`settingKey`);

--
-- Indici per le tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `preparations`
--
ALTER TABLE `preparations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `preparation_ingredients`
--
ALTER TABLE `preparation_ingredients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`preparationId`) REFERENCES `preparations` (`id`) ON DELETE SET NULL;

--
-- Limiti per la tabella `preparation_ingredients`
--
ALTER TABLE `preparation_ingredients`
  ADD CONSTRAINT `preparation_ingredients_ibfk_1` FOREIGN KEY (`preparationId`) REFERENCES `preparations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `preparation_ingredients_ibfk_2` FOREIGN KEY (`inventoryId`) REFERENCES `inventory` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
