-- SQL Dump for GalenicoLab - New Mock Data (v2.1 Fix)
--

START TRANSACTION;

-- Svuota le tabelle in ordine, partendo da quella con le foreign key
DELETE FROM `preparation_ingredients`;
DELETE FROM `preparations`;
DELETE FROM `inventory`;
DELETE FROM `settings`;
DELETE FROM `logs`;

-- Reimposta l'AUTO_INCREMENT per ogni tabella, così gli ID ripartono da 1
ALTER TABLE `preparations` AUTO_INCREMENT = 1;
ALTER TABLE `inventory` AUTO_INCREMENT = 1;
ALTER TABLE `preparation_ingredients` AUTO_INCREMENT = 1;
ALTER TABLE `settings` AUTO_INCREMENT = 1;
ALTER TABLE `logs` AUTO_INCREMENT = 1;

--
-- Popolamento tabella `inventory` (15 articoli)
--
INSERT INTO `inventory` (`id`, `name`, `ni`, `lot`, `expiry`, `quantity`, `unit`, `costPerGram`, `supplier`, `isExcipient`, `isContainer`, `isDoping`, `isNarcotic`, `securityData`) VALUES
(1, 'Idrocortisone Butirrato', '25/S001', 'HCB-2025A', '2027-10-31', 50.00, 'g', 15.5000, 'Acef', 0, 0, 0, 0, NULL),
(2, 'Ketoconazolo', '25/S002', 'KTC-001B', '2028-05-31', 250.00, 'g', 1.8000, 'Farmalabor', 0, 0, 0, 0, NULL),
(3, 'Acido Salicilico', '25/S003', 'AS-2025C', '2029-01-31', 500.00, 'g', 0.0800, 'Galeno', 0, 0, 0, 0, NULL),
(4, 'Testosterone Propionato', '25/S004', 'TEST-P-01', '2027-06-30', 25.00, 'g', 25.0000, 'Acef', 0, 0, 1, 0, '{"pictograms":["GHS08"]}'),
(5, 'Amni Visnaga Glicolico 5%', '25/S005', 'AV-GL-5', '2026-11-30', 100.00, 'ml', 0.9000, 'Sinerga', 0, 0, 0, 0, NULL),
(6, 'Urea', '25/S006', 'UR-123', '2028-12-31', 1000.00, 'g', 0.0500, 'Farmalabor', 0, 0, 0, 0, NULL),
(7, 'Olio di Mandorle Dolci', '25/S007', 'OMD-25', '2027-09-30', 2000.00, 'ml', 0.0200, 'Galeno', 1, 0, 0, 0, NULL),
(8, 'Alcool Cetilstearilico', '25/S008', 'ACS-01', '2029-10-31', 5000.00, 'g', 0.0150, 'Acef', 1, 0, 0, 0, NULL),
(9, 'Glicerolo', '25/S009', 'GLI-02', '2030-01-31', 3000.00, 'ml', 0.0100, 'Farmalabor', 1, 0, 0, 0, NULL),
(10, 'Niacinamide', '25/S010', 'NIA-007', '2027-08-31', 450.00, 'g', 0.2000, 'Galeno', 0, 0, 0, 0, NULL),
(11, 'Vaso per unguento 50g', '25/C001', 'VAS-50', '2030-12-31', 200.00, 'n.', 0.5000, 'Plastilab', 0, 1, 0, 0, NULL),
(12, 'Flacone vetro 200ml', '25/C002', 'FLV-200', '2030-12-31', 100.00, 'n.', 1.2000, 'Vetreria Scienza', 0, 1, 0, 0, NULL),
(13, 'Tubetto alluminio 100g', '25/C003', 'TUB-AL-100', '2030-12-31', 150.00, 'n.', 0.8000, 'Plastilab', 0, 1, 0, 0, NULL),
(14, 'Capsule Gelatina Dura N.1', '25/C004', 'CAPS-1', '2028-06-30', 5000.00, 'n.', 0.0200, 'Farmalabor', 0, 1, 0, 0, NULL),
(15, 'Siringa graduata 1ml', '25/C005', 'SIR-1ML', '2029-12-31', 300.00, 'n.', 0.1500, 'Plastilab', 0, 1, 0, 0, NULL);

