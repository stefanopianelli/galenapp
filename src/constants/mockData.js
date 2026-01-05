// mockData.js
// Dati di esempio v4.1 - Coerenti, completi e con logica corretta (usage fix)

export const MOCK_INVENTORY = [
  // Principi Attivi
  { id: 1, name: 'Minoxidil Base', ni: '24/S001', lot: 'MX-2401', expiry: '2026-12-31', quantity: 480.00, unit: 'g', costPerGram: 0.90, supplier: 'Farma-Chemical', isExcipient: false, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: ['GHS07'] } },
  { id: 2, name: 'Idrocortisone Butirrato', ni: '24/S002', lot: 'HCB-2402', expiry: '2025-11-30', quantity: 99.00, unit: 'g', costPerGram: 1.25, supplier: 'Pharma-Actives', isExcipient: false, isContainer: false, isDoping: true, isNarcotic: false, securityData: { pictograms: ['GHS08'] } },
  { id: 3, name: 'Sildenafil Citrato', ni: '24/S003', lot: 'SIL-2403', expiry: '2026-05-31', quantity: 198.00, unit: 'g', costPerGram: 2.75, supplier: 'Pharma-Actives', isExcipient: false, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: ['GHS07', 'GHS08'] } },
  { id: 4, name: 'Acido Salicilico', ni: '24/S004', lot: 'AS-2401', expiry: '2027-01-31', quantity: 950.00, unit: 'g', costPerGram: 0.10, supplier: 'Farma-Chemical', isExcipient: false, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: ['GHS05', 'GHS07'] } },
  { id: 5, name: 'Melatonina', ni: '24/S005', lot: 'MLT-2404', expiry: '2026-08-31', quantity: 250.00, unit: 'g', costPerGram: 3.50, supplier: 'NaturePharma', isExcipient: false, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 6, name: 'Clotrimazolo', ni: '24/S006', lot: 'CLT-2312', expiry: '2025-12-31', quantity: 200.00, unit: 'g', costPerGram: 1.10, supplier: 'Farma-Chemical', isExcipient: false, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: ['GHS07'] } },
  
  // Eccipienti
  { id: 7, name: 'Glicole Propilenico', ni: '24/E001', lot: 'GP-2401', expiry: '2025-10-31', quantity: 4800.00, unit: 'ml', costPerGram: 0.04, supplier: 'Farma-Chemical', isExcipient: true, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 8, name: 'Alcool Etilico 96°', ni: '24/E002', lot: 'ALC-2402', expiry: '2027-03-31', quantity: 8500.00, unit: 'ml', costPerGram: 0.02, supplier: 'Distillerie Nazionali', isExcipient: true, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: ['GHS02'] } },
  { id: 9, name: 'Crema Base Lipo', ni: '24/E003', lot: 'CBL-2401', expiry: '2025-09-30', quantity: 1850.00, unit: 'g', costPerGram: 0.05, supplier: 'Galenica Srl', isExcipient: true, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 10, name: 'Lattosio Monoidrato', ni: '24/E004', lot: 'LAC-2403', expiry: '2026-06-30', quantity: 4000.00, unit: 'g', costPerGram: 0.01, supplier: 'Galenica Srl', isExcipient: true, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 11, name: 'Camomilla Fiori T.T.', ni: '24/E005', lot: 'CAM-2311', expiry: '2025-11-30', quantity: 500.00, unit: 'g', costPerGram: 0.11, supplier: 'HerbalSana', isExcipient: true, isContainer: false, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },

  // Contenitori
  { id: 12, name: 'Flacone vetro 100ml c/contagocce', ni: '24/C001', lot: 'FLV-24', expiry: '2029-01-01', quantity: 95.00, unit: 'n.', costPerGram: 0.80, supplier: 'Pharma-Packaging', isExcipient: false, isContainer: true, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 13, name: 'Vasetto unguento 50g', ni: '24/C002', lot: 'VAS-24', expiry: '2029-01-01', quantity: 198.00, unit: 'n.', costPerGram: 0.45, supplier: 'Pharma-Packaging', isExcipient: false, isContainer: true, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 14, name: 'Capsule Gelatina Dura Tipo 0', ni: '24/C003', lot: 'CAPS-0-24', expiry: '2028-01-01', quantity: 880.00, unit: 'n.', costPerGram: 0.02, supplier: 'Capsul-It', isExcipient: false, isContainer: true, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
  { id: 15, name: 'Busta per tisana 100g', ni: '24/C004', lot: 'BUST-24', expiry: '2029-01-01', quantity: 300.00, unit: 'n.', costPerGram: 0.15, supplier: 'Pharma-Packaging', isExcipient: false, isContainer: true, isDoping: false, isNarcotic: false, securityData: { pictograms: [] } },
];

