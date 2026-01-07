import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Dimensioni Etichetta (Brother QL-800 - Rotolo 62mm)
const LABEL_WIDTH = 62;
const LABEL_HEIGHT = 90; // Altezza stimata, la taglierina la taglierà qui
const MARGIN = 3;

export const generateLabelPDF = async (prep, pharmacySettings) => {
  // Orientamento Portrait, unità mm, dimensioni custom [62, 90]
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [LABEL_WIDTH, LABEL_HEIGHT]
  });

  const pharmacyName = pharmacySettings.name || "Farmacia Galenica";
  const pharmacyPhone = pharmacySettings.phone ? `Tel: ${pharmacySettings.phone}` : "";
  
  let cursorY = MARGIN + 4;

  // --- INTESTAZIONE FARMACIA ---
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(pharmacyName, LABEL_WIDTH / 2, cursorY, { align: "center" });
  
  cursorY += 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(pharmacyPhone, LABEL_WIDTH / 2, cursorY, { align: "center" });

  cursorY += 2;
  doc.setLineWidth(0.3);
  doc.line(MARGIN, cursorY, LABEL_WIDTH - MARGIN, cursorY);
  
  cursorY += 4;

  // --- INFO PREPARAZIONE ---
  // N.P. e Data
  doc.setFontSize(7);
  doc.text(`N.P.: ${prep.prepNumber}`, MARGIN, cursorY);
  doc.text(new Date(prep.date).toLocaleDateString('it-IT'), LABEL_WIDTH - MARGIN, cursorY, { align: "right" });
  
  cursorY += 4;

  // Paziente (se esiste)
  if (prep.patient) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`Paziente: ${prep.patient}`, MARGIN, cursorY);
    cursorY += 4;
  }

  // Medico (se esiste)
  if (prep.doctor) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Dr. ${prep.doctor}`, MARGIN, cursorY);
    cursorY += 5;
  }

  // --- NOME PREPARAZIONE (Grande) ---
  cursorY += 2;
  doc.setFontSize(10); // Più grande possibile
  doc.setFont("helvetica", "bold");
  
  // Gestione testo lungo per il nome
  const splitName = doc.splitTextToSize(prep.name, LABEL_WIDTH - (MARGIN * 2));
  doc.text(splitName, LABEL_WIDTH / 2, cursorY, { align: "center" });
  cursorY += (splitName.length * 4) + 2;

  // --- POSOLOGIA / USO ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const splitPosology = doc.splitTextToSize(prep.posology || "Uso secondo prescrizione medica", LABEL_WIDTH - (MARGIN * 2));
  doc.text(splitPosology, MARGIN, cursorY);
  cursorY += (splitPosology.length * 3) + 2;

  // --- SCADENZA (Importante) ---
  // Disegniamo un box per la scadenza
  cursorY += 2;
  doc.setFillColor(240, 240, 240); // Grigio chiaro
  doc.rect(MARGIN, cursorY - 4, LABEL_WIDTH - (MARGIN * 2), 6, 'F');
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`SCADENZA: ${new Date(prep.expiryDate).toLocaleDateString('it-IT')}`, LABEL_WIDTH / 2, cursorY, { align: "center" });
  cursorY += 6;

  // --- QR CODE (Piccolo in basso a destra) ---
  // Lo mettiamo in basso a destra prima del footer
  try {
      const qrData = JSON.stringify({ type: 'prep', id: prep.id });
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 0 });
      // 12x12mm QR code
      doc.addImage(qrDataUrl, 'PNG', LABEL_WIDTH - MARGIN - 12, LABEL_HEIGHT - MARGIN - 14, 12, 12);
  } catch (e) {
      console.error("QR Error", e);
  }

  // --- FOOTER (Avvertenze) ---
  // Posizionamento assoluto in fondo
  const footerY = LABEL_HEIGHT - MARGIN - 2;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Tenere fuori dalla portata dei bambini.", MARGIN, footerY);
  doc.text("Conservare al riparo da fonti di calore.", MARGIN, footerY - 3);

  // Apertura PDF
  // Per stampanti termiche, spesso è meglio aprire in una nuova finestra ("bloburl") 
  // così l'utente può selezionare la stampante dal browser.
  const pdfBlob = doc.output('bloburl');
  window.open(pdfBlob, '_blank');
};
