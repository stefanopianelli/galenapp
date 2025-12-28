import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { VAT_RATE } from '../constants/tariffs';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('it-IT').format(date);
};

// --- CONFIGURAZIONE STILE ---
const COLORS = {
  primary: [13, 148, 136], // Teal-600
  secondary: [45, 212, 191], // Teal-400
  text: [31, 41, 55], // Slate-800
  textLight: [107, 114, 128], // Slate-500
  background: [240, 253, 250], // Teal-50
  white: [255, 255, 255],
  border: [209, 213, 219] // Gray-300
};

// Helper per estrarre i colori
const getRGB = (colorArr) => [colorArr[0], colorArr[1], colorArr[2]];

export const generateWorkSheetPDF = (preparationData, pharmacySettings) => {
  const doc = new jsPDF();
  
  const { details, ingredients, pricing } = preparationData;
  const isOfficinale = details.prepType === 'officinale';
  const prepDate = new Date().toLocaleDateString('it-IT');

  const settings = pharmacySettings || {};
  const pharmacyName = settings.name || "Farmacia (Nome non impostato)";
  const pharmacyAddress = `${settings.address || ''}, ${settings.zip || ''} ${settings.city || ''} (${settings.province || ''})`;
  const pharmacyContacts = settings.phone ? `Tel: ${settings.phone}` : '';

  // Helper per disegnare intestazioni di sezione
  const drawSectionHeader = (text, yPos) => {
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(14, yPos - 5, 182, 7, 1, 1, 'F');
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(text.toUpperCase(), 16, yPos);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]); // Reset text color
    return yPos + 10;
  };

  // --- HEADER ---
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(pharmacyName, 105, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.text([pharmacyAddress, pharmacyContacts], 105, 24, { align: 'center', lineHeightFactor: 1.2 });

  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // --- TITLE ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const title = isOfficinale ? "FOGLIO DI LAVORAZIONE - OFFICINALE" : "FOGLIO DI LAVORAZIONE - MAGISTRALE";
  doc.text(title, 105, 42, { align: 'center' });
  
  let y = 55;

  // --- INFO BOX ---
  // Usiamo autotable per creare una griglia ordinata per i dati principali
  const infoData = [
    [
      { content: 'N. PREPARAZIONE:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      { content: details.prepNumber, styles: { fontStyle: 'bold', fontSize: 11 } },
      { content: 'DATA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      { content: prepDate }
    ],
    [
      { content: 'NOME:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      { content: details.name, colSpan: 3, styles: { fontStyle: 'bold' } }
    ],
    [
      { content: 'FORMA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      details.pharmaceuticalForm,
      { content: 'QUANTITÀ:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      `${details.quantity} ${details.prepUnit || 'g'}`
    ],
    [
      { content: 'SCADENZA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      formatDate(details.expiryDate),
      { content: 'USO:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      details.usage
    ]
  ];

  if (!isOfficinale) {
    infoData.push([
      { content: 'PAZIENTE:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      details.patient,
      { content: 'MEDICO:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      details.doctor
    ]);
    infoData.push([
      { content: 'DATA RICETTA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
      formatDate(details.recipeDate),
      { content: '', colSpan: 2 }
    ]);
  }

  doc.autoTable({
    startY: y,
    body: infoData,
    theme: 'plain',
    styles: { cellPadding: 1.5, fontSize: 9, textColor: COLORS.text },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 55 }
    },
    didDrawPage: (d) => y = d.cursor.y + 5 // Aggiorna y
  });

  y = doc.lastAutoTable.finalY + 5;

  // --- COMPOSIZIONE ---
  y = drawSectionHeader("Formula e Composizione", y);

  const ingredientsBody = ingredients.map(ing => {
    let flags = [];
    if(ing.isDoping) flags.push("Doping");
    if(ing.isNarcotic) flags.push("Stupefacente");
    
    // Gestione visualizzazione lotti
    const identifier = ing.lot || ing.ni || '-';

    return [
      { content: ing.name, styles: { fontStyle: 'bold' } },
      identifier,
      { content: `${Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)} ${ing.unit}`, styles: { halign: 'right' } },
      flags.join(', ')
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['SOSTANZA / COMPONENTE', 'LOTTO / N.I.', 'QUANTITÀ', 'NOTE']],
    body: ingredientsBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.background, textColor: COLORS.primary, fontStyle: 'bold', lineColor: COLORS.primary, lineWidth: 0.1 },
    styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 'auto' }
    }
  });
  
  y = doc.lastAutoTable.finalY + 10;

  // Check spazio pagina
  if (y > 220) { doc.addPage(); y = 20; }

  // --- POSOLOGIA & AVVERTENZE (Compact) ---
  doc.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, 182, 25, 2, 2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("POSOLOGIA:", 17, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(details.posology || '-', 40, y + 5, { maxWidth: 150 });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("AVVERTENZE:", 17, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(details.warnings || '-', 40, y + 15, { maxWidth: 150 });

  y += 35;

  // Check spazio pagina
  if (y > 220) { doc.addPage(); y = 20; }

  // --- VERIFICHE & FASI ---
  y = drawSectionHeader("Controlli e Fasi Operative", y);

  // Verifiche Iniziali (Left column)
  const startYChecks = y;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Verifiche Preliminari", 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const drawCheckbox = (text, checked, x, y) => {
    doc.setDrawColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.rect(x, y - 3, 4, 4);
    if (checked) {
      doc.setFont('zapfdingbats');
      doc.setFontSize(10);
      doc.text('4', x + 0.5, y); // '4' in zapfdingbats is a checkmark
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }
    doc.text(text, x + 7, y);
    return y + 6;
  };

  y = drawCheckbox("Pulizia Locali e Attrezzature", true, 14, y);
  y = drawCheckbox("Idoneità Personale", true, 14, y);
  y = drawCheckbox("Corrispondenza Materie Prime", true, 14, y);

  // Procedure (Right column text area look)
  if (details.operatingProcedures) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Procedure Operative:", 100, startYChecks);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const splitText = doc.splitTextToSize(details.operatingProcedures, 90);
    doc.text(splitText, 100, startYChecks + 6);
  }

  y = Math.max(y, startYChecks + 25) + 5;

  // --- CHECKLIST DINAMICA ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Fasi Eseguite", 14, y);
  y += 6;
  
  let finalChecklistItems = [];
  if (details.worksheetItems && details.worksheetItems.length > 0) {
    finalChecklistItems = details.worksheetItems
      .filter(item => item.checked)
      .map(item => item.text);
  } else {
    finalChecklistItems = [
      'Verifica calcoli', 'Pesata componenti', 'Miscelazione', 'Confezionamento', 'Controllo Aspetto'
    ];
  }

  // Stampiamo le fasi su due colonne per risparmiare spazio
  let col = 0;
  let startYList = y;
  finalChecklistItems.forEach((item, i) => {
    if (y > 270) { doc.addPage(); y = 20; startYList = 20; } // Gestione pagina
    
    // Disegna checkbox "spuntata"
    const xPos = col === 0 ? 14 : 110;
    doc.setDrawColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.rect(xPos, y - 3, 4, 4);
    
    // Draw simple X
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(0.4);
    doc.line(xPos, y-3, xPos+4, y+1);
    doc.line(xPos, y+1, xPos+4, y-3);
    
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(item, xPos + 7, y);
    
    y += 6;
    // Se troppe righe, passa a colonna 2
    if (y > startYList + 30 && col === 0) {
       y = startYList;
       col = 1;
    }
  });

  // Reset Y al massimo delle due colonne
  y = Math.max(y, startYList + 6) + 10;

  // --- DETTAGLIO COSTI ---
  if (y > 200) { doc.addPage(); y = 20; }
  y = drawSectionHeader("Dettaglio Economico & Tariffazione", y);

  const costsBody = ingredients.map(ing => {
    const cost = (ing.costPerGram || 0) * ing.amountUsed;
    return [
      ing.name,
      `${Number(ing.amountUsed).toFixed(ing.isContainer ? 0 : 2)} ${ing.unit}`,
      `€ ${Number(ing.costPerGram || 0).toFixed(4)}`,
      `€ ${cost.toFixed(2)}`
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['VOCE DI COSTO', 'QUANTITÀ', 'COSTO UNIT.', 'TOTALE']],
    body: costsBody,
    theme: 'grid',
    headStyles: { fillColor: COLORS.background, textColor: COLORS.primary, fontStyle: 'bold', lineColor: COLORS.primary, lineWidth: 0.1 },
    styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    }
  });
  
  y = doc.lastAutoTable.finalY + 5;

  // Box Riepilogo Costi (Right Aligned)
  const summaryX = 110;
  const summaryWidth = 86;
  
  // Controlla spazio
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

  const drawSummaryLine = (label, value, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(label, summaryX, y);
    doc.text(value, summaryX + summaryWidth, y, { align: 'right' });
    y += 5;
  };

  drawSummaryLine("Totale Materie Prime:", `€ ${pricing.substances.toFixed(2)}`);
  drawSummaryLine("Onorario Professionale:", `€ ${pricing.fee.toFixed(2)}`);
  if (pricing.additional > 0) {
    drawSummaryLine("Addizionali / Sost. Pericolose:", `€ ${pricing.additional.toFixed(2)}`);
  }
  // Extra Tech Ops non è esplicitamente nel pricing object standard ma incluso nella fee o calcolato a parte.
  // Assumiamo che pricing.fee includa già le operazioni extra se non sono separate.
  // Se volessimo separarle dovremmo passare extraTechOps a questa funzione.
  
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(summaryX, y, summaryX + summaryWidth, y);
  y += 5;
  
  drawSummaryLine("Totale Imponibile:", `€ ${pricing.net.toFixed(2)}`, true);
  drawSummaryLine(`IVA (${(VAT_RATE * 100).toFixed(0)}%):`, `€ ${pricing.vat.toFixed(2)}`);

  y += 5;

  // --- FOOTER & PREZZO ---
  if (y > 240) { doc.addPage(); y = 20; }
  
  // Box Prezzo
  doc.setFillColor(COLORS.background[0], COLORS.background[1], COLORS.background[2]);
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.roundedRect(130, y, 66, 20, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
  doc.text("PREZZO FINALE (IVA incl.)", 163, y + 6, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(`€ ${pricing.final.toFixed(2)}`, 163, y + 15, { align: 'center' });

  // Firme
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  const signY = y + 15;
  doc.line(14, signY, 80, signY);
  doc.text("Il Farmacista Preparatore", 14, signY + 5);

  doc.line(90, signY, 120, signY);
  doc.text("Data", 90, signY + 5);

  // --- SAVE ---
  const safeName = details.name.replace(/\s+/g, '_');
  const safeNum = details.prepNumber.replace(/[\/\\|]/g, '-');
  doc.save(`FL_${safeNum}_${safeName}.pdf`);
};