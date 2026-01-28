CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('customer', 'supplier', 'doctor') NOT NULL COMMENT 'Tipo di contatto',
  `name` VARCHAR(255) NOT NULL COMMENT 'Ragione Sociale o Nome e Cognome',
  `taxId` VARCHAR(50) DEFAULT NULL COMMENT 'Codice Fiscale o Partita IVA',
  `email` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `zip` VARCHAR(10) DEFAULT NULL,
  `province` VARCHAR(5) DEFAULT NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`type`),
  INDEX (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
