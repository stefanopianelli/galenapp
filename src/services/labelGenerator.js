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
  const qrSize = 9; 
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
  } catch (e) { console.error("QR Error", e); }

  // Funzione che disegna una singola etichetta
  const drawLabelContent = (batchData = null) => {
      const isOfficinale = !!batchData;
      
      // Calcolo fattore di scala per Officinali (Proporzione qtà confezione / totale preparato)
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

      // SX: Farmacia (Con più risalto, SENZA BOX)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(pharmacyName, MARGIN, textPharmacyY);
      
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      const splitInfo = doc.splitTextToSize(pharmacyInfo, headerLeftW);
      doc.text(splitInfo, MARGIN, textPharmacyY + 2.5);

      // DX: Dati Ricetta & Scadenza
      const rightAlignX = LABEL_WIDTH - MARGIN - qrSize - 2;
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`N.P.: ${prep.prepNumber}`, rightAlignX, textNpY, { align: 'right' });
      
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${new Date(prep.date).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + 3.5, { align: 'right' });
      
      doc.setFont("helvetica", "bold");
      doc.text(`SCADENZA: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + 7, { align: 'right' });

      // Sotto Farmacia: Paziente/Medico (Magistrale) o Lotto (Officinale)
      let pzDocY = textPharmacyY + 2.5 + (splitInfo.length * 2) + 2; 
      pzDocY = Math.max(pzDocY, textPharmacyY + 9);

      if (!isOfficinale) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          if (prep.patient) {
              doc.text(`Paziente: ${prep.patient}`, MARGIN, pzDocY);
              pzDocY += 2.5;
          }
          if (prep.doctor) {
              doc.text(`Medico: ${prep.doctor}`, MARGIN, pzDocY);
              pzDocY += 1;
          }
      } else {
          // Officinale: Mostriamo info lotto
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          const container = prep.ingredients.find(i => String(i.id) === String(batchData.containerId));
          const containerName = container ? container.name : "Confezione";
          doc.text(`Lotto: ${batchData.productQuantity} ${prep.prepUnit} in ${containerName}`, MARGIN, pzDocY);
          pzDocY += 2.5;
      }

      // Divider
      cursorY = Math.max(pzDocY + 0.5, textNpY + 10.5); 
      doc.setLineWidth(0.1);
      doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
      cursorY += 4; 

      // --- 2. TITOLO PREPARAZIONE ---
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const splitName = doc.splitTextToSize(prep.name, LABEL_WIDTH - (MARGIN * 2));
      doc.text(splitName, LABEL_WIDTH / 2, cursorY, { align: "center" });
      cursorY += (splitName.length * 4) + 1;

      // --- 3. CORPO (Ingredienti SX, Costi DX) ---
      const bodyStartY = cursorY;
      const colSplitX = LABEL_WIDTH / 2;
      
      // SX: Composizione
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("Composizione:", MARGIN, cursorY);
      cursorY += 3;
      
      prep.ingredients.forEach(ing => {
          if (!ing.isContainer) {
              const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
              doc.setFont("helvetica", isExcipient ? "italic" : "bold");
              const nameText = isExcipient ? `${ing.name} (ecc.)` : ing.name;
              
              const qtyVal = ing.amountUsed * ratio;
              // Se la quantità è molto piccola, usiamo 3 decimali, altrimenti 2
              const qtyText = `${Number(qtyVal).toFixed(qtyVal < 0.1 ? 3 : 2)}${ing.unit}`;
              
              const maxNameWidth = (colSplitX - MARGIN - 2) - 12;
              const nameLines = doc.splitTextToSize(nameText, maxNameWidth);
              doc.text(nameLines, MARGIN, cursorY);
              doc.text(qtyText, colSplitX - 2, cursorY, { align: 'right' });
              cursorY += (nameLines.length * 2.5);
          }
      });

      // DX: Costi (Magistrale) o Prezzo (Officinale)
      let costY = bodyStartY;
      
      if (!isOfficinale) {
          // --- MAGISTRALE ---
          doc.setFont("helvetica", "bold");
          doc.text("Dettaglio Costi:", colSplitX + 2, costY);
          costY += 3;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(5);

          let costMatPrime = 0, costContainers = 0;
          prep.ingredients.forEach(ing => {
              const cost = (ing.amountUsed * (ing.costPerGram || 0));
              if (ing.isContainer) costContainers += cost; else costMatPrime += cost;
          });

          let costFee = 0, costAdditional = 0, vatAmount = 0, finalPrice = parseFloat(prep.totalPrice || 0);
          const hasPricingData = !!prep.pricingData;

          if (hasPricingData) {
              const pd = prep.pricingData;
              costFee = parseFloat(pd.fee || 0);
              costAdditional = parseFloat(pd.additional || 0);
              vatAmount = parseFloat(pd.vat || 0);
              finalPrice = parseFloat(pd.final || finalPrice);
          } else {
              const net = finalPrice / (1 + VAT_RATE);
              vatAmount = finalPrice - net;
              costFee = net - (costMatPrime + costContainers);
          }

          const printLine = (l, v, b = false) => {
              doc.setFont("helvetica", b ? "bold" : "normal");
              doc.text(l, colSplitX + 2, costY);
              doc.text(`€ ${v.toFixed(2)}`, LABEL_WIDTH - MARGIN, costY, { align: 'right' });
              costY += 2.5;
          };

          if (hasPricingData) {
              printLine("Mat. Prime:", costMatPrime);
              if (costContainers > 0) printLine("Contenitori:", costContainers);
              printLine("Onorario Prof.:", costFee);
              if (costAdditional > 0) printLine("Addizionali:", costAdditional);
          } else {
              printLine("Mat. Prime/Cont.:", costMatPrime + costContainers);
              printLine("Onorari/Add.:", Math.max(0, costFee));
          }
          
          printLine(`IVA (${(VAT_RATE*100).toFixed(0)}%):`, vatAmount);
          costY += 1.5; doc.setFontSize(7);
          printLine("TOTALE:", finalPrice, true);

      } else {
          // --- OFFICINALE ---
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text("Prezzo al Pubblico:", colSplitX + 2, costY);
          costY += 6;
          
          doc.setFontSize(14);
          doc.text(`€ ${parseFloat(batchData.unitPrice || 0).toFixed(2)}`, colSplitX + 2, costY);
          
          costY += 5;
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          doc.text("(IVA inclusa)", colSplitX + 2, costY);
      }

      // Vertical Line
      doc.setLineWidth(0.1);
      doc.line(colSplitX, bodyStartY - 2, colSplitX, Math.max(cursorY, costY) + 2);
      cursorY = Math.max(cursorY, costY) + 3;

      // --- 4. FOOTER ---
      doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
      cursorY += 3;

      const warnWidth = LABEL_WIDTH - (MARGIN*2);
      doc.setFontSize(5); doc.setFont("helvetica", "italic");
      const allWarns = [...(prep.labelWarnings || [])];
      if (prep.customLabelWarning) allWarns.push(prep.customLabelWarning.trim());
      
      if (allWarns.length > 0) {
          const splitWarns = doc.splitTextToSize(allWarns.join(" - "), warnWidth);
          doc.text(splitWarns, MARGIN, cursorY);
      }
  };

  // Logica Principale: Loop o Singola
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
