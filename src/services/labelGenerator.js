import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { VAT_RATE } from '../constants/tariffs'; 

// Configurazione standard Landscape per rotolo 62mm
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

export const generateLabelPDF = async (prep, pharmacySettings, rollFormat = 62) => {
  const CURRENT_ROLL_HEIGHT = parseInt(rollFormat) || 62;
  const isSmall = CURRENT_ROLL_HEIGHT < 40; 
  const isMedium = CURRENT_ROLL_HEIGHT >= 40 && CURRENT_ROLL_HEIGHT < 60;
  
  const CURRENT_LABEL_WIDTH = isSmall ? 130 : 100;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: [CURRENT_LABEL_WIDTH, CURRENT_ROLL_HEIGHT]
  });

  const pharmacyName = (pharmacySettings.name || "Farmacia Galenica").toUpperCase();
  const pharmacyInfo = [
      pharmacySettings.address, 
      [pharmacySettings.zip, pharmacySettings.city, pharmacySettings.province ? `(${pharmacySettings.province})` : ''].filter(Boolean).join(" "),
      pharmacySettings.phone
  ].filter(Boolean).join(" - ");

  let logoDataUrl = null;
  if (pharmacySettings.logo) {
      logoDataUrl = await getImageDataUrl(`./api/uploads/${pharmacySettings.logo}`);
  }

  let qrDataUrl = null;
  const qrSize = isSmall ? 0 : (isMedium ? 8 : 9); 
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
  } catch (e) { console.error("QR Error", e); }

  // Funzione CORE di disegno
  // Accetta il documento su cui disegnare, l'offset verticale e i dati del batch
  const drawOnDoc = (targetDoc, startOffsetY, batchData) => {
      const isOfficinale = !!batchData;
      let ratio = 1;
      if (isOfficinale && prep.quantity > 0) {
          ratio = parseFloat(batchData.productQuantity) / parseFloat(prep.quantity);
      }

      // --- CONFIGURAZIONE FONT & SPAZI ---
      const F_H1 = isSmall ? 8 : (isMedium ? 9 : 10); 
      const F_H2 = isSmall ? 6 : (isMedium ? 6 : 7); 
      const F_TITLE = isSmall ? 8 : (isMedium ? 10 : (isOfficinale ? 12 : 10)); 
      const F_BODY = isSmall ? 5 : (isMedium ? 6 : 7); 
      const F_COST = isSmall ? 5 : (isMedium ? 5 : 6); 
      const F_WARN = isSmall ? 4 : (isMedium ? 4.5 : 5); 
      
      const GAP_H = isSmall ? 2.5 : (isMedium ? 3 : 3.5); 
      const GAP_B = isSmall ? 2.2 : (isMedium ? 2.8 : 3.5); 

      // Applico l'offset iniziale a cursorY
      let cursorY = MARGIN + (isSmall ? 1 : 3) + startOffsetY;

      // --- 1. HEADER ---
      const headerLeftW = isSmall ? 70 : 50;
      const textPharmacyY = cursorY; 
      const textNpY = cursorY; 

      // QR Code
      if (qrDataUrl && !isSmall) {
          targetDoc.addImage(qrDataUrl, 'PNG', CURRENT_LABEL_WIDTH - MARGIN - qrSize, MARGIN + (isMedium ? 1 : 1.5) + startOffsetY, qrSize, qrSize);
      }

      // Farmacia
      targetDoc.setFontSize(F_H1); targetDoc.setFont("helvetica", "bold");
      targetDoc.text(pharmacyName, MARGIN, textPharmacyY);
      
      if (!isSmall) {
          targetDoc.setFontSize(5); targetDoc.setFont("helvetica", "normal");
          const splitInfo = targetDoc.splitTextToSize(pharmacyInfo, headerLeftW);
          targetDoc.text(splitInfo, MARGIN, textPharmacyY + 2.5);
      }

      // DX: N.P. & Data
      const rightAlignX = CURRENT_LABEL_WIDTH - MARGIN - (isSmall ? 0 : (qrSize + 2));
      targetDoc.setFontSize(F_H2); targetDoc.setFont("helvetica", "bold");
      targetDoc.text(`N.P.: ${prep.prepNumber}`, rightAlignX, textNpY, { align: 'right' });
      targetDoc.setFont("helvetica", "normal");
      targetDoc.text(`Data: ${new Date(prep.date).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + GAP_H, { align: 'right' });
      targetDoc.setFont("helvetica", "bold");
      targetDoc.text(`Scad: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, rightAlignX, textNpY + (GAP_H * 2), { align: 'right' });

      // Sotto Farmacia
      let pzDocY = textPharmacyY + (isSmall ? 4 : 9); 
      if (!isOfficinale) {
          targetDoc.setFontSize(isSmall ? 5 : 6); targetDoc.setFont("helvetica", "normal");
          if (prep.patient) { targetDoc.text(`Pz: ${prep.patient}`, MARGIN, pzDocY); pzDocY += (isSmall ? 2 : 2.5); }
          if (prep.doctor) { targetDoc.text(`Dr: ${prep.doctor}`, MARGIN, pzDocY); pzDocY += 1; }
      } else {
          targetDoc.setFontSize(isSmall ? 6 : 7); targetDoc.setFont("helvetica", "bold");
          const container = prep.ingredients.find(i => String(i.id) === String(batchData.containerId));
          const containerName = container ? container.name : "Conf.";
          const lotText = `Lotto: ${batchData.productQuantity} ${prep.prepUnit}` + (isSmall ? '' : ` in ${containerName}`);
          targetDoc.text(lotText, MARGIN, pzDocY);
          pzDocY += (isMedium ? 2 : 2.5);
      }

      // Divider
      let currentCursorY = Math.max(pzDocY + 0.5, textNpY + (GAP_H * 3)); 
      targetDoc.setLineWidth(0.1); targetDoc.setDrawColor(0);
      targetDoc.line(MARGIN, currentCursorY, CURRENT_LABEL_WIDTH - MARGIN, currentCursorY);
      currentCursorY += (isSmall ? 2 : (isMedium ? 3.5 : 4)); 

      // --- 2. TITOLO ---
      targetDoc.setFontSize(F_TITLE); targetDoc.setFont("helvetica", "bold");
      const splitName = targetDoc.splitTextToSize(prep.name, CURRENT_LABEL_WIDTH - (MARGIN * 2));
      targetDoc.text(splitName, CURRENT_LABEL_WIDTH / 2, currentCursorY, { align: "center" });
      currentCursorY += (splitName.length * (isOfficinale ? (isSmall ? 3.5 : 5) : (isSmall ? 3 : 4))) + 1;

      // --- 3. CORPO ---
      const bodyStartY = currentCursorY;
      const colSplitX = isOfficinale ? (CURRENT_LABEL_WIDTH * 0.65) : (CURRENT_LABEL_WIDTH / 2);
      
      // SX: Composizione
      const DIVIDED_FORMS = ['Capsule', 'Cartine e cialdini', 'Compresse e gomme da masticare medicate', 'Suppositori e ovuli', 'Pillole, pastiglie e granulati'];
      const isDivided = DIVIDED_FORMS.includes(prep.pharmaceuticalForm);
      
      const unitCount = isOfficinale ? parseFloat(batchData.productQuantity) : parseFloat(prep.quantity);
      const compLabel = isDivided ? `Composizione (per unità di cui ${unitCount}):` : "Composizione:";
      
      targetDoc.setFontSize(isSmall ? 5 : 7);
      targetDoc.setFont("helvetica", "bold");
      targetDoc.text(compLabel, MARGIN, currentCursorY);
      currentCursorY += (isSmall ? 2.5 : 3.5);
      
      prep.ingredients.forEach(ing => {
          if (!ing.isContainer) {
              const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
              targetDoc.setFont("helvetica", isExcipient ? "italic" : "bold");
              const nameText = isExcipient ? `${ing.name} (ecc.)` : ing.name;
              
              let finalQty = ing.amountUsed * ratio;
              let finalUnit = ing.unit;

              // Ripartizione Unitaria per forme divise
              if (isDivided) {
                  const divisor = isOfficinale ? parseFloat(batchData.productQuantity) : parseFloat(prep.quantity);
                  if (divisor > 0) {
                      finalQty = (ing.amountUsed * ratio) / divisor;
                  }
              }

              // Conversione di scala automatica (g -> mg -> mcg)
              if (finalUnit === 'g') {
                  if (finalQty < 0.0001) {
                      finalQty *= 1000000;
                      finalUnit = 'mcg';
                  } else if (finalQty < 1) {
                      finalQty *= 1000;
                      finalUnit = 'mg';
                  }
              }
              
              // Rimuove decimali inutili (es. 10.00 -> 10)
              const qtyText = `${parseFloat(Number(finalQty).toFixed(3))}${finalUnit}`;
              const maxNameWidth = (colSplitX - MARGIN - 2) - (isSmall ? 8 : 12);
              
              // Logica Shrink-to-Fit
              let currentFontSize = F_BODY;
              targetDoc.setFontSize(currentFontSize);
              
              while (targetDoc.getTextWidth(nameText) > maxNameWidth && currentFontSize > 4.5) {
                  currentFontSize -= 0.5;
                  targetDoc.setFontSize(currentFontSize);
              }
              
              // Se entra in una riga o se abbiamo raggiunto il minimo font
              if (targetDoc.getTextWidth(nameText) <= maxNameWidth) {
                  targetDoc.text(nameText, MARGIN, currentCursorY);
                  targetDoc.setFontSize(F_BODY); // Reset per la quantità (o la lasciamo piccola? meglio reset)
                  targetDoc.text(qtyText, colSplitX - 2, currentCursorY, { align: 'right' });
                  currentCursorY += GAP_B;
              } else {
                  // Fallback: va a capo col font minimo
                  const nameLines = targetDoc.splitTextToSize(nameText, maxNameWidth);
                  targetDoc.text(nameLines, MARGIN, currentCursorY);
                  
                  // La quantità la allineiamo alla prima riga o in basso? 
                  // Alla prima riga è standard.
                  targetDoc.setFontSize(F_BODY); 
                  targetDoc.text(qtyText, colSplitX - 2, currentCursorY, { align: 'right' });
                  
                  currentCursorY += (nameLines.length * GAP_B);
              }
              
              targetDoc.setFontSize(F_BODY);
          }
      });

      // --- AGGIUNTA: Uso e Posologia (Solo Magistrali) ---
      if (!isOfficinale) {
          currentCursorY += (isSmall ? 0.8 : 1.2); // Spazio separatore ridotto
          
          // Font minuscolo per massimizzare spazio sostanze (3pt - 3.5pt)
          const fontSmall = isSmall ? 2.8 : (isMedium ? 3.0 : 3.5);
          const gapSmall = isSmall ? 1.0 : (isMedium ? 1.3 : 1.5);
          const maxTextW = (colSplitX - MARGIN - 2);

          targetDoc.setFontSize(fontSmall);

          if (prep.usage) {
              targetDoc.setFont("helvetica", "bold");
              targetDoc.text(`Uso: ${prep.usage}`, MARGIN, currentCursorY);
              currentCursorY += gapSmall;
          }

          if (prep.posology) {
              targetDoc.setFont("helvetica", "bold");
              const posLabel = "Posologia: ";
              const labelW = targetDoc.getTextWidth(posLabel);
              targetDoc.text(posLabel, MARGIN, currentCursorY);
              
              targetDoc.setFont("helvetica", "normal");
              const splitPos = targetDoc.splitTextToSize(prep.posology, maxTextW - labelW);
              
              // Se la posologia è corta, stampa sulla stessa riga, altrimenti vai a capo ma resta compatto
              if (splitPos.length === 1) {
                  targetDoc.text(prep.posology, MARGIN + labelW, currentCursorY);
                  currentCursorY += gapSmall;
              } else {
                  // Stampa la prima riga accanto all'etichetta
                  targetDoc.text(splitPos[0], MARGIN + labelW, currentCursorY);
                  currentCursorY += gapSmall;
                  // Stampa le righe successive (rientrate o meno? meglio non rientrate per spazio)
                  for (let i = 1; i < splitPos.length; i++) {
                      targetDoc.text(splitPos[i], MARGIN, currentCursorY);
                      currentCursorY += gapSmall;
                  }
              }
          }
      }

      // DX: Costi
      let costY = bodyStartY;
      if (!isOfficinale) {
          if (!isSmall) {
              targetDoc.setFontSize(F_BODY); targetDoc.setFont("helvetica", "bold");
              targetDoc.text("Dettaglio Costi:", colSplitX + 2, costY);
              costY += 3;
              targetDoc.setFontSize(F_COST); targetDoc.setFont("helvetica", "normal");

              let costMatP = 0, costCont = 0;
              prep.ingredients.forEach(ing => { const c = (ing.amountUsed * (ing.costPerGram || 0)); if (ing.isContainer) costCont += c; else costMatP += c; });
              let fee = 0, add = 0, vat = 0, tot = parseFloat(prep.totalPrice || 0);
              if (prep.pricingData) { fee = parseFloat(prep.pricingData.fee || 0); add = parseFloat(prep.pricingData.additional || 0); vat = parseFloat(prep.pricingData.vat || 0); tot = parseFloat(prep.pricingData.final || tot); } 
              else { const net = tot / (1 + VAT_RATE); vat = tot - net; fee = net - (costMatP + costCont); }

              const printL = (l, v, b = false) => {
                  targetDoc.setFont("helvetica", b ? "bold" : "normal");
                  targetDoc.text(l, colSplitX + 2, costY);
                  targetDoc.text(`€ ${v.toFixed(2)}`, CURRENT_LABEL_WIDTH - MARGIN, costY, { align: 'right' });
                  costY += (isMedium ? 2.2 : 2.5);
              };

              printL("Mat. Prime:", costMatP);
              if (costCont > 0) printL("Contenitori:", costCont);
              printL("Onorario Prof.:", fee);
              if (add > 0) printL("Addizionali:", add);
              printL(`IVA (${(VAT_RATE*100).toFixed(0)}%):`, vat);
              costY += 1; targetDoc.setFontSize(F_BODY + 1);
              printL("TOTALE:", tot, true);
          } else {
              let tot = parseFloat(prep.totalPrice || 0);
              costY += 2; targetDoc.setFontSize(F_BODY); targetDoc.text("TOTALE:", colSplitX + 2, costY);
              targetDoc.text(`€ ${tot.toFixed(2)}`, CURRENT_LABEL_WIDTH - MARGIN, costY + 4, { align: 'right' });
              costY += 8;
          }
      } else {
          const priceBoxX = colSplitX + 2;
          const priceBoxW = CURRENT_LABEL_WIDTH - MARGIN - priceBoxX;
          
          if (!isSmall) {
              const priceBoxH = isMedium ? 12 : 14; 
              targetDoc.setDrawColor(200); targetDoc.setFillColor(245, 245, 245);
              targetDoc.roundedRect(priceBoxX, costY, priceBoxW, priceBoxH, 2, 2, 'FD');
              targetDoc.setTextColor(80); targetDoc.setFontSize(isMedium ? 5 : 6); targetDoc.setFont("helvetica", "bold");
              targetDoc.text("PREZZO AL PUBBLICO", priceBoxX + (priceBoxW/2), costY + 3, { align: 'center' });
              targetDoc.setTextColor(0); targetDoc.setFontSize(isMedium ? 12 : 14); targetDoc.setFont("helvetica", "bold");
              targetDoc.text(`€ ${parseFloat(batchData.unitPrice || 0).toFixed(2)}`, priceBoxX + (priceBoxW/2), costY + (isMedium ? 8 : 9), { align: 'center' });
              targetDoc.setFontSize(5); targetDoc.setFont("helvetica", "normal");
              targetDoc.text("(IVA inclusa)", priceBoxX + (priceBoxW/2), costY + (isMedium ? 11 : 12), { align: 'center' });
              costY += priceBoxH + 2;
          } else {
              targetDoc.setFontSize(6); targetDoc.text("Prezzo:", colSplitX + 2, costY);
              targetDoc.setFontSize(10); targetDoc.text(`€ ${parseFloat(batchData.unitPrice || 0).toFixed(2)}`, CURRENT_LABEL_WIDTH - MARGIN, costY + 4, { align: 'right' });
              costY += 6;
          }
      }

      // Linea verticale corretta
      targetDoc.setLineWidth(0.1); targetDoc.setDrawColor(0);
      const endOfContentY = Math.max(currentCursorY, costY) - (isMedium ? 2.5 : 3.5);
      targetDoc.line(colSplitX, bodyStartY - 2, colSplitX, endOfContentY + 1);
      
      currentCursorY = endOfContentY + (isMedium ? 2 : 3);

      // --- 4. FOOTER ---
      targetDoc.line(MARGIN, currentCursorY, CURRENT_LABEL_WIDTH - MARGIN, currentCursorY);
      currentCursorY += (isMedium ? 2 : 3);
      
      let footerBottomLimit = CURRENT_ROLL_HEIGHT - MARGIN;
      const warnWidth = CURRENT_LABEL_WIDTH - (MARGIN*2);
      targetDoc.setFontSize(F_WARN); targetDoc.setFont("helvetica", "italic");
      const allWarns = [...(prep.labelWarnings || [])];
      if (prep.customLabelWarning) allWarns.push(prep.customLabelWarning.trim());
      
      if (allWarns.length > 0) {
          let warnY = currentCursorY;
          const splitWarns = targetDoc.splitTextToSize(allWarns.join(" - "), warnWidth);
          splitWarns.forEach(line => {
              //if (warnY + (isMedium ? 1.5 : 2) > footerBottomLimit) return; // Non tagliare durante il calcolo altezza
              targetDoc.text(line, MARGIN, warnY);
              warnY += (isMedium ? 1.8 : 2.2);
          });
          currentCursorY = warnY;
      }
      
      return currentCursorY; // Ritorna l'altezza finale effettiva
  };

  // Funzione wrapper per centrare
  const processAndDraw = (batch) => {
      // 1. Dry Run per calcolare altezza
      const dryDoc = new jsPDF({ orientation: 'l', unit: 'mm', format: [CURRENT_LABEL_WIDTH, CURRENT_ROLL_HEIGHT] });
      
      // Calcolo altezza reale
      const contentHeight = drawOnDoc(dryDoc, 0, batch);
      
      // Calcolo Offset per centrare verticalmente
      let startOffsetY = (CURRENT_ROLL_HEIGHT - contentHeight) / 2;
      // Se il contenuto è troppo alto, partiamo dall'alto standard (o 0 se negativo)
      // Ma attenzione ai margini originali (3mm). 
      // contentHeight include già i margini (perché cursorY parte da MARGIN).
      // Quindi se contentHeight = 60 e ROLL = 62, offset = 1.
      // Se contentHeight = 40, offset = 11.
      // Però drawOnDoc parte già da MARGIN. Quindi se passo offset, si sommerà a MARGIN.
      // Dobbiamo sottrarre MARGIN dal calcolo dell'altezza pura del contenuto?
      // No, drawOnDoc ritorna la Y finale assoluta.
      // Altezza vuota sotto = ROLL_HEIGHT - finalY.
      // Altezza vuota sopra = MARGIN (implicito).
      // Vogliamo che Altezza Sotto = Altezza Sopra.
      // Attuale Sopra = MARGIN.
      // Nuova Sopra = MARGIN + Offset.
      // Nuova Sotto = ROLL_HEIGHT - (finalY + Offset).
      // MARGIN + Offset = ROLL_HEIGHT - finalY - Offset
      // 2 * Offset = ROLL_HEIGHT - finalY - MARGIN
      // Offset = (ROLL_HEIGHT - finalY - MARGIN) / 2.
      
      if (startOffsetY < 0) startOffsetY = 0; // Nessun offset se non c'è spazio
      // Applico formula corretta:
      startOffsetY = (CURRENT_ROLL_HEIGHT - contentHeight - MARGIN) / 2;
      if (startOffsetY < 0) startOffsetY = 0;

      // 2. Stampa Reale
      drawOnDoc(doc, startOffsetY, batch);
  };

  // Esecuzione
  if (prep.prepType === 'officinale' && prep.batches && prep.batches.length > 0) {
      prep.batches.forEach((batch, index) => {
          if (index > 0) doc.addPage();
          processAndDraw(batch);
      });
  } else {
      processAndDraw(null);
  }

  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};