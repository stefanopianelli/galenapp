import React, { useState, useMemo } from 'react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Euro, Package, Calendar, DollarSign } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { VAT_RATE } from '../../constants/tariffs';

const Reporting = ({ preparations, inventory }) => {  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Estrai anni disponibili dai dati
  const availableYears = useMemo(() => {
      const years = new Set([new Date().getFullYear()]);
      preparations.forEach(p => {
          if (p.date) years.add(new Date(p.date).getFullYear());
      });
      return Array.from(years).sort((a, b) => b - a);
  }, [preparations]);
  
  // --- CALCOLI STATISTICI ---
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;
    const monthlyData = {};

    // Inizializza tutti i mesi dell'anno selezionato
    for (let i = 0; i < 12; i++) {
        const d = new Date(selectedYear, i, 1);
        const key = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
        monthlyData[key] = { 
            name: d.toLocaleString('it-IT', { month: 'short' }), 
            revenue: 0, 
            profit: 0, 
            cost: 0,
            count: 0, 
            sortKey: i 
        };
    }

    // Filtra preparazioni per anno
    const filteredPreps = preparations.filter(p => new Date(p.date).getFullYear() === parseInt(selectedYear));

    filteredPreps.forEach(prep => {
      let grossRevenue = parseFloat(prep.totalPrice || 0);

      // Per Officinali: Ricalcolo il valore della produzione dai lotti (più affidabile)
      if (prep.prepType === 'officinale' && prep.batches && Array.isArray(prep.batches)) {
          grossRevenue = prep.batches.reduce((acc, batch) => {
              // Trova il contenitore associato per sapere quanti pezzi sono stati prodotti
              const container = prep.ingredients.find(i => String(i.id) === String(batch.containerId));
              const numPezzi = container ? parseFloat(container.amountUsed || 0) : 0;
              return acc + (numPezzi * parseFloat(batch.unitPrice || 0));
          }, 0);
      }

      if (grossRevenue <= 0) return;

      // Scorporo IVA
      const netPrice = grossRevenue / (1 + VAT_RATE);
      
      // Calcolo Costo Vivo (Mat. Prime + Contenitori)
      let prepCost = 0;
      if (prep.pricingData && prep.pricingData.substances) {
          prepCost = parseFloat(prep.pricingData.substances); // Se abbiamo il dato salvato
      } else {
          // Fallback calcolo al volo
          prep.ingredients.forEach(ing => {
              prepCost += (ing.amountUsed * (ing.costPerGram || 0));
          });
      }

      const profit = netPrice - prepCost;

      totalRevenue += netPrice;
      totalCost += prepCost;
      totalProfit += profit;

      // Aggregazione Mensile
      const date = new Date(prep.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += netPrice;
        monthlyData[monthKey].cost += prepCost;
        monthlyData[monthKey].profit += profit;
        monthlyData[monthKey].count += 1;
      }
    });

    // Ordina mesi cronologicamente
    const trendData = Object.values(monthlyData).sort((a, b) => a.sortKey - b.sortKey);

    // Analisi Magazzino (Sempre su tutto lo stock attuale)
    let stockValue = 0;
    const expiringItems = [];
    const topValueItems = [...inventory]
        .map(i => ({ ...i, totalVal: i.quantity * (i.costPerGram || 0) }))
        .sort((a, b) => b.totalVal - a.totalVal)
        .slice(0, 5);

    inventory.forEach(item => {
        if (!item.disposed) {
            stockValue += (item.quantity * (item.costPerGram || 0));
            
            const days = (new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24);
            if (days > 0 && days <= 90) {
                expiringItems.push(item);
            }
        }
    });

    return {
      totalRevenue,
      totalProfit,
      totalCost,
      marginPercent: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      trendData,
      prepCount: filteredPreps.length,
      stockValue,
      topValueItems,
      expiringItems: expiringItems.sort((a, b) => new Date(a.expiry) - new Date(b.expiry)).slice(0, 5)
    };
  }, [preparations, inventory, selectedYear]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Cruscotto Direzionale</h2>
        <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline">Analisi Anno:</span>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none font-bold"
            >
                {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
            title={`Fatturato ${selectedYear}`} 
            value={`€ ${stats.totalRevenue.toFixed(2)}`} 
            icon={<DollarSign className="text-teal-600" />} 
            color="border-l-4 border-teal-500" 
        />
        <StatCard 
            title="Margine Operativo" 
            value={`€ ${stats.totalProfit.toFixed(2)}`} 
            subValue={`${stats.marginPercent.toFixed(1)}%`}
            icon={<TrendingUp className="text-blue-600" />} 
            color="border-l-4 border-blue-500" 
        />
        <StatCard 
            title="Valore Magazzino (Oggi)" 
            value={`€ ${stats.stockValue.toFixed(2)}`} 
            icon={<Package className="text-amber-600" />} 
            color="border-l-4 border-amber-500" 
        />
        <StatCard 
            title={`Prep. Svolte ${selectedYear}`} 
            value={stats.prepCount} 
            icon={<Calendar className="text-slate-600" />} 
            color="border-l-4 border-slate-500" 
        />
      </div>

      {/* GRAFICI TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Andamento Mensile (Fatturato vs Utile)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis />
                        <Tooltip formatter={(value) => `€ ${parseFloat(value).toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="revenue" name="Fatturato" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cost" name="Costi Vivi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Utile Stimato" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* PIE CHART COSTI */}
        <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Ripartizione Economica</h3>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Costi Vivi (Mat. Prime)', value: stats.totalCost },
                                { name: 'Margine (Onorari)', value: stats.totalProfit }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {/* Costi: Amber, Margine: Teal */}
                            <Cell key="cost" fill="#f59e0b" />
                            <Cell key="profit" fill="#0d9488" />
                        </Pie>
                        <Tooltip formatter={(value) => `€ ${parseFloat(value).toFixed(2)}`} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center text-sm text-slate-600">
                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 bg-teal-600 rounded-full"></div> Margine ({stats.marginPercent.toFixed(0)}%)</div>
                    <div className="flex items-center gap-2 justify-center mt-1"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> Costi Vivi ({100 - stats.marginPercent.toFixed(0)}%)</div>
                </div>
            </div>
        </Card>
      </div>

      {/* TABELLE DETTAGLIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Package size={20} className="text-teal-600"/> Top 5 Sostanze per Valore (Stock)</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                          <tr>
                              <th className="px-4 py-2">Sostanza</th>
                              <th className="px-4 py-2 text-right">Q.tà</th>
                              <th className="px-4 py-2 text-right">Valore Tot.</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {stats.topValueItems.map(item => (
                              <tr key={item.id}>
                                  <td className="px-4 py-2 font-medium text-slate-700">{item.name}</td>
                                  <td className="px-4 py-2 text-right text-slate-500">{item.quantity} {item.unit}</td>
                                  <td className="px-4 py-2 text-right font-mono font-bold text-teal-700">€ {item.totalVal.toFixed(2)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>

          <Card className="p-6">
              <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-amber-500"/> In Scadenza (Prossimi 90gg)</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500">
                          <tr>
                              <th className="px-4 py-2">Sostanza</th>
                              <th className="px-4 py-2">Scadenza</th>
                              <th className="px-4 py-2 text-right">Valore a Rischio</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {stats.expiringItems.length > 0 ? stats.expiringItems.map(item => (
                              <tr key={item.id}>
                                  <td className="px-4 py-2 font-medium text-slate-700">{item.name}</td>
                                  <td className="px-4 py-2 text-amber-600 font-bold whitespace-nowrap">{formatDate(item.expiry)}</td>
                                  <td className="px-4 py-2 text-right font-mono">€ {(item.quantity * item.costPerGram).toFixed(2)}</td>
                              </tr>
                          )) : <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-400 italic">Nessuna scadenza imminente</td></tr>}
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
    </div>
  );
};

export default Reporting;