const ingredientsForPrep = (prepId) => {
    const allIngredients = {
        1: [{ id: 1, amount: 5.00 }, { id: 7, amount: 20.00 }, { id: 8, amount: 50.00 }, { id: 12, amount: 1.00 }],
        2: [{ id: 2, amount: 0.50 }, { id: 9, amount: 49.50 }, { id: 13, amount: 1.00 }],
        3: [{ id: 3, amount: 1.00 }, { id: 10, amount: 4.00 }, { id: 14, amount: 10.00 }],
        4: [{ id: 5, amount: 0.30 }, { id: 10, amount: 20.00 }, { id: 14, amount: 60.00 }],
        5: [{ id: 4, amount: 5.00 }, { id: 9, amount: 95.00 }, { id: 13, amount: 2.00 }],
        6: [{ id: 10, amount: 15.00 }], // Cartine con solo eccipiente
        7: [{ id: 6, amount: 1.20 }],
        8: [{ id: 4, amount: 3.00 }, {id: 8, amount: 97.00}],
        9: [{ id: 11, amount: 100.00 }, { id: 15, amount: 1.00 }],
        10: [{ id: 7, amount: 50.00 }],
    };
    const selected = allIngredients[prepId] || [];
    return selected.map(ing => ({
        ...MOCK_INVENTORY.find(inv => inv.id === ing.id),
        amountUsed: ing.amount
    }));
};

