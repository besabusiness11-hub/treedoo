import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileUp, Sparkles, TrendingDown, Bolt, AlertTriangle, RefreshCw, Loader2 } from "lucide-react"

const MOCK_DATA = [
  { name: 'Gen', consumo: 400 },
  { name: 'Feb', consumo: 380 },
  { name: 'Mar', consumo: 290 },
  { name: 'Apr', consumo: 220 },
  { name: 'Mag', consumo: 180 },
  { name: 'Giu', consumo: 240 },
];

export default function Bollette() {
  const [data, setData] = useState<{name: string, consumo: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fake network request delay
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          // Simulation: 25% chance of network failure to show off the Error Boundary
          if (Math.random() < 0.25) {
             reject(new Error("Timeout del server (simulato)"));
          } else {
             resolve();
          }
        }, 1200);
      });
      setData(MOCK_DATA);
    } catch (err: any) {
      setError("Impossibile caricare i dati di consumo. Verifica la connessione.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bollette & Consumi</h2>
        <p className="text-sm text-slate-500">Monitora i consumi condominiali e carica le tue bollette per l'analisi intelligente.</p>
      </div>

      <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-none shadow-xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-200 text-sm font-medium">Spesa Media Mensile</p>
              <h3 className="text-4xl font-extrabold mt-1">€ 142.50</h3>
            </div>
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Bolt className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          
          <div className="h-[200px] w-full mt-4">
            {isLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <p className="text-xs text-blue-200 font-medium tracking-wide">Recupero consumi...</p>
              </div>
            ) : error ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-red-950/20 rounded-xl border border-red-500/20 text-center p-4">
                <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
                <p className="text-[13px] font-medium text-rose-200/90 mb-4">{error}</p>
                <Button 
                  onClick={fetchChartData} 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white transition-colors"
                >
                   <RefreshCw className="w-4 h-4 mr-2" /> Riprova
                </Button>
              </div>
            ) : (
              <div className="h-full w-full filter drop-shadow-md">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Line type="monotone" dataKey="consumo" stroke="#38bdf8" strokeWidth={4} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50/30">
        <CardHeader className="pb-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
               <Sparkles className="w-5 h-5" />
             </div>
             <div>
                <CardTitle className="text-blue-900">AI Energy Optimization</CardTitle>
                <CardDescription>Analizziamo le tue bollette tramite OCR per suggerirti risparmi.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm flex items-start gap-4">
            <TrendingDown className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Suggerimento del mese</h4>
              <p className="text-sm text-slate-600 mt-1">Il tuo consumo energetico è salito del 15% rispetto a Giugno scorso. Ti suggeriamo di programmare il condizionatore solo nelle ore di punta o proporre al condominio l'attivazione di una Comunità Energetica (CER).</p>
            </div>
          </div>
          
          <Button variant="outline" className="w-full border-dashed border-2 hover:bg-blue-50 border-blue-200 text-blue-700 h-12 flex gap-2">
            <FileUp className="w-4 h-4" />
            CARICA NUOVA BOLLETTA (OCR)
          </Button>
        </CardContent>
      </Card>
      
    </div>
  )
}