-- Popolamento tabella `preparations` (10 preparazioni)
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `date`, `expiryDate`, `patient`, `doctor`, `recipeDate`, `posology`, `prepType`, `status`, `totalPrice`, `usage`, `operatingProcedures`, `labelWarnings`, `techOps`, `worksheetItems`, `batches`) VALUES
(101, '25/P001', 'Crema Idrocortisone Butirrato 0.1%', 'Crema', 50, 'g', '2025-12-01', '2026-06-01', 'Mario Rossi', 'Dr. Verdi', '2025-11-28', 'Applicare 1-2 volte al dì sulla zona interessata.', 'magistrale', 'Completata', 25.50, 'Topica', '', '[]', '[]', '[]', NULL),
(102, '25/P002', 'Niacinamide 10% Gel', 'Gel', 30, 'g', '2025-12-02', '2026-03-02', 'Laura Bianchi', 'Dr. Gialli', '2025-12-01', 'Applicare mattina e sera.', 'magistrale', 'Completata', 22.00, 'Topica', 'Preparare il gel secondo farmacopea.', '[]', '["Pesata","Miscelazione"]', '[]', NULL),
(103, '25/P003', 'Ketoconazolo 2% Shampoo', 'Shampoo', 200, 'ml', '2025-12-03', '2026-06-03', 'Paolo Neri', 'Dr. Blu', '2025-12-01', 'Usare 2-3 volte a settimana.', 'magistrale', 'Completata', 35.00, 'Topica', 'Disperdere il chetoconazolo in base.', '[]', '["Dissoluzione","Miscelazione","Misura di volume"]', '[]', NULL),
(104, '25/P004', 'Testosterone Propionato 5% in Olio', 'Soluzione Orale', 100, 'ml', '2025-12-05', '2026-06-05', 'Marco Gialli', 'Dr. Rossi', '2025-12-04', 'Secondo prescrizione medica.', 'magistrale', 'Completata', 75.00, 'Orale', 'Solubilizzare l''attivo nell''olio scaldato.', '["Tenere fuori dalla portata dei bambini"]', '["Pesata","Riscaldamento / Fusione / Evaporazione","Misura di volume"]', '[]', NULL),
(105, '25/P005', 'Crema all''Urea 10%', 'Crema', 100, 'g', '2025-12-08', '2026-03-08', 'Anna Verdi', 'Dr. Rossi', '2025-12-05', 'Applicare al bisogno sulle zone secche.', 'magistrale', 'Completata', 28.00, 'Topica', 'Emulsionare a caldo le fasi.', '[]', '["Pesata","Miscelazione","Emulsionare"]', '[]', NULL),
(106, '25/P006', 'Acido Salicilico 2% Lozione', 'Lozione', 100, 'ml', '2025-12-10', '2026-02-10', 'Luca Verdi', 'Dr. Gialli', '2025-12-09', 'Applicare con un batuffolo di cotone la sera.', 'magistrale', 'Bozza', 18.00, 'Topica', '', '[]', '[]', '[]', NULL),
(107, '25/P007', 'Capsule di Amni Visnaga', 'Capsule', 60, 'n.', '2025-12-11', '2026-06-11', 'Giulia Neri', 'Dr. Blu', '2025-12-10', '1 capsula al giorno.', 'magistrale', 'Completata', 45.00, 'Orale', 'Ripartire la polvere in capsule.', '[]', '["Pesata","Polverizzazione / Triturazione","Ripartizione in capsule/cartine"]', '[]', NULL),
(108, '25/P008', 'Crema base idratante', 'Crema', 500, 'g', '2025-12-12', '2026-06-12', '', '', NULL, 'Uso esterno.', 'officinale', 'Completata', 15.00, 'Topica', 'Preparazione standard per base emulsionante.', '[]', '["Pesata","Miscelazione","Emulsionare"]', '[]', '[{"containerId":11,"productQuantity":50,"unitPrice":15}]'),
(109, '25/P009', 'Olio da massaggio', 'Olio', 1000, 'ml', '2025-12-15', '2026-12-15', '', '', NULL, 'Applicare sulla pelle e massaggiare.', 'officinale', 'Completata', 12.00, 'Topica', 'Miscelare gli oli in proporzione.', '["Tenere al riparo da luce e fonti di calore"]', '["Misura di volume","Miscelazione"]', '[]', '[{"containerId":12,"productQuantity":100,"unitPrice":12}]'),
(110, '25/P010', 'Gel Rinfrescante', 'Gel', 300, 'g', '2025-12-16', '2026-04-16', '', '', NULL, 'Applicare al bisogno.', 'officinale', 'Bozza', 0.00, 'Topica', '', '[]', '[]', '[]', '[{"containerId":13,"productQuantity":3,"unitPrice":5}]');

