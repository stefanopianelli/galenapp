import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { VAT_RATE } from '../constants/tariffs';
import { TechOpsList } from '../components/modals/TechOpsModal';
import { formatDate } from '../utils/dateUtils';

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

// --- HELPERS ---

const getImageDataUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
  });
};

const drawSectionHeader = (doc, text, yPos) => {
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.roundedRect(14, yPos - 5, 182, 7, 1, 1, 'F');
  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), 16, yPos);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  return yPos + 10;
};

const drawSheetHeader = (doc, settings, prep, isOfficinale, logoDataUrl, qrDataUrl) => {
    // Logo
    if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', 14, 8, 22, 22);
    }

    // QR Code
    if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', 175, 8, 20, 20);
    }

    // Intestazione Farmacia
    const pharmacyName = settings.name || "Farmacia (Nome non impostato)";
    const pharmacyAddress = `${settings.address || ''}, ${settings.zip || ''} ${settings.city || ''} (${settings.province || ''})`;
    const pharmacyContacts = settings.phone ? `Tel: ${settings.phone}` : '';

    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(pharmacyName, 105, 18, { align: 'center' });

    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text([pharmacyAddress, pharmacyContacts], 105, 24, { align: 'center', lineHeightFactor: 1.2 });

    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Titolo Documento
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const title = isOfficinale ? "FOGLIO DI LAVORAZIONE - OFFICINALE" : "FOGLIO DI LAVORAZIONE - MAGISTRALE";
    doc.text(title, 105, 42, { align: 'center' });

    return 55; // Y start per la sezione successiva
};

const drawPrepInfo = (doc, prep, isOfficinale, startY) => {
    const prepDate = formatDate(new Date()); // Data stampa
    const infoData = [
        [
          { content: 'N. PREPARAZIONE:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          { content: prep.prepNumber, styles: { fontStyle: 'bold', fontSize: 11 } },
          { content: 'DATA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          { content: prepDate }
        ],
        [
          { content: 'NOME:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          { content: prep.name, colSpan: 3, styles: { fontStyle: 'bold' } }
        ],
        [
          { content: 'FORMA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          prep.pharmaceuticalForm,
          { content: 'QUANTITÀ:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          `${prep.quantity} ${prep.prepUnit || 'g'}`
        ],
        [
          { content: 'SCADENZA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          formatDate(prep.expiryDate),
          { content: 'USO:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          prep.usage
        ]
    ];

    if (!isOfficinale) {
        infoData.push([
          { content: 'PAZIENTE:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          prep.patient,
          { content: 'MEDICO:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          prep.doctor
        ]);
        infoData.push([
          { content: 'DATA RICETTA:', styles: { fontStyle: 'bold', textColor: COLORS.primary } }, 
          formatDate(prep.recipeDate),
          { content: '', colSpan: 2 }
        ]);
    }
    
    infoData.push([
        { content: 'POSOLOGIA:', styles: { fontStyle: 'bold', textColor: COLORS.primary, valign: 'top' } },
        { content: prep.posology, colSpan: 3 }
    ]);

    doc.autoTable({
        startY: startY,
        body: infoData,
        theme: 'plain',
        styles: { cellPadding: 1.5, fontSize: 9, textColor: COLORS.text },
        columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { cellWidth: 35 }, 3: { cellWidth: 55 } }
    });

    return doc.lastAutoTable.finalY + 10;
};

const drawPreliminaries = (doc, startY) => {
    let y = startY;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text("VERIFICHE PRELIMINARI:", 14, y);
    y += 5;
    
    const drawCheck = (text, x, yPos) => {
        doc.setDrawColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
        doc.rect(x, yPos - 3, 4, 4);
        // Checked
        doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setLineWidth(0.4);
        doc.line(x, yPos - 3, x + 4, yPos + 1);
        doc.line(x, yPos + 1, x + 4, yPos - 3);
        
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(text, x + 6, yPos);
    };

    drawCheck("Verifica Pulizia Locali, Puliti", 14, y);
    drawCheck("Verifica Pulizia Attrezzatura, Utensili, Confezionamento, Puliti", 105, y);
    
    return y + 15;
};

const drawCompositionTable = (doc, ingredients, prep, isOfficinale, startY) => {
    let y = drawSectionHeader(doc, "Composizione", startY);

    const substances = ingredients.filter(ing => !ing.isContainer).sort((a, b) => a.name.localeCompare(b.name));
    const containers = ingredients.filter(ing => ing.isContainer).sort((a, b) => a.name.localeCompare(b.name));

    // Helper per calcolare rowspan
    const getRowSpanMap = (items) => {
        const counts = {};
        items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + 1; });
        return counts;
    };

    if (substances.length > 0) {
        const subRowSpans = getRowSpanMap(substances);
        const processedSubNames = new Set();

        const substancesBody = substances.map(ing => {
            let flags = [];
            if(ing.isDoping) flags.push("Doping");
            if(ing.isNarcotic) flags.push("Stupefacente");
            const identifier = [ing.lot ? 'L:'+ing.lot : null, ing.ni ? 'NI:'+ing.ni : null].filter(Boolean).join(' ') || '-';
            
            const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
            const displayName = isExcipient ? `${ing.name} (Eccipiente)` : ing.name;

            // Calcolo Tolleranza
            let toleranceText = '';
            const recipeQty = parseFloat(ing.amountUsed || 0);
            const weighedQty = ing.stockDeduction ? parseFloat(ing.stockDeduction) : recipeQty;
            
            if (Math.abs(weighedQty - recipeQty) > 0.001) {
                const diff = weighedQty - recipeQty;
                const percent = recipeQty > 0 ? (diff / recipeQty) * 100 : 0;
                const sign = diff > 0 ? '+' : '';
                toleranceText = `${sign}${diff.toFixed(2)} ${ing.unit} (${sign}${percent.toFixed(1)}%)`;
            }

            // Cella Nome con RowSpan
            let nameCell = null;
            if (!processedSubNames.has(ing.name)) {
                nameCell = { 
                    content: displayName, 
                    rowSpan: subRowSpans[ing.name], 
                    styles: { fontStyle: isExcipient ? 'italic' : 'bold', valign: 'middle' } 
                };
                processedSubNames.add(ing.name);
            }

            const rowData = [
                identifier,
                { content: `${Number(recipeQty).toFixed(2)} ${ing.unit}`, styles: { halign: 'right' } },
                { content: toleranceText, styles: { halign: 'right' } },
                flags.join(', ')
            ];

            // Se è la prima riga del gruppo, aggiunge la cella col nome (e rowspan) all'inizio
            if (nameCell) {
                return [nameCell, ...rowData];
            } else {
                // Se è una riga successiva, NON aggiunge la prima colonna (perché coperta dal rowspan)
                return rowData;
            }
        });

        doc.autoTable({
            startY: y - 7,
            head: [['SOSTANZA', 'LOTTO / N.I.', 'QUANTITÀ', 'TOLLERANZA', 'NOTE']],
            body: substancesBody,
            theme: 'grid',
            headStyles: { fillColor: COLORS.background, textColor: COLORS.primary, fontStyle: 'bold', lineColor: COLORS.primary, lineWidth: 0.1 },
            styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border },
            columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 35 }, 2: { cellWidth: 25 }, 3: { cellWidth: 30 }, 4: { cellWidth: 'auto' } }
        });
        y = doc.lastAutoTable.finalY;
    }

    if (containers.length > 0) {
        y += 5;
        const contRowSpans = getRowSpanMap(containers);
        const processedContNames = new Set();

        const containersBody = containers.map(ing => {
            const identifier = [ing.lot ? 'L:'+ing.lot : null, ing.ni ? 'NI:'+ing.ni : null].filter(Boolean).join(' ') || '-';
            
            let nameCell = null;
            if (!processedContNames.has(ing.name)) {
                nameCell = { 
                    content: ing.name, 
                    rowSpan: contRowSpans[ing.name], 
                    styles: { fontStyle: 'bold', valign: 'middle' } 
                };
                processedContNames.add(ing.name);
            }

            const rowData = [
                identifier,
                { content: `${Number(ing.amountUsed).toFixed(0)} ${ing.unit}`, styles: { halign: 'right' } },
                ''
            ];

            if (nameCell) {
                return [nameCell, ...rowData];
            } else {
                return rowData;
            }
        });

        doc.autoTable({
            startY: y,
            head: [['CONTENITORE', 'LOTTO / N.I.', 'QUANTITÀ', 'NOTE']],
            body: containersBody,
            theme: 'grid',
            headStyles: { fillColor: COLORS.background, textColor: COLORS.secondary, fontStyle: 'bold', lineColor: COLORS.secondary, lineWidth: 0.1 },
            styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 }, 2: { cellWidth: 30 }, 3: { cellWidth: 'auto' } }
        });
        y = doc.lastAutoTable.finalY + 5;
    }

    if(isOfficinale && prep.batches && prep.batches.length > 0) {
        y += 5;
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.text("DETTAGLIO LOTTIZZAZIONE", 14, y);
        y += 2;
        const batchesBody = prep.batches.map(batch => {
            const container = ingredients.find(ing => ing.id === batch.containerId);
            return [container ? container.name : `ID: ${batch.containerId}`, Number(container ? container.amountUsed : 0).toFixed(0), `${batch.productQuantity} ${prep.prepUnit}`, `€ ${parseFloat(batch.unitPrice || 0).toFixed(2)}` ];
        });
        doc.autoTable({
            startY: y, head: [['CONTENITORE', 'N. CONFEZIONI', 'Q.TÀ / CONF.', 'PREZZO UNITARIO']], body: batchesBody, theme: 'grid',
            headStyles: { fillColor: COLORS.background, textColor: COLORS.secondary, fontStyle: 'bold', lineColor: COLORS.secondary, lineWidth: 0.1 },
            styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 'auto', halign: 'right' } }
        });
        y = doc.lastAutoTable.finalY + 5;
    }

    return y + 5;
};

