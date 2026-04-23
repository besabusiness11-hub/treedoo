import React, { createContext, useContext, useEffect, useState } from 'react';

// Lista parole bannate (filtro sicurezza)
const BANNED_WORDS = [
  'cazzo', 'merda', 'stronzo', 'stronza', 'vaffanculo', 'minchia', 
  'coglione', 'cogliona', 'puttana', 'bastardo', 'bastarda',
  'idiota', 'deficiente', 'imbecille', 'troia', 'porco',
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'dick',
];

export function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

export function filterBannedWords(text: string): string {
  let filtered = text;
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

export type Ticket = {
  id: string;
  type: string;
  desc: string;
  status: 'open' | 'resolved';
  date: string;
  author: string;
};

export type Scadenza = {
  id: string;
  title: string;
  amount: number;
  dateStr: string;
  month: string;
  condominio?: string;
  urgent?: boolean;
};

export type Evento = {
  id: string;
  title: string;
  date: string; // ISO Date String
  desc: string;
};

export type Reply = {
  id: string;
  author: string;
  content: string;
  date: string;
};

export type Post = {
  id: string;
  author: string;
  content: string;
  date: string; // "Oggi, 14:30"
  replies: number;
  repliesList: Reply[];
  isAvviso: boolean; // se true = Avviso Amministratore, altrimenti Bacheca
};

// Documenti condominiali (Bilancio, Regolamento, Verbali)
export type Documento = {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
};

export type CondominioData = {
  tickets: Ticket[];
  scadenze: Scadenza[];
  eventi: Evento[];
  posts: Post[];
  bilanci: Documento[];
  regolamento: Documento | null;
  verbali: Documento[];
};

type DataContextType = {
  data: CondominioData;
  addTicket: (t: Omit<Ticket, 'id' | 'date' | 'status'>) => void;
  resolveTicket: (id: string) => void;
  addScadenza: (s: Omit<Scadenza, 'id'>) => void;
  addEvento: (e: Omit<Evento, 'id'>) => void;
  addPost: (p: Omit<Post, 'id' | 'date' | 'replies' | 'repliesList'>) => void;
  replyToPost: (postId: string, reply: { author: string; content: string }) => void;
  addBilancio: (d: Omit<Documento, 'id' | 'date'>) => void;
  setRegolamento: (d: Omit<Documento, 'id' | 'date'>) => void;
  addVerbale: (d: Omit<Documento, 'id' | 'date'>) => void;
  clearData: () => void;
};

const initialData: CondominioData = {
  tickets: [],
  scadenze: [],
  eventi: [],
  posts: [],
  bilanci: [],
  regolamento: null,
  verbali: [],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CondominioData>(() => {
    const saved = localStorage.getItem('treedoo_data_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrazione: assicurati che i nuovi campi esistano
        return {
          ...initialData,
          ...parsed,
          bilanci: parsed.bilanci || [],
          regolamento: parsed.regolamento || null,
          verbali: parsed.verbali || [],
          posts: (parsed.posts || []).map((p: any) => ({
            ...p,
            repliesList: p.repliesList || [],
          })),
        };
      } catch {
        return initialData;
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('treedoo_data_v3', JSON.stringify(data));
  }, [data]);

  const addTicket = (t: Omit<Ticket, 'id' | 'date' | 'status'>) => {
    setData(prev => ({
      ...prev,
      tickets: [{
        ...t,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        status: 'open'
      }, ...prev.tickets]
    }));
  };

  const resolveTicket = (id: string) => {
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t)
    }));
  };

  const addScadenza = (s: Omit<Scadenza, 'id'>) => {
    setData(prev => ({
      ...prev,
      scadenze: [{ ...s, id: Date.now().toString() }, ...prev.scadenze]
    }));
  };

  const addEvento = (e: Omit<Evento, 'id'>) => {
    setData(prev => ({
      ...prev,
      eventi: [{ ...e, id: Date.now().toString() }, ...prev.eventi]
    }));
  };

  const addPost = (p: Omit<Post, 'id' | 'date' | 'replies' | 'repliesList'>) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setData(prev => ({
      ...prev,
      posts: [{ ...p, id: Date.now().toString(), date: `Oggi, ${timeStr}`, replies: 0, repliesList: [] }, ...prev.posts]
    }));
  };

  const replyToPost = (postId: string, reply: { author: string; content: string }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            replies: p.replies + 1,
            repliesList: [...(p.repliesList || []), {
              id: Date.now().toString(),
              author: reply.author,
              content: reply.content,
              date: `Oggi, ${timeStr}`,
            }]
          };
        }
        return p;
      })
    }));
  };

  const addBilancio = (d: Omit<Documento, 'id' | 'date'>) => {
    const now = new Date();
    setData(prev => ({
      ...prev,
      bilanci: [{ ...d, id: Date.now().toString(), date: now.toLocaleDateString('it-IT') }, ...prev.bilanci]
    }));
  };

  const setRegolamento = (d: Omit<Documento, 'id' | 'date'>) => {
    const now = new Date();
    setData(prev => ({
      ...prev,
      regolamento: { ...d, id: Date.now().toString(), date: now.toLocaleDateString('it-IT') }
    }));
  };

  const addVerbale = (d: Omit<Documento, 'id' | 'date'>) => {
    const now = new Date();
    setData(prev => ({
      ...prev,
      verbali: [{ ...d, id: Date.now().toString(), date: now.toLocaleDateString('it-IT') }, ...prev.verbali]
    }));
  };

  const clearData = () => {
    setData(initialData);
  };

  return (
    <DataContext.Provider value={{ data, addTicket, resolveTicket, addScadenza, addEvento, addPost, replyToPost, addBilancio, setRegolamento, addVerbale, clearData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
