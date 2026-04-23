import { useData } from "@/lib/DataContext"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, ArrowLeft, Info, ShieldCheck, Calendar } from "lucide-react"
import { Link } from "react-router-dom"

export default function Regolamento() {
  const { data } = useData()
  const regolamento = data.regolamento

  return (
    <div className="animate-in fade-in duration-500 bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <header className="bg-[#1e3a8a] text-white pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/dashboard" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight">Regolamento Condominiale</h1>
        </div>
        <p className="text-blue-200 text-sm">Le regole del tuo condominio, definite dall'amministratore.</p>
      </header>

      <div className="px-6 pt-6 space-y-4">
        {regolamento ? (
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{regolamento.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">Aggiornato il {regolamento.date} • {regolamento.author}</span>
                  </div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{regolamento.content}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="font-bold text-slate-700 text-lg">Regolamento non ancora disponibile</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-[280px]">
              L'amministratore non ha ancora pubblicato il regolamento condominiale.
            </p>
            <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left max-w-sm">
              <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                Invia una richiesta all'amministratore tramite il pulsante "Comunica con Amministratore" nella Dashboard per sollecitare la pubblicazione del regolamento.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
