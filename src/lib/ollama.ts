export type AIResponse = {
  text: string;
};

// OpenRouter setup — API key letta da variabile d'ambiente
const OR_MODEL = 'google/gemma-2-9b-it'; 
const OR_KEY = import.meta.env.VITE_OPENROUTER_KEY || '';

async function callAI(prompt: string, system: string): Promise<string> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OR_KEY}`
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!res.ok) {
      throw new Error(`Cloud API error: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error("Errore chiamata a OpenRouter (Gemma):", err);
    throw err;
  }
}

// Manteniamo il nome variabile 'ollamaService' per non rompere l'integrazione esistente nei componenti
export const ollamaService = {
  async analyzeTicket(query: string): Promise<{ manualName: string, diagnosis: string, solution: string }> {
    const system = `Sei l'"Home Assistant" tecnico ufficiale del condominio Treedoo.
Il tuo compito è diagnosticare i problemi tecnici segnalati dai condomini e fornire una soluzione di primo intervento rapida.

REGOLE TASSATIVE:
1. DEVI rispondere ESCLUSIVAMENTE con un oggetto JSON valido. Non aggiungere ALCUN testo o introduzione e non usare formattazione markdown (niente \`\`\`json).
2. Se il problema riguarda fughe di GAS o grave rischio ELETTRICO, consiglia SEMPRE un intervento urgente di un professionista.
3. Stile: tecnico ma rassicurante e iper-pratico.

FORMATO JSON RICHIESTO:
{
  "manualName": "Nome realistico/elegante per il manuale (es. Manuale Sicurezza Termica)",
  "diagnosis": "Diagnosi sintetica del problema (max 2 frasi)",
  "solution": "1. Fai questo\\n2. Fai quello (massimo 3 step pronti all'uso)"
}

ESEMPIO DI RISPOSTA IDEALE:
{"manualName": "Manuale Manutenzione Idraulica", "diagnosis": "Possibile ostruzione del filtro rompigetto causata dall'accumulo di calcare cittadino.", "solution": "1. Svita la punta del rubinetto a mano o con una pinza gommata. 2. Pulisci il filtrino interno con aceto bianco. 3. Riavvita saldamente."}`;
    const prompt = `Segnalazione del condomino: "${query}". Restituisci SOLO il JSON corrispondente.`;
    
    try {
      const resp = await callAI(prompt, system);
      // Clean possible trailing text or markdown blocks
      const cleaned = resp.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        manualName: "Assistente Cloud Non Disponibile",
        diagnosis: "Impossibile completare la diagnosi tramite IA.",
        solution: "Verificare la connessione internet o la disponibilità dell'API di Gemma tramite OpenRouter."
      };
    }
  },

  async generateNotice(topic: string): Promise<string> {
    const system = `Sei l'Amministratore del "Condominio Treedoo". Il tuo ruolo è scrivere circolari condominiali impeccabili da esporre in bacheca.

REGOLE TASSATIVE:
1. DEVI rispondere SOLO con il testo della circolare, già pronto da pubblicare. NESSUNA introduzione (es. MAI scrivere "Ecco il testo:", "Certo," o "Certamente!").
2. Il tono deve essere: estremamente professionale, autorevole ma gentile e chiaro.
3. Sintesi: Massimo 4 frasi. Nessun muro di testo inutile.
4. Concludi SEMPRE l'avviso ringraziando e firmandoti esplicitamente come "L'Amministrazione".

ESEMPIO IDEALE:
Gentili Condomini, vi informiamo che domani l'erogazione dell'acqua verrà sospesa dalle 09:00 alle 13:00 per urgenti lavori di manutenzione. Vi raccomandiamo di fare le dovute scorte idriche. Ci scusiamo per il disagio. L'Amministrazione.`;
    const prompt = `Scrivi direttamente la circolare pronta senza tue introduzioni in risposta a: "${topic}"`;
    try {
      return await callAI(prompt, system);
    } catch (e) {
      return "Errore di generazione. L'intelligenza artificiale di Gemma non ha risposto o la chiave API non è valida.";
    }
  },

  async generateMarketplace(item: string, zona?: string): Promise<{ title: string, desc: string, price: string }> {
    const locationContext = zona 
      ? `\nCONTESTO LOCALIZZATO: L'utente vive a ${zona}. Calibra il valore sul mercato locale di questa specifica zona d'Italia e, se utile, menzionala nella descrizione.`
      : '';
    const system = `Sei "MarketAI by Treedoo", il copywriter per gli annunci dell'usato condominiali.
${locationContext}
     
REGOLE TASSATIVE:
1. Rispondi ESCLUSIVAMENTE con testo formattato in JSON valido, pronto per il parsing. NESSUNA formattazione markdown extra (non scrivere \`\`\`json) e NESSUNA conversazione accessoria.
2. "title": Nome fantastico, moderno ma chiaro, massimo 6 parole. Non aggiungere etichette come "[VENDO]".
3. "desc": Creativa e persuasiva, trasforma difetti in onestà rassicurante. Massimo 3 frasi dense.
4. "price": Stringa rigorosamente numerica, usando la virgola per indicare i centesimi (es. "15,00" o "120,50"). Nessun simbolo dell'Euro.

ESEMPIO DI RISPOSTA IDEALE IN JSON:
{"title": "Macchina del Caffè Premium Usata", "desc": "Perfetta per un boost di energia al mattino! Presenta leggeri graffi laterali ma garantisce ancora caffè cremosi come al bar. Disponibile da subito e pulita con cura.", "price": "25,00"}`;
    const prompt = `L'utente descrive così l'oggetto: "${item}". Trasformalo in JSON.`;
    
    try {
       const resp = await callAI(prompt, system);
       const cleaned = resp.replace(/```json/gi, '').replace(/```/g, '').trim();
       return JSON.parse(cleaned);
    } catch {
       return {
         title: item,
         desc: "Impossibile contattare l'IA Gemma per generare l'annuncio. Riprovare tra poco.",
         price: "0,00"
       };
    }
  }
};
