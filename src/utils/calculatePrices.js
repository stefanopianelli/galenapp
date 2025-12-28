import { NATIONAL_TARIFF_FEES, VAT_RATE } from '../constants/tariffs';

export const calculatePreparationPricing = (details, selectedIngredients, extraTechOps, inventory, pharmacySettings, batches = []) => {
  const qty = parseFloat(details.quantity) || 0;
  const form = details.pharmaceuticalForm;
  const isOfficinale = details.prepType === 'officinale';

  // --- Calculate Professional Fee ---
  let professionalFee = 0;
  if (form === 'Capsule' || form === 'Cartine') {
    const BASE_QTY = 120;
    professionalFee = 22.00;
    if (qty > BASE_QTY) professionalFee += (Math.ceil((qty - BASE_QTY) / 10) * 2.00);
    else if (qty < BASE_QTY && qty > 0) professionalFee -= (Math.ceil((BASE_QTY - qty) / 10) * 1.00);
    
    const activeSubstancesCount = selectedIngredients.filter(i => !i.isExcipient && !i.isContainer).length;
    const extraComponents = Math.max(0, activeSubstancesCount - 1);
    
    professionalFee += (Math.min(extraComponents, 4) * 0.60);
    professionalFee += (extraTechOps * 2.30);
    professionalFee *= 1.40;
  } else {
    professionalFee = NATIONAL_TARIFF_FEES[form] || 8.00;
    professionalFee += (extraTechOps * 2.30);
  }

  // --- Calculate Additional Fee ---
  let additional = 0;
  const hasHazardousSubstance = selectedIngredients.some(ing => 
      (ing.securityData?.pictograms?.length > 0) || ing.isDoping || ing.isNarcotic
  );
  if (hasHazardousSubstance) {
      additional = 2.50;
  }

  // --- Calculate Substances Cost ---
  const substancesCost = selectedIngredients.reduce((acc, ing) => acc + (ing.costPerGram ? ing.costPerGram * ing.amountUsed : 0), 0);
  
  // --- Final Totals ---
  const net = substancesCost + professionalFee + additional;
  const vat = net * VAT_RATE;
  const final = net + vat;

  return {
    substances: substancesCost,
    fee: professionalFee,
    additional: additional,
    net: net,
    vat: vat,
    final: final
  };
};

export const getPreparationUnit = (form) => {
  if (['Crema', 'Gel', 'Unguento', 'Pasta', 'Polvere'].includes(form)) return 'g';
  if (['Lozione', 'Sciroppo', 'Soluzione Cutanea', 'Soluzione Orale'].includes(form)) return 'ml';
  if (['Capsule', 'Supposte', 'Ovuli', 'Cartine'].includes(form)) return 'n.'; 
  return '-';
};
