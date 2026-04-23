import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CloudUpload, CheckCircle2, X, Wrench, Send, Bot, ChevronRight, Sparkles, Loader2 } from "lucide-react"
import { useData } from "@/lib/DataContext"
import { ollamaService } from "@/lib/ollama"

export default function TicketForm() {
  const navigate = useNavigate()
  const { addTicket } = useData()
  const [dbUser, setDbUser] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('treedoo_user');
    if (saved) setDbUser(JSON.parse(saved));
    
    // Lock background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const [step, setStep] = useState<"form" | "loading" | "ai-analysis" | "success">("form")
  const [desc, setDesc] = useState("")
  const [type, setType] = useState("idraulico")
  const [aiData, setAiData] = useState<{manualName:string, diagnosis:string, solution:string} | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep("loading")
    try {
      const result = await ollamaService.analyzeTicket(desc)
      setAiData(result)
      setStep("ai-analysis")
    } catch (err) {
      console.error(err)
      // Se fallisce andiamo dritti alla pubblicazione
      publishTicket()
    }
  }

  const publishTicket = () => {
    addTicket({
      desc,
      type,
      author: dbUser?.name || "Condomino",
    })
    setStep("success")
  }

  return (
    <div className="animate-in slide-in-from-bottom pt-12 bg-slate-900/40 fixed inset-0 z-50 overflow-y-auto overscroll-contain block">
      
      <div className="bg-white rounded-t-[2.5rem] p-6 pb-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto min-h-[calc(100dvh-3rem)] mb-0">
        
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex justify-center items-center">
                <Wrench className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nuova Richiesta</h2>
          </div>
          <button onClick={() => navigate("/dashboard")} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Descrivi dettagliatamente il problema riscontrato (es. 'Il frigorifero fa un rumore strano e non raffredda', oppure 'La caldaia segna errore E03')..." 
                  className="h-32 resize-none rounded-xl border-gray-200 shadow-sm pt-4 px-4 focus:ring-[#00d05e]"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-bold text-sm flex items-center justify-between">
                  <span>Allega Foto (Opzionale)</span>
                </Label>
                <div className="border-2 border-dashed border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors h-40 group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100 text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
                    <CloudUpload className="w-6 h-6" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-700">Carica Foto del Guasto</p>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-bold shadow-xl shadow-[#00d05e]/30 bg-[#00d05e] hover:bg-[#00b853] text-white flex gap-2">
                  <Sparkles className="w-5 h-5 content-baseline" />
                  ANALIZZA CON HOME ASSISTANT
                </Button>
              </div>
            </form>
        )}

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mb-4" />
          <h3 className="font-bold text-slate-800 text-lg">L'Intelligenza Artificiale ci sta pensando...</h3>
          <p className="text-sm text-slate-500 max-w-[200px]">Sto interrogando i manuali tecnici virtuali per formulare una diagnosi sicura.</p>
        </div>
      )}

      {step === "ai-analysis" && aiData && (
        <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white overflow-hidden animate-in zoom-in-95 duration-300 rounded-3xl">
          <CardHeader className="bg-emerald-500/10 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                 <CardTitle className="text-emerald-900">AI Home Assistant</CardTitle>
                 <CardDescription className="text-emerald-700">{aiData.manualName}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Diagnosi IAM:</strong> {aiData.diagnosis}
              </p>
              <div className="bg-white border border-emerald-100 rounded-lg p-4 shadow-sm space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Soluzione Consigliata:
                </h4>
                <p className="text-sm text-slate-600">
                  {aiData.solution}
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button type="button" variant="outline" className="w-full flex justify-between items-center h-12 rounded-xl text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => setStep("form")}>
                <span>Problema Risolto (Annulla Ticket)</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button onClick={publishTicket} className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                Il problema persiste, invia all'Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in zoom-in-90 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Ticket Inviato!</h3>
          <p className="text-slate-500 max-w-xs">L'amministratore è stato notificato. Riceverai aggiornamenti a breve.</p>
          <Button variant="outline" className="mt-6 rounded-xl border-gray-200" onClick={() => navigate("/dashboard")}>
            Torna alla Dashboard
          </Button>
        </div>
      )}

      </div>
    </div>
  )
}
