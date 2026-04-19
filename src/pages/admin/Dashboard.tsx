import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarClock, AlertTriangle, FileText, Send, Sparkles, LogOut } from "lucide-react"
import { Link } from "react-router-dom"

import { useState, useEffect } from "react"

export default function AdminDashboard() {
  const [dbUser, setDbUser] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('treedoo_user');
    if (saved) setDbUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('treedoo_user');
  };
  return (
    <div className="min-h-[100dvh] bg-slate-100 pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 lg:px-8 shadow-md flex justify-between items-center sticky top-0 z-20">
        <div>
          <p className="text-[11px] text-slate-400 font-bold mb-0.5 uppercase tracking-wide">Benvenuto, {dbUser?.name?.split(' ')[0] || "Amministratore"}</p>
          <h1 className="text-xl font-bold tracking-tight">Treedoo <span className="font-light text-slate-400 text-sm ml-2">ADMIN</span></h1>
        </div>
        <Link to="/" onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
        </Link>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 mt-4 animate-in fade-in duration-500">
        
        {/* Welcome & AI Copilot Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Pannello di Controllo</h2>
             <p className="text-slate-500">Gestisci i tuoi 12 condomini attivi. Tutto è sotto controllo.</p>
          </div>
          
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none shadow-lg lg:col-span-1">
            <CardContent className="p-6 flex flex-col justify-center h-full space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold">AI Co-Pilot Attivo</h3>
              </div>
              <p className="text-sm text-indigo-100">
                Oggi ho generato <strong>3 bozze di comunicazioni</strong> e individuato <strong>1 scadenza fiscale</strong> urgente.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Smart Timeline Scadenze */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Timeline Scadenze Automatizzata
            </h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  <TimelineItem 
                    date="Oggi" 
                    title="Modello 770 - Invio telematico" 
                    condominio="Condominio Le Querce" 
                    urgent 
                  />
                  <TimelineItem 
                    date="Tra 3 gg" 
                    title="Manutenzione periodica Ascensore" 
                    condominio="Condominio Roma" 
                  />
                  <TimelineItem 
                    date="Tra 12 gg" 
                    title="Scadenza Polizza Globale Fabbricati" 
                    condominio="Residence I Pini" 
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Auto-Generated Drafts */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bozze Comunicazioni (Generate da AI)
            </h3>
            <div className="space-y-4">
              <DraftCard 
                title="Avviso Interruzione Idrica" 
                preview="Gentili condòmini, vi informiamo che a causa di..." 
                condominio="Condominio Le Querce"
              />
              <DraftCard 
                title="Sollecito Pagamento Rate Arretrate" 
                preview="Gentile condomino, le scriviamo per ricordarle che..." 
                condominio="Condominio Roma (Interno 12)"
              />
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

function TimelineItem({ date, title, condominio, urgent }: { date: string, title: string, condominio: string, urgent?: boolean }) {
  return (
    <div className="p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-default">
      <div className="flex-shrink-0 pt-1">
        {urgent ? (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-blue-400 mt-1" />
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

function DraftCard({ title, preview, condominio }: { title: string, preview: string, condominio: string }) {
  return (
    <Card className="hover:border-blue-300 transition-colors cursor-pointer border-l-4 border-l-indigo-500">
      <CardContent className="p-4 space-y-3">
        <div>
          <span className="text-xs font-semibold text-indigo-500 mb-1 block uppercase tracking-wider">{condominio}</span>
          <h4 className="font-bold text-slate-900">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 italic">"{preview}"</p>
        <div className="flex justify-end pt-2">
          <Button size="sm" className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
             Revisiona e Invia <Send className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
