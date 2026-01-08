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

  // Generazione QR Code (Subito, per posizionarlo in header)
  let qrDataUrl = null;
  const qrSize = 13;
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
  } catch (e) { console.error("QR Error", e); }

  let cursorY = MARGIN + 4;

  // --- 1. HEADER (Farmacia SX, Dati Ricetta Centro-DX, QR DX) ---
  const headerLeftW = 50;

  // QR Code (Estrema Destra)
  if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', LABEL_WIDTH - MARGIN - qrSize, MARGIN, qrSize, qrSize);
  }

  // SX: Farmacia (Con più risalto)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(pharmacyName, MARGIN, cursorY);
  
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  const splitInfo = doc.splitTextToSize(pharmacyInfo, headerLeftW);
  doc.text(splitInfo, MARGIN, cursorY + 2.5);

  // DX: Dati Ricetta & Scadenza (Spostati a sinistra del QR)
  const rightAlignX = LABEL_WIDTH - MARGIN - qrSize - 3;
  const headerFontSize = 7;
  
  doc.setFontSize(headerFontSize);
  doc.setFont("helvetica", "bold");
  doc.text(`N.P.: ${prep.prepNumber}`, rightAlignX, cursorY, { align: 'right' });
  
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${new Date(prep.date).toLocaleDateString('it-IT')}`, rightAlignX, cursorY + 3.5, { align: 'right' });
  
  doc.setFont("helvetica", "bold");
  doc.text(`SCADENZA: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, rightAlignX, cursorY + 7, { align: 'right' });

  // Paziente & Medico (Sotto Farmacia a sinistra)
  let pzDocY = cursorY + 9;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  if (prep.patient) {
      doc.text(`Paziente: ${prep.patient}`, MARGIN, pzDocY);
      pzDocY += 3;
  }
  if (prep.doctor) {
      doc.text(`Medico: ${prep.doctor}`, MARGIN, pzDocY);
  }

  cursorY = Math.max(pzDocY + 2, cursorY + 11); 
  
  doc.setLineWidth(0.1);
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  cursorY += 4;

  // --- 2. TITOLO PREPARAZIONE (Centrato) ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const splitName = doc.splitTextToSize(prep.name, LABEL_WIDTH - (MARGIN * 2));
  doc.text(splitName, LABEL_WIDTH / 2, cursorY, { align: "center" });
  cursorY += (splitName.length * 4) + 1;

  // --- 3. CORPO (Ingredienti SX, Costi DX) ---
  const bodyStartY = cursorY;
  const colSplitX = LABEL_WIDTH - 45; 
  
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
      if (ing.isContainer) costContainers += cost;
      else costMatPrime += cost;
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
      costFee = netPrice - (costMatPrime + costContainers); 
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
          const maxNameWidth = (colSplitX - MARGIN - 2) - 12;
          const nameLines = doc.splitTextToSize(nameText, maxNameWidth);
          doc.text(nameLines, MARGIN, cursorY);
          doc.text(qtyText, colSplitX - 2, cursorY, { align: 'right' });
          cursorY += (nameLines.length * 2.5);
      }
  });

  // COLONNA DX: Riepilogo Costi
  let costY = bodyStartY;
  doc.setFontSize(6);
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
  
  costY += 2; // Spazio prima del totale
  doc.setFontSize(7);
  printCostLine("TOTALE:", finalPrice, true);

  // Linea verticale separatrice
  doc.line(colSplitX, bodyStartY - 2, colSplitX, Math.max(cursorY, costY) + 2);
  cursorY = Math.max(cursorY, costY) + 3;

  // --- 4. FOOTER (Avvertenze SX) ---
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  cursorY += 3;

  // Tutto lo spazio disponibile per le avvertenze
  const warnWidth = LABEL_WIDTH - (MARGIN*2);
  doc.setFontSize(5);
  doc.setFont("helvetica", "italic");
  
  const labelWarnings = prep.labelWarnings || [];
  if (labelWarnings.length > 0 || (prep.customLabelWarning && prep.customLabelWarning.trim() !== '')) {
      let warnY = cursorY;
      labelWarnings.forEach(w => {
          if (warnY > ROLL_HEIGHT - MARGIN) return;
          if (w.toLowerCase().includes("doping")) { 
              doc.setFont("helvetica", "bolditalic"); 
          }
          const splitW = doc.splitTextToSize(`• ${w}`, warnWidth);
          doc.text(splitW, MARGIN, warnY);
          warnY += (splitW.length * 2);
          doc.setFont("helvetica", "italic");
      });
      if (prep.customLabelWarning && warnY < ROLL_HEIGHT - MARGIN) {
          const splitC = doc.splitTextToSize(`• ${prep.customLabelWarning}`, warnWidth);
          doc.text(splitC, MARGIN, warnY);
      }
  }

  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};
