import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { VAT_RATE } from '../constants/tariffs'; 

// Configurazione standard Landscape per rotolo 62mm
const ROLL_HEIGHT = 62; 
const LABEL_WIDTH = 100;
const MARGIN = 3;

// Helper per caricare immagini
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

  // Caricamento Logo
  let logoDataUrl = null;
  if (pharmacySettings.logo) {
      logoDataUrl = await getImageDataUrl(`./api/uploads/${pharmacySettings.logo}`);
  }

  // Generazione QR Code
  let qrDataUrl = null;
  const qrSize = 9; 
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
  } catch (e) { console.error("QR Error", e); }

  // Funzione che disegna una singola etichetta
  const drawLabelContent = (batchData = null) => {
      const isOfficinale = !!batchData;
      
      // Calcolo fattore di scala per Officinali
      let ratio = 1;
      if (isOfficinale && prep.quantity > 0) {
          ratio = parseFloat(batchData.productQuantity) / parseFloat(prep.quantity);
      }

      let cursorY = MARGIN + 3;

      // --- 1. HEADER (Farmacia SX, Dati Ricetta Centro-DX, QR DX) ---
      const headerLeftW = 50;
      const qrY = MARGIN + 1.5; 
      const textPharmacyY = MARGIN + 4; 
      const textNpY = MARGIN + 3.5; 

      // QR Code (Alto a Destra)
      if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', LABEL_WIDTH - MARGIN - qrSize, qrY, qrSize, qrSize);
      }

      // SX: Farmacia
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(pharmacyName, MARGIN, textPharmacyY);
      
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      const splitInfo = doc.splitTextToSize(pharmacyInfo, headerLeftW);
      doc.text(splitInfo, MARGIN, textPharmacyY + 2.5);

      // DX: N.P. & Data
      const rightAlignX = LABEL_WIDTH - MARGIN - qrSize - 2;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`N.P.: ${prep.prepNumber}`, rightAlignX, textNpY, { align: 'right' });
      
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${new Date(prep.date).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + 3.5, { align: 'right' });
      
      doc.setFont("helvetica", "bold");
      doc.text(`SCADENZA: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + 7, { align: 'right' });

      // Sotto Farmacia: Paziente/Medico o Info Lotto
      const infoH = splitInfo.length * 2.2;
      let pzDocY = textPharmacyY + 2.5 + infoH + 2; 
      pzDocY = Math.max(pzDocY, textPharmacyY + 9);

      if (!isOfficinale) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          if (prep.patient) { doc.text(`Paziente: ${prep.patient}`, MARGIN, pzDocY); pzDocY += 2.5; }
          if (prep.doctor) { doc.text(`Medico: ${prep.doctor}`, MARGIN, pzDocY); pzDocY += 1; }
      } else {
          doc.setFontSize(7); doc.setFont("helvetica", "bold");
          const container = prep.ingredients.find(i => String(i.id) === String(batchData.containerId));
          const containerName = container ? container.name : "Confezione";
          doc.text(`Lotto: ${batchData.productQuantity} ${prep.prepUnit} in ${containerName}`, MARGIN, pzDocY);
          pzDocY += 2.5;
      }

      // Divider
      let currentCursorY = Math.max(pzDocY + 0.5, textNpY + 10.5); 
      doc.setLineWidth(0.1); doc.setDrawColor(0);
      doc.line(MARGIN, currentCursorY, LABEL_WIDTH - MARGIN, currentCursorY);
      currentCursorY += 4; 

      // --- 2. TITOLO PREPARAZIONE ---
      doc.setFontSize(isOfficinale ? 12 : 10);
      doc.setFont("helvetica", "bold");
      const splitName = doc.splitTextToSize(prep.name, LABEL_WIDTH - (MARGIN * 2));
      doc.text(splitName, LABEL_WIDTH / 2, currentCursorY, { align: "center" });
      currentCursorY += (splitName.length * (isOfficinale ? 5 : 4)) + 1;

      // --- 3. CORPO (Ingredienti SX, Costi DX) ---
      const bodyStartY = currentCursorY;
      const colSplitX = isOfficinale ? (LABEL_WIDTH * 0.65) : (LABEL_WIDTH / 2);
      
      // SX: Composizione
      doc.setFontSize(isOfficinale ? 7 : 6);
      doc.setFont("helvetica", "bold");
      doc.text("Composizione:", MARGIN, currentCursorY);
      currentCursorY += 3.5;
      
      prep.ingredients.forEach(ing => {
          if (!ing.isContainer) {
              const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
              doc.setFont("helvetica", isExcipient ? "italic" : "bold");
              const nameText = isExcipient ? `${ing.name} (ecc.)` : ing.name;
              
              const qtyVal = ing.amountUsed * ratio;
              const qtyText = `${Number(qtyVal).toFixed(qtyVal < 0.1 ? 3 : 2)}${ing.unit}`;
              
              const maxNameWidth = (colSplitX - MARGIN - 2) - 14;
              const nameLines = doc.splitTextToSize(nameText, maxNameWidth);
              doc.text(nameLines, MARGIN, currentCursorY);
              doc.text(qtyText, colSplitX - 2, currentCursorY, { align: 'right' });
              currentCursorY += (nameLines.length * (isOfficinale ? 3.5 : 2.5));
          }
      });

      // DX: Costi
      let costY = bodyStartY;
      if (!isOfficinale) {
          // Magistrale Standard
          doc.setFontSize(6); doc.setFont("helvetica", "bold");
          doc.text("Dettaglio Costi:", colSplitX + 2, costY);
          costY += 3;
          doc.setFontSize(5); doc.setFont("helvetica", "normal");

          let costMatP = 0, costCont = 0;
          prep.ingredients.forEach(ing => {
              const c = (ing.amountUsed * (ing.costPerGram || 0));
              if (ing.isContainer) costCont += c; else costMatP += c;
          });

          let fee = 0, add = 0, vat = 0, tot = parseFloat(prep.totalPrice || 0);
          if (prep.pricingData) {
              fee = parseFloat(prep.pricingData.fee || 0);
              add = parseFloat(prep.pricingData.additional || 0);
              vat = parseFloat(prep.pricingData.vat || 0);
              tot = parseFloat(prep.pricingData.final || tot);
          } else {
              const net = tot / (1 + VAT_RATE);
              vat = tot - net;
              fee = net - (costMatP + costCont);
          }

          const printL = (l, v, b = false) => {
              doc.setFont("helvetica", b ? "bold" : "normal");
              doc.text(l, colSplitX + 2, costY);
              doc.text(`€ ${v.toFixed(2)}`, LABEL_WIDTH - MARGIN, costY, { align: 'right' });
              costY += 2.5;
          };

          printL("Mat. Prime:", costMatP);
          if (costCont > 0) printL("Contenitori:", costCont);
          printL("Onorario Prof.:", fee);
          if (add > 0) printL("Addizionali:", add);
          printL(`IVA (${(VAT_RATE*100).toFixed(0)}%):`, vat);
          costY += 1.5; doc.setFontSize(7);
          printL("TOTALE:", tot, true);
      } else {
          // Officinale Restyling (Box Prezzo)
          const priceBoxX = colSplitX + 2;
          const priceBoxW = LABEL_WIDTH - MARGIN - priceBoxX;
          const priceBoxH = 18;
          
          doc.setDrawColor(200);
          doc.setFillColor(245, 245, 245);
          doc.roundedRect(priceBoxX, costY, priceBoxW, priceBoxH, 2, 2, 'FD');
          
          doc.setTextColor(80); doc.setFontSize(7); doc.setFont("helvetica", "bold");
          doc.text("PREZZO AL PUBBLICO", priceBoxX + (priceBoxW/2), costY + 4, { align: 'center' });
          
          doc.setTextColor(0); doc.setFontSize(14); doc.setFont("helvetica", "bold");
          doc.text(`€ ${parseFloat(batchData.unitPrice || 0).toFixed(2)}`, priceBoxX + (priceBoxW/2), costY + 11, { align: 'center' });
          
          doc.setFontSize(5); doc.setFont("helvetica", "normal");
          doc.text("(IVA inclusa)", priceBoxX + (priceBoxW/2), costY + 14.5, { align: 'center' });
          
          costY += priceBoxH + 2;
      }

      doc.setLineWidth(0.1); doc.setDrawColor(0);
      doc.line(colSplitX, bodyStartY - 2, colSplitX, Math.max(currentCursorY, costY) + 2);
      currentCursorY = Math.max(currentCursorY, costY) + 4; 

      // --- 4. FOOTER ---
      doc.line(MARGIN, currentCursorY, LABEL_WIDTH - MARGIN, currentCursorY);
      currentCursorY += 3;
      
      // Logo Centrato in Basso (Solo per Officinali)
      let footerBottomLimit = ROLL_HEIGHT - MARGIN;
      const logoSize = 12;
      
      if (isOfficinale && logoDataUrl) {
          const logoX = (LABEL_WIDTH - logoSize) / 2;
          const logoY = ROLL_HEIGHT - MARGIN - logoSize;
          doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
          footerBottomLimit -= (logoSize + 2); 
      }

      const warnWidth = LABEL_WIDTH - (MARGIN*2);
      doc.setFontSize(5); doc.setFont("helvetica", "italic");
      const allWarns = [...(prep.labelWarnings || [])];
      if (prep.customLabelWarning) allWarns.push(prep.customLabelWarning.trim());
      
      if (allWarns.length > 0) {
          let warnY = currentCursorY;
          const splitWarns = doc.splitTextToSize(allWarns.join(" - "), warnWidth);
          
          splitWarns.forEach(line => {
              if (warnY + 2 > footerBottomLimit) return; // Stop prima del logo
              doc.text(line, MARGIN, warnY);
              warnY += 2.2;
          });
      }
  };

  // Esecuzione
  if (prep.prepType === 'officinale' && prep.batches && prep.batches.length > 0) {
      prep.batches.forEach((batch, index) => {
          if (index > 0) doc.addPage();
          drawLabelContent(batch);
      });
  } else {
      drawLabelContent(null);
  }

  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};