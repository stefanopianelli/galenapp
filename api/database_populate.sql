-- Popolamento del database GalenicoLab
-- Versione 1.6 - Dati di esempio con logica corretta per ingredienti e campi obbligatori

-- Svuotare le tabelle esistenti in ordine inverso
DELETE FROM `logs`;
DELETE FROM `preparation_ingredients`;
DELETE FROM `preparations`;
DELETE FROM `inventory`;

-- Resettare l'auto-incremento
ALTER TABLE `inventory` AUTO_INCREMENT = 1;
ALTER TABLE `preparations` AUTO_INCREMENT = 1;
ALTER TABLE `preparation_ingredients` AUTO_INCREMENT = 1;
ALTER TABLE `logs` AUTO_INCREMENT = 1;

-- INVENTARIO (15 sostanze, nessuna scaduta)
INSERT INTO `inventory` (`id`, `name`, `ni`, `lot`, `expiry`, `quantity`, `unit`, `costPerGram`, `supplier`, `isExcipient`, `isContainer`, `isDoping`, `isNarcotic`, `securityData`) VALUES
(1, 'Minoxidil Base', '24/S001', 'MX-2401', '2026-12-31', 480.00, 'g', 0.90, 'Farma-Chemical', 0, 0, 0, 0, '{"pictograms":["GHS07"]}'),
(2, 'Idrocortisone Butirrato', '24/S002', 'HCB-2402', '2025-11-30', 99.00, 'g', 1.25, 'Pharma-Actives', 0, 0, 1, 0, '{"pictograms":["GHS08"]}'),
(3, 'Sildenafil Citrato', '24/S003', 'SIL-2403', '2026-05-31', 198.00, 'g', 2.75, 'Pharma-Actives', 0, 0, 0, 0, '{"pictograms":["GHS07", "GHS08"]}'),
(4, 'Acido Salicilico', '24/S004', 'AS-2401', '2027-01-31', 950.00, 'g', 0.10, 'Farma-Chemical', 0, 0, 0, 0, '{"pictograms":["GHS05", "GHS07"]}'),
(5, 'Melatonina', '24/S005', 'MLT-2404', '2026-08-31', 250.00, 'g', 3.50, 'NaturePharma', 0, 0, 0, 0, '{"pictograms":[]}'),
(6, 'Clotrimazolo', '24/S006', 'CLT-2312', '2025-12-31', 200.00, 'g', 1.10, 'Farma-Chemical', 0, 0, 0, 0, '{"pictograms":["GHS07"]}'),
(7, 'Glicole Propilenico', '24/E001', 'GP-2401', '2025-10-31', 4800.00, 'ml', 0.04, 'Farma-Chemical', 1, 0, 0, 0, '{"pictograms":[]}'),
(8, 'Alcool Etilico 96°', '24/E002', 'ALC-2402', '2027-03-31', 8500.00, 'ml', 0.02, 'Distillerie Nazionali', 1, 0, 0, 0, '{"pictograms":["GHS02"]}'),
(9, 'Crema Base Lipo', '24/E003', 'CBL-2401', '2025-09-30', 1850.00, 'g', 0.05, 'Galenica Srl', 1, 0, 0, 0, '{"pictograms":[]}'),
(10, 'Lattosio Monoidrato', '24/E004', 'LAC-2403', '2026-06-30', 4000.00, 'g', 0.01, 'Galenica Srl', 1, 0, 0, 0, '{"pictograms":[]}'),
(11, 'Camomilla Fiori T.T.', '24/E005', 'CAM-2311', '2025-11-30', 500.00, 'g', 0.11, 'HerbalSana', 1, 0, 0, 0, '{"pictograms":[]}'),
(12, 'Flacone vetro 100ml c/contagocce', '24/C001', 'FLV-24', '2029-01-01', 95, 'n.', 0.80, 'Pharma-Packaging', 0, 1, 0, 0, '{"pictograms":[]}'),
(13, 'Vasetto unguento 50g', '24/C002', 'VAS-24', '2029-01-01', 198, 'n.', 0.45, 'Pharma-Packaging', 0, 1, 0, 0, '{"pictograms":[]}'),
(14, 'Capsule Gelatina Dura Tipo 0', '24/C003', 'CAPS-0-24', '2028-01-01', 880, 'n.', 0.02, 'Capsul-It', 0, 1, 0, 0, '{"pictograms":[]}'),
(15, 'Busta per tisana 100g', '24/C004', 'BUST-24', '2029-01-01', 300, 'n.', 0.15, 'Pharma-Packaging', 0, 1, 0, 0, '{"pictograms":[]}');


