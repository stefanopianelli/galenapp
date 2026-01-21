import { NATIONAL_TARIFF_FEES } from '../constants/tariffs';

export const calculateComplexFee = (details, selectedIngredients) => {
    let fee = 0;
    const form = details.pharmaceuticalForm;
    const qty = parseFloat(details.quantity) || 0;
    const activeSubstancesCount = selectedIngredients.filter(i => !i.isExcipient && !i.isContainer).length;
    const techOpsCount = (details.techOps || []).length;

    // Variabili Breakdown
    let extraOpsCount = 0;
    let extraCompCount = 0;
    let extraOpsFee = 0;
    let extraCompFee = 0;
    let qtyFee = 0;

    if (form === 'Capsule') {
        const BASE_QTY = 120;
        fee = 22.00;
        if (qty > BASE_QTY) {
            qtyFee = (Math.ceil((qty - BASE_QTY) / 10) * 2.00);
            fee += qtyFee;
        } else if (qty < BASE_QTY && qty > 0) {
            qtyFee = -(Math.ceil((BASE_QTY - qty) / 10) * 1.00);
            fee += qtyFee;
        }
        
        extraCompCount = Math.min(Math.max(0, activeSubstancesCount - 1), 4);
        extraCompFee = extraCompCount * 0.60;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 3);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Cartine e cialdini') {
        const BASE_QTY = 10;
        fee = 11.00;
        if (qty > BASE_QTY) {
            qtyFee = ((qty - BASE_QTY) * 0.25);
            fee += qtyFee;
        } else if (qty < BASE_QTY && qty > 0) {
            qtyFee = -((BASE_QTY - qty) * 0.35);
            fee += qtyFee;
        }
        
        extraCompCount = Math.min(Math.max(0, activeSubstancesCount - 1), 4);
        extraCompFee = extraCompCount * 0.60;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 3);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Suppositori e ovuli') {
        const BASE_QTY = 6;
        fee = 13.30;
        if (qty > BASE_QTY) {
            qtyFee = ((qty - BASE_QTY) * 0.60);
            fee += qtyFee;
        } else if (qty < BASE_QTY && qty > 0) {
            qtyFee = -((BASE_QTY - qty) * 1.10);
            fee += qtyFee;
        }

        extraCompCount = Math.max(0, activeSubstancesCount - 3);
        extraCompFee = extraCompCount * 0.60;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 4);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Preparazioni liquide (soluzioni)') {
        fee = 6.65;
        extraCompCount = Math.max(0, activeSubstancesCount - 2);
        extraCompFee = extraCompCount * 0.80;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 2);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Estratti liquidi e tinture') {
        fee = 8.00;
        extraCompCount = Math.max(0, activeSubstancesCount - 2);
        extraCompFee = extraCompCount * 0.80;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 2);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Emulsioni, sospensioni e miscele di olii') {
        fee = 13.30;
        const BASE_QTY = 250;
        if (qty > BASE_QTY) {
            qtyFee = (Math.ceil((qty - BASE_QTY) / 100) * 0.70);
            fee += qtyFee;
        }
        
        extraCompCount = Math.max(0, activeSubstancesCount - 2);
        extraCompFee = extraCompCount * 0.70;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 2);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Preparazioni semisolide per applicazione cutanea e paste') {
        fee = 13.30;
        const BASE_QTY = 50;
        if (qty > BASE_QTY) {
            qtyFee = (Math.ceil((qty - BASE_QTY) / 50) * 0.75);
            fee += qtyFee;
        }

        extraCompCount = Math.max(0, activeSubstancesCount - 2);
        extraCompFee = extraCompCount * 0.75;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 2);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Compresse e gomme da masticare medicate') {
        const BASE_QTY = 100;
        fee = 33.25;
        if (qty > BASE_QTY) {
            qtyFee = (Math.ceil((qty - BASE_QTY) / 10) * 3.00);
            fee += qtyFee;
        } else if (qty < BASE_QTY && qty > 0) {
            qtyFee = -(Math.ceil((BASE_QTY - qty) / 10) * 2.00);
            fee += qtyFee;
        }
        
        // Componenti extra (4 inclusi) - costo 0? Mantengo logica esistente
        extraCompCount = Math.max(0, activeSubstancesCount - 4);
        extraCompFee = 0;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 3);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form.includes('Colliri sterili') || form.includes('Prep. oftalmiche sterili')) {
        const numRecipients = Math.ceil(qty / 10);
        const baseFeePerRecipient = 31.65;
        
        const countExtra = Math.max(0, activeSubstancesCount - 2);
        const feePerComp = countExtra * 5.00;

        const countOps = Math.max(0, techOpsCount - 4); // 4 incluse
        const feePerOp = countOps * 10.00;

        fee = numRecipients * (baseFeePerRecipient + feePerComp + feePerOp);
        
        extraCompCount = countExtra; // x N recipients? Visualmente meglio mostrare unitario o totale? Mostriamo conteggio base.
        extraCompFee = feePerComp * numRecipients; // Costo totale visualizzato
        extraOpsCount = countOps;
        extraOpsFee = feePerOp * numRecipients;

    } else if (form.includes('Preparazioni semisolide orali vet')) {
        fee = 13.30;
        const isWeight = form.includes('(a peso)');
        const BASE_QTY = isWeight ? 50 : 5;
        const STEP_OVER = isWeight ? 10 : 1;
        const STEP_UNDER = isWeight ? 5 : 1;

        if (qty > BASE_QTY) {
            qtyFee = (Math.ceil((qty - BASE_QTY) / STEP_OVER) * 0.30);
            fee += qtyFee;
        } else if (qty < BASE_QTY && qty > 0) {
            qtyFee = -(Math.ceil((BASE_QTY - qty) / STEP_UNDER) * 0.80);
            fee += qtyFee;
        }

        extraCompCount = Math.max(0, activeSubstancesCount - 2);
        extraCompFee = extraCompCount * 0.60;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 3);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form.includes('Pillole, pastiglie e granulati')) {
        fee = 19.95;
        const isWeight = form.includes('(a peso)');
        const BASE_QTY = isWeight ? 100 : 20;
        const STEP_OVER = isWeight ? 50 : 1;
        const STEP_UNDER = isWeight ? 50 : 10;

        if (qty > BASE_QTY) {
            qtyFee = (Math.ceil((qty - BASE_QTY) / STEP_OVER) * 0.15);
            fee += qtyFee;
        } else if (qty < BASE_QTY && qty > 0) {
            qtyFee = -(Math.ceil((BASE_QTY - qty) / STEP_UNDER) * 0.30);
            fee += qtyFee;
        }

        extraCompCount = Math.max(0, activeSubstancesCount - 1);
        extraCompFee = extraCompCount * 0.60;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 4);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else if (form === 'Polveri composte e piante per tisane') {
        fee = 6.65;
        extraCompCount = Math.max(0, activeSubstancesCount - 2);
        extraCompFee = extraCompCount * 0.75;
        fee += extraCompFee;

        extraOpsCount = Math.max(0, techOpsCount - 2);
        extraOpsFee = extraOpsCount * 2.30;
        fee += extraOpsFee;

    } else {
        // Fallback
        fee = 8.00;
    }

    return {
        fee: fee * 1.40, // Prezzo finale calcolato con onorario
        breakdown: {
            extraOpsCount,
            extraCompCount,
            extraOpsFee,
            extraCompFee,
            qtyFee
        }
    };
};