--
-- Popolamento tabella `preparation_ingredients`
--
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`) VALUES
(101, 1, 0.05),
(101, 8, 20.00),
(101, 11, 29.95), -- Per Crema idrocortisone
(108, 6, 200.00), -- Per Crema base
(108, 7, 200.00),
(108, 8, 100.00),
(109, 7, 1000.00), -- Per Olio da massaggio
(110, 9, 290.00), -- Per Gel Rinfrescante
(110, 13, 10.00), -- Tubetto per Gel Rinfrescante
(102, 10, 3.00), -- Per Niacinamide Gel
(102, 9, 27.00),
(102, 13, 1.00), -- Tubetto per Niacinamide Gel
(103, 2, 4.00), -- Per Ketoconazolo Shampoo
(103, 12, 1.00), -- Flacone per Ketoconazolo Shampoo
(104, 4, 5.00), -- Per Testosterone Propionato
(104, 7, 95.00),
(104, 12, 1.00),
(105, 6, 10.00), -- Per Crema Urea
(105, 8, 30.00),
(105, 13, 2.00),
(106, 3, 2.00), -- Per Acido Salicilico Lozione
(106, 9, 98.00),
(106, 12, 1.00),
(107, 5, 30.00), -- Per Capsule Amni Visnaga
(107, 14, 60.00); -- Capsule per Amni Visnaga


--
-- Popolamento tabella `logs`
--
INSERT INTO `logs` (`id`, `date`, `type`, `substance`, `ni`, `quantity`, `unit`, `notes`, `operator`, `preparationId`) VALUES
(1, '2025-11-15', 'CARICO', 'Idrocortisone Butirrato', '25/S001', 50.00, 'g', 'Carico iniziale lotto', 'Sistema', NULL),
(2, '2025-11-15', 'CARICO', 'Ketoconazolo', '25/S002', 250.00, 'g', 'Carico iniziale lotto', 'Sistema', NULL),
(3, '2025-11-15', 'CARICO', 'Acido Salicilico', '25/S003', 500.00, 'g', 'Carico iniziale lotto', 'Sistema', NULL),
(4, '2025-12-01', 'SCARICO', 'Idrocortisone Butirrato', '25/S001', 0.05, 'g', 'Preparazione #25/P001', 'Sistema', 101),
(5, '2025-12-01', 'SCARICO', 'Alcool Cetilstearilico', '25/S008', 20.00, 'g', 'Preparazione #25/P001', 'Sistema', 101),
(6, '2025-12-02', 'SCARICO', 'Niacinamide', '25/S010', 3.00, 'g', 'Preparazione #25/P002', 'Sistema', 102),
(7, '2025-12-03', 'SCARICO', 'Ketoconazolo', '25/S002', 4.00, 'g', 'Preparazione #25/P003', 'Sistema', 103),
(8, '2025-12-05', 'SCARICO', 'Testosterone Propionato', '25/S004', 5.00, 'g', 'Preparazione #25/P004', 'Sistema', 104),
(9, '2025-12-08', 'SCARICO', 'Urea', '25/S006', 10.00, 'g', 'Preparazione #25/P005', 'Sistema', 105),
(10, '2025-12-11', 'SCARICO', 'Amni Visnaga Glicolico 5%', '25/S005', 30.00, 'ml', 'Preparazione #25/P007', 'Sistema', 107),
(11, '2025-12-12', 'SCARICO', 'Alcool Cetilstearilico', '25/S008', 150.00, 'g', 'Preparazione #25/P008', 'Sistema', 108);


COMMIT;