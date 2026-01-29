import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Conferma',
    cancelText: 'Annulla',
    isDangerous: false,
    onConfirm: () => {},
  });

  const confirm = useCallback(({ 
    title = "Conferma Azione", 
    message = "Sei sicuro di voler procedere?", 
    confirmText = "Conferma", 
    cancelText = "Annulla", 
    isDangerous = false, 
    onConfirm 
  }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDangerous,
      onConfirm: () => {
        if (onConfirm) onConfirm();
      }
    });
  }, []);

  const close = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={close}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDangerous={modalState.isDangerous}
      />
    </ConfirmationContext.Provider>
  );
};
