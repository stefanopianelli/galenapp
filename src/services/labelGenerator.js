import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { VAT_RATE } from '../constants/tariffs'; 
import { formatDate } from '../utils/dateUtils';

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

// Helper per generare Barcode (MINSAN)
const getBarcodeDataUrl = (text) => {
    if (!text) return null;
    try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, text, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 18,
            margin: 10
        });
        return canvas.toDataURL("image/png");
    } catch (e) {
        console.error("Barcode Error", e);
        return null;
    }
};

// --- HELPER FUNZIONI DI DISEGNO ---

const drawHeader = (doc, settings, prep, layout, startY, qrDataUrl) => {
    const { pharmacyName, pharmacyInfo } = settings;
    const { width, isSmall, isMedium, qrSize, fonts, gaps } = layout;
    let cursorY = startY;

    // QR Code
    if (qrDataUrl && !isSmall) {
        // Correzione allineamento: sposto in alto rispetto alla base del testo
        doc.addImage(qrDataUrl, 'PNG', width - MARGIN - qrSize, startY - (isMedium ? 1.5 : 2), qrSize, qrSize);
    }

    // Farmacia
    doc.setFontSize(fonts.h1); doc.setFont("helvetica", "bold");
    doc.text(pharmacyName, MARGIN, cursorY);
    
    if (!isSmall) {
        doc.setFontSize(5); doc.setFont("helvetica", "normal");
        const headerLeftW = isSmall ? 70 : 50;
        const splitInfo = doc.splitTextToSize(pharmacyInfo, headerLeftW);
        doc.text(splitInfo, MARGIN, cursorY + 2.5);
    }

    // DX: N.P. & Data
    const rightAlignX = width - MARGIN - (isSmall ? 0 : (qrSize + 2));
    doc.setFontSize(fonts.h2); doc.setFont("helvetica", "bold");
    doc.text(`N.P.: ${prep.prepNumber}`, rightAlignX, cursorY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${formatDate(prep.date)}`, rightAlignX, cursorY + gaps.h, { align: 'right' });
    doc.setFont("helvetica", "bold");
    doc.text(`Scad: ${formatDate(prep.expiryDate)}`, rightAlignX, cursorY + (gaps.h * 2), { align: 'right' });

    // Sotto Farmacia (Paziente/Medico o Lotto)
    let pzDocY = cursorY + (isSmall ? 4 : 9); 
    if (layout.isOfficinale) {
        doc.setFontSize(isSmall ? 6 : 7); doc.setFont("helvetica", "bold");
        const batchData = layout.batchData;
        const container = prep.ingredients.find(i => String(i.id) === String(batchData.containerId));
        const containerName = container ? container.name : "Conf.";
        const lotText = `Lotto: ${batchData.productQuantity} ${prep.prepUnit}` + (isSmall ? '' : ` in ${containerName}`);
        doc.text(lotText, MARGIN, pzDocY);
        pzDocY += (isMedium ? 2 : 2.5);
    } else {
        doc.setFontSize(isSmall ? 5 : 6); doc.setFont("helvetica", "normal");
        if (prep.patient) { doc.text(`Pz: ${prep.patient}`, MARGIN, pzDocY); pzDocY += (isSmall ? 2 : 2.5); }
        if (prep.doctor) { doc.text(`Dr: ${prep.doctor}`, MARGIN, pzDocY); pzDocY += 1; }
    }

    // Divider
    let dividerY = Math.max(pzDocY + 0.5, cursorY + (gaps.h * 3)); 
    doc.setLineWidth(0.1); doc.setDrawColor(0);
    doc.line(MARGIN, dividerY, width - MARGIN, dividerY);
    
    return dividerY + (isSmall ? 2 : (isMedium ? 3.5 : 4)) * layout.scale; 
};

const drawTitle = (doc, prep, layout, startY) => {
    doc.setFontSize(layout.fonts.title); doc.setFont("helvetica", "bold");
    const splitName = doc.splitTextToSize(prep.name, layout.width - (MARGIN * 2));
    doc.text(splitName, layout.width / 2, startY, { align: "center" });
    return startY + (splitName.length * (layout.isOfficinale ? (layout.isSmall ? 3.5 : 5) : (layout.isSmall ? 3 : 4)) * layout.scale) + 1;
};

const drawComposition = (doc, prep, layout, startY) => {
    const { width, isSmall, isMedium, fonts, gaps, scale } = layout;
    let cursorY = startY;
    const colSplitX = layout.isOfficinale ? (width * 0.65) : (width / 2);

    const DIVIDED_FORMS = ['Capsule', 'Cartine e cialdini', 'Compresse e gomme da masticare medicate', 'Suppositori e ovuli', 'Pillole, pastiglie e granulati (a unità)', 'Preparazioni semisolide orali vet (a unità)', 'Colliri sterili (soluzioni)', 'Prep. oftalmiche sterili semisolide'];
    const isDivided = DIVIDED_FORMS.includes(prep.pharmaceuticalForm);
    
    let unitCount;
    if (['Colliri sterili (soluzioni)', 'Prep. oftalmiche sterili semisolide'].includes(prep.pharmaceuticalForm)) {
        // Per oftalmici, l'unità è il recipiente standard da 10ml/g
        unitCount = Math.ceil(parseFloat(prep.quantity) / 10);
    } else {
        unitCount = layout.isOfficinale ? parseFloat(layout.batchData.productQuantity) : parseFloat(prep.quantity);
    }

    let compLabel = "Composizione:";
    if (isDivided) {
        if (prep.pharmaceuticalForm === 'Colliri sterili (soluzioni)') {
            compLabel = "Composizione (per flacone da 10ml):";
        } else if (prep.pharmaceuticalForm === 'Prep. oftalmiche sterili semisolide') {
            compLabel = "Composizione (per flacone da 10g):";
        } else {
            compLabel = `Composizione (per unità di cui ${unitCount}):`;
        }
    }
    
    doc.setFontSize(Math.max(4, (isSmall ? 5 : 7) * scale));
    doc.setFont("helvetica", "bold");
    doc.text(compLabel, MARGIN, cursorY);
    cursorY += (isSmall ? 2.5 : 3.5) * scale;

    const ratio = layout.ratio;

    // Aggregazione Sostanze per Nome
    const aggregatedIngredients = [];
    const aggMap = new Map();

    prep.ingredients.forEach(ing => {
        if (ing.isContainer) return; // Ignora contenitori per la lista composizione

        if (!aggMap.has(ing.name)) {
            aggMap.set(ing.name, {
                ...ing,
                amountUsed: parseFloat(ing.amountUsed || 0)
            });
            aggregatedIngredients.push(aggMap.get(ing.name));
        } else {
            const existing = aggMap.get(ing.name);
            existing.amountUsed += parseFloat(ing.amountUsed || 0);
        }
    });

    aggregatedIngredients.forEach(ing => {
        if (!ing.isContainer) {
            const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
            doc.setFont("helvetica", isExcipient ? "italic" : "bold");
            const nameText = isExcipient ? `${ing.name} (ecc.)` : ing.name;
            
            let finalQty = ing.amountUsed * ratio;
            let finalUnit = ing.unit;

            if (isDivided && unitCount > 0) {
                finalQty = (ing.amountUsed * ratio) / unitCount;
            }

            if (finalUnit === 'g') {
                if (finalQty < 0.0001) { finalQty *= 1000000; finalUnit = 'mcg'; } 
                else if (finalQty < 1) { finalQty *= 1000; finalUnit = 'mg'; }
            }
            
            const displayUnit = ing.unitUsed || finalUnit;
            const qtyText = `${parseFloat(Number(finalQty).toFixed(3))}${displayUnit}`;
            const maxNameWidth = (colSplitX - MARGIN - 2) - (isSmall ? 8 : 12);
            
            let currentFontSize = fonts.body;
            doc.setFontSize(currentFontSize);
            
            while (doc.getTextWidth(nameText) > maxNameWidth && currentFontSize > 3.5) {
                currentFontSize -= 0.5;
                doc.setFontSize(currentFontSize);
            }
            
            if (doc.getTextWidth(nameText) <= maxNameWidth) {
                doc.text(nameText, MARGIN, cursorY);
                doc.setFontSize(fonts.body); 
                doc.text(qtyText, colSplitX - 2, cursorY, { align: 'right' });
                cursorY += gaps.body;
            } else {
                const nameLines = doc.splitTextToSize(nameText, maxNameWidth);
                doc.text(nameLines, MARGIN, cursorY);
                doc.setFontSize(fonts.body); 
                doc.text(qtyText, colSplitX - 2, cursorY, { align: 'right' });
                cursorY += (nameLines.length * gaps.body);
            }
            doc.setFontSize(fonts.body);
        }
    });

    // Uso e Posologia
    cursorY += (isSmall ? 0.8 : 1.2) * scale; 
    
    // Font leggermente aumentato per leggibilità, ma sempre scalabile
    const baseSmallFont = isSmall ? 3.2 : (isMedium ? 3.8 : 4.5);
    const fontSmall = Math.max(2.8, baseSmallFont * scale); // Minimo di sicurezza alzato a 2.8
    const gapSmall = (isSmall ? 1.2 : (isMedium ? 1.5 : 1.8)) * scale;
    const maxTextW = (colSplitX - MARGIN - 2);

    doc.setFontSize(fontSmall);

    if (prep.usage) {
        doc.setFont("helvetica", "bold");
        doc.text(`Uso: ${prep.usage}`, MARGIN, cursorY);
        cursorY += gapSmall;
    }

    if (prep.posology) {
        doc.setFont("helvetica", "bold");
        const posLabel = "Posologia: ";
        const labelW = doc.getTextWidth(posLabel);
        doc.text(posLabel, MARGIN, cursorY);
        
        doc.setFont("helvetica", "normal");
        const splitPos = doc.splitTextToSize(prep.posology, maxTextW - labelW);
        
        if (splitPos.length === 1) {
            doc.text(prep.posology, MARGIN + labelW, cursorY);
            cursorY += gapSmall;
        } else {
            doc.text(splitPos[0], MARGIN + labelW, cursorY);
            cursorY += gapSmall;
            for (let i = 1; i < splitPos.length; i++) {
                doc.text(splitPos[i], MARGIN, cursorY);
                cursorY += gapSmall;
            }
        }
    }

    return cursorY;
};

const drawCosts = (doc, prep, layout, startY, bodyStartY, barcodeDataUrl) => {
    const { width, isSmall, isMedium, fonts, scale } = layout;
    let cursorY = startY; 
    
    let costY = bodyStartY; 
    const colSplitX = layout.isOfficinale ? (width * 0.65) : (width / 2);

    // Calcolo divisore per costi unitari (solo oftalmici)
    let costDivisor = 1;
    if (['Colliri sterili (soluzioni)', 'Prep. oftalmiche sterili semisolide'].includes(prep.pharmaceuticalForm)) {
        costDivisor = Math.ceil(parseFloat(prep.quantity) / 10) || 1;
    }

    if (!layout.isOfficinale) {
        if (!isSmall) {
            doc.setFontSize(fonts.body); doc.setFont("helvetica", "bold");
            doc.text(costDivisor > 1 ? "Dettaglio Costi (Unitario):" : "Dettaglio Costi:", colSplitX + 2, costY);
            costY += (3 * scale);
            doc.setFontSize(fonts.cost); doc.setFont("helvetica", "normal");

            let costMatP = 0, costCont = 0;
            prep.ingredients.forEach(ing => { const c = (ing.amountUsed * (ing.costPerGram || 0)); if (ing.isContainer) costCont += c; else costMatP += c; });
            let fee = 0, add = 0, vat = 0, tot = parseFloat(prep.totalPrice || 0);
            if (prep.pricingData) { fee = parseFloat(prep.pricingData.fee || 0); add = parseFloat(prep.pricingData.additional || 0); vat = parseFloat(prep.pricingData.vat || 0); tot = parseFloat(prep.pricingData.final || tot); } 
            else { const net = tot / (1 + VAT_RATE); vat = tot - net; fee = net - (costMatP + costCont); }

            // Applico divisione per visualizzare costo singolo flacone
            costMatP /= costDivisor;
            costCont /= costDivisor;
            fee /= costDivisor;
            add /= costDivisor;
            vat /= costDivisor;
            tot /= costDivisor;

            const printL = (l, v, b = false) => {
                doc.setFont("helvetica", b ? "bold" : "normal");
                doc.text(l, colSplitX + 2, costY);
                doc.text(`€ ${v.toFixed(2)}`, width - MARGIN, costY, { align: 'right' });
                costY += ((isMedium ? 2.2 : 2.5) * scale);
            };

            printL("Mat. Prime:", costMatP);
            if (costCont > 0) printL("Contenitori:", costCont);
            printL("Onorario Prof.:", fee);
            if (add > 0) printL("Addizionali:", add);
            printL(`IVA (${(VAT_RATE*100).toFixed(0)}%):`, vat);
            costY += (1 * scale); doc.setFontSize(fonts.body + 1);
            printL("TOTALE:", tot, true);
        } else {
            let tot = parseFloat(prep.totalPrice || 0) / costDivisor;
            costY += 2 * scale; doc.setFontSize(fonts.body); doc.text("TOTALE:", colSplitX + 2, costY);
            doc.text(`€ ${tot.toFixed(2)}`, width - MARGIN, costY + 4 * scale, { align: 'right' });
            costY += 8 * scale;
        }
    } else {
        const priceBoxX = colSplitX + 2;
        const priceBoxW = width - MARGIN - priceBoxX;
        const batchData = layout.batchData;
        
        if (!isSmall) {
            const priceBoxH = (isMedium ? 12 : 14) * Math.max(0.8, scale); 
            doc.setDrawColor(200); doc.setFillColor(245, 245, 245);
            doc.roundedRect(priceBoxX, costY, priceBoxW, priceBoxH, 2, 2, 'FD');
            doc.setTextColor(80); doc.setFontSize(isMedium ? 5 : 6); doc.setFont("helvetica", "bold");
            doc.text("PREZZO AL PUBBLICO", priceBoxX + (priceBoxW/2), costY + 3 * scale, { align: 'center' });
            doc.setTextColor(0); doc.setFontSize(isMedium ? 12 : 14); doc.setFont("helvetica", "bold");
            doc.text(`€ ${parseFloat(batchData.unitPrice || 0).toFixed(2)}`, priceBoxX + (priceBoxW/2), costY + (isMedium ? 8 : 9) * scale, { align: 'center' });
            doc.setFontSize(5); doc.setFont("helvetica", "normal");
            doc.text("(IVA inclusa)", priceBoxX + (priceBoxW/2), costY + (isMedium ? 11 : 12) * scale, { align: 'center' });
            costY += priceBoxH + (isMedium ? 1 : 2);

            // DISEGNO BARCODE (Se presente)
            if (barcodeDataUrl) {
                const bcW = priceBoxW * 0.9;
                const bcH = isMedium ? 6 : 8;
                doc.addImage(barcodeDataUrl, 'PNG', priceBoxX + (priceBoxW - bcW)/2, costY, bcW, bcH);
                costY += bcH + 1;
            }
        } else {
            doc.setFontSize(6); doc.text("Prezzo:", colSplitX + 2, costY);
            doc.setFontSize(10); doc.text(`€ ${parseFloat(batchData.unitPrice || 0).toFixed(2)}`, width - MARGIN, costY + 4, { align: 'right' });
            costY += 6;
            
            if (barcodeDataUrl) {
                const bcW = priceBoxW;
                const bcH = 5;
                doc.addImage(barcodeDataUrl, 'PNG', priceBoxX, costY, bcW, bcH);
                costY += bcH + 1;
            }
        }
    }

    // Linea verticale
    doc.setLineWidth(0.1); doc.setDrawColor(0);
    const endOfContentY = Math.max(startY, costY) - ((isMedium ? 2.5 : 3.5) * scale);
    doc.line(colSplitX, bodyStartY - 2, colSplitX, endOfContentY + 1);
    
    return endOfContentY + ((isMedium ? 2 : 3) * scale);
};

const drawFooter = (doc, prep, layout, startY) => {
    const { width, isMedium, fonts, scale } = layout;
    let cursorY = startY;

    doc.line(MARGIN, cursorY, width - MARGIN, cursorY);
    cursorY += ((isMedium ? 2 : 3) * scale);
    
    const warnWidth = width - (MARGIN*2);
    doc.setFontSize(fonts.warn); doc.setFont("helvetica", "italic");
    const allWarns = [...(prep.labelWarnings || [])];
    if (prep.customLabelWarning) allWarns.push(prep.customLabelWarning.trim());
    
    if (allWarns.length > 0) {
        let warnY = cursorY;
        const splitWarns = doc.splitTextToSize(allWarns.join(" - "), warnWidth);
        splitWarns.forEach(line => {
            doc.text(line, MARGIN, warnY);
            warnY += ((isMedium ? 1.8 : 2.2) * scale);
        });
        cursorY = warnY;
    }
    return cursorY;
};

// --- MAIN GENERATOR ---

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

  let qrDataUrl = null;
  const qrSize = isSmall ? 0 : (isMedium ? 8 : 9); 
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
  } catch (e) { console.error("QR Error", e); }

  // Orchestratore del disegno
  const drawOnDoc = (targetDoc, startOffsetY, batchData, contentScale = 1.0) => {
      const isOfficinale = !!batchData;
      let ratio = 1;
      if (isOfficinale && prep.quantity > 0) {
          ratio = parseFloat(batchData.productQuantity) / parseFloat(prep.quantity);
      }

      // Preparo l'oggetto Layout
      const layout = {
          width: CURRENT_LABEL_WIDTH,
          height: CURRENT_ROLL_HEIGHT,
          isSmall, isMedium, isOfficinale,
          qrSize,
          scale: contentScale,
          ratio,
          batchData,
          fonts: {
              h1: isSmall ? 8 : (isMedium ? 9 : 10),
              h2: isSmall ? 6 : (isMedium ? 6 : 7),
              title: (isSmall ? 8 : (isMedium ? 10 : (isOfficinale ? 12 : 10))) * Math.max(0.9, contentScale),
              body: Math.max(3.5, (isSmall ? 5 : (isMedium ? 6 : 7)) * contentScale),
              cost: Math.max(3.5, (isSmall ? 5 : (isMedium ? 5 : 6)) * contentScale),
              warn: Math.max(3.0, (isSmall ? 4 : (isMedium ? 4.5 : 5)) * contentScale)
          },
          gaps: {
              h: (isSmall ? 2.5 : (isMedium ? 3 : 3.5)) * contentScale,
              body: (isSmall ? 2.2 : (isMedium ? 2.8 : 3.5)) * contentScale
          }
      };

      const settings = { pharmacyName, pharmacyInfo };

      // Generazione Barcode per il batch corrente (se officinale)
      const barcodeDataUrl = (isOfficinale && batchData?.minsan) ? getBarcodeDataUrl(batchData.minsan) : null;

      // 1. Header
      let currentY = drawHeader(targetDoc, settings, prep, layout, MARGIN + (isSmall ? 1 : 3) + startOffsetY, qrDataUrl);
      
      // 2. Title
      const bodyStartY = drawTitle(targetDoc, prep, layout, currentY);
      
      // 3. Composition (Left Column) -> Ritorna Y finale sinistra
      const compEndY = drawComposition(targetDoc, prep, layout, bodyStartY);
      
      // 4. Costs (Right Column) & Divider -> Ritorna Y finale massima tra le due
      currentY = drawCosts(targetDoc, prep, layout, compEndY, bodyStartY, barcodeDataUrl);
      
      // 5. Footer
      currentY = drawFooter(targetDoc, prep, layout, currentY);

      return currentY;
  };

  // Funzione wrapper per centrare e scalare
  const processAndDraw = (batch) => {
      let scale = 1.0;
      let finalHeight = 0;
      const maxAvailableHeight = CURRENT_ROLL_HEIGHT - MARGIN;

      // 1. Dry Run Iterativo
      for (let i = 0; i < 6; i++) {
          const dryDoc = new jsPDF({ orientation: 'l', unit: 'mm', format: [CURRENT_LABEL_WIDTH, CURRENT_ROLL_HEIGHT] });
          finalHeight = drawOnDoc(dryDoc, 0, batch, scale);
          if (finalHeight <= maxAvailableHeight) break;
          scale -= 0.07;
      }
      if (scale < 0.6) scale = 0.6;

      // 2. Calcolo Offset
      let startOffsetY = (CURRENT_ROLL_HEIGHT - finalHeight - MARGIN) / 2;
      if (startOffsetY < 0) startOffsetY = 0;

      // 3. Stampa Reale
      drawOnDoc(doc, startOffsetY, batch, scale);
  };

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