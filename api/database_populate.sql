-- DISABILITA CONTROLLI CHIAVE ESTERNA PER TRUNCATE
SET FOREIGN_KEY_CHECKS = 0;

-- SVUOTA TABELLE (Usa DELETE per evitare errori FK su alcuni hosting)
DELETE FROM `logs`;
DELETE FROM `preparation_ingredients`;
DELETE FROM `preparations`;
DELETE FROM `inventory`;

-- RESET AUTO_INCREMENT
ALTER TABLE `logs` AUTO_INCREMENT = 1;
ALTER TABLE `preparation_ingredients` AUTO_INCREMENT = 1;
ALTER TABLE `preparations` AUTO_INCREMENT = 1;
ALTER TABLE `inventory` AUTO_INCREMENT = 1;

-- RIABILITA CONTROLLI
SET FOREIGN_KEY_CHECKS = 1;

-- 1. POPOLAMENTO MAGAZZINO (INVENTORY)
INSERT INTO `inventory` (`id`, `name`, `ni`, `lot`, `expiry`, `quantity`, `unit`, `costPerGram`, `isExcipient`, `isContainer`, `minStock`, `supplier`, `receptionDate`, `disposed`) VALUES
(1, 'Minoxidil Base', 'PA001', 'L-MX2025', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 100.00, 'g', 0.85, 0, 0, 10, 'Farmalabor', CURDATE(), 0),
(2, 'Progesterone Micronizzato', 'PA002', 'L-PRG99', DATE_ADD(CURDATE(), INTERVAL 18 MONTH), 50.00, 'g', 1.20, 0, 0, 5, 'Acef', CURDATE(), 0),
(3, 'Ketoconazolo', 'PA003', 'L-KETO1', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 50.00, 'g', 0.60, 0, 0, 5, 'Farmalabor', CURDATE(), 0),
(4, 'Acido Salicilico', 'PA004', 'L-SAL01', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 250.00, 'g', 0.15, 0, 0, 20, 'Acef', CURDATE(), 0),
(5, 'Urea USP', 'PA005', 'L-UR55', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1000.00, 'g', 0.05, 0, 0, 100, 'Farmalabor', CURDATE(), 0),
(6, 'Idrocortisone Acetato', 'PA006', 'L-HYD01', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 25.00, 'g', 2.50, 0, 0, 2, 'Acef', CURDATE(), 0),
(7, 'Mentolo Cristalli', 'PA007', 'L-MNT01', DATE_ADD(CURDATE(), INTERVAL 4 YEAR), 100.00, 'g', 0.30, 0, 0, 10, 'Farmalabor', CURDATE(), 0),
(8, 'Omeprazolo', 'PA008', 'L-OMP01', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 50.00, 'g', 1.50, 0, 0, 5, 'Acef', CURDATE(), 0),
(9, 'Lattosio Monoidrato', 'ECC01', 'L-LAT01', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 2000.00, 'g', 0.02, 1, 0, 500, 'Acef', CURDATE(), 0),
(10, 'Vaselina Bianca Filante', 'ECC02', 'L-VAS01', DATE_ADD(CURDATE(), INTERVAL 5 YEAR), 5000.00, 'g', 0.01, 1, 0, 1000, 'Farmalabor', CURDATE(), 0),
(11, 'Crema Base Idrofila', 'ECC03', 'L-CRB01', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1000.00, 'g', 0.08, 1, 0, 200, 'Acef', CURDATE(), 0),
(12, 'Alcool Etilico 96°', 'ECC04', 'L-ALC96', DATE_ADD(CURDATE(), INTERVAL 10 YEAR), 5000.00, 'ml', 0.03, 1, 0, 1000, 'Distillerie Locali', CURDATE(), 0),
(13, 'Acqua Depurata', 'ECC05', 'L-H2O', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 10000.00, 'ml', 0.001, 1, 0, 2000, 'Produzione Interna', CURDATE(), 0),
(14, 'Capsule Tipo 0 (Trasparenti)', 'CON01', 'L-CPS0', DATE_ADD(CURDATE(), INTERVAL 5 YEAR), 2000.00, 'n.', 0.02, 0, 1, 200, 'Capsugel', CURDATE(), 0),
(15, 'Capsule Tipo 1 (Bianche)', 'CON02', 'L-CPS1', DATE_ADD(CURDATE(), INTERVAL 5 YEAR), 1000.00, 'n.', 0.02, 0, 1, 200, 'Capsugel', CURDATE(), 0),
(16, 'Flacone Vetro Scuro 100ml', 'CON03', 'L-FL100', DATE_ADD(CURDATE(), INTERVAL 10 YEAR), 100.00, 'n.', 0.80, 0, 1, 20, 'Vetreria', CURDATE(), 0),
(17, 'Flacone Contagocce 10ml', 'CON04', 'L-FL10', DATE_ADD(CURDATE(), INTERVAL 10 YEAR), 200.00, 'n.', 0.50, 0, 1, 20, 'Vetreria', CURDATE(), 0),
(18, 'Barattolo Unguento 50g', 'CON05', 'L-BAR50', DATE_ADD(CURDATE(), INTERVAL 10 YEAR), 150.00, 'n.', 0.40, 0, 1, 30, 'Plastica Srl', CURDATE(), 0),
(19, 'Cartine Farmaceutiche', 'CON06', 'L-CRT01', DATE_ADD(CURDATE(), INTERVAL 5 YEAR), 500.00, 'n.', 0.05, 0, 1, 100, 'Acef', CURDATE(), 0);