export const MOCK_PREPARATIONS = [
  { id: 1, prepNumber: '24/P001', name: 'Minoxidil 5% Lozione', date: '2024-04-15', patient: 'Mario Rossi', doctor: 'Dr. Bianchi', recipeDate: '2024-04-10', prepType: 'magistrale', pharmaceuticalForm: 'Preparazioni liquide (soluzioni)', quantity: 100, prepUnit: 'ml', expiryDate: '2024-07-15', posology: '1ml sul cuoio capelluto due volte al giorno.', status: 'Completata', totalPrice: 28.50, patientPhone: '3331234567', usage: 'Topica', ingredients: ingredientsForPrep(1), techOps: ['SOLUBILIZZAZIONE'] },
  { id: 2, prepNumber: '24/P002', name: 'Idrocortisone 1% Crema', date: '2024-04-14', patient: 'Laura Verdi', doctor: 'Dr. Neri', recipeDate: '2024-04-14', prepType: 'magistrale', pharmaceuticalForm: 'Preparazioni semisolide per applicazione cutanea e paste', quantity: 50, prepUnit: 'g', expiryDate: '2024-10-14', posology: 'Applicare 1-2 volte al giorno.', status: 'Completata', totalPrice: 22.50, patientPhone: '3478901234', usage: 'Topica', ingredients: ingredientsForPrep(2), techOps: ['MISCELAZIONE'] },
  { id: 3, prepNumber: '24/P003', name: 'Sildenafil 100mg', date: '2024-04-12', patient: 'Giovanni Gialli', doctor: 'Dr. Azzurri', recipeDate: '2024-04-01', prepType: 'magistrale', pharmaceuticalForm: 'Capsule', quantity: 10, prepUnit: 'n.', expiryDate: '2024-10-12', posology: 'Una capsula al bisogno.', status: 'Completata', totalPrice: 55.20, patientPhone: '3385566778', usage: 'Orale', ingredients: ingredientsForPrep(3), techOps: ['MISCELAZIONE', 'RIEMPIMENTO', 'DIVISIONE_IN_DOSI'] },
  { id: 4, prepNumber: '24/P004', name: 'Melatonina 5mg - Bozza', date: '2024-04-11', patient: 'Paola Neri', doctor: 'Autoprescrizione', recipeDate: '2024-04-11', prepType: 'magistrale', pharmaceuticalForm: 'Capsule', quantity: 60, prepUnit: 'n.', expiryDate: '2024-10-11', posology: 'Una capsula la sera.', status: 'Bozza', totalPrice: 32.80, patientPhone: '3358877665', usage: 'Orale', ingredients: ingredientsForPrep(4), techOps: [] },
  { id: 5, prepNumber: '24/P005', name: 'Acido Salicilico 5% Unguento', date: '2024-04-10', patient: 'Franco Marroni', doctor: 'Dr. Rossi', recipeDate: '2024-04-09', prepType: 'magistrale', pharmaceuticalForm: 'Preparazioni semisolide per applicazione cutanea e paste', quantity: 100, prepUnit: 'g', expiryDate: '2024-07-10', posology: 'Applicare localmente.', status: 'Completata', totalPrice: 19.40, patientPhone: '', usage: 'Topica', ingredients: ingredientsForPrep(5), techOps: [] },
  { id: 6, prepNumber: '24/P006', name: 'Cartine di Fermenti', date: '2024-04-08', patient: 'Bambino Rossi', doctor: 'Dr. Pediatra', recipeDate: '2024-04-08', prepType: 'magistrale', pharmaceuticalForm: 'Cartine e cialdini', quantity: 20, prepUnit: 'n.', expiryDate: '2024-06-08', posology: 'Una al giorno.', status: 'Completata', totalPrice: 17.60, patientPhone: '3331234567', usage: 'Orale', ingredients: ingredientsForPrep(6), techOps: [] },
  { id: 7, prepNumber: '24/P007', name: 'Clotrimazolo Ovuli', date: '2024-04-02', patient: 'Giovanna Verdi', doctor: 'Dr. Ginecologo', recipeDate: '2024-04-01', prepType: 'magistrale', pharmaceuticalForm: 'Suppositori e ovuli', quantity: 12, prepUnit: 'n.', expiryDate: '2024-07-02', posology: 'Un ovulo la sera per 12 giorni.', status: 'Completata', totalPrice: 28.90, patientPhone: '3478901234', usage: 'Vaginale', ingredients: ingredientsForPrep(7), techOps: ['FUSIONE', 'RIEMPIMENTO_STAMPI'] },
  { id: 8, prepNumber: '24/P008', name: 'Alcool Borico 3%', date: '2024-04-15', patient: null, doctor: null, recipeDate: null, prepType: 'officinale', pharmaceuticalForm: 'Preparazioni liquide (soluzioni)', quantity: 100, prepUnit: 'ml', expiryDate: '2025-04-15', posology: 'Uso esterno.', status: 'Completata', totalPrice: 12.50, patientPhone: null, usage: 'Topica', ingredients: ingredientsForPrep(8), techOps: [] },
  { id: 9, prepNumber: '24/P009', name: 'Tisana Rilassante - Bozza', date: '2024-04-12', patient: null, doctor: null, recipeDate: null, prepType: 'officinale', pharmaceuticalForm: 'Polveri composte e piante per tisane', quantity: 100, prepUnit: 'g', expiryDate: '2024-12-12', posology: 'Un cucchiaio in acqua calda.', status: 'Bozza', totalPrice: 15.80, patientPhone: null, usage: 'Orale', ingredients: ingredientsForPrep(9), techOps: ['MISCELAZIONE'] },
  { id: 10, prepNumber: '24/P010', name: 'Eosina 1% Soluzione Acquosa', date: '2024-03-25', patient: null, doctor: null, recipeDate: null, prepType: 'officinale', pharmaceuticalForm: 'Preparazioni liquide (soluzioni)', quantity: 50, prepUnit: 'ml', expiryDate: '2024-09-25', posology: 'Applicare sulla parte interessata.', status: 'Completata', totalPrice: 10.20, patientPhone: null, usage: 'Topica', ingredients: ingredientsForPrep(10), techOps: [] }
];

export const MOCK_LOGS = [
    {id: 1, date: '2024-04-15', type: 'SCARICO', substance: 'Minoxidil Base', ni: '24/S001', quantity: 5.00, unit: 'g', notes: 'Prep. #24/P001', preparationId: 1},
    {id: 2, date: '2024-04-14', type: 'SCARICO', substance: 'Idrocortisone Butirrato', ni: '24/S002', quantity: 0.50, unit: 'g', notes: 'Prep. #24/P002', preparationId: 2},
    {id: 3, date: '2024-04-12', type: 'SCARICO', substance: 'Sildenafil Citrato', ni: '24/S003', quantity: 1.00, unit: 'g', notes: 'Prep. #24/P003', preparationId: 3},
    {id: 4, date: '2024-04-02', type: 'CARICO', substance: 'Sildenafil Citrato', ni: '24/S003', quantity: 200.00, unit: 'g', notes: 'DDT 123'},
    {id: 5, date: '2024-03-25', type: 'CARICO', substance: 'Minoxidil Base', ni: '24/S001', quantity: 500.00, unit: 'g', notes: 'DDT 119'},
];