// src/components/modals/QRScannerModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Barcode } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  // Gestione Lettore Barcode USB (Emulazione Tastiera)
  useEffect(() => {
      if (!isOpen) return;

      let buffer = '';
      let lastKeyTime = Date.now();

      const handleKeyDown = (e) => {
          const currentTime = Date.now();
          const gap = currentTime - lastKeyTime;
          lastKeyTime = currentTime;

          // Se passa troppo tempo tra un tasto e l'altro (es. digitazione manuale), resetta
          // I lettori barcode sparano i caratteri con gap < 20-30ms
          if (gap > 100) { 
              buffer = ''; 
          }

          if (e.key === 'Enter') {
              if (buffer.length > 5) { // Lunghezza minima per essere un nostro JSON
                  try {
                      // Pulizia buffer da caratteri spuri se necessario
                      const data = JSON.parse(buffer);
                      if (data && data.type === 'prep' && data.id) {
                          onScanSuccess(data.id);
                          onClose();
                      }
                  } catch (err) {
                      // Ignora se non è un JSON valido (potrebbe essere un altro barcode)
                      // Non mostriamo errore per non disturbare
                  }
              }
              buffer = '';
          } else {
              // Accumula solo caratteri stampabili
              if (e.key.length === 1) {
                  buffer += e.key;
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onScanSuccess, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Piccola attesa per assicurare che il DOM sia pronto
    const timer = setTimeout(() => {
        try {
            // Pulisci eventuale istanza precedente
            const element = document.getElementById('reader');
            if (!element) return;
            element.innerHTML = '';

            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render((decodedText) => {
                try {
                    const data = JSON.parse(decodedText);
                    if (data && data.type === 'prep' && data.id) {
                        scanner.clear();
                        onScanSuccess(data.id);
                        onClose();
                    } else {
                        setError("QR Code non valido per GalenicoLab.");
                    }
                } catch (e) {
                    setError("Formato QR non riconosciuto.");
                }
            }, (errorMessage) => {
                // Ignoriamo gli errori di scansione "frame vuoto" che sono normali
            });

            scannerRef.current = scanner;
        } catch (e) {
            console.error("Errore avvio scanner:", e);
            setError("Impossibile avviare la fotocamera.");
        }
    }, 100);

    return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
            try {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            } catch (e) { /* ignore cleanup errors */ }
        }
    };
  }, [isOpen, onScanSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white text-slate-600"
        >
            <X size={24}/>
        </button>
        
        <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
                <Camera className="text-teal-600" /> Scansiona QR Code
            </h3>
            <p className="text-slate-500 text-sm mb-4 flex items-center justify-center gap-2">
                Inquadra con la fotocamera o usa il lettore USB <Barcode size={16} className="text-slate-400"/>
            </p>
            
            {/* Container per lo scanner */}
            <div id="reader" className="w-full h-[300px] bg-slate-100 rounded-lg overflow-hidden border-2 border-dashed border-slate-300"></div>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm font-medium">
                    {error}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
