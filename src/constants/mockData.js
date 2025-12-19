// --- DATI SIMULATI (15 SOSTANZE - Scenario Dicembre 2025) ---
// Data di riferimento: 15 Dicembre 2025
export const MOCK_INVENTORY = [
  // --- PRINCIPI ATTIVI (10) ---
  { id: 1, name: 'Paracetamolo Polvere', ni: '25/S101', lot: 'PAR-001', expiry: '2028-12-31', quantity: 850, unit: 'g', totalCost: 50.00, costPerGram: 0.059, supplier: 'Acef', purity: 'Ph.Eur.', receptionDate: '2025-01-15', ddtNumber: 'ACE-1001', ddtDate: '2025-01-14', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 2, name: 'Melatonina', ni: '25/S102', lot: 'MEL-332', expiry: '2027-06-30', quantity: 95, unit: 'g', totalCost: 350.00, costPerGram: 3.68, supplier: 'Farmalabor', purity: '99.8%', receptionDate: '2025-02-20', ddtNumber: 'FL-2002', ddtDate: '2025-02-18', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 3, name: 'Finasteride', ni: '25/S103', lot: 'FIN-A55', expiry: '2028-02-29', quantity: 48, unit: 'g', totalCost: 950.00, costPerGram: 19.79, supplier: 'Galeno', purity: '99.5%', receptionDate: '2025-03-10', ddtNumber: 'GAL-3003', ddtDate: '2025-03-09', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: 'finasteride_sds.pdf', securityData: { cas: '98319-26-7', hazardStatements: 'H360', pictograms: ['GHS08'] } },
  { id: 4, name: 'Tadalafil', ni: '25/S104', lot: 'TAD-B01', expiry: '2027-11-30', quantity: 22, unit: 'g', totalCost: 1200.00, costPerGram: 54.54, supplier: 'Acef', purity: '99.2%', receptionDate: '2025-04-05', ddtNumber: 'ACE-4004', ddtDate: '2025-04-04', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: 'tadalafil_sds.pdf', securityData: { cas: '171596-29-5', hazardStatements: 'H361', pictograms: ['GHS08'] } },
  { id: 5, name: 'Curcumina Estr. Secco', ni: '25/S105', lot: 'CUR-95C', expiry: '2026-10-31', quantity: 450, unit: 'g', totalCost: 45.00, costPerGram: 0.10, supplier: 'Farmalabor', purity: '95%', receptionDate: '2025-05-12', ddtNumber: 'FL-5005', ddtDate: '2025-05-10', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 6, name: 'Vitamina D3 100.000 UI/g', ni: '25/S106', lot: 'VD3-C01', expiry: '2026-08-31', quantity: 980, unit: 'g', totalCost: 120.00, costPerGram: 0.122, supplier: 'Galeno', purity: '100.000 UI/g', receptionDate: '2025-06-18', ddtNumber: 'GAL-6006', ddtDate: '2025-06-17', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 7, name: 'Caffeina Anidra', ni: '25/S107', lot: 'CAF-007', expiry: '2029-01-01', quantity: 1800, unit: 'g', totalCost: 60.00, costPerGram: 0.033, supplier: 'Acef', purity: 'Ph.Eur.', receptionDate: '2025-07-22', ddtNumber: 'ACE-7007', ddtDate: '2025-07-21', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 8, name: 'Minoxidil Base', ni: '25/S108', lot: 'MNX-A11', expiry: '2028-05-31', quantity: 200, unit: 'g', totalCost: 240.00, costPerGram: 1.2, supplier: 'Farmalabor', purity: '99.9%', receptionDate: '2025-08-01', ddtNumber: 'FL-8008', ddtDate: '2025-07-30', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: 'minoxidil_sds.pdf', securityData: { cas: '38304-91-5', hazardStatements: 'H302, H315', pictograms: ['GHS07'] } },
  
  // --- IN SCADENZA (< 6 mesi) ---
  { id: 9, name: 'Diltiazem Cloridrato', ni: '25/S109', lot: 'DIL-X09', expiry: '2026-05-15', quantity: 80, unit: 'g', totalCost: 200.00, costPerGram: 2.5, supplier: 'Acef', purity: 'Ph.Eur.', receptionDate: '2025-01-02', ddtNumber: 'ACE-9009', ddtDate: '2025-01-01', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 10, name: 'Coenzima Q10', ni: '25/S110', lot: 'Q10-Z01', expiry: '2026-02-28', quantity: 150, unit: 'g', totalCost: 180.00, costPerGram: 1.2, supplier: 'Galeno', purity: '99%', receptionDate: '2025-09-10', ddtNumber: 'GAL-1010', ddtDate: '2025-09-09', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },

  // --- ECCIPIENTI (5) ---
  { id: 11, name: 'Lattosio Monoidrato', ni: '25/E001', lot: 'LAC-001', expiry: '2027-12-31', quantity: 4500, unit: 'g', totalCost: 30.00, costPerGram: 0.0067, supplier: 'Farmalabor', purity: 'FU', receptionDate: '2025-01-10', ddtNumber: 'FL-E001', ddtDate: '2025-01-09', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 12, name: 'Cellulosa Microcristallina PH 102', ni: '25/E002', lot: 'CMC-102', expiry: '2028-01-31', quantity: 8800, unit: 'g', totalCost: 80.00, costPerGram: 0.0091, supplier: 'Acef', purity: 'Ph.Eur.', receptionDate: '2025-02-15', ddtNumber: 'ACE-E002', ddtDate: '2025-02-14', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  { id: 13, name: 'Magnesio Stearato Vegetale', ni: '25/E003', lot: 'MG-ST-V', expiry: '2026-11-30', quantity: 950, unit: 'g', totalCost: 25.00, costPerGram: 0.026, supplier: 'Farmalabor', purity: 'FU', receptionDate: '2025-03-20', ddtNumber: 'FL-E003', ddtDate: '2025-03-19', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  
  // --- SCADUTA ---
  { id: 14, name: 'Silice Colloidale Anidra', ni: '25/E004', lot: 'SIL-C01', expiry: '2025-11-01', quantity: 400, unit: 'g', totalCost: 15.00, costPerGram: 0.0375, supplier: 'Galeno', purity: 'FU', receptionDate: '2024-11-01', ddtNumber: 'GAL-E004', ddtDate: '2024-10-30', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
  
  // --- ESAURITA (ma non smaltita) ---
  { id: 15, name: 'Tadalafil', ni: '24/S099', lot: 'TAD-OLD', expiry: '2026-12-31', quantity: 0, unit: 'g', totalCost: 1000.00, costPerGram: 50, supplier: 'Acef', purity: '99%', receptionDate: '2024-10-01', ddtNumber: 'ACE-OLD', ddtDate: '2024-09-30', firstUseDate: null, endUseDate: null, disposed: false, sdsFile: null, securityData: null },
];

export const MOCK_PREPARATIONS = [
  { id: 201, prepNumber: '25/P001', name: 'Melatonina 5mg', pharmaceuticalForm: 'Capsule', quantity: 120, prepUnit: 'n.', expiryDate: '2026-06-15', posology: '1 caps 30 min prima di coricarsi', date: '2025-12-10', patient: 'Laura Neri', doctor: 'Dr. Rossi', status: 'Completata', totalPrice: 32.50, ingredients: [
    { id: 2, name: 'Melatonina', ni: '25/S102', lot: 'MEL-332', amountUsed: 0.6, unit: 'g' },
    { id: 11, name: 'Lattosio Monoidrato', ni: '25/E001', lot: 'LAC-001', amountUsed: 35.4, unit: 'g' }
  ]},
  { id: 202, prepNumber: '25/P002', name: 'Finasteride 1mg', pharmaceuticalForm: 'Capsule', quantity: 90, prepUnit: 'n.', expiryDate: '2026-06-12', posology: '1 caps al giorno', date: '2025-12-12', patient: 'Marco Verdi', doctor: 'Dr. Gialli', status: 'Completata', totalPrice: 38.00, ingredients: [
    { id: 3, name: 'Finasteride', ni: '25/S103', lot: 'FIN-A55', amountUsed: 0.09, unit: 'g' },
    { id: 12, name: 'Cellulosa Microcristallina PH 102', ni: '25/E002', lot: 'CMC-102', amountUsed: 26.91, unit: 'g' }
  ]},
  { id: 203, prepNumber: '25/P003', name: 'Tadalafil 20mg', pharmaceuticalForm: 'Capsule', quantity: 30, prepUnit: 'n.', expiryDate: '2026-06-08', posology: '1 caps al bisogno', date: '2025-12-08', patient: 'Paolo Bianchi', doctor: 'Dr. Blu', status: 'Completata', totalPrice: 45.10, ingredients: [
    { id: 4, name: 'Tadalafil', ni: '25/S104', lot: 'TAD-B01', amountUsed: 0.6, unit: 'g' },
    { id: 12, name: 'Cellulosa Microcristallina PH 102', ni: '25/E002', lot: 'CMC-102', amountUsed: 8.4, unit: 'g' }
  ]},
  { id: 204, prepNumber: '25/P004', name: 'Caffeina 100mg', pharmaceuticalForm: 'Capsule', quantity: 60, prepUnit: 'n.', expiryDate: '2026-06-14', posology: '1 caps al mattino', date: '2025-12-14', patient: 'Chiara Rossi', doctor: 'Dr. Neri', status: 'Completata', totalPrice: 28.75, ingredients: [
    { id: 7, name: 'Caffeina Anidra', ni: '25/S107', lot: 'CAF-007', amountUsed: 6, unit: 'g' },
    { id: 11, name: 'Lattosio Monoidrato', ni: '25/E001', lot: 'LAC-001', amountUsed: 17.4, unit: 'g' }
  ]},
  { id: 205, prepNumber: '25/P005', name: 'Paracetamolo 500mg', pharmaceuticalForm: 'Capsule', quantity: 20, prepUnit: 'n.', expiryDate: '2026-06-01', posology: '1 caps ogni 6 ore al bisogno', date: '2025-12-01', patient: 'Luca Gialli', doctor: 'Dr. Verdi', status: 'Completata', totalPrice: 21.00, ingredients: [
    { id: 1, name: 'Paracetamolo Polvere', ni: '25/S101', lot: 'PAR-001', amountUsed: 10, unit: 'g' },
    { id: 13, name: 'Magnesio Stearato Vegetale', ni: '25/E003', lot: 'MG-ST-V', amountUsed: 0.2, unit: 'g' }
  ]},
  { id: 206, prepNumber: '25/P006', name: 'Minoxidil 2.5mg', pharmaceuticalForm: 'Capsule', quantity: 100, prepUnit: 'n.', expiryDate: '2026-06-15', posology: '1 caps al giorno', date: '2025-12-15', patient: 'Giuseppe Rosato', doctor: 'Dr. Bruni', status: 'Completata', totalPrice: 30.00, ingredients: [
    { id: 8, name: 'Minoxidil Base', ni: '25/S108', lot: 'MNX-A11', amountUsed: 0.25, unit: 'g' },
    { id: 12, name: 'Cellulosa Microcristallina PH 102', ni: '25/E002', lot: 'CMC-102', amountUsed: 29.75, unit: 'g' }
  ]},
  { id: 207, prepNumber: '25/P007', name: 'Coenzima Q10 100mg', pharmaceuticalForm: 'Capsule', quantity: 60, prepUnit: 'n.', expiryDate: '2026-02-20', posology: '1 caps die', date: '2025-11-20', patient: 'Maria Ciano', doctor: 'Dr. Oliva', status: 'Completata', totalPrice: 35.20, ingredients: [
    { id: 10, name: 'Coenzima Q10', ni: '25/S110', lot: 'Q10-Z01', amountUsed: 6, unit: 'g' },
    { id: 11, name: 'Lattosio Monoidrato', ni: '25/E001', lot: 'LAC-001', amountUsed: 18, unit: 'g' }
  ]},
  { id: 208, prepNumber: '25/P008', name: 'Curcumina 500mg', pharmaceuticalForm: 'Capsule', quantity: 90, prepUnit: 'n.', expiryDate: '2026-06-13', posology: '2 cps die', date: '2025-12-13', patient: 'Fabio Magenta', doctor: 'Dr. Viola', status: 'Completata', totalPrice: 31.80, ingredients: [
    { id: 5, name: 'Curcumina Estr. Secco', ni: '25/S105', lot: 'CUR-95C', amountUsed: 45, unit: 'g' },
    { id: 13, name: 'Magnesio Stearato Vegetale', ni: '25/E003', lot: 'MG-ST-V', amountUsed: 0.9, unit: 'g' }
  ]},
  { id: 209, prepNumber: '25/P009', name: 'Diltiazem 60mg', pharmaceuticalForm: 'Capsule', quantity: 100, prepUnit: 'n.', expiryDate: '2026-05-10', posology: '1 caps x 3/die', date: '2025-11-10', patient: 'Anna Arancio', doctor: 'Dr. Sole', status: 'Completata', totalPrice: 39.50, ingredients: [
    { id: 9, name: 'Diltiazem Cloridrato', ni: '25/S109', lot: 'DIL-X09', amountUsed: 6, unit: 'g' },
    { id: 11, name: 'Lattosio Monoidrato', ni: '25/E001', lot: 'LAC-001', amountUsed: 24, unit: 'g' }
  ]},
  { id: 210, prepNumber: '25/P010', name: 'Vitamina D3 5000 UI', pharmaceuticalForm: 'Capsule', quantity: 120, prepUnit: 'n.', expiryDate: '2026-06-11', posology: '1 caps a settimana', date: '2025-12-11', patient: 'Mario Marrone', doctor: 'Dr. Bosco', status: 'Completata', totalPrice: 30.15, ingredients: [
    { id: 6, name: 'Vitamina D3 100.000 UI/g', ni: '25/S106', lot: 'VD3-C01', amountUsed: 6, unit: 'g' },
    { id: 12, name: 'Cellulosa Microcristallina PH 102', ni: '25/E002', lot: 'CMC-102', amountUsed: 30, unit: 'g' }
  ]}
];


export const MOCK_LOGS = [
    { id: 1, date: '2024-01-10', type: 'CARICO', substance: 'Paracetamolo Polvere', ni: '25/S101', quantity: 50, unit: 'g', notes: 'Carico iniziale' },
    { id: 2, date: '2024-01-15', type: 'SCARICO', substance: 'Melatonina', ni: '25/S102', quantity: 5, unit: 'g', notes: 'Preparazione #201' },
    { id: 3, date: '2024-02-10', type: 'SCARICO', substance: 'Finasteride', ni: '25/S103', quantity: 1, unit: 'g', notes: 'Preparazione #202' },
    { id: 4, date: '2024-03-05', type: 'CARICO', substance: 'Lattosio Monoidrato', ni: '25/E001', quantity: 1000, unit: 'g', notes: 'Nuovo arrivo' },
    { id: 5, date: '2023-12-05', type: 'SMALTIMENTO', substance: 'Silice Colloidale Anidra', ni: '25/E004', quantity: 100, unit: 'g', notes: 'Smaltimento per scadenza' }
];