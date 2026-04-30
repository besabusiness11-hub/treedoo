import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';

const BANNED_WORDS = [
  'cazzo', 'merda', 'stronzo', 'stronza', 'vaffanculo', 'minchia',
  'coglione', 'cogliona', 'puttana', 'bastardo', 'bastarda',
  'idiota', 'deficiente', 'imbecille', 'troia', 'porco',
  'fuck', 'shit', 'bitch', 'asshole', 'damn', 'dick',
];

export function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(lower));
}

export function filterBannedWords(text: string): string {
  let filtered = text;
  BANNED_WORDS.forEach(word => {
    filtered = filtered.replace(new RegExp(`\\b${word}\\b`, 'gi'), '***');
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
  photo_url?: string | null;
};

export type Scadenza = {
  id: string;
  title: string;
  amount: number;
  dateStr: string;
  due_date?: string; // ISO format "2026-04-30" used for API
  month: string;
  condominio?: string;
  urgent?: boolean;
  paid?: boolean;
};

export type EventType = 'holiday' | 'maintenance' | 'meeting' | 'social';

export type Evento = {
  id: string;
  title: string;
  date: string;
  desc: string;
  type: EventType;
  participants?: string[];
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
  date: string;
  replies: number;
  repliesList: Reply[];
  isAvviso: boolean;
};

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
  addTicketWithFile: (t: { desc: string; type: string; author: string }, file?: File | null) => Promise<void>;
  resolveTicket: (id: string) => void;
  addScadenza: (s: Omit<Scadenza, 'id'>) => void;
  payScadenza: (id: string) => Promise<void>;
  addEvento: (e: Omit<Evento, 'id'>) => void;
  addPost: (p: Omit<Post, 'id' | 'date' | 'replies' | 'repliesList'>) => void;
  replyToPost: (postId: string, reply: { author: string; content: string }) => void;
  addBilancio: (d: Omit<Documento, 'id' | 'date'>) => void;
  setRegolamento: (d: Omit<Documento, 'id' | 'date'>) => void;
  addVerbale: (d: Omit<Documento, 'id' | 'date'>) => void;
  clearData: () => void;
};

const defaultEventi: Evento[] = [
  {
    id: 'e1',
    title: 'Assemblea Straordinaria',
    date: new Date(Date.now() + 2 * 86400000).toISOString(),
    desc: 'Discussione lavori facciata e bonus 110%',
    type: 'meeting',
    participants: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2', 'https://i.pravatar.cc/150?u=3']
  },
  {
    id: 'e2',
    title: 'Manutenzione Ascensore',
    date: new Date(Date.now() + 5 * 86400000).toISOString(),
    desc: 'Intervento programmato ditta Otis',
    type: 'maintenance',
    participants: ['https://i.pravatar.cc/150?u=4']
  },
  {
    id: 'e3',
    title: 'Aperitivo di Vicinato',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    desc: 'Ci troviamo in giardino per un brindisi',
    type: 'social',
    participants: ['https://i.pravatar.cc/150?u=5', 'https://i.pravatar.cc/150?u=6', 'https://i.pravatar.cc/150?u=7']
  }
];

const initialData: CondominioData = {
  tickets: [],
  scadenze: [],
  eventi: defaultEventi,
  posts: [],
  bilanci: [],
  regolamento: null,
  verbali: [],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function mapApiTicket(t: any): Ticket {
  return {
    id: t.id,
    type: t.category || 'altro',
    desc: t.description || t.title || '',
    status: t.status === 'risolto' ? 'resolved' : 'open',
    date: t.created_at,
    author: t.user_name || 'Condomino',
    photo_url: t.photo_url ? `${API_BASE}${t.photo_url}` : null,
  };
}

function mapApiScadenza(s: any): Scadenza {
  const d = new Date(s.due_date);
  return {
    id: s.id,
    title: s.title,
    amount: Number(s.amount) || 0,
    dateStr: d.toLocaleDateString('it-IT'),
    month: d.toLocaleDateString('it-IT', { month: 'long' }),
    paid: s.paid,
    urgent: !s.paid && d < new Date(Date.now() + 7 * 86400000),
  };
}

function mapApiPost(p: any): Post {
  return {
    id: p.id,
    author: p.user_name || 'Condomino',
    content: p.content,
    date: new Date(p.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    replies: 0,
    repliesList: [],
    isAvviso: p.category === 'avviso',
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<CondominioData>(() => {
    const saved = localStorage.getItem('treedoo_data_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed, bilanci: parsed.bilanci || [], regolamento: parsed.regolamento || null, verbali: parsed.verbali || [], posts: (parsed.posts || []).map((p: any) => ({ ...p, repliesList: p.repliesList || [] })) };
      } catch { return initialData; }
    }
    return initialData;
  });

  const fetchFromAPI = () => {
    if (!user) return;
    Promise.all([
      api.tickets.list().catch(() => null),
      api.scadenze.list().catch(() => null),
      api.posts.list().catch(() => null),
    ]).then(([tickets, scadenze, posts]) => {
      setData(prev => ({
        ...prev,
        ...(tickets ? { tickets: (tickets as any[]).map(mapApiTicket) } : {}),
        ...(scadenze ? { scadenze: (scadenze as any[]).map(mapApiScadenza) } : {}),
        ...(posts ? { posts: (posts as any[]).map(mapApiPost) } : {}),
      }));
    });
  };

  // Initial fetch + 30s polling
  useEffect(() => {
    if (!user) return;
    fetchFromAPI();
    const interval = setInterval(fetchFromAPI, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Persist non-API data to localStorage
  useEffect(() => {
    const toSave = { bilanci: data.bilanci, regolamento: data.regolamento, verbali: data.verbali };
    localStorage.setItem('treedoo_data_v3', JSON.stringify(toSave));
  }, [data.bilanci, data.regolamento, data.verbali]);

  const addTicket = (t: Omit<Ticket, 'id' | 'date' | 'status'>) => {
    addTicketWithFile(t, null);
  };

  const addTicketWithFile = async (t: { desc: string; type: string; author: string }, file?: File | null) => {
    const formData = new FormData();
    formData.append('title', t.desc);
    formData.append('description', t.desc);
    formData.append('category', t.type);
    if (file) formData.append('photo', file);
    try {
      const created = await api.tickets.create(formData);
      setData(prev => ({ ...prev, tickets: [mapApiTicket(created), ...prev.tickets] }));
    } catch {
      // Fallback local
      setData(prev => ({
        ...prev,
        tickets: [{ ...t, id: Date.now().toString(), date: new Date().toISOString(), status: 'open' }, ...prev.tickets]
      }));
    }
  };

  const resolveTicket = async (id: string) => {
    try {
      await api.tickets.updateStatus(id, 'risolto');
    } catch { /* ignore */ }
    setData(prev => ({ ...prev, tickets: prev.tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t) }));
  };

  const addScadenza = async (s: Omit<Scadenza, 'id'>) => {
    // Convert Italian date format to ISO if due_date not provided
    const isoDate = s.due_date || (() => {
      const parts = s.dateStr.split('/');
      if (parts.length >= 2) {
        const year = parts[2] || new Date().getFullYear().toString();
        return `${year}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      }
      return new Date().toISOString().split('T')[0];
    })();
    try {
      const created = await api.scadenze.create({ title: s.title, amount: s.amount, due_date: isoDate, payment_ref: null });
      setData(prev => ({ ...prev, scadenze: [mapApiScadenza(created), ...prev.scadenze] }));
    } catch {
      setData(prev => ({ ...prev, scadenze: [{ ...s, id: Date.now().toString() }, ...prev.scadenze] }));
    }
  };

  const payScadenza = async (id: string) => {
    try { await api.scadenze.pay(id); } catch { /* ignore */ }
    setData(prev => ({ ...prev, scadenze: prev.scadenze.map(s => s.id === id ? { ...s, paid: true } : s) }));
  };

  const addEvento = (e: Omit<Evento, 'id'>) => {
    setData(prev => ({ ...prev, eventi: [{ ...e, id: Date.now().toString() }, ...prev.eventi] }));
  };

  const addPost = async (p: Omit<Post, 'id' | 'date' | 'replies' | 'repliesList'>) => {
    const timeStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    try {
      const created = await api.posts.create(p.content, p.isAvviso ? 'avviso' : 'generale');
      setData(prev => ({ ...prev, posts: [mapApiPost(created), ...prev.posts] }));
    } catch {
      setData(prev => ({ ...prev, posts: [{ ...p, id: Date.now().toString(), date: `Oggi, ${timeStr}`, replies: 0, repliesList: [] }, ...prev.posts] }));
    }
  };

  const replyToPost = (postId: string, reply: { author: string; content: string }) => {
    const timeStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, replies: p.replies + 1, repliesList: [...(p.repliesList || []), { id: Date.now().toString(), author: reply.author, content: reply.content, date: `Oggi, ${timeStr}` }] } : p)
    }));
  };

  const addBilancio = (d: Omit<Documento, 'id' | 'date'>) => {
    setData(prev => ({ ...prev, bilanci: [{ ...d, id: Date.now().toString(), date: new Date().toLocaleDateString('it-IT') }, ...prev.bilanci] }));
  };

  const setRegolamento = (d: Omit<Documento, 'id' | 'date'>) => {
    setData(prev => ({ ...prev, regolamento: { ...d, id: Date.now().toString(), date: new Date().toLocaleDateString('it-IT') } }));
  };

  const addVerbale = (d: Omit<Documento, 'id' | 'date'>) => {
    setData(prev => ({ ...prev, verbali: [{ ...d, id: Date.now().toString(), date: new Date().toLocaleDateString('it-IT') }, ...prev.verbali] }));
  };

  const clearData = () => setData(initialData);

  return (
    <DataContext.Provider value={{ data, addTicket, addTicketWithFile, resolveTicket, addScadenza, payScadenza, addEvento, addPost, replyToPost, addBilancio, setRegolamento, addVerbale, clearData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}
