import { NATIONAL_TARIFF_FEES } from '../constants/tariffs';

export const calculateComplexFee = (details, selectedIngredients) => {
    const qty = parseFloat(details.quantity) || 0;
    const form = details.pharmaceuticalForm;
    const activeSubstancesCount = selectedIngredients.filter(i => !i.isExcipient && !i.isContainer).length;
    const techOpsCount = (details.techOps || []).length;
    let fee = 0;

    if (form === 'Capsule') {
        const BASE_QTY = 120;
        fee = 22.00;
        if (qty > BASE_QTY) fee += (Math.ceil((qty - BASE_QTY) / 10) * 2.00);
        else if (qty < BASE_QTY && qty > 0) fee -= (Math.ceil((BASE_QTY - qty) / 10) * 1.00);
        
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 1);
        fee += Math.min(extraComponentsCount, 4) * 0.60;

        const extraOpsCount = Math.max(0, techOpsCount - 3);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Cartine e cialdini') {
        const BASE_QTY_CARTINE = 10;
        fee = 11.00;
        if (qty > BASE_QTY_CARTINE) fee += ((qty - BASE_QTY_CARTINE) * 0.25);
        else if (qty < BASE_QTY_CARTINE && qty > 0) fee -= ((BASE_QTY_CARTINE - qty) * 0.35);
        
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 1);
        fee += Math.min(extraComponentsCount, 4) * 0.60;

        const extraOpsCount = Math.max(0, techOpsCount - 3);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Suppositori e ovuli') {
        const BASE_QTY_OVULI = 6;
        fee = 13.30;
        if (qty > BASE_QTY_OVULI) fee += ((qty - BASE_QTY_OVULI) * 0.60);
        else if (qty < BASE_QTY_OVULI && qty > 0) fee -= ((BASE_QTY_OVULI - qty) * 1.10);

        const extraComponentsCount = Math.max(0, activeSubstancesCount - 3);
        fee += extraComponentsCount * 0.60;

        const extraOpsCount = Math.max(0, techOpsCount - 4);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Preparazioni liquide (soluzioni)') {
        fee = 6.65;
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
        fee += extraComponentsCount * 0.80;
        const extraOpsCount = Math.max(0, techOpsCount - 2);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Estratti liquidi e tinture') {
        fee = 8.00;
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
        fee += extraComponentsCount * 0.80;
        const extraOpsCount = Math.max(0, techOpsCount - 2);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Emulsioni, sospensioni e miscele di olii') {
        const BASE_QTY = 250;
        fee = 13.30;
        if (qty > BASE_QTY) fee += (Math.ceil((qty - BASE_QTY) / 100) * 0.70);
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
        fee += extraComponentsCount * 0.70;
        const extraOpsCount = Math.max(0, techOpsCount - 2);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Preparazioni semisolide per applicazione cutanea e paste') {
        const BASE_QTY = 50;
        fee = 13.30;
        if (qty > BASE_QTY) fee += (Math.ceil((qty - BASE_QTY) / 50) * 0.75);
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
        fee += extraComponentsCount * 0.75;
        const extraOpsCount = Math.max(0, techOpsCount - 2);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Polveri composte e piante per tisane') {
        fee = 6.65;
        const extraComponentsCount = Math.max(0, activeSubstancesCount - 2);
        fee += extraComponentsCount * 0.75;
        const extraOpsCount = Math.max(0, techOpsCount - 2);
        fee += extraOpsCount * 2.30;
    } else if (form === 'Compresse e gomme da masticare medicate') {
        const BASE_QTY = 100;
        fee = 33.25;
        if (qty > BASE_QTY) fee += (Math.ceil((qty - BASE_QTY) / 10) * 3.00);
        else if (qty < BASE_QTY && qty > 0) fee -= (Math.ceil((BASE_QTY - qty) / 10) * 2.00);
        
        const extraOpsCount = Math.max(0, techOpsCount - 3);
        fee += extraOpsCount * 2.30;
    } else { // Default per altre forme (Tariffa Tabellare)
        fee = NATIONAL_TARIFF_FEES[form] || 8.00;
        const extraOpsCount = techOpsCount;
        fee += extraOpsCount * 2.30;
    }

    // Moltiplicatore finale 1.40 applicato a tutte le forme farmaceutiche
    fee *= 1.40;

    return fee;
};
