import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Package, Printer, Sparkles, ShieldCheck, ArrowRight, History } from 'lucide-react';
import screen0 from '../assets/screen0.png';
import screen1 from '../assets/screen1.png';
import screen2 from '../assets/screen2.png';
import screen3 from '../assets/screen3.png';
import screen4 from '../assets/screen4.png';

const slides = [screen0, screen1, screen2, screen3, screen4];

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mb-4 text-teal-600">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-1.5 rounded-lg text-white">
              <FlaskConical size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Galen<span className="text-teal-600">APP</span></span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Login</button>
            <button onClick={() => navigate('/login')} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-teal-600/20">
              Accedi al Laboratorio
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={12} /> Nuovo: Assistente AI integrato
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Il Gestionale NBP <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Semplice, Sicuro, Intelligente.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Abbandona la carta e i fogli di calcolo. Gestisci sostanze, tariffazione, etichette e registri ufficiali in un'unica piattaforma cloud progettata per i farmacisti moderni.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <button onClick={() => navigate('/login')} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-full font-bold text-lg transition-all shadow-xl shadow-teal-600/30 flex items-center justify-center gap-2 hover:gap-3">
              Entra in Piattaforma <ArrowRight size={20} />
            </button>
            <button className="bg-white border border-slate-200 text-slate-700 hover:border-slate-300 px-8 py-3.5 rounded-full font-bold text-lg transition-all">
              Richiedi Demo
            </button>
          </div>
        </div>
        
        {/* Abstract Visual Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-400/10 rounded-full blur-3xl -z-10 animate-pulse duration-[5000ms]"></div>
      </header>

      {/* VISUAL DASHBOARD SLIDER */}
      <section className="px-6 mb-24">
        <div className="max-w-6xl mx-auto bg-slate-900 rounded-2xl p-1.5 shadow-2xl shadow-slate-900/20 rotate-1 hover:rotate-0 transition-transform duration-700 overflow-hidden group">
            <div className="bg-slate-800 rounded-xl overflow-hidden relative border border-slate-700 aspect-video">
                {slides.map((src, index) => (
                  <img 
                    key={index}
                    src={src} 
                    alt={`Dashboard Screen ${index + 1}`} 
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} 
                  />
                ))}
                
                {/* Navigation Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white scale-110 shadow' : 'bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
            </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tutto ciò che serve al tuo laboratorio</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Strumenti potenti per semplificare ogni aspetto della galenica, dalla presa in carico della sostanza alla stampa dell'etichetta finale.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Package} 
              title="Magazzino & Lotti" 
              description="Tracciabilità completa delle sostanze. Carico/scarico automatico, gestione scadenze e certificati d'analisi sempre a portata di mano." 
            />
            <FeatureCard 
              icon={FlaskConical} 
              title="Wizard Preparazioni" 
              description="Guidato passo-passo nella creazione di Magistrali e Officinali. Calcoli automatici, controllo dosaggi e verifica disponibilità." 
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Tariffazione NBP" 
              description="Calcolo automatico del prezzo secondo la Tariffa Nazionale. Gestione onorari, addizionali per sostanze pericolose e IVA." 
            />
            <FeatureCard 
              icon={Printer} 
              title="Etichettatura Smart" 
              description="Generazione PDF etichette a norma. Formati personalizzabili, avvertenze automatiche, QR code e gestione lotti." 
            />
            <FeatureCard 
              icon={History} 
              title="Registri Digitali" 
              description="Storico completo delle preparazioni e dei movimenti di magazzino. Esporta i registri per i controlli ASL in un click." 
            />
            <FeatureCard 
              icon={Sparkles} 
              title="Assistente AI" 
              description="Un esperto virtuale sempre disponibile per rispondere a dubbi su formulazioni, incompatibilità e normativa vigente." 
            />
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-24 px-6 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Pronto a modernizzare il tuo laboratorio?</h2>
          <p className="text-slate-400 mb-10 text-lg">
            Unisciti alle farmacie che hanno già scelto l'efficienza e la sicurezza di GalenicoLab.
          </p>
          <button onClick={() => navigate('/login')} className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-teal-500/20">
            Accedi Ora
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-slate-50 text-sm text-slate-500 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-70">
          <FlaskConical size={16} />
          <span className="font-bold tracking-tight">GalenAPP</span>
        </div>
        <p>&copy; {new Date().getFullYear()} GalenAPP. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
};

export default LandingPage;