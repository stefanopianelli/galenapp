import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('it-IT').format(date);
};

export const generateWorkSheetPDF = (preparationData, pharmacySettings) => {
  const doc = new jsPDF();
  
  const { details, ingredients, pricing } = preparationData;
  const isOfficinale = details.prepType === 'officinale';
  const prepDate = new Date().toLocaleDateString('it-IT');

  const settings = pharmacySettings || {};
  const pharmacyName = settings.name || "Farmacia (Nome non impostato)";
  const pharmacyAddress = `${settings.address || ''}, ${settings.zip || ''} ${settings.city || ''} (${settings.province || ''})`;
  const pharmacyPhone = settings.phone ? `Tel: ${settings.phone}` : '';

  // --- HEADER ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = isOfficinale ? "Foglio di Lavorazione - Preparazione Officinale" : "Foglio di Lavorazione - Preparazione Magistrale";
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const pharmacyInfoLine = `${pharmacyName} - ${pharmacyAddress}${pharmacyPhone ? ` - ${pharmacyPhone}` : ''}`;
  doc.text(pharmacyInfoLine, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

  // --- PREPARATION DATA ---
  let y = 45;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Dati della Preparazione", 20, y);
  y += 5;
  doc.line(20, y, 190, y);
  y += 8;

  const anagraficaBody = [
    [{content: 'Numero Progressivo:', styles: {fontStyle: 'bold'}}, details.prepNumber],
    [{content: 'Nome Preparazione:', styles: {fontStyle: 'bold'}}, details.name],
    [{content: 'Data Preparazione:', styles: {fontStyle: 'bold'}}, prepDate],
    [{content: 'Data Limite Utilizzo:', styles: {fontStyle: 'bold'}}, formatDate(details.expiryDate)],
    [{content: 'Quantità Totale:', styles: {fontStyle: 'bold'}}, `${details.quantity} ${details.prepUnit || 'g'}`],
    [{content: 'Forma Farmaceutica:', styles: {fontStyle: 'bold'}}, details.pharmaceuticalForm],
  ];

  if (!isOfficinale) {
    anagraficaBody.push([{content: 'Data Ricetta:', styles: {fontStyle: 'bold'}}, formatDate(details.recipeDate)]);
    anagraficaBody.push([{content: 'Medico Prescrittore:', styles: {fontStyle: 'bold'}}, details.doctor]);
    anagraficaBody.push([{content: 'Paziente:', styles: {fontStyle: 'bold'}}, details.patient]);
  }
  
  anagraficaBody.push([{content: 'Posologia:', styles: {fontStyle: 'bold'}}, {content: details.posology, styles: {cellWidth: 'wrap'}}]);
  anagraficaBody.push([{content: 'Uso:', styles: {fontStyle: 'bold'}}, details.usage]);
  anagraficaBody.push([{content: 'Avvertenze:', styles: {fontStyle: 'bold'}}, {content: details.warnings, styles: {cellWidth: 'wrap'}}]);
  
  doc.autoTable({
    startY: y,
    theme: 'plain',
    body: anagraficaBody,
    styles: { cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 50 } }
  });
  y = doc.autoTable.previous.finalY + 10;

  // --- VERIFICHE INIZIALI (CHECKLIST) ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Verifiche Iniziali", 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const checkboxSize = 4;
  let checkboxX = 20;
  const checkboxY = y - 3.5;
  const textX = checkboxX + checkboxSize + 2;

  // Checkbox 1: Verifica pulizia Locali
  doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize);
  doc.line(checkboxX, checkboxY, checkboxX + checkboxSize, checkboxY + checkboxSize);
  doc.line(checkboxX, checkboxY + checkboxSize, checkboxX + checkboxSize, checkboxY);
  doc.text("Verifica pulizia Locali", textX, y);

  // Calcola la nuova posizione X per il secondo item
  checkboxX = 85; // Posizione orizzontale per il secondo checkbox
  const textX2 = checkboxX + checkboxSize + 2;

  // Checkbox 2: Verifica pulizia, attrezzatura, etc.
  doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize);
  doc.line(checkboxX, checkboxY, checkboxX + checkboxSize, checkboxY + checkboxSize);
  doc.line(checkboxX, checkboxY + checkboxSize, checkboxX + checkboxSize, checkboxY);
  doc.text("Verifica pulizia, attrezzatura, utensili, confezionamento", textX2, y);

  y += 10; // Spazio dopo la riga delle checkbox
  
  // --- COMPOSITION TABLE ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Composizione", 20, y);
  y += 8;
  
  const ingredientsBody = ingredients.map(ing => {
    let flags = [];
    if(ing.isDoping) flags.push("D");
    if(ing.isNarcotic) flags.push("S");
    if(ing.isContainer) flags.push("C");

    return [
      ing.name,
      ing.ni, // Changed from ing.lot
      `${Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)} ${ing.unit}`,
      flags.join(', ')
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['Componente / Contenitore', 'N.I.', 'Quantità', 'Note (D=Dopante, S=Stupef., C=Cont.)']],
    body: ingredientsBody,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
  });
  y = doc.autoTable.previous.finalY + 10;

  // --- PROCESSING STEPS (CHECKLIST) ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Fasi di Lavorazione e Controlli", 20, y);
  y += 8;

  let finalChecklistItems = [];
  if (details.worksheetItems && details.worksheetItems.length > 0) {
    finalChecklistItems = details.worksheetItems
      .filter(item => item.checked)
      .map(item => item.text);
  } else {
    // Fallback per compatibilità con vecchie preparazioni o se non impostato
    finalChecklistItems = [
      'Verifica fonti documentali e calcoli',
      'Controllo corrispondenza materie prime',
      'Pesata/misura dei componenti',
      'Miscelazione / Lavorazione',
      'Allestimento / Incapsulamento / Ripartizione',
      'Controllo di uniformità e aspetto',
      'Etichettatura e confezionamento'
    ];
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  finalChecklistItems.forEach(item => {
    const checkboxX = 20;
    const checkboxY = y - 3.5;
    const checkboxSize = 4;
    doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize); // Draw box
    doc.line(checkboxX, checkboxY, checkboxX + checkboxSize, checkboxY + checkboxSize); // Draw X
    doc.line(checkboxX, checkboxY + checkboxSize, checkboxX + checkboxSize, checkboxY); // Draw X
    doc.text(item, checkboxX + checkboxSize + 5, y);
    y += 7;
  });
  y+= 5;
  
  // --- BATCH DETAILS (Officinale only) ---
  if(isOfficinale && details.batches && details.batches.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Dettaglio Lotti di Produzione", 20, y);
    y += 8;

    const batchesBody = details.batches.map(batch => {
      const container = ingredients.find(ing => ing.id === batch.containerId);
      return [
        container ? container.name : `ID: ${batch.containerId}`,
        Number(container.amountUsed).toFixed(0),
        batch.productQuantity,
        `€ ${parseFloat(batch.unitPrice || 0).toFixed(2)}`
      ];
    });

    doc.autoTable({
      startY: y,
      head: [['Contenitore', 'N. Confezioni', 'Q.tà / Conf.', 'Prezzo Unitario']],
      body: batchesBody,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
    });
    y = doc.autoTable.previous.finalY + 10;
  }

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
  doc.text(`Avvertenze: ${details.warnings}`, 20, y);
  y += 7;
  
  // --- FINAL SIGNATURE ---
  doc.line(120, y + 10, 190, y + 10);
  doc.text("Firma del Farmacista Responsabile", 120, y + 15);


  // --- SAVE ---
  doc.save(`FL_${details.prepNumber.replace('/', '-')}_${details.name}.pdf`);
};