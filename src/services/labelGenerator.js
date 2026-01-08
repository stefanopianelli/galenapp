import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { VAT_RATE } from '../constants/tariffs'; 

// Configurazione standard Landscape per rotolo 62mm
const ROLL_HEIGHT = 62; 
const LABEL_WIDTH = 100;
const MARGIN = 3;

export const generateLabelPDF = async (prep, pharmacySettings) => {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: [LABEL_WIDTH, ROLL_HEIGHT]
  });

  const pharmacyName = (pharmacySettings.name || "Farmacia Galenica").toUpperCase();
  const pharmacyInfo = [
      pharmacySettings.address, 
      [pharmacySettings.zip, pharmacySettings.city, pharmacySettings.province ? `(${pharmacySettings.province})` : ''].filter(Boolean).join(" "),
      pharmacySettings.phone
  ].filter(Boolean).join(" - ");

  // Generazione QR Code
  let qrDataUrl = null;
  const qrSize = 9; // Dimensione finale scelta
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
  } catch (e) { console.error("QR Error", e); }

  // --- 1. HEADER ---
  const qrY = MARGIN + 1.5; // Abbassato per centratura ottica con le 3 righe di testo
  const textPharmacyY = MARGIN + 4; 
  const textNpY = MARGIN + 3.5; 
  const headerLeftW = 50;
  
  // QR Code (Alto a Destra)
  if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', LABEL_WIDTH - MARGIN - qrSize, qrY, qrSize, qrSize);
  }

  // Nome Farmacia (Alto a Sinistra)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(pharmacyName, MARGIN, textPharmacyY);
  
  // N.P. (Alto a Destra)
  const rightAlignX = LABEL_WIDTH - MARGIN - qrSize - 2;
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(`N.P.: ${prep.prepNumber}`, rightAlignX, textNpY, { align: 'right' });
  
  // Data e Scadenza (Scalati giù rispetto a N.P.)
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${new Date(prep.date).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + 3.5, { align: 'right' });
  
  doc.setFont("helvetica", "bold");
  doc.text(`SCADENZA: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + 7, { align: 'right' });

  // Info Farmacia (Sotto Nome Farmacia)
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  const splitInfo = doc.splitTextToSize(pharmacyInfo, headerLeftW);
  doc.text(splitInfo, MARGIN, textPharmacyY + 2.5);

  // Paziente & Medico (Sotto Info Farmacia)
  let pzDocY = textPharmacyY + 2.5 + (splitInfo.length * 2) + 2; 
  pzDocY = Math.max(pzDocY, textPharmacyY + 9);

  doc.setFontSize(6);
  if (prep.patient) {
      doc.text(`Paziente: ${prep.patient}`, MARGIN, pzDocY);
      pzDocY += 2.5;
  }
  if (prep.doctor) {
      doc.text(`Medico: ${prep.doctor}`, MARGIN, pzDocY);
      pzDocY += 1; // Ridotto da 2.5
  }

  // Definizione cursorY per il blocco successivo (Header Divider)
  let cursorY = Math.max(pzDocY + 0.5, textNpY + 10.5); 
  
  doc.setLineWidth(0.1);
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  cursorY += 4; // Ripristinato spazio dopo la riga

  // --- 2. TITOLO PREPARAZIONE ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const splitName = doc.splitTextToSize(prep.name, LABEL_WIDTH - (MARGIN * 2));
  doc.text(splitName, LABEL_WIDTH / 2, cursorY, { align: "center" });
  cursorY += (splitName.length * 4) + 1;

  // --- 3. CORPO (Ingredienti SX, Costi DX) ---
  const bodyStartY = cursorY;
  const colSplitX = LABEL_WIDTH / 2; // Divisione esatta a metà (50/50)
  
  // Variabili per i costi
  let costMatPrime = 0;
  let costContainers = 0;
  let costFee = 0;
  let costAdditional = 0;
  let vatAmount = 0;
  let finalPrice = parseFloat(prep.totalPrice || 0);
  const hasPricingData = !!prep.pricingData;

  const ingredients = prep.ingredients || [];
  ingredients.forEach(ing => {
      const cost = (ing.amountUsed * (ing.costPerGram || 0));
      if (ing.isContainer) {
          costContainers += cost;
      } else {
          costMatPrime += cost;
      }
  });

  if (hasPricingData) {
      const pd = prep.pricingData;
      costFee = parseFloat(pd.fee || 0);
      costAdditional = parseFloat(pd.additional || 0);
      vatAmount = parseFloat(pd.vat || 0);
      finalPrice = parseFloat(pd.final || finalPrice);
  } else {
      const netPrice = finalPrice / (1 + VAT_RATE);
      vatAmount = finalPrice - netPrice;
      const totalIngredients = costMatPrime + costContainers;
      costFee = netPrice - totalIngredients; 
  }
  
  // COLONNA SX: Ingredienti
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("Composizione:", MARGIN, cursorY);
  cursorY += 3;
  
  ingredients.forEach(ing => {
      if (!ing.isContainer) {
          const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
          doc.setFont("helvetica", isExcipient ? "italic" : "bold");
          const nameText = isExcipient ? `${ing.name} (ecc.)` : ing.name;
          const qtyText = `${Number(ing.amountUsed).toFixed(2)}${ing.unit}`;
          
          const qtyWidthAllowance = 12;
          const maxNameWidth = (colSplitX - MARGIN - 2) - qtyWidthAllowance;
          const nameLines = doc.splitTextToSize(nameText, maxNameWidth);
          
          doc.text(nameLines, MARGIN, cursorY);
          doc.text(qtyText, colSplitX - 2, cursorY, { align: 'right' });
          cursorY += (nameLines.length * 2.5);
      }
  });

  // COLONNA DX: Riepilogo Costi
  let costY = bodyStartY;
  doc.setFont("helvetica", "bold");
  doc.text("Dettaglio Costi:", colSplitX + 2, costY);
  costY += 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);

  const printCostLine = (label, val, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(label, colSplitX + 2, costY);
      doc.text(`€ ${val.toFixed(2)}`, LABEL_WIDTH - MARGIN, costY, { align: 'right' });
      costY += 2.5;
  };

  if (hasPricingData) {
      printCostLine("Mat. Prime:", costMatPrime);
      if (costContainers > 0) printCostLine("Contenitori:", costContainers);
      printCostLine("Onorario Prof.:", costFee);
      if (costAdditional > 0) printCostLine("Addizionali:", costAdditional);
  } else {
      printCostLine("Mat. Prime/Cont.:", costMatPrime + costContainers);
      printCostLine("Onorari/Add.:", Math.max(0, costFee));
  }
  
  printCostLine(`IVA (${(VAT_RATE*100).toFixed(0)}%):`, vatAmount);
  
  costY += 1.5; 
  doc.setFontSize(7);
  printCostLine("TOTALE:", finalPrice, true);

  // Linea verticale separatrice
  doc.line(colSplitX, bodyStartY - 2, colSplitX, Math.max(cursorY, costY) + 2);

  cursorY = Math.max(cursorY, costY) + 3;

  // --- 4. FOOTER (Avvertenze SX) ---
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  cursorY += 3;

  const warnWidth = LABEL_WIDTH - (MARGIN*2);
  doc.setFontSize(5);
  doc.setFont("helvetica", "italic");
  
  const labelWarnings = prep.labelWarnings || [];
  const customWarn = prep.customLabelWarning;
  
  if (labelWarnings.length > 0 || (customWarn && customWarn.trim() !== '')) {
      const allWarns = [...labelWarnings];
      if (customWarn && customWarn.trim() !== '') allWarns.push(customWarn.trim());
      
      const combinedText = allWarns.join(" - ");
      doc.setFontSize(5);
      doc.setFont("helvetica", "italic");
      
      const splitWarns = doc.splitTextToSize(combinedText, warnWidth);
      doc.text(splitWarns, MARGIN, cursorY);
  }

  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};