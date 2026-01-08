import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Configurazione standard per etichettatrici (es. Brother QL-800, Dymo)
// Larghezza rotolo 62mm (standard comune)
const LABEL_WIDTH = 62;
const MARGIN = 3;

export const generateLabelPDF = async (prep, pharmacySettings) => {
  // 1. Calcolo preventivo dell'altezza necessaria
  // Questo è un calcolo approssimativo per impostare l'altezza del canvas PDF
  let estimatedHeight = 20; // Header Farmacia
  estimatedHeight += 20; // Dati Paziente/Medico/Data
  estimatedHeight += 15; // Nome Preparazione
  
  // Stima Ingredienti
  const ingredients = prep.ingredients || [];
  estimatedHeight += 5 + (ingredients.length * 4); 
  
  // Stima Posologia
  const posologyLength = (prep.posology || "").length;
  estimatedHeight += 5 + (Math.ceil(posologyLength / 35) * 3);
  
  // Stima Avvertenze
  const warnings = prep.labelWarnings || [];
  if (warnings.length > 0) estimatedHeight += (warnings.length * 4) + 5;
  if (prep.customLabelWarning) estimatedHeight += 10;
  
  // Footer e Spazi
  estimatedHeight += 25; 

  // Minimo 60mm, Massimo quello che serve
  const LABEL_HEIGHT = Math.max(60, estimatedHeight);

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [LABEL_WIDTH, LABEL_HEIGHT]
  });

  const pharmacyName = pharmacySettings.name || "Farmacia Galenica";
  const pharmacyAddress = pharmacySettings.address || "";
  const pharmacyPhone = pharmacySettings.phone || "";
  
  let cursorY = MARGIN + 4;

  // --- INTESTAZIONE FARMACIA ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(pharmacyName, LABEL_WIDTH / 2, cursorY, { align: "center" });
  
  cursorY += 3;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  const contactText = [pharmacyAddress, pharmacyPhone].filter(Boolean).join(" - ");
  const splitContact = doc.splitTextToSize(contactText, LABEL_WIDTH - (MARGIN * 2));
  doc.text(splitContact, LABEL_WIDTH / 2, cursorY, { align: "center" });
  cursorY += (splitContact.length * 2.5) + 1;

  doc.setLineWidth(0.2);
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  cursorY += 3;

  // --- INFO PAZIENTE / MEDICO ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  const leftColX = MARGIN;
  const rightColX = LABEL_WIDTH / 2 + 2;

  // Riga 1: N.P. e Data
  doc.setFont("helvetica", "bold");
  doc.text(`N.P.: ${prep.prepNumber}`, leftColX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(prep.date).toLocaleDateString('it-IT'), LABEL_WIDTH - MARGIN, cursorY, { align: "right" });
  cursorY += 3.5;

  // Riga 2: Paziente
  if (prep.patient) {
    doc.text(`Paziente: ${prep.patient}`, leftColX, cursorY);
    cursorY += 3.5;
  }

  // Riga 3: Medico
  if (prep.doctor) {
    doc.text(`Dr. ${prep.doctor}`, leftColX, cursorY);
    cursorY += 3.5;
  }

  cursorY += 1;

  // --- NOME PREPARAZIONE ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const splitName = doc.splitTextToSize(prep.name, LABEL_WIDTH - (MARGIN * 2));
  doc.text(splitName, LABEL_WIDTH / 2, cursorY, { align: "center" });
  cursorY += (splitName.length * 4) + 2;

  // --- COMPOSIZIONE (Quali-Quantitativa) ---
  if (ingredients.length > 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Composizione:", MARGIN, cursorY);
      cursorY += 3;
      
      ingredients.forEach(ing => {
          const isExcipient = ing.isExcipient === true || ing.isExcipient == 1;
          const isContainer = ing.isContainer;
          
          if (!isContainer) {
              doc.setFont("helvetica", isExcipient ? "italic" : "bold");
              const nameText = isExcipient ? `${ing.name} (ecc.)` : ing.name;
              const qtyText = `${Number(ing.amountUsed).toFixed(2)}${ing.unit}`;
              
              // Nome a sinistra, quantità a destra con puntini? No, spazio semplice
              // Calcoliamo lo spazio
              const qtyWidth = doc.getTextWidth(qtyText);
              const maxNameWidth = LABEL_WIDTH - (MARGIN * 2) - qtyWidth - 2;
              
              const nameLines = doc.splitTextToSize(nameText, maxNameWidth);
              doc.text(nameLines, MARGIN, cursorY);
              doc.text(qtyText, LABEL_WIDTH - MARGIN, cursorY, { align: 'right' });
              
              cursorY += (nameLines.length * 3);
          }
      });
      cursorY += 2;
  }

  // --- POSOLOGIA ---
  if (prep.posology) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Uso e Posologia:", MARGIN, cursorY);
      cursorY += 3;
      
      doc.setFont("helvetica", "normal");
      const splitPosology = doc.splitTextToSize(prep.posology, LABEL_WIDTH - (MARGIN * 2));
      doc.text(splitPosology, MARGIN, cursorY);
      cursorY += (splitPosology.length * 3) + 2;
  }

  // --- SCADENZA ---
  cursorY += 1;
  doc.setDrawColor(0);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(MARGIN, cursorY - 3, LABEL_WIDTH - (MARGIN * 2), 6, 1, 1, 'FD');
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`SCADENZA: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, LABEL_WIDTH / 2, cursorY + 1, { align: "center" });
  cursorY += 7;

  // --- AVVERTENZE (Selezionate nel Wizard + Custom) ---
  const labelWarnings = prep.labelWarnings || [];
  if (labelWarnings.length > 0 || (prep.customLabelWarning && prep.customLabelWarning.trim() !== '')) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("Avvertenze:", MARGIN, cursorY);
      cursorY += 3;

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      
      // Stampiamo tutte le avvertenze dei checkbox
      labelWarnings.forEach(w => {
          const splitW = doc.splitTextToSize(`• ${w}`, LABEL_WIDTH - (MARGIN * 2));
          // Se è l'avvertenza doping, la mettiamo in rosso per visibilità? 
          // Per ora seguiamo la richiesta di semplicità, ma manteniamo il grassetto se contiene "Doping"
          if (w.toLowerCase().includes("doping")) {
              doc.setTextColor(200, 0, 0);
              doc.setFont("helvetica", "bolditalic");
          }
          
          doc.text(splitW, MARGIN, cursorY);
          cursorY += (splitW.length * 2.8);
          
          doc.setTextColor(0, 0, 0); // Reset
          doc.setFont("helvetica", "italic");
      });

      // Stampiamo l'avvertenza personalizzata
      if (prep.customLabelWarning && prep.customLabelWarning.trim() !== '') {
          const splitC = doc.splitTextToSize(`• ${prep.customLabelWarning}`, LABEL_WIDTH - (MARGIN * 2));
          doc.text(splitC, MARGIN, cursorY);
          cursorY += (splitC.length * 2.8);
      }
      cursorY += 2;
  }

  // --- PREZZO E FOOTER ---
  // Linea separazione
  doc.setLineWidth(0.1);
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  cursorY += 3;

  // Prezzo (opzionale in etichetta ma utile)
  if (prep.totalPrice) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Prezzo: € ${parseFloat(prep.totalPrice).toFixed(2)}`, MARGIN, cursorY);
  }

  // QR Code (A destra del prezzo)
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
      doc.addImage(qrDataUrl, 'PNG', LABEL_WIDTH - MARGIN - 12, cursorY - 3, 12, 12);
  } catch (e) {
      console.error("QR Error", e);
  }

  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};
