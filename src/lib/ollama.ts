export type AIResponse = {
  text: string;
};

// OpenRouter setup — API key letta da variabile d'ambiente
const OR_MODEL = 'google/gemma-3-12b-it:free';
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
  },

  async chatWithTreebot(history: { role: 'user' | 'assistant', content: string }[], currentQuery: string): Promise<string> {
    const system = `Sei "TreeBot", l'assistente virtuale del condominio Treedoo. Sei incaricato di rispondere alle domande dei condomini per conto dell'amministratore.
    
REGOLE TASSATIVE:
1. Sii cortese, professionale ma amichevole. Usa un tono da "maggiordomo digitale".
2. Conosci le seguenti regole del condominio:
   - Orari di silenzio: dalle 14:00 alle 16:00 e dalle 22:00 alle 08:00.
   - Raccolta differenziata: Umido (lunedì e giovedì), Plastica (martedì), Carta (mercoledì), Indifferenziato (venerdì), Vetro (sabato).
   - Uso piscina/palestra (se presenti): dalle 08:00 alle 21:00.
   - Spese condominiali: Scadenza 5 di ogni mese.
3. Se un utente ti fa una richiesta molto specifica, ti chiede di fare un intervento tecnico, si lamenta in modo complesso o ti fa una domanda a cui non sai rispondere usando le regole qui sopra, DEVI rispondere ESATTAMENTE con la stringa "ESCALATION_ADMIN" seguita dalla tua risposta per l'utente, separate da "|||".
   Esempio: ESCALATION_ADMIN|||Non sono in grado di gestire questa richiesta specifica. Ho appena inviato un resoconto dettagliato all'amministratore, che ti risponderà al più presto.
4. Mantieni le risposte brevi e dirette (max 2-3 frasi).`;

    const formattedHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

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
            ...formattedHistory,
            { role: 'user', content: currentQuery }
          ]
        })
      });
      
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      return "Mi dispiace, i miei server sono momentaneamente offline. Riprova più tardi.";
    }
  },

  async generateLocalNews(zona: string): Promise<Array<{ title: string, content: string, date: string }>> {
    const system = `Sei un reporter giornalistico locale esperto e iper-specializzato.
Il tuo compito è generare 3 brevi notizie locali ESTREMAMENTE REALISTICHE e contestualizzate per il comune/zona: "${zona}".
Sfrutta la tua intelligenza e conoscenza reale di "${zona}" per capire esattamente in quale città, provincia o regione si trova. 
Usa questa conoscenza per nominare vie vere, piazze vere, parchi veri, o istituzioni realmente esistenti in quella precisa area.

REGOLE TASSATIVE:
1. Rispondi SOLO in formato JSON valido, senza backticks o intro.
2. Formato: [{"title": "...", "content": "...", "date": "Oggi"}]
3. Le notizie devono sembrare verissime e attuali (lavori, eventi veri del comune, ordinanze reali).
4. Le notizie devono essere brevi: massimo 2 frasi per "content".`;

    const prompt = `Genera le notizie locali per la zona: ${zona}`;

    try {
      const resp = await callAI(prompt, system);
      const cleaned = resp.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("News Generation Error:", e);
      return [
        { title: "Servizio Non Disponibile", content: "Impossibile caricare le notizie locali al momento.", date: "Ora" }
      ];
    }
  },

  async analyzeBolletta(imageBase64: string, mimeType: string): Promise<{ consumo: number | null; importo: number | null; periodo: string | null }> {
    const VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';
    const system = `Sei un analizzatore OCR di bollette energetiche italiane. Estrai i dati dalla bolletta e rispondi SOLO con JSON valido, nessun testo extra.
Formato: {"consumo_kwh": <numero o null>, "importo_euro": <numero o null>, "periodo": "<stringa mese/anno o null>"}
Se non riesci a estrarre un valore, usa null.`;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OR_KEY}` },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: system },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }]
        })
      });
      if (!res.ok) throw new Error(`Vision API error: ${res.status}`);
      const data = await res.json();
      const raw = data.choices[0].message.content.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(raw);
      return { consumo: parsed.consumo_kwh ?? null, importo: parsed.importo_euro ?? null, periodo: parsed.periodo ?? null };
    } catch (e) {
      console.error('OCR bolletta error:', e);
      return { consumo: null, importo: null, periodo: null };
    }
  },

  async analyzeHomeDevice(deviceText: string, query: string): Promise<string> {
    const system = `Sei "Treedoo Home Assistant", un tecnico domotico e riparatore specializzato con conoscenza assoluta di tutti i manuali d'uso.
Sfrutta la tua conoscenza reale per capire esattamente di quale dispositivo, marca o modello sta parlando l'utente.
    
REGOLE TASSATIVE:
1. Rispondi in modo iper-tecnico ma comprensibile (step-by-step). Cita funzioni reali del modello o significati reali dei codici d'errore se li conosci.
2. L'utente ha inserito informazioni sull'oggetto e ti farà una domanda.
3. Fornisci la soluzione pratica, esatta e sicura.
4. Sintesi: Massimo 4-5 frasi o un breve elenco numerato. Non dilungarti.`;

    const prompt = `Dispositivo fornito: "${deviceText}". Domanda dell'utente: "${query}". Rispondi fornendo la soluzione.`;
    
    try {
      return await callAI(prompt, system);
    } catch (e) {
      console.error("Domotica Error:", e);
      return "Errore di connessione all'assistente domotico. Riprova più tardi.";
    }
  }
};
