import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, MapPin, ShoppingBag, Newspaper, ChevronRight, Camera, Sparkles, AlertTriangle, TrendingUp } from "lucide-react"

export default function SocialHub() {
  const [activeTab, setActiveTab] = useState<"bacheca" | "avvisi">("bacheca")
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showNeighborhood, setShowNeighborhood] = useState(false)
  const [marketStep, setMarketStep] = useState<"upload" | "analyzing" | "result">("upload")

  const handleMarketUpload = () => {
    setMarketStep("analyzing")
    setTimeout(() => {
      setMarketStep("result")
    }, 2000)
  }

  return (
    <>
      <div className="animate-in fade-in duration-500 bg-gray-50 min-h-screen pb-24 top-0 left-0">
        
        {/* Header stringato */}
        <header className="bg-[#0b1b3d] text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-md sticky top-0 z-10">
          <h1 className="text-2xl font-extrabold tracking-tight">Comunicazioni e Vicinato</h1>
        </header>

        <div className="px-5 space-y-8 pt-6 relative z-0">
          
          {/* Comunicazioni Interne */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1 text-gray-500">
              <Users className="w-4 h-4" />
              <h2 className="text-[11px] font-bold tracking-widest uppercase">Comunicazioni Interne</h2>
            </div>
            
            <div className="bg-gray-200/50 p-1 rounded-2xl flex relative max-w-[fit-content]">
               <button
                  onClick={() => setActiveTab("bacheca")}
                  className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${activeTab === "bacheca" ? "bg-white shadow-sm text-slate-800" : "text-gray-500 hover:text-slate-700"}`}
               >
                  Bacheca Condomini
               </button>
               <button
                  onClick={() => setActiveTab("avvisi")}
                  className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeTab === "avvisi" ? "bg-white shadow-sm text-slate-800" : "text-gray-500 hover:text-slate-700"}`}
               >
                  Avvisi Amministratore
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
               </button>
            </div>

            {activeTab === "bacheca" && (
              <Card className="rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 border-b border-gray-50 pb-5">
                    <div className="w-12 h-12 rounded-full flex gap-0 items-center justify-center font-bold text-blue-500 bg-blue-100/50 text-sm flex-shrink-0">
                      LG
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-[15px] text-slate-800">Laura (Int. 4)</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Oggi, 14:30</span>
                      <p className="text-[13px] text-slate-600 mt-3 leading-relaxed">
                        Ciao a tutti, qualcuno ha per caso ricevuto un pacco Amazon a mio nome? Il corriere dice di averlo lasciato nell'androne ma non lo trovo. Grazie!
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center gap-2 text-slate-500 cursor-pointer hover:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                    <span className="text-xs font-semibold">2 Risposte</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "avvisi" && (
              <Card className="rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <CardContent className="p-8 text-center text-sm text-gray-400 font-medium">
                  Nessun nuovo avviso dall'amministratore.
                </CardContent>
              </Card>
            )}

          </section>

          {/* Apertura al Vicinato */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1 mt-8 text-gray-500">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">3</div>
              <h2 className="text-[11px] font-bold tracking-widest uppercase">Apertura al Vicinato</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div onClick={() => alert("Feature Cerca Locali aperta")}>
                 <HubActionCard title="Cerca Locali" desc="Servizi in zona" icon={<MapPin className="text-indigo-500 w-6 h-6"/>} color="bg-indigo-50" />
               </div>
               <div onClick={() => {setShowMarketplace(true); setMarketStep("upload")}}>
                 <HubActionCard title="Marketplace" desc="Friction-zero AI" icon={<ShoppingBag className="text-teal-500 w-6 h-6"/>} color="bg-teal-50" hasAI />
               </div>
            </div>
            
            <div onClick={() => setShowNeighborhood(true)}>
              <Card className="rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center relative">
                      <Newspaper className="text-pink-500 w-6 h-6" />
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                         <Sparkles className="w-2 h-2" /> AI
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800">Rete di Quartiere</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Pattern Detection</p>
                    </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
                </CardContent>
              </Card>
            </div>
          </section>

        </div>
      </div>

      {/* AI Marketplace Modal */}
      {showMarketplace && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#0b1b3d]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-teal-500" />
                 <h2 className="text-lg font-bold text-slate-900">AI Marketplace</h2>
              </div>
              <button onClick={() => setShowMarketplace(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>

            {marketStep === "upload" && (
              <div 
                onClick={handleMarketUpload}
                className="border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-teal-50 transition-colors"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-teal-100 text-teal-600 mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Scatta una foto all'oggetto</h3>
                <p className="text-sm text-slate-500 mt-2">L'AI genererà titolo, descrizione e stima del valore per pubblicarlo con 1 solo tap.</p>
              </div>
            )}

            {marketStep === "analyzing" && (
              <div className="border border-gray-100 bg-gray-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-[264px]">
                <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin mb-4" />
                <h3 className="font-bold text-slate-800">Machine Vision in corso...</h3>
                <p className="text-sm text-slate-500 mt-2">Analisi dell'oggetto, stima dei prezzi online e generazione tags.</p>
              </div>
            )}

            {marketStep === "result" && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-2xl flex-shrink-0 bg-[url('https://picsum.photos/seed/bike/200/200?blur=1')] bg-cover bg-center border border-gray-300" />
                  <div className="space-y-1 w-full">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">AUTO-GENERATO DA AI</p>
                    <input type="text" defaultValue="Bicicletta City Bike B'Twin (Donna, Blu)" className="w-full font-bold text-slate-900 border-none bg-transparent hover:bg-gray-50 focus:bg-white rounded-lg p-1 -ml-1" />
                    <textarea defaultValue="Vendo bici usata in ottime condizioni. Pneumatici cambiati di recente, freno anteriore da calibrare." className="w-full text-sm text-slate-500 border-none bg-transparent hover:bg-gray-50 focus:bg-white rounded-lg p-1 -ml-1 resize-none h-16" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl border border-teal-100">
                   <div>
                     <p className="text-xs text-teal-800 font-medium">Stima di Mercato (AI)</p>
                     <div className="flex items-baseline gap-2 mt-0.5">
                       <span className="text-2xl font-extrabold text-teal-900">€ 85,00</span>
                       <span className="text-xs text-teal-600 line-through">€ 120,00 nuovo</span>
                     </div>
                   </div>
                   <TrendingUp className="w-8 h-8 text-teal-400 opacity-50" />
                </div>
                <button 
                  onClick={() => {alert("Annuncio Pubblicato nella bacheca di condominio/quartiere!"); setShowMarketplace(false);}}
                  className="w-full h-14 rounded-2xl bg-[#00d05e] hover:bg-[#00b853] text-white font-bold text-sm shadow-xl shadow-[#00d05e]/30 transition-all active:scale-95"
                >
                  PUBBLICA ANNUNCIO
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Rete Quartiere Modal */}
      {showNeighborhood && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#0b1b3d]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg text-white">
                   <Sparkles className="w-4 h-4" />
                 </div>
                 <h2 className="text-lg font-bold text-slate-900">AI Pattern Detection</h2>
              </div>
              <button onClick={() => setShowNeighborhood(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed px-1">
                L'Intelligenza Artificiale aggrega i ticket anonimizzati della zona per rilevare macro-criticità prima dell'amministrazione pubblica.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-amber-500" />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 bg-amber-100 text-amber-800 w-fit px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Anomalia di Quartiere (Q4)
                  </div>
                  <h3 className="text-xl font-extrabold text-amber-900 leading-tight">Problema Rete Idrica Condiviso</h3>
                  <p className="text-sm text-amber-800/80 font-medium">
                    Nelle ultime 48 ore, <strong>5 condomini diversi</strong> su Via Roma e Via Milano hanno aperto ticket riguardo cali di pressione dell'acqua calda.
                  </p>
                  <p className="text-xs text-amber-700/70 italic border-l-2 border-amber-300 pl-3">
                    "È altamente probabile un guasto all'acquedotto stradale principale. Vuoi generare una PEC automatica cumulativa da inviare al fornitore ACEA da parte dei 5 amministratori?"
                  </p>
                </div>
                <div className="flex gap-2 mt-5 relative z-10">
                  <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-12 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all">
                    Genera PEC ACEA
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-4">
                <span className="text-sm font-semibold text-slate-700">Altri 2 pattern lievi rilevati...</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

function HubActionCard({ title, desc, icon, color, hasAI }: { title: string, desc: string, icon: React.ReactNode, color: string, hasAI?: boolean }) {
  return (
    <Card className="rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer group flex items-start flex-col relative">
      {hasAI && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-teal-400 to-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
           <Sparkles className="w-2 h-2" /> AI
        </div>
      )}
      <CardContent className="p-5 space-y-4 w-full">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-[13px] text-slate-800 leading-tight">{title}</h4>
          <p className="text-[11px] text-slate-500 mt-1">{desc}</p>
        </div>
      </CardContent>
    </Card>
  )
}
