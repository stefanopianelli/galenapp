// src/components/modals/QRScannerModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Barcode } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState('');
  const [debugKeys, setDebugKeys] = useState(''); // DEBUG
  const scannerRef = useRef(null);

  const handleDetectedId = (id) => {
      onClose();
      // Ritarda la navigazione per permettere al modale di chiudersi visivamente
      setTimeout(() => onScanSuccess(id), 100);
  };

  // Gestione Lettore Barcode USB (Emulazione Tastiera)
  useEffect(() => {
      if (!isOpen) return;

      let buffer = '';
      let lastKeyTime = Date.now();

      const handleKeyDown = (e) => {
          const currentTime = Date.now();
          const gap = currentTime - lastKeyTime;
          lastKeyTime = currentTime;

          if (gap > 200) { 
              buffer = ''; 
          }

          if (e.key === 'Enter') {
              if (buffer.length > 3) {
                  const cleanBuffer = buffer.trim();
                  
                  // 1. Tentativo Regex Robusto
                  const prepMatch = cleanBuffer.match(/^PREP.?(\d+)$/i);
                  
                  if (prepMatch && prepMatch[1]) {
                      handleDetectedId(prepMatch[1]);
                  } else {
                      // 2. Tentativo JSON (Legacy)
                      try {
                          const data = JSON.parse(cleanBuffer);
                          if (data && data.type === 'prep' && data.id) {
                              handleDetectedId(data.id);
                          }
                      } catch (err) {
                          setError("Formato non riconosciuto: " + cleanBuffer);
                      }
                  }
              }
              buffer = '';
          } else {
              if (e.key.length === 1) {
                  buffer += e.key;
                  setDebugKeys(prev => (prev + e.key).slice(-50));
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onScanSuccess, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
        try {
            const element = document.getElementById('reader');
            if (!element) return;
            element.innerHTML = '';

            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render((decodedText) => {
                // Prova Regex
                const prepMatch = decodedText.match(/^PREP.?(\d+)$/i);
                if (prepMatch && prepMatch[1]) {
                    scanner.clear().then(() => {
                        handleDetectedId(prepMatch[1]);
                    }).catch(e => {
                        handleDetectedId(prepMatch[1]);
                    });
                    return;
                }

                // Prova JSON
                try {
                    const data = JSON.parse(decodedText);
                    if (data && data.type === 'prep' && data.id) {
                        scanner.clear().then(() => {
                            handleDetectedId(data.id);
                        }).catch(e => {
                            handleDetectedId(data.id);
                        });
                    }
                } catch (e) {
                    // Ignora errori durante scansione continua
                }
            }, (errorMessage) => {});

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

            {/* DEBUG AREA */}
            <div className="mt-2 text-xs text-slate-400 font-mono break-all border-t pt-2">
                Input Scanner: {debugKeys || "In attesa..."}
            </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
