import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import { callGemini } from '../../services/gemini';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Buongiorno Collega. Sono il tuo assistente galenico virtuale.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    const prompt = `Sei un esperto farmacista formulatore galenico in Italia. Rispondi in modo tecnico ma conciso. Domanda dell'utente: "${userMsg}"`;

    const response = await callGemini(prompt);

    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsLoading(false);
  };

  return (
    <Card className="flex flex-col h-[600px] border-slate-200">
      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-full">
            <Sparkles className="text-purple-600 w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Assistente Galenico IA</h3>
            <p className="text-xs text-slate-500">Powered by Gemini 2.5</p>
          </div>
        </div>
        <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setMessages([])}>Pulisci Chat</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${ 
              msg.role === 'user'
                ? 'bg-teal-600 text-white rounded-br-none'
                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
              }
            `}>
              {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="animate-spin w-4 h-4" /> Sto consultando la farmacopea...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 rounded-b-lg flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chiedi: 'Qual è la solubilità del Minoxidil in alcool 96?'"
          className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2.5 transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </Card>
  );
}

export default AIAssistant;
