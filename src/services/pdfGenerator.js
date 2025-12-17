import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid
  return new Intl.DateTimeFormat('it-IT').format(date);
};

export const generateWorkSheetPDF = (preparationData, pharmacySettings) => {
  const doc = new jsPDF();
  
  const { details, ingredients, pricing } = preparationData;
  const prepDate = new Date().toLocaleDateString('it-IT');

  const settings = pharmacySettings || {};
  const pharmacyName = settings.name || "Farmacia (Nome non impostato)";
  const pharmacyAddress = `${settings.address || ''}, ${settings.zip || ''} ${settings.city || ''} (${settings.province || ''})`;
  const pharmacyPhone = settings.phone ? `Tel: ${settings.phone}` : '';

  // --- HEADER ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("Foglio di Lavorazione - Preparazione Magistrale", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(pharmacyName, 20, 35);
  doc.text(pharmacyAddress, 20, 40);
  doc.text(pharmacyPhone, 20, 45);

  // --- PREPARATION DATA ---
  let y = 60;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Dati della Preparazione", 20, y);
  y += 5;
  doc.line(20, y, 190, y); // separator
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.autoTable({
    startY: y,
    theme: 'plain',
    body: [
      [{content: 'Numero Progressivo:', styles: {fontStyle: 'bold'}}, details.prepNumber],
      [{content: 'Nome Preparazione:', styles: {fontStyle: 'bold'}}, details.name],
      [{content: 'Data Preparazione:', styles: {fontStyle: 'bold'}}, prepDate],
      [{content: 'Data Limite Utilizzo:', styles: {fontStyle: 'bold'}}, formatDate(details.expiryDate)],
      [{content: 'Quantità Totale:', styles: {fontStyle: 'bold'}}, `${details.quantity} ${details.prepUnit}`],
      [{content: 'Forma Farmaceutica:', styles: {fontStyle: 'bold'}}, details.pharmaceuticalForm],
    ],
    styles: { cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 50 } }
  });
  y = doc.autoTable.previous.finalY + 10;

  // --- PRESCRIPTION DATA ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Prescrizione e Destinazione", 20, y);
  y += 5;
  doc.line(20, y, 190, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.autoTable({
    startY: y,
    theme: 'plain',
    body: [
      [{content: 'Medico Prescrittore:', styles: {fontStyle: 'bold'}}, details.doctor],
      [{content: 'Paziente:', styles: {fontStyle: 'bold'}}, details.patient],
      [{content: 'Posologia:', styles: {fontStyle: 'bold'}}, {content: details.posology, styles: {cellWidth: 'wrap'}}],
    ],
    styles: { cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 50 } }
  });
  y = doc.autoTable.previous.finalY + 10;

  // --- COMPOSITION TABLE ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Composizione", 20, y);
  y += 8;
  
  const ingredientsBody = ingredients.map(ing => [
    ing.name,
    ing.lot,
    `${ing.amountUsed} ${ing.unit}`,
    `€ ${(ing.costPerGram * ing.amountUsed).toFixed(2)}`,
    '' // Empty space for signature
  ]);

  doc.autoTable({
    startY: y,
    head: [['Componente', 'N. Lotto', 'Quantità Pesata', 'Costo', 'Firma Operatore']],
    body: ingredientsBody,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' } }
  });
  y = doc.autoTable.previous.finalY + 10;

  // --- PROCESSING STEPS ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Fasi di Lavorazione e Controlli", 20, y);
  y += 8;
  
  const stepsBody = [
      ['Pesata dei componenti', ''],
      ['Miscelazione / Solubilizzazione', ''],
      ['Incapsulamento / Ripartizione / Confezionamento', ''],
      ['Controllo uniformità di massa (ove applicabile)', ''],
      ['Controllo tenuta del contenitore e confezionamento', ''],
      ['Etichettatura finale e controllo', '']
  ];
  
  doc.autoTable({
      startY: y,
      head: [['Fase / Controllo', 'Firma Operatore']],
      body: stepsBody,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' }
  });
  y = doc.autoTable.previous.finalY + 10;

  // --- FINAL PRICE & NOTES & SIGNATURE ---
  // Check if there is enough space for the final block
  if (y > 250) {
    doc.addPage();
    y = 20; // Reset y for the new page
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prezzo Praticato: € ${pricing.final.toFixed(2)}`, 20, y);
  y += 7;
  if(details.notes) {
    doc.text(`Note: ${details.notes}`, 20, y);
    y += 7;
  }
  
  // --- FINAL SIGNATURE ---
  doc.line(120, y + 10, 190, y + 10);
  doc.text("Firma del Farmacista Responsabile", 120, y + 15);


  // --- SAVE ---
  doc.save(`FL_${details.prepNumber.replace('/', '-')}_${details.name}.pdf`);
};