const drawLabelWarnings = (doc, prep, startY) => {
    const hasLabelWarnings = (prep.labelWarnings && prep.labelWarnings.length > 0) || (prep.customLabelWarning && prep.customLabelWarning.trim() !== '');
    if (!hasLabelWarnings) return startY;

    let y = startY;
    if (y > 220) { doc.addPage(); y = 20; }
    
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    let totalWarnHeight = 0;
    
    const processedWarnings = (prep.labelWarnings || []).map(warn => {
        const lines = doc.splitTextToSize(`• ${warn}`, 170);
        const height = lines.length * 4; 
        totalWarnHeight += height + 2;
        return { lines, height };
    });

    let customWarnLines = null;
    let customWarnHeight = 0;
    if (prep.customLabelWarning && prep.customLabelWarning.trim() !== '') {
        customWarnLines = doc.splitTextToSize(`• ${prep.customLabelWarning}`, 170);
        customWarnHeight = customWarnLines.length * 4;
        totalWarnHeight += customWarnHeight + 2;
    }

    const labelBoxHeight = 10 + totalWarnHeight;
    
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setFillColor(COLORS.background[0], COLORS.background[1], COLORS.background[2]);
    doc.roundedRect(14, y, 182, labelBoxHeight, 1, 1, 'FD');
    
    doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text("FRASI ED AVVERTENZE DA RIPORTARE IN ETICHETTA:", 17, y + 6);
    
    doc.setFont('helvetica', 'italic'); doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    
    let currentWarnY = y + 12;
    processedWarnings.forEach(item => {
        doc.text(item.lines, 20, currentWarnY);
        currentWarnY += item.height + 2;
    });

    if (customWarnLines) {
        doc.text(customWarnLines, 20, currentWarnY);
    }
    
    return y + labelBoxHeight + 10;
};

