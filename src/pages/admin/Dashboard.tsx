import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarClock, AlertTriangle, FileText, Send, Sparkles, LogOut, PieChart, Edit3, ShieldCheck } from "lucide-react"
import { Link } from "react-router-dom"

import React, { useState, useEffect } from "react"
import { useData } from "@/lib/DataContext"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ollamaService } from "@/lib/ollama"
import { Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const [dbUser, setDbUser] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('treedoo_user');
    if (saved) setDbUser(JSON.parse(saved));
  }, []);

  const { data, addScadenza, resolveTicket, addPost, addBilancio, setRegolamento, addVerbale } = useData();
  const [newScadenzaTitle, setNewScadenzaTitle] = useState("");
  const [newScadenzaAmount, setNewScadenzaAmount] = useState("");
  const [newAvvisoTitle, setNewAvvisoTitle] = useState("");
  const [isGeneratingAvviso, setIsGeneratingAvviso] = useState(false);
  
  // Documenti admin
  const [activeDocTab, setActiveDocTab] = useState<"bilancio" | "regolamento" | "verbale">("bilancio");
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");

  const handleAddScadenza = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScadenzaTitle && newScadenzaAmount) {
      addScadenza({
        title: newScadenzaTitle,
        amount: parseFloat(newScadenzaAmount),
        dateStr: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        month: new Date().toLocaleDateString('it-IT', { month: 'long' }),
        condominio: "Tutti",
      });
      setNewScadenzaTitle("");
      setNewScadenzaAmount("");
    }
  };

  const handleAddAvviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAvvisoTitle) {
      addPost({
        author: dbUser?.name || "Amministratore",
        content: newAvvisoTitle,
        isAvviso: true,
      });
      setNewAvvisoTitle("");
    }
  };

  const handleGenerateAvviso = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newAvvisoTitle) return;
    setIsGeneratingAvviso(true);
    try {
      const generated = await ollamaService.generateNotice(newAvvisoTitle);
      setNewAvvisoTitle(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAvviso(false);
    }
  };

  const handlePublishDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;
    const author = dbUser?.name || "Amministratore";
    
    if (activeDocTab === "bilancio") {
      addBilancio({ title: docTitle, content: docContent, author });
    } else if (activeDocTab === "regolamento") {
      setRegolamento({ title: docTitle, content: docContent, author });
    } else if (activeDocTab === "verbale") {
      addVerbale({ title: docTitle, content: docContent, author });
    }
    setDocTitle("");
    setDocContent("");
  };

  const handleLogout = () => {
    localStorage.removeItem('treedoo_user');
  };

  return (
    <div className="min-h-[100dvh] bg-[#faf8f5] pb-12">
      {/* Header */}
      <header className="bg-[#1a3322] text-white p-4 lg:px-8 shadow-md flex justify-between items-center sticky top-0 z-20">
        <div>
          <p className="text-[11px] text-[#a5cdb0] font-bold mb-0.5 uppercase tracking-wide">Benvenuto, {dbUser?.name?.split(' ')[0] || "Amministratore"}</p>
          <h1 className="text-xl font-bold tracking-tight"><span className="text-black">tree</span><span className="text-[#4ade80]">doo</span> <span className="font-light text-[#a5cdb0] text-sm ml-2">ADMIN</span></h1>
        </div>
        <Link to="/" onClick={handleLogout} className="text-[#a5cdb0] hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
        </Link>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 mt-4 animate-in fade-in duration-500">
        
        {/* Welcome & Status Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Pannello di Controllo</h2>
             <p className="text-slate-500">Gestisci le attività dei tuoi condomini. Tutto è sotto controllo.</p>
          </div>
          
          <Card className="bg-gradient-to-r from-[#1e3a8a] to-blue-700 text-white border-none shadow-lg lg:col-span-1">
            <CardContent className="p-6 flex flex-col justify-center h-full space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold">Stato Sistema</h3>
              </div>
              <p className="text-sm text-blue-100">
                Oggi ci sono <strong>{data.tickets.filter(t => t.status==='open').length} ticket aperti</strong> e <strong>{data.scadenze.length} scadenze</strong> attive.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Smart Timeline Scadenze */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Scadenze e Ticket
              </h3>
            </div>
            
            <Card className="rounded-2xl">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {data.tickets.filter(t => t.status === 'open').map(ticket => (
                     <div key={ticket.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors cursor-default">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">TICKET ({ticket.type})</span>
                            <h4 className="font-semibold text-sm text-slate-900 mt-1">{ticket.desc}</h4>
                          </div>
                          <Button size="sm" onClick={() => resolveTicket(ticket.id)} className="w-full bg-slate-900 hover:bg-slate-800">
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Segna come Risolto
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500">Aperto in data: {new Date(ticket.date).toLocaleDateString()} - {ticket.author}</p>
                     </div>
                  ))}

                  {data.scadenze.map((s) => (
                    <TimelineItem 
                      key={s.id}
                      date={s.dateStr} 
                      title={s.title + ` (€${s.amount})`} 
                      condominio={s.condominio || "Tutti"} 
                      urgent={s.urgent} 
                    />
                  ))}
                  
                  {data.tickets.filter(t => t.status === 'open').length === 0 && data.scadenze.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">Nessuna attività pendente.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-emerald-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <CalendarClock className="w-5 h-5 text-emerald-600" /> Genera Scadenza / Rata
                </CardTitle>
                <CardDescription className="text-emerald-700/70">Aggiungi una nuova scadenza condominiale.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddScadenza} className="space-y-4">
                  <Input 
                    placeholder="Titolo (es. Pulizia Scale Marzo)" 
                    value={newScadenzaTitle} 
                    onChange={(e) => setNewScadenzaTitle(e.target.value)} 
                    className="bg-white border-emerald-100 focus-visible:ring-emerald-500"
                    required
                  />
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Importo (es. 45.50)" 
                    value={newScadenzaAmount} 
                    onChange={(e) => setNewScadenzaAmount(e.target.value)} 
                    className="bg-white border-emerald-100 focus-visible:ring-emerald-500"
                    required
                  />
                  <Button type="submit" className="w-full bg-[#1a3322] hover:bg-[#1a3322]/90">
                    Pubblica Scadenza
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Avvisi e Bacheca */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bacheca Condominiale
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {data.posts.map(post => (
                <DraftCard 
                  key={post.id}
                  title={post.isAvviso ? "Avviso Amministrazione" : "Post di Vicinato"} 
                  preview={post.content} 
                  condominio={post.author}
                  isAvviso={post.isAvviso}
                />
              ))}
              {data.posts.length === 0 && (
                <p className="text-sm text-slate-500 italic py-4">Nessun post presente in bacheca.</p>
              )}
            </div>
            
            <Card>
              <CardHeader className="bg-red-50 border-b border-red-100 relative">
                <div className="absolute top-4 right-4 bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI
                </div>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Invia Avviso AI
                </CardTitle>
                <CardDescription className="text-red-700/70">L'Intelligenza Artificiale formalizzerà la tua bozza in un avviso professionale da esporre in bacheca.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddAvviso} className="space-y-4">
                  <Textarea 
                    placeholder="Es. Sospensione acqua giovedì dalle 9 alle 12..." 
                    value={newAvvisoTitle} 
                    onChange={(e) => setNewAvvisoTitle(e.target.value)} 
                    className="bg-white border-red-100 focus-visible:ring-red-500 min-h-[100px]"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleGenerateAvviso} disabled={isGeneratingAvviso || !newAvvisoTitle} className="flex-1 bg-amber-500 text-white hover:bg-amber-600 gap-2 font-bold shadow-sm shadow-amber-500/20">
                      {isGeneratingAvviso ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGeneratingAvviso ? "Elaborazione..." : "Migliora con AI"}
                    </Button>
                    <Button type="submit" disabled={!newAvvisoTitle} className="flex-1 bg-[#1a3322] hover:bg-[#1a3322]/90 flex items-center gap-2 font-bold shadow-md">
                      <Send className="w-4 h-4" /> Pubblica
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

        </div>

        {/* Gestione Documenti Condominiali */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Gestione Documenti
          </h3>
          <p className="text-sm text-slate-500 -mt-2">Pubblica bilanci, regolamento e verbali visibili ai condomini.</p>

          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 p-0">
              <div className="flex w-full divide-x divide-gray-100">
                <button 
                  onClick={() => setActiveDocTab("bilancio")} 
                  className={`flex-1 flex flex-col items-center justify-center p-4 gap-1 transition-colors ${activeDocTab === 'bilancio' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <PieChart className="w-5 h-5" />
                  <span className="text-xs font-bold">Bilancio</span>
                </button>
                <button 
                  onClick={() => setActiveDocTab("regolamento")} 
                  className={`flex-1 flex flex-col items-center justify-center p-4 gap-1 transition-colors ${activeDocTab === 'regolamento' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold">Regolamento</span>
                </button>
                <button 
                  onClick={() => setActiveDocTab("verbale")} 
                  className={`flex-1 flex flex-col items-center justify-center p-4 gap-1 transition-colors ${activeDocTab === 'verbale' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Edit3 className="w-5 h-5" />
                  <span className="text-xs font-bold">Verbale</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePublishDoc} className="space-y-4">
                <div className="space-y-3">
                  <Input 
                    placeholder={`Titolo del ${activeDocTab} (es. ${activeDocTab === 'bilancio' ? 'Preventivo 2026' : activeDocTab === 'regolamento' ? 'Aggiornamento Marzo' : 'Assemblea Straordinaria'})`}
                    value={docTitle} 
                    onChange={(e) => setDocTitle(e.target.value)} 
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#1a3322]"
                    required
                  />
                  <Textarea 
                    placeholder="Contenuto testuale o note allegate al documento..." 
                    value={docContent} 
                    onChange={(e) => setDocContent(e.target.value)} 
                    className="bg-gray-50 border-gray-200 focus-visible:ring-[#1a3322] min-h-[120px]"
                    required
                  />
                </div>
                <div className="flex bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 font-medium">
                  {activeDocTab === 'regolamento' && "Nota: Esiste un solo regolamento attivo. Se ne pubblichi uno nuovo, sovrascriverà automaticamente il precedente."}
                  {activeDocTab !== 'regolamento' && `I condomini riceveranno una notifica della pubblicazione di questo ${activeDocTab}.`}
                </div>
                <Button type="submit" className="w-full bg-[#1a3322] hover:bg-[#1a3322]/90 shadow-md">
                  Rendi Pubblico
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  )
}

function TimelineItem({ date, title, condominio, urgent }: { key?: React.Key, date: string, title: string, condominio: string, urgent?: boolean }) {
  return (
    <div className="p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-default">
      <div className="flex-shrink-0 pt-1">
        {urgent ? (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-[#1e3a8a] mt-1" />
        )}
      </div>
      <div className="space-y-1 w-full">
        <div className="flex justify-between items-start">
          <h4 className={`font-semibold text-sm ${urgent ? 'text-red-700' : 'text-slate-900'}`}>{title}</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${urgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{date}</span>
        </div>
        <p className="text-xs text-slate-500">{condominio}</p>
      </div>
    </div>
  )
}

function DraftCard({ title, preview, condominio, isAvviso }: { key?: React.Key, title: string, preview: string, condominio: string, isAvviso?: boolean }) {
  return (
    <Card className={`hover:border-blue-300 transition-colors border-l-4 rounded-xl ${isAvviso ? 'border-l-red-500 bg-red-50/20' : 'border-l-[#1e3a8a]'}`}>
      <CardContent className="p-4 space-y-3">
        <div>
          <span className={`text-xs font-semibold mb-1 block uppercase tracking-wider ${isAvviso ? 'text-red-500' : 'text-[#1e3a8a]'}`}>{isAvviso ? 'URGENTE / ADMIN' : condominio}</span>
          <h4 className="font-bold text-slate-900">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 italic">"{preview}"</p>
      </CardContent>
    </Card>
  )
}
