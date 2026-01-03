// --- GEMINI API HELPER ---
export const callGemini = async (prompt, apiKey) => { 
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Errore nella risposta IA. Riprova.";
  } catch (e) {
    console.error(e);
    return "Errore di connessione al servizio IA.";
  }
};