const drawTechOpsAndPhases = (doc, prep, startY) => {
    let y = startY;
    
    // Tech Ops
    const hasTechOps = prep.techOps && prep.techOps.length > 0;
    if (hasTechOps) {
        if (y > 260) { doc.addPage(); y = 20; }
        y = drawSectionHeader(doc, "OPERAZIONI TECNOLOGICHE", y);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        
        const opsText = prep.techOps.map(opCode => {
            const op = TechOpsList.find(o => o.code === opCode);
            return op ? `• ${op.text} (${op.code})` : '';
        }).filter(Boolean).join('   '); 

        const splitText = doc.splitTextToSize(opsText, 180);
        doc.text(splitText, 16, y - 3); 
        y += (splitText.length * 4) + 10; 
    }
    
    if (y > 260) { doc.addPage(); y = 20; }

    // Fasi
    y = drawSectionHeader(doc, "Controlli e Fasi Operative", y);

    if (prep.operatingProcedures) {
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text("Procedure operative ed eventuali integrazioni:", 14, y);
        y += 6;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        const splitText = doc.splitTextToSize(prep.operatingProcedures, 180);
        doc.text(splitText, 14, y);
        y += (splitText.length * 4) + 10;
    }

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text("Fasi Eseguite", 14, y);
    y += 6;
    
    let finalChecklistItems = (prep.worksheetItems && prep.worksheetItems.length > 0) 
        ? prep.worksheetItems.filter(item => item.checked).map(item => item.text)
        : ['Verifica calcoli', 'Pesata componenti', 'Miscelazione', 'Confezionamento', 'Controllo Aspetto'];

    let col = 0; let startYList = y;
    let maxY = y; 
    finalChecklistItems.forEach((item, i) => {
        if (y > 270) { doc.addPage(); y = 20; startYList = 20; maxY = 20; }
        const xPos = col === 0 ? 14 : 110;
        
        doc.setDrawColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.rect(xPos, y - 3, 4, 4);
        doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.line(xPos, y-3, xPos+4, y+1); doc.line(xPos, y+1, xPos+4, y-3);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(item, xPos + 7, y);
        y += 6;
        if (y > maxY) maxY = y;
        if (y > startYList + 30 && col === 0) { y = startYList; col = 1; }
    });

    return maxY + 10;
};

const drawCostsTable = (doc, ingredients, pricing, startY) => {
    let y = startY;
    if (y > 200) { doc.addPage(); y = 20; }
    y = drawSectionHeader(doc, "Dettaglio Economico & Tariffazione", y);
    
    // Aggregazione Costi per Nome
    const aggMap = new Map();
    ingredients.forEach(ing => {
        const cost = (ing.costPerGram || 0) * ing.amountUsed;
        if (!aggMap.has(ing.name)) {
            aggMap.set(ing.name, {
                name: ing.name,
                unit: ing.unit,
                totalAmount: parseFloat(ing.amountUsed),
                totalCost: cost,
                isContainer: ing.isContainer
            });
        } else {
            const entry = aggMap.get(ing.name);
            entry.totalAmount += parseFloat(ing.amountUsed);
            entry.totalCost += cost;
        }
    });

    const costsBody = Array.from(aggMap.values()).map(entry => {
        const avgCostPerUnit = entry.totalAmount > 0 ? (entry.totalCost / entry.totalAmount) : 0;
        return [
            entry.name, 
            `${entry.totalAmount.toFixed(entry.isContainer ? 0 : 2)} ${entry.unit}`, 
            `€ ${avgCostPerUnit.toFixed(4)}`, 
            `€ ${entry.totalCost.toFixed(2)}` 
        ];
    });
    
    doc.autoTable({
        startY: y, head: [['VOCE DI COSTO', 'QUANTITÀ', 'COSTO UNIT. (MEDIO)', 'TOTALE']], body: costsBody, theme: 'grid',
        headStyles: { fillColor: COLORS.background, textColor: COLORS.primary, fontStyle: 'bold', lineColor: COLORS.primary, lineWidth: 0.1 },
        styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } }
    });
    
    y = doc.lastAutoTable.finalY + 5;
    
    if (y > 220) { doc.addPage(); y = 20; }
    const summaryX = 110; const summaryWidth = 86;
    doc.setFontSize(9); doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const drawSummaryLine = (label, value, isBold = false) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(label, summaryX, y); doc.text(value, summaryX + summaryWidth, y, { align: 'right' });
        y += 5;
    };
    drawSummaryLine("Totale Materie Prime:", `€ ${pricing.substances.toFixed(2)}`);
    drawSummaryLine("Onorario Professionale:", `€ ${pricing.fee.toFixed(2)}`);
    if (pricing.additional > 0) drawSummaryLine("Addizionali / Sost. Pericolose:", `€ ${pricing.additional.toFixed(2)}`);
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]); doc.line(summaryX, y, summaryX + summaryWidth, y);
    y += 5;
    drawSummaryLine("Totale Imponibile:", `€ ${pricing.net.toFixed(2)}`, true);
    drawSummaryLine(`IVA (${(VAT_RATE * 100).toFixed(0)}%):`, `€ ${pricing.vat.toFixed(2)}`);
    
    return y + 5;
};

const drawFooterAndSignatures = (doc, pricing, startY) => {
    let y = startY;
    if (y > 240) { doc.addPage(); y = 20; }
    
    // Box Prezzo Finale
    doc.setFillColor(COLORS.background[0], COLORS.background[1], COLORS.background[2]);
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(130, y, 66, 20, 2, 2, 'FD');
    doc.setFontSize(10); doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
    doc.text("PREZZO FINALE (IVA incl.)", 163, y + 6, { align: 'center' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(`€ ${pricing.final.toFixed(2)}`, 163, y + 15, { align: 'center' });
    
    // Firme in basso
    const footerHeight = 60; 
    const pageHeight = 297;
    let signStartY = pageHeight - footerHeight - 20; 

    // Se non c'è spazio dopo il prezzo, vai a nuova pagina
    if (y + 25 > signStartY) {
        doc.addPage();
        signStartY = pageHeight - footerHeight - 20; // Ricalcola per sicurezza (o usa margine alto)
    }

    let signY = signStartY;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    
    doc.line(14, signY, 80, signY); doc.text("Il Farmacista Preparatore", 14, signY + 5);
    doc.line(90, signY, 120, signY); doc.text("Data", 90, signY + 5);
    
    signY += 25;
    
    doc.line(14, signY, 80, signY); doc.text("Il Direttore Responsabile", 14, signY + 5);
    doc.line(90, signY, 120, signY); doc.text("Data", 90, signY + 5);
};

// --- FUNZIONE PRINCIPALE EXPORTATA ---

export const generateWorkSheetPDF = async (preparationData, pharmacySettings) => {
  const doc = new jsPDF();
  const { details, ingredients, pricing } = preparationData;
  const isOfficinale = details.prepType === 'officinale';

  // 1. Preparazione Dati & Assets
  let logoDataUrl = null;
  if (pharmacySettings && pharmacySettings.logo) {
      try {
        logoDataUrl = await getImageDataUrl(`./api/uploads/${pharmacySettings.logo}`);
      } catch (e) { console.error("Logo load error", e); }
  }

  let qrDataUrl = null;
  try {
      const qrData = JSON.stringify({ type: 'prep', id: details.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1 });
  } catch (e) { console.error("QR Error", e); }

  // 2. Disegno Sezioni in Sequenza
  let currentY = drawSheetHeader(doc, pharmacySettings || {}, details, isOfficinale, logoDataUrl, qrDataUrl);
  
  currentY = drawPrepInfo(doc, details, isOfficinale, currentY);
  
  currentY = drawPreliminaries(doc, currentY);
  
  currentY = drawCompositionTable(doc, ingredients, details, isOfficinale, currentY);
  
  currentY = drawLabelWarnings(doc, details, currentY);
  
  currentY = drawTechOpsAndPhases(doc, details, currentY);
  
  currentY = drawCostsTable(doc, ingredients, pricing, currentY);
  
  drawFooterAndSignatures(doc, pricing, currentY);

  // 3. Salvataggio
  doc.save(`FL_${details.prepNumber.replace(/["\/|]/g, '-')}_${details.name.replace(/\s+/g, '_')}.pdf`);
};