-- PREPARAZIONI (7 magistrali, 3 officinali, 2 in bozza)
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `date`, `patient`, `doctor`, `recipeDate`, `prepType`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `posology`, `status`, `totalPrice`, `patientPhone`, `usage`, `techOps`) VALUES
(1, '24/P001', 'Minoxidil 5% Lozione', '2024-04-15', 'Mario Rossi', 'Dr. Bianchi', '2024-04-10', 'magistrale', 'Preparazioni liquide (soluzioni)', 100, 'ml', '2024-07-15', '1ml sul cuoio capelluto due volte al giorno.', 'Completata', 28.50, '3331234567', 'Topica', '["SOLUBILIZZAZIONE"]'),
(2, '24/P002', 'Idrocortisone 1% Crema', '2024-04-14', 'Laura Verdi', 'Dr. Neri', '2024-04-14', 'magistrale', 'Preparazioni semisolide per applicazione cutanea e paste', 50, 'g', '2024-10-14', 'Applicare 1-2 volte al giorno.', 'Completata', 22.50, '3478901234', 'Topica', '["MISCELAZIONE"]'),
(3, '24/P003', 'Sildenafil 100mg', '2024-04-12', 'Giovanni Gialli', 'Dr. Azzurri', '2024-04-01', 'magistrale', 'Capsule', 10, 'n.', '2024-10-12', 'Una capsula al bisogno.', 'Completata', 55.20, '3385566778', 'Orale', '["MISCELAZIONE", "RIEMPIMENTO", "DIVISIONE_IN_DOSI"]'),
(4, '24/P004', 'Melatonina 5mg - Bozza', '2024-04-11', 'Paola Neri', 'Autoprescrizione', '2024-04-11', 'magistrale', 'Capsule', 60, 'n.', '2024-10-11', 'Una capsula la sera.', 'Bozza', 32.80, '3358877665', 'Orale', '[]'),
(5, '24/P005', 'Acido Salicilico 5% Unguento', '2024-04-10', 'Franco Marroni', 'Dr. Rossi', '2024-04-09', 'magistrale', 'Preparazioni semisolide per applicazione cutanea e paste', 100, 'g', '2024-07-10', 'Applicare localmente.', 'Completata', 19.40, '', 'Topica', '[]'),
(6, '24/P006', 'Cartine di Fermenti', '2024-04-08', 'Bambino Rossi', 'Dr. Pediatra', '2024-04-08', 'magistrale', 'Cartine e cialdini', 20, 'n.', '2024-06-08', 'Una al giorno.', 'Completata', 17.60, '3331234567', 'Orale', '[]'),
(7, '24/P007', 'Clotrimazolo Ovuli', '2024-04-02', 'Giovanna Verdi', 'Dr. Ginecologo', '2024-04-01', 'magistrale', 'Suppositori e ovuli', 12, 'n.', '2024-07-02', 'Un ovulo la sera per 12 giorni.', 'Completata', 28.90, '3478901234', 'Vaginale', '["FUSIONE", "RIEMPIMENTO_STAMPI"]'),
(8, '24/P008', 'Alcool Borico 3%', '2024-04-15', NULL, NULL, NULL, 'officinale', 'Preparazioni liquide (soluzioni)', 100, 'ml', '2025-04-15', 'Uso esterno.', 'Completata', 12.50, NULL, 'Topica', '[]'),
(9, '24/P009', 'Tisana Rilassante - Bozza', '2024-04-12', NULL, NULL, NULL, 'officinale', 'Polveri composte e piante per tisane', 100, 'g', '2024-12-12', 'Un cucchiaio in acqua calda.', 'Bozza', 15.80, NULL, 'Orale', '["MISCELAZIONE"]'),
(10, '24/P010', 'Eosina 1% Soluzione Acquosa', '2024-03-25', NULL, NULL, NULL, 'officinale', 'Preparazioni liquide (soluzioni)', 50, 'ml', '2024-09-25', 'Applicare sulla parte interessata.', 'Completata', 10.20, NULL, 'Topica', '[]');

-- INGREDIENTI DELLE PREPARAZIONI
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`) VALUES
(1, 1, 5.00), (1, 7, 20.00), (1, 8, 50.00), (1, 12, 1.00),
(2, 2, 0.50), (2, 9, 49.50), (2, 13, 1.00),
(3, 3, 1.00), (3, 10, 4.00), (3, 14, 10.00),
(4, 5, 0.30), (4, 10, 20.00), (4, 14, 60.00),
(5, 4, 5.00), (5, 9, 95.00), (5, 13, 2.00),
(6, 10, 15.00),
(7, 6, 1.20),
(8, 4, 3.00), (8, 8, 97.00),
(9, 11, 100.00), (9, 15, 1.00),
(10, 8, 50.00);


-- LOG
INSERT INTO `logs` (`date`, `type`, `substance`, `ni`, `quantity`, `unit`, `notes`, `operator`, `preparationId`) VALUES
('2024-04-15', 'SCARICO', 'Minoxidil Base', '24/S001', 5.00, 'g', 'Prep. #24/P001', 'Sistema', 1),
('2024-04-14', 'SCARICO', 'Idrocortisone Butirrato', '24/S002', 0.50, 'g', 'Prep. #24/P002', 'Sistema', 2),
('2024-04-12', 'SCARICO', 'Sildenafil Citrato', '24/S003', 1.00, 'g', 'Prep. #24/P003', 'Sistema', 3),
('2024-04-02', 'CARICO', 'Sildenafil Citrato', '24/S003', 200.00, 'g', 'DDT 123', 'Sistema', NULL),
('2024-03-25', 'CARICO', 'Minoxidil Base', '24/S001', 500.00, 'g', 'DDT 119', 'Sistema', NULL);