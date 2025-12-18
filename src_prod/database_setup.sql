-- --------------------------------------------------------
-- Struttura del Database per GalenicoLab
-- Database: `galenico_lab`
-- --------------------------------------------------------

--
-- Struttura della tabella `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `ni` varchar(50) DEFAULT NULL,
  `lot` varchar(100) DEFAULT NULL,
  `expiry` date DEFAULT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit` varchar(10) NOT NULL,
  `totalCost` decimal(10,2) DEFAULT NULL,
  `costPerGram` decimal(12,6) DEFAULT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `purity` varchar(50) DEFAULT NULL,
  `receptionDate` date DEFAULT NULL,
  `ddtNumber` varchar(50) DEFAULT NULL,
  `ddtDate` date DEFAULT NULL,
  `firstUseDate` date DEFAULT NULL,
  `endUseDate` date DEFAULT NULL,
  `disposed` tinyint(1) NOT NULL DEFAULT 0,
  `sdsFile` varchar(255) DEFAULT NULL,
  `securityData` text DEFAULT NULL COMMENT 'JSON object for security info'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Struttura della tabella `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `type` varchar(50) NOT NULL,
  `substance` varchar(255) NOT NULL,
  `ni` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit` varchar(10) NOT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Struttura della tabella `pharmacy_settings`
--

CREATE TABLE `pharmacy_settings` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Struttura della tabella `preparations`
--

CREATE TABLE `preparations` (
  `id` int(11) NOT NULL,
  `prepNumber` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `pharmaceuticalForm` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `prepUnit` varchar(10) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `posology` text DEFAULT NULL,
  `date` date DEFAULT NULL,
  `patient` varchar(255) DEFAULT NULL,
  `doctor` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `totalPrice` decimal(10,2) DEFAULT NULL,
  `ingredients` text DEFAULT NULL COMMENT 'JSON array of ingredients'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indici per le tabelle scaricate
--
ALTER TABLE `inventory` ADD PRIMARY KEY (`id`);
ALTER TABLE `logs` ADD PRIMARY KEY (`id`);
ALTER TABLE `pharmacy_settings` ADD PRIMARY KEY (`id`);
ALTER TABLE `preparations` ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--
ALTER TABLE `inventory` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `logs` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `pharmacy_settings` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `preparations` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Popolamento del Database con Dati di Esempio
-- --------------------------------------------------------

--
-- Popolamento della tabella `pharmacy_settings`
--
INSERT INTO `pharmacy_settings` (`id`, `name`, `address`, `zip`, `city`, `province`, `phone`) VALUES
(1, 'Farmacia Galenica', 'Via Roma, 10', '10121', 'Torino', 'TO', '011-555-1234');


--
-- Popolamento della tabella `inventory` (20 sostanze)
-- Le date di scadenza sono calcolate dinamicamente a partire dalla data odierna
--
INSERT INTO `inventory` (`id`, `name`, `ni`, `lot`, `expiry`, `quantity`, `unit`, `totalCost`, `costPerGram`, `supplier`) VALUES
(1, 'Paracetamolo Polvere', '25/S101', 'PAR-001', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 850.000, 'g', 50.00, 0.059000, 'Acef'),
(2, 'Melatonina', '25/S102', 'MEL-332', DATE_ADD(CURDATE(), INTERVAL 18 MONTH), 95.000, 'g', 350.00, 3.680000, 'Farmalabor'),
(3, 'Finasteride', '25/S103', 'FIN-A55', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 48.000, 'g', 950.00, 19.790000, 'Galeno'),
(4, 'Tadalafil', '25/S104', 'TAD-B01', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 22.000, 'g', 1200.00, 54.540000, 'Acef'),
(5, 'Curcumina Estr. Secco', '25/S105', 'CUR-95C', DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 450.000, 'g', 45.00, 0.100000, 'Farmalabor'),
(6, 'Vitamina D3 100.000 UI/g', '25/S106', 'VD3-C01', DATE_ADD(CURDATE(), INTERVAL 8 MONTH), 980.000, 'g', 120.00, 0.122000, 'Galeno'),
(7, 'Caffeina Anidra', '25/S107', 'CAF-007', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 1800.000, 'g', 60.00, 0.033000, 'Acef'),
(8, 'Minoxidil Base', '25/S108', 'MNX-A11', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 200.000, 'g', 240.00, 1.200000, 'Farmalabor'),
(9, 'Diltiazem Cloridrato', '25/S109', 'DIL-X09', DATE_ADD(CURDATE(), INTERVAL 5 MONTH), 80.000, 'g', 200.00, 2.500000, 'Acef'),
(10, 'Coenzima Q10', '25/S110', 'Q10-Z01', DATE_ADD(CURDATE(), INTERVAL 2 MONTH), 150.000, 'g', 180.00, 1.200000, 'Galeno'),
(11, 'Lattosio Monoidrato', '25/E001', 'LAC-001', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 4500.000, 'g', 30.00, 0.006700, 'Farmalabor'),
(12, 'Cellulosa Microcristallina PH 102', '25/E002', 'CMC-102', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 8800.000, 'g', 80.00, 0.009100, 'Acef'),
(13, 'Magnesio Stearato Vegetale', '25/E003', 'MG-ST-V', DATE_ADD(CURDATE(), INTERVAL 11 MONTH), 950.000, 'g', 25.00, 0.026000, 'Farmalabor'),
(14, 'Silice Colloidale Anidra', '25/E004', 'SIL-C01', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), 400.000, 'g', 15.00, 0.037500, 'Galeno'),
(15, 'Tadalafil (Lotto Vecchio)', '24/S099', 'TAD-OLD', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 0.000, 'g', 1000.00, 50.000000, 'Acef'),
(16, 'Idrochinone', '25/S111', 'IDRO-01', DATE_ADD(CURDATE(), INTERVAL 14 MONTH), 100.000, 'g', 75.00, 0.750000, 'Acef'),
(17, 'Acido Salicilico', '25/S112', 'SAL-AC', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 500.000, 'g', 20.00, 0.040000, 'Farmalabor'),
(18, 'Urea', '25/S113', 'UREA-P', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 1000.000, 'g', 15.00, 0.015000, 'Galeno'),
(19, 'Glicole Propilenico', '25/E005', 'GLIC-PROP', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 2500.000, 'g', 40.00, 0.016000, 'Acef'),
(20, 'Olio di Vaselina', '25/E006', 'VAS-OIL', DATE_ADD(CURDATE(), INTERVAL 4 YEAR), 5000.000, 'g', 50.00, 0.010000, 'Farmalabor');