-- 2. POPOLAMENTO PREPARAZIONI (PREPARATIONS)
-- Schema completo senza 'details', con tutti i campi esplosi.

-- P1: Capsule Minoxidil 2mg (Capsule) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`, `uniformityCheck`) 
VALUES (1, '26/P001', 'Minoxidil 2mg Capsule', 'Capsule', '100', 'unità', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), CURDATE(), 'Completata', 'magistrale', 'Mario Rossi', 'Dr. Bianchi',
'{"enabled":true, "sampleSize":10, "targetWeight":300, "tareWeight":95, "measurements":[395,398,400,392,399,401,397,395,402,398], "isCompliant":true, "isComplete":true}'
);

-- P2: Crema Idrocortisone 1% (Semisolide Cutanee) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (2, '26/P002', 'Crema Idrocortisone 1%', 'Preparazioni semisolide per applicazione cutanea e paste', '50', 'g', DATE_ADD(CURDATE(), INTERVAL 3 MONTH), CURDATE(), 'Completata', 'magistrale', 'Luigi Verdi', 'Dr. Neri');

-- P3: Lozione Minoxidil 5% (Liquide) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (3, '26/P003', 'Lozione Minoxidil 5%', 'Preparazioni liquide (soluzioni)', '100', 'ml', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), CURDATE(), 'Completata', 'magistrale', 'Anna Gialli', 'Dr. Bianchi');

-- P4: Cartine Acido Salicilico (Cartine) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (4, '26/P004', 'Cartine Acido Salicilico 500mg', 'Cartine e cialdini', '20', 'unità', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), CURDATE(), 'Bozza', 'magistrale', 'Giuseppe Blu', 'Dr. Rosa');

-- P5: Ovuli Progesterone (Suppositori) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (5, '26/P005', 'Ovuli Progesterone 200mg', 'Suppositori e ovuli', '12', 'unità', DATE_ADD(CURDATE(), INTERVAL 3 MONTH), CURDATE(), 'Bozza', 'magistrale', 'Maria Viola', 'Dr. Bianchi');

-- P6: Collirio Atropina (Colliri) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (6, '26/P006', 'Collirio Atropina 0.01%', 'Colliri sterili (soluzioni)', '10', 'ml', DATE_ADD(CURDATE(), INTERVAL 1 MONTH), CURDATE(), 'Bozza', 'magistrale', 'Bambino Rossi', 'Dr. Oculista');

-- P7: Pasta all'Acqua (Paste) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (7, '26/P007', 'Pasta all\'Ossido di Zinco', 'Preparazioni semisolide per applicazione cutanea e paste', '100', 'g', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), CURDATE(), 'Completata', 'magistrale', 'Anonimo', 'Dr. Derma');

-- P8: Emulsione Corpo (Emulsioni) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (8, '26/P008', 'Emulsione Idratante Urea 10%', 'Emulsioni, sospensioni e miscele di olii', '200', 'g', DATE_ADD(CURDATE(), INTERVAL 6 MONTH), CURDATE(), 'Bozza', 'magistrale', 'Luisa Neri', 'Dr. Bianchi');

-- P9: Estratto Idroalcolico (Estratti) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (9, '26/P009', 'Tintura Mentolo 1%', 'Estratti liquidi e tinture', '50', 'ml', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), CURDATE(), 'Completata', 'magistrale', 'Marco Polo', 'Dr. Verdi');

-- P10: Polvere Composta (Tisane) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (10, '26/P010', 'Polvere Composta Digestiva', 'Polveri composte e piante per tisane', '100', 'g', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), CURDATE(), 'Bozza', 'magistrale', 'Sig.ra Rosa', 'Dr. Erbe');

-- P11: Pillole Veterinarie (Pillole) - Magistrale
INSERT INTO `preparations` (`id`, `prepNumber`, `name`, `pharmaceuticalForm`, `quantity`, `prepUnit`, `expiryDate`, `date`, `status`, `prepType`, `patient`, `doctor`) 
VALUES (11, '26/P011', 'Pillole Ketoconazolo Vet', 'Pillole, pastiglie e granulati (a unità)', '30', 'unità', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), CURDATE(), 'Completata', 'magistrale', 'Fido (Cane)', 'Dr. Vet');


-- 3. LINK INGREDIENTI (PREPARATION_INGREDIENTS)

-- P1: Capsule Minoxidil (1: Minoxidil, 9: Lattosio, 14: Capsule 0)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(1, 1, 0.20, 0, 0.20), -- Minoxidil
(1, 9, 29.80, 1, 30.00), -- Lattosio
(1, 14, 100, 0, NULL); -- Capsule 0

-- P2: Crema Idro (6: Idro, 11: Crema Base, 18: Barattolo)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(2, 6, 0.50, 0, 0.50), -- Idrocortisone
(2, 11, 49.50, 1, 50.00), -- Crema Base
(2, 18, 1, 0, NULL); -- Barattolo

-- P3: Lozione (1: Minox, 12: Alcool, 13: Acqua, 16: Flacone 100)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(3, 1, 5.00, 0, 5.00), -- Minoxidil
(3, 12, 70.00, 1, 70.00), -- Alcool
(3, 13, 25.00, 1, 25.00), -- Acqua
(3, 16, 1, 0, NULL); -- Flacone

-- P4: Cartine (4: Salicilico, 9: Lattosio, 19: Cartine)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(4, 4, 10.00, 0, 10.00), -- Salicilico
(4, 9, 10.00, 1, 10.00), -- Lattosio
(4, 19, 20, 0, NULL); -- Cartine

-- P5: Ovuli (2: Progesterone, 10: Vaselina/Burro Cacao sim, 10: Vaselina usata come base)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(5, 2, 2.40, 0, 2.40), -- Progesterone (200mg * 12)
(5, 10, 20.00, 1, 20.00); -- Base

-- P6: Collirio (13: Acqua, 17: Flacone 10)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(6, 13, 10.00, 1, 10.00), -- Acqua
(6, 17, 1, 0, NULL); -- Flacone 10

-- P7: Pasta (10: Vaselina, 4: Salicilico usata come polvere inerte sim, 18: Barattolo)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(7, 10, 50.00, 1, 50.00),
(7, 4, 50.00, 0, 50.00),
(7, 18, 2, 0, NULL); -- 2 Barattoli da 50

-- P8: Emulsione (5: Urea, 11: Crema Base, 18: Barattolo)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(8, 5, 20.00, 0, 20.00),
(8, 11, 180.00, 1, 180.00);

-- P9: Tintura (7: Mentolo, 12: Alcool)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(9, 7, 0.50, 0, 0.50),
(9, 12, 49.50, 1, 50.00);

-- P10: Polvere (4: Salicilico, 5: Urea, 9: Lattosio)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(10, 4, 20.00, 0, 20.00),
(10, 5, 20.00, 0, 20.00),
(10, 9, 60.00, 1, 60.00);

-- P11: Pillole Vet (3: Keto, 9: Lattosio)
INSERT INTO `preparation_ingredients` (`preparationId`, `inventoryId`, `amountUsed`, `isExcipient`, `stockDeduction`) VALUES
(11, 3, 3.00, 0, 3.00),
(11, 9, 10.00, 1, 10.00);