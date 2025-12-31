--
-- Popolamento delle tabelle con dati di esempio
-- Metodo sicuro con DELETE per massima compatibilità

START TRANSACTION;

-- Svuota le tabelle in ordine, partendo da quella con le foreign key
DELETE FROM `preparation_ingredients`;
DELETE FROM `preparations`;
DELETE FROM `inventory`;
DELETE FROM `settings`;

-- Reimposta l'AUTO_INCREMENT per ogni tabella, così gli ID ripartono da 1
ALTER TABLE `preparations` AUTO_INCREMENT = 1;
ALTER TABLE `inventory` AUTO_INCREMENT = 1;
ALTER TABLE `preparation_ingredients` AUTO_INCREMENT = 1;
ALTER TABLE `settings` AUTO_INCREMENT = 1;


-- Popolamento tabella `inventory`
INSERT INTO `inventory` (`id`, `name`, `ni`, `lot`, `expiry`, `quantity`, `unit`, `totalCost`, `costPerGram`, `supplier`, `purity`, `receptionDate`, `ddtNumber`, `ddtDate`, `isExcipient`, `isContainer`, `isDoping`, `isNarcotic`, `securityData`) VALUES
(1, 'Paracetamolo Polvere', '25/S101', 'PAR-001', '2028-12-31', 850.00, 'g', 50.00, 0.0590, 'Acef', 'Ph.Eur.', '2025-01-15', 'ACE-1001', '2025-01-14', 0, 0, 0, 0, NULL),
(2, 'Melatonina', '25/S102', 'MEL-332', '2027-06-30', 95.00, 'g', 350.00, 3.6800, 'Farmalabor', '99.8%', '2025-02-20', 'FL-2002', '2025-02-18', 0, 0, 0, 0, NULL),
(3, 'Finasteride', '25/S103', 'FIN-A55', '2028-02-29', 48.00, 'g', 950.00, 19.7900, 'Galeno', '99.5%', '2025-03-10', 'GAL-3003', '2025-03-09', 0, 0, 1, 0, '{"cas":"98319-26-7","hazardStatements":"H360","pictograms":["GHS08"]}'),
(4, 'Tadalafil', '25/S104', 'TAD-B01', '2027-11-30', 22.00, 'g', 1200.00, 54.5400, 'Acef', '99.2%', '2025-04-05', 'ACE-4004', '2025-04-04', 0, 0, 1, 0, '{"cas":"171596-29-5","hazardStatements":"H361","pictograms":["GHS08"]}'),
(5, 'Curcumina Estr. Secco', '25/S105', 'CUR-95C', '2026-10-31', 450.00, 'g', 45.00, 0.1000, 'Farmalabor', '95%', '2025-05-12', 'FL-5005', '2025-05-10', 0, 0, 0, 0, NULL),
(6, 'Vitamina D3 100.000 UI/g', '25/S106', 'VD3-C01', '2026-08-31', 980.00, 'g', 120.00, 0.1220, 'Galeno', '100.000 UI/g', '2025-06-18', 'GAL-6006', '2025-06-17', 0, 0, 0, 0, NULL),
(7, 'Caffeina Anidra', '25/S107', 'CAF-007', '2029-01-01', 1800.00, 'g', 60.00, 0.0330, 'Acef', 'Ph.Eur.', '2025-07-22', 'ACE-7007', '2025-07-21', 0, 0, 0, 0, NULL),
(8, 'Minoxidil Base', '25/S108', 'MNX-A11', '2028-05-31', 200.00, 'g', 240.00, 1.2000, 'Farmalabor', '99.9%', '2025-08-01', 'FL-8008', '2025-07-30', 0, 0, 0, 0, '{"cas":"38304-91-5","hazardStatements":"H302, H315","pictograms":["GHS07"]}'),
(9, 'Diltiazem Cloridrato', '25/S109', 'DIL-X09', '2026-05-15', 80.00, 'g', 200.00, 2.5000, 'Acef', 'Ph.Eur.', '2025-01-02', 'ACE-9009', '2025-01-01', 0, 0, 0, 0, NULL),
(10, 'Coenzima Q10', '25/S110', 'Q10-Z01', '2026-02-28', 150.00, 'g', 180.00, 1.2000, 'Galeno', '99%', '2025-09-10', 'GAL-1010', '2025-09-09', 0, 0, 0, 0, NULL),
(11, 'Lattosio Monoidrato', '25/E001', 'LAC-001', '2027-12-31', 4500.00, 'g', 30.00, 0.0067, 'Farmalabor', 'FU', '2025-01-10', 'FL-E001', '2025-01-09', 1, 0, 0, 0, NULL),
(12, 'Cellulosa Microcristallina PH 102', '25/E002', 'CMC-102', '2028-01-31', 8800.00, 'g', 80.00, 0.0091, 'Acef', 'Ph.Eur.', '2025-02-15', 'ACE-E002', '2025-02-14', 1, 0, 0, 0, NULL),
(13, 'Magnesio Stearato Vegetale', '25/E003', 'MG-ST-V', '2026-11-30', 950.00, 'g', 25.00, 0.0260, 'Farmalabor', 'FU', '2025-03-20', 'FL-E003', '2025-03-19', 1, 0, 0, 0, NULL),
(14, 'Silice Colloidale Anidra', '25/E004', 'SIL-C01', '2025-11-01', 400.00, 'g', 15.00, 0.0375, 'Galeno', 'FU', '2024-11-01', 'GAL-E004', '2024-10-30', 1, 0, 0, 0, NULL),
(15, 'Tadalafil (OLD)', '24/S099', 'TAD-OLD', '2026-12-31', 0.00, 'g', 1000.00, 50.0000, 'Acef', '99%', '2024-10-01', 'ACE-OLD', '2024-09-30', 0, 0, 1, 0, NULL),
(101, 'Flacone Vetro Scuro 100ml', '25/C001', 'VET-100', '2030-12-31', 50.00, 'n.', 45.00, 0.9000, 'Vetreria Scienza', NULL, '2025-01-20', 'VS-001', '2025-01-18', 0, 1, 0, 0, NULL),
(102, 'Barattolo Plastica 50g', '25/C002', 'PL-50', '2029-06-30', 100.00, 'n.', 60.00, 0.6000, 'Plastilab', NULL, '2025-02-10', 'PL-442', '2025-02-08', 0, 1, 0, 0, NULL),
(103, 'Flacone Vetro 30ml + Contagocce', '25/C003', 'CG-30', '2030-01-01', 30.00, 'n.', 42.00, 1.4000, 'Vetreria Scienza', NULL, '2025-03-05', 'VS-055', '2025-03-04', 0, 1, 0, 0, NULL),
(104, 'Scatola Capsule (100 posti)', '25/C004', 'BOX-C', '2028-12-31', 200.00, 'n.', 100.00, 0.5000, 'Cartotecnica Galenica', NULL, '2025-04-12', 'CG-123', '2025-04-10', 0, 1, 0, 0, NULL);