--
-- Popolamento della tabella `preparations` (15 preparazioni)
--
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `posology`, `date`, `patient`, `doctor`, `status`, `totalPrice`, `ingredients`) VALUES
(201, '25/P001', 'Melatonina 5mg', 'Capsule', 120, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps 30 min prima di coricarsi', CURDATE(), 'Laura Neri', 'Dr. Rossi', 'Completata', 32.50, '[{"id": 2, "name": "Melatonina", "ni": "25/S102", "lot": "MEL-332", "amountUsed": 0.6, "unit": "g"}, {"id": 11, "name": "Lattosio Monoidrato", "ni": "25/E001", "lot": "LAC-001", "amountUsed": 35.4, "unit": "g"}]'),
(202, '25/P002', 'Finasteride 1mg', 'Capsule', 90, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps al giorno', CURDATE(), 'Marco Verdi', 'Dr. Gialli', 'Completata', 38.00, '[{"id": 3, "name": "Finasteride", "ni": "25/S103", "lot": "FIN-A55", "amountUsed": 0.09, "unit": "g"}, {"id": 12, "name": "Cellulosa Microcristallina PH 102", "ni": "25/E002", "lot": "CMC-102", "amountUsed": 26.91, "unit": "g"}]'),
(203, '25/P003', 'Tadalafil 20mg', 'Capsule', 30, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps al bisogno', CURDATE(), 'Paolo Bianchi', 'Dr. Blu', 'Completata', 45.10, '[{"id": 4, "name": "Tadalafil", "ni": "25/S104", "lot": "TAD-B01", "amountUsed": 0.6, "unit": "g"}, {"id": 12, "name": "Cellulosa Microcristallina PH 102", "ni": "25/E002", "lot": "CMC-102", "amountUsed": 8.4, "unit": "g"}]'),
(204, '25/P004', 'Caffeina 100mg', 'Capsule', 60, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps al mattino', CURDATE(), 'Chiara Rossi', 'Dr. Neri', 'Completata', 28.75, '[{"id": 7, "name": "Caffeina Anidra", "ni": "25/S107", "lot": "CAF-007", "amountUsed": 6, "unit": "g"}, {"id": 11, "name": "Lattosio Monoidrato", "ni": "25/E001", "lot": "LAC-001", "amountUsed": 17.4, "unit": "g"}]'),
(205, '25/P005', 'Paracetamolo 500mg', 'Capsule', 20, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps ogni 6 ore al bisogno', CURDATE(), 'Luca Gialli', 'Dr. Verdi', 'Completata', 21.00, '[{"id": 1, "name": "Paracetamolo Polvere", "ni": "25/S101", "lot": "PAR-001", "amountUsed": 10, "unit": "g"}, {"id": 13, "name": "Magnesio Stearato Vegetale", "ni": "25/E003", "lot": "MG-ST-V", "amountUsed": 0.2, "unit": "g"}]'),
(206, '25/P006', 'Minoxidil 2.5mg', 'Capsule', 100, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps al giorno', CURDATE(), 'Giuseppe Rosato', 'Dr. Bruni', 'Completata', 30.00, '[{"id": 8, "name": "Minoxidil Base", "ni": "25/S108", "lot": "MNX-A11", "amountUsed": 0.25, "unit": "g"}, {"id": 12, "name": "Cellulosa Microcristallina PH 102", "ni": "25/E002", "lot": "CMC-102", "amountUsed": 29.75, "unit": "g"}]'),
(207, '25/P007', 'Coenzima Q10 100mg', 'Capsule', 60, 'n.', DATE_ADD(CURDATE(), INTERVAL 2 MONTH), '1 caps die', CURDATE(), 'Maria Ciano', 'Dr. Oliva', 'Completata', 35.20, '[{"id": 10, "name": "Coenzima Q10", "ni": "25/S110", "lot": "Q10-Z01", "amountUsed": 6, "unit": "g"}, {"id": 11, "name": "Lattosio Monoidrato", "ni": "25/E001", "lot": "LAC-001", "amountUsed": 18, "unit": "g"}]'),
(208, '25/P008', 'Curcumina 500mg', 'Capsule', 90, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '2 cps die', CURDATE(), 'Fabio Magenta', 'Dr. Viola', 'Completata', 31.80, '[{"id": 5, "name": "Curcumina Estr. Secco", "ni": "25/S105", "lot": "CUR-95C", "amountUsed": 45, "unit": "g"}, {"id": 13, "name": "Magnesio Stearato Vegetale", "ni": "25/E003", "lot": "MG-ST-V", "amountUsed": 0.9, "unit": "g"}]'),
(209, '25/P009', 'Diltiazem 60mg', 'Capsule', 100, 'n.', DATE_ADD(CURDATE(), INTERVAL 5 MONTH), '1 caps x 3/die', CURDATE(), 'Anna Arancio', 'Dr. Sole', 'Completata', 39.50, '[{"id": 9, "name": "Diltiazem Cloridrato", "ni": "25/S109", "lot": "DIL-X09", "amountUsed": 6, "unit": "g"}, {"id": 11, "name": "Lattosio Monoidrato", "ni": "25/E001", "lot": "LAC-001", "amountUsed": 24, "unit": "g"}]'),
(210, '25/P010', 'Vitamina D3 5000 UI', 'Capsule', 120, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps a settimana', CURDATE(), 'Mario Marrone', 'Dr. Bosco', 'Completata', 30.15, '[{"id": 6, "name": "Vitamina D3 100.000 UI/g", "ni": "25/S106", "lot": "VD3-C01", "amountUsed": 6, "unit": "g"}, {"id": 12, "name": "Cellulosa Microcristallina PH 102", "ni": "25/E002", "lot": "CMC-102", "amountUsed": 30, "unit": "g"}]'),
(211, '25/P011', 'Minoxidil 5% Soluzione', 'Soluzione Cutanea', 100, 'ml', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 ml la sera', CURDATE(), 'Carlo Neri', 'Dr.ssa Riva', 'Completata', 42.50, '[{"id": 8, "name": "Minoxidil Base", "ni": "25/S108", "lot": "MNX-A11", "amountUsed": 5, "unit": "g"}, {"id": 19, "name": "Glicole Propilenico", "ni": "25/E005", "lot": "GLIC-PROP", "amountUsed": 20, "unit": "g"}]'),
(212, '25/P012', 'Idrochinone 4% Crema', 'Crema', 30, 'g', DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 'Applicare la sera', CURDATE(), 'Sofia Verdi', 'Dr. Gialli', 'Completata', 25.00, '[{"id": 16, "name": "Idrochinone", "ni": "25/S111", "lot": "IDRO-01", "amountUsed": 1.2, "unit": "g"}]'),
(213, '25/P013', 'Acido Salicilico 2%', 'Lozione', 200, 'ml', DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 'Mattina e sera', CURDATE(), 'Giulia Blu', 'Dr. Rossi', 'Completata', 22.00, '[{"id": 17, "name": "Acido Salicilico", "ni": "25/S112", "lot": "SAL-AC", "amountUsed": 4, "unit": "g"}]'),
(214, '25/P014', 'Urea 10% Crema', 'Crema', 100, 'g', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Al bisogno', CURDATE(), 'Antonio Gialli', 'Dr. Verdi', 'Completata', 18.50, '[{"id": 18, "name": "Urea", "ni": "25/S113", "lot": "UREA-P", "amountUsed": 10, "unit": "g"}]'),
(215, '25/P015', 'Tadalafil 5mg', 'Capsule', 30, 'n.', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), '1 caps al giorno', CURDATE(), 'Roberto Neri', 'Dr. Rossi', 'Completata', 29.80, '[{"id": 4, "name": "Tadalafil", "ni": "25/S104", "lot": "TAD-B01", "amountUsed": 0.15, "unit": "g"}, {"id": 11, "name": "Lattosio Monoidrato", "ni": "25/E001", "lot": "LAC-001", "amountUsed": 8.85, "unit": "g"}]');

COMMIT;
