import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CloudUpload, CheckCircle2, X, Wrench, ArrowRight, Bot, ChevronRight, Sparkles, Loader2, Home, Tv, Lightbulb, Thermometer, Camera, Image } from "lucide-react"
import { useData } from "@/lib/DataContext"
import { useAuth } from "@/lib/AuthContext"
import { ollamaService } from "@/lib/ollama"
import { motion, AnimatePresence } from "framer-motion"

export default function TicketForm() {
  const navigate = useNavigate()
  const { addTicketWithFile } = useData()
  const { user } = useAuth()

  const [activeView, setActiveView] = useState<"main" | "ticket" | "domotica">("main")

  // Ticket State
  const [ticketStep, setTicketStep] = useState<"form" | "loading" | "ai-analysis" | "success">("form")
  const [desc, setDesc] = useState("")
  const [type, setType] = useState("idraulico")
  const [aiData, setAiData] = useState<{manualName:string, diagnosis:string, solution:string} | null>(null)
  const [ticketFile, setTicketFile] = useState<File | null>(null)
  const ticketFileRef = useRef<HTMLInputElement>(null)

  // Domotica State
  const [deviceDesc, setDeviceDesc] = useState("")
  const [deviceQuery, setDeviceQuery] = useState("")
  const [domoticaStep, setDomoticaStep] = useState<"form" | "loading" | "result">("form")
  const [domoticaResult, setDomoticaResult] = useState<string | null>(null)
  const [deviceFile, setDeviceFile] = useState<File | null>(null)
  const deviceFileRef = useRef<HTMLInputElement>(null)

  // Ticket Logic
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTicketStep("loading")
    try {
      const result = await ollamaService.analyzeTicket(desc)
      setAiData(result)
      setTicketStep("ai-analysis")
    } catch (err) {
      console.error(err)
      await publishTicket()
    }
  }

  const publishTicket = async () => {
    await addTicketWithFile({ desc, type, author: user?.name || "Condomino" }, ticketFile)
    setTicketStep("success")
  }

  // Domotica Logic
  const handleDomoticaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDomoticaStep("loading")
    try {
      const fullContext = deviceFile ? `[FOTO ALLEGATA: ${deviceFile.name}] Il dispositivo è: ${deviceDesc}` : `Il dispositivo è: ${deviceDesc}`;
      const res = await ollamaService.analyzeHomeDevice(fullContext, deviceQuery || "Spiegami come funziona")
      setDomoticaResult(res)
      setDomoticaStep("result")
    } catch (err) {
      console.error(err)
      setDomoticaResult("Errore di connessione con l'Assistente Domotico.")
      setDomoticaStep("result")
    }
  }

  return (
    <div className="animate-in fade-in duration-500 bg-[#faf8f5] min-h-screen pb-32 relative text-slate-800">
      
      {/* Header Comune (Green Banner) */}
      <header className="bg-gradient-to-br from-[#1a3322] via-emerald-900 to-[#1a3322] text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-lg shadow-emerald-900/20 sticky top-0 z-10 border-b border-emerald-800/50 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-md">Gestione</h1>
          <p className="text-emerald-200/80 text-sm mt-1 font-medium">Gestione dispositivi e segnalazioni</p>
        </div>
        {activeView !== "main" && (
          <button onClick={() => { setActiveView("main"); setTicketStep("form"); setDomoticaStep("form"); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* --- MAIN MENU --- */}
      <div className="px-6 pt-6 space-y-4 animate-in fade-in duration-300">
        <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Cosa ti serve?</h2>
        
        <div onClick={() => setActiveView("ticket")} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform">
            <Wrench className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-800">Ticket Condominiale</h3>
            <p className="text-xs text-slate-500 mt-1">Segnala un guasto o un problema all'Amministratore.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </div>

        <div onClick={() => setActiveView("domotica")} className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 hover:shadow-md transition-all cursor-pointer group flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
             <Sparkles className="w-3 h-3" /> AI
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
            <Tv className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-800">Assistente Dispositivi</h3>
            <p className="text-xs text-slate-500 mt-1">Scatta una foto al tuo elettrodomestico per capire come usarlo.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {/* --- MODAL TICKET --- */}
      <AnimatePresence>
        {activeView === "ticket" && (
          <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 400) {
                  setActiveView("main");
                  setTicketStep("form");
                }
              }}
              className="bg-white rounded-t-[2.5rem] p-6 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto max-h-[90dvh] min-h-[50dvh] mb-0 flex flex-col"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0" />

              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex justify-center items-center">
                      <Wrench className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nuova Richiesta</h2>
                </div>
                <button onClick={() => { setActiveView("main"); setTicketStep("form"); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 scrollbar-none pb-2">
                {ticketStep === "form" && (
              <form onSubmit={handleTicketSubmit} className="space-y-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-700 font-bold text-sm">Tipo di Intervento</Label>
                  <Select id="type" className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:ring-[#00d05e]" value={type} onChange={(e) => setType(e.target.value)} required>
                    <option value="idraulico">Idraulico</option>
                    <option value="elettrico">Elettrico</option>
                    <option value="strutturale">Strutturale</option>
                    <option value="altro">Altro</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-slate-700 font-bold text-sm">Descrizione del problema</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Es. 'La caldaia segna errore E03'..." 
                    className="h-32 resize-none rounded-xl border-gray-200 shadow-sm pt-4 px-4 focus:ring-[#00d05e]"
                    value={desc} onChange={(e) => setDesc(e.target.value)} required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-sm flex items-center justify-between">
                    <span>Allega Foto (Opzionale)</span>
                  </Label>
                  <input ref={ticketFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setTicketFile(e.target.files?.[0] || null)} />
                  <div onClick={() => ticketFileRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-40 group ${ticketFile ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200 bg-gray-50/50 hover:bg-gray-50'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm border mb-3 group-hover:scale-110 transition-transform ${ticketFile ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-emerald-100 text-emerald-500'}`}>
                      {ticketFile ? <CheckCircle2 className="w-6 h-6" /> : <CloudUpload className="w-6 h-6" />}
                    </div>
                    <p className="text-[13px] font-bold text-slate-700">{ticketFile ? ticketFile.name : "Carica Foto del Guasto"}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-[#00d05e]/30 bg-[#00d05e] hover:bg-[#00b853] text-white flex gap-2">
                    <Sparkles className="w-5 h-5 content-baseline" />
                    ANALIZZA GUASTO
                  </Button>
                </div>
              </form>
            )}

            {ticketStep === "loading" && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mb-4" />
                <h3 className="font-bold text-slate-800 text-lg">Analisi in corso...</h3>
              </div>
            )}

            {ticketStep === "ai-analysis" && aiData && (
              <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white overflow-hidden rounded-3xl">
                <CardHeader className="bg-emerald-500/10 border-b border-emerald-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-lg text-white"><Bot className="w-6 h-6" /></div>
                    <div>
                       <CardTitle className="text-emerald-900">AI Home Assistant</CardTitle>
                       <CardDescription className="text-emerald-700">{aiData.manualName}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-700 leading-relaxed"><strong className="text-slate-900">Diagnosi IAM:</strong> {aiData.diagnosis}</p>
                    <div className="bg-white border border-emerald-100 rounded-lg p-4 shadow-sm space-y-2">
                      <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Soluzione Consigliata:</h4>
                      <p className="text-sm text-slate-600">{aiData.solution}</p>
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col gap-3">
                    <Button variant="outline" className="w-full h-12 rounded-xl text-emerald-700 border-emerald-200" onClick={() => setActiveView("main")}>
                      Problema Risolto (Annulla)
                    </Button>
                    <Button onClick={() => publishTicket()} className="w-full h-12 rounded-xl bg-slate-900 text-white">
                      Il problema persiste, invia all'Admin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {ticketStep === "success" && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4"><CheckCircle2 className="w-10 h-10" /></div>
                <h3 className="text-2xl font-bold text-slate-900">Ticket Inviato!</h3>
                <p className="text-slate-500 max-w-xs">L'amministratore è stato notificato. Riceverai aggiornamenti a breve.</p>
                <Button variant="outline" className="mt-6 rounded-xl border-gray-200" onClick={() => { setActiveView("main"); setTicketStep("form"); }}>Torna alla Home</Button>
              </div>
            )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL DOMOTICA --- */}
      <AnimatePresence>
        {activeView === "domotica" && (
          <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 400) {
                  setActiveView("main");
                  setDomoticaStep("form");
                }
              }}
              className="bg-white rounded-t-[2.5rem] p-6 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto max-h-[90dvh] min-h-[50dvh] mb-0 flex flex-col"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0" />

              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex justify-center items-center">
                      <Tv className="w-5 h-5" />
                   </div>
                   <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assistente Domotico</h2>
                </div>
                <button onClick={() => { setActiveView("main"); setDomoticaStep("form"); }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 scrollbar-none pb-2">
                {domoticaStep === "form" && (
              <form onSubmit={handleDomoticaSubmit} className="space-y-5 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="bg-emerald-50 p-4 rounded-xl text-emerald-800 text-sm font-medium flex gap-3 border border-emerald-100">
                   <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                   <p>Inserisci i dati del tuo elettrodomestico (es. foto, marca, modello) e chiedi a Treedoo come funziona.</p>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-slate-700 font-bold text-sm">Aggiungi Foto o Documento</Label>
                  <input ref={deviceFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setDeviceFile(e.target.files?.[0] || null)} />
                  <div
                    onClick={() => deviceFileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${deviceFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-3 ${deviceFile ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                      {deviceFile ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                    </div>
                    <p className={`text-[13px] font-bold ${deviceFile ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {deviceFile ? deviceFile.name : "Carica Foto Dispositivo"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-sm">Di che dispositivo si tratta?</Label>
                  <input 
                    type="text" 
                    placeholder="Es. Condizionatore Daikin, Lavatrice LG..." 
                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white px-4 text-sm outline-none focus:border-emerald-500 transition-colors"
                    value={deviceDesc} onChange={(e) => setDeviceDesc(e.target.value)} required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold text-sm">Cosa vuoi sapere?</Label>
                  <Textarea 
                    placeholder="Es. Come imposto la modalità deumidificatore? Come pulisco i filtri?" 
                    className="h-24 resize-none rounded-xl border border-gray-200 bg-gray-50 focus:bg-white p-4 text-sm outline-none focus:border-emerald-500 transition-colors"
                    value={deviceQuery} onChange={(e) => setDeviceQuery(e.target.value)} required
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={!deviceDesc || !deviceQuery} className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-teal-500/30 bg-teal-600 hover:bg-teal-700 text-white flex gap-2">
                    <Bot className="w-5 h-5 content-baseline" />
                    CHIEDI ALL'ASSISTENTE
                  </Button>
                </div>
              </form>
            )}

            {domoticaStep === "loading" && (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin mb-4" />
                <h3 className="font-bold text-slate-800 text-lg">Analizzo il dispositivo...</h3>
                <p className="text-sm text-slate-500 max-w-[200px]">Consultazione dei manuali virtuali in corso.</p>
              </div>
            )}

            {domoticaStep === "result" && domoticaResult && (
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
                    <Thermometer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Guida Dispositivo</h3>
                    <p className="text-xs text-slate-500 capitalize">{deviceDesc}</p>
                  </div>
                </div>
                
                <div className="prose prose-sm prose-slate max-w-none text-[13px] leading-relaxed">
                  {domoticaResult.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button variant="outline" className="w-full h-12 rounded-xl text-slate-600 border-gray-200" onClick={() => { setDomoticaStep("form"); setDeviceQuery(""); setDeviceFile(null); }}>
                    Fai un'altra domanda
                  </Button>
                </div>
              </div>
            )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