-- Popolamento tabella `preparations`
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `posology`, `date`, `patient`, `doctor`, `status`, `totalPrice`, `prepType`, `notes`, `usage`, `operatingProcedures`, `labelWarnings`, `techOps`, `worksheetItems`, `recipeDate`, `batches`) VALUES
(201, '25/P001', 'Melatonina 5mg', 'Capsule', 120, 'n.', '2026-06-15', '1 caps 30 min prima di coricarsi', '2025-12-10', 'Laura Neri', 'Dr. Rossi', 'Completata', 32.50, 'magistrale', NULL, 'Orale', '', '[]', '[]', '[]', '2025-12-09', NULL),
(202, '25/P002', 'Finasteride 1mg', 'Capsule', 90, 'n.', '2026-06-12', '1 caps al giorno', '2025-12-12', 'Marco Verdi', 'Dr. Gialli', 'Completata', 38.00, 'magistrale', NULL, 'Orale', 'Miscelazione in progressione geometrica delle polveri.', '[]', '[]', '[{"text":"Verifica fonti documentali e calcoli","checked":true},{"text":"Controllo corrispondenza materie prime","checked":true},{"text":"Pesata/misura dei componenti","checked":true},{"text":"Miscelazione / Lavorazione","checked":true},{"text":"Allestimento / Incapsulamento / Ripartizione","checked":true},{"text":"Controllo di uniformità e aspetto","checked":true},{"text":"Etichettatura e confezionamento","checked":true}]', '2025-12-10', NULL),
(301, '25/P003', 'Minoxidil Base 5% Lozione', 'Lozione', 100, 'ml', '2026-02-28', 'Applicare 1ml (20 gocce) sul cuoio capelluto asciutto 1-2 volte al giorno.', '2025-12-14', '', '', 'Completata', 28.50, 'officinale', NULL, 'Topica', '1. Solubilizzare minoxidil in etanolo 96°.\n2. Aggiungere il glicole propilenico.\n3. Portare a volume con acqua depurata sotto agitazione.', '[]', '[]', '[{"text":"Verifica fonti documentali e calcoli","checked":true},{"text":"Controllo corrispondenza materie prime","checked":true},{"text":"Misurazione volumi","checked":true},{"text":"Solubilizzazione","checked":true},{"text":"Controllo di aspetto e limpidezza","checked":true},{"text":"Etichettatura e confezionamento","checked":true}]', NULL, '[{"containerId":101,"productQuantity":100,"unitPrice":25}]'),
(302, '25/P004', 'Crema Base Idratante', 'Crema', 200, 'g', '2026-03-15', 'Applicare sulla zona interessata più volte al giorno.', '2025-12-15', '', '', 'Bozza', 0.00, 'officinale', NULL, 'Topica', '', '[]', '[]', '[]', NULL, '[]');

-- Popolamento tabella `preparation_ingredients`
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`) VALUES
(201, 2, 0.60),
(201, 11, 35.40),
(201, 104, 2.00),
(202, 3, 0.09),
(202, 12, 26.91),
(202, 104, 1.00),
(301, 8, 5.00),
(301, 101, 1.00),
(302, 102, 4.00);

COMMIT;
