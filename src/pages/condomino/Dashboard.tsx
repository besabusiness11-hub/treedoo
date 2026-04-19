import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Building, FileText, PieChart, Edit3, Receipt, Users, Calendar, Wrench, MessageSquare, ArrowRight, Bell, User, LogOut, Info } from "lucide-react"
import { Link } from "react-router-dom"
import { DayPicker } from "react-day-picker"
import { it } from "date-fns/locale"
import "react-day-picker/dist/style.css"

export default function CondominoDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [dbUser, setDbUser] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('treedoo_user');
    if (saved) setDbUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('treedoo_user');
  };
  
  // Create some mock dates for events
  const today = new Date();
  const event1 = new Date();
  event1.setDate(today.getDate() + 4);
  const event2 = new Date();
  event2.setDate(today.getDate() + 11);

  return (
    <div className="animate-in fade-in duration-500 bg-gray-50 min-h-screen pb-32 relative">
      
      {/* Big Blue Header */}
      <header className="bg-[#1e3a8a] text-white pt-12 pb-10 px-6 rounded-b-[2.5rem] shadow-md relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-200">Bentornat{dbUser?.name?.endsWith('a') ? 'a' : 'o'}, {dbUser?.name?.split(' ')[0] || "Marco"}</p>
            <h1 className="text-[22px] font-extrabold tracking-tight">Il Mio Condominio</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-blue-100" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1e3a8a]" />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-800 border border-blue-700/50 flex flex-col justify-center items-center shadow-inner relative group cursor-pointer overflow-hidden">
              <Link to="/" onClick={handleLogout} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white z-10">
                <LogOut className="w-4 h-4 ml-0.5" />
              </Link>
              <User className="w-5 h-5 text-blue-100 group-hover:opacity-0 transition-opacity" />
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-4 relative z-20 space-y-6 pt-8">
        
        {/* Gestione Amministrativa (2x2 Grid) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">1</div>
            <h2 className="text-[11px] font-bold text-gray-500 tracking-widest">GESTIONE AMMINISTRATIVA</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DashboardTile icon={<PieChart className="w-6 h-6 text-blue-600" />} title="Bilancio" />
            <DashboardTile icon={<FileText className="w-6 h-6 text-blue-600" />} title="Regolamento" />
            <DashboardTile icon={<Edit3 className="w-6 h-6 text-blue-600" />} title="Verbali" />
            <Link to="/bollette">
              <DashboardTile icon={<Receipt className="w-6 h-6 text-blue-600" />} title="Bollette" hasNotification />
            </Link>
          </div>
        </section>

        {/* Gestione Proprietà (List) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1 mt-6">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">2</div>
            <h2 className="text-[11px] font-bold text-gray-500 tracking-widest">GESTIONE PROPRIETÀ</h2>
          </div>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 space-y-1">
              <CardContent className="p-3 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-slate-800 text-sm">Scadenze Pagamenti</h3>
                    <p className="text-[11px] text-slate-500 leading-tight">Rata Maggio:<br/>15/05</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-bold text-slate-800 mr-1">
                  € 125,00
                </div>
              </CardContent>
              
              <div className="h-px bg-gray-50 mx-4" />

              <Link to="/ticket" className="block">
                <CardContent className="p-3 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm opacity-50">Richiesta Manutenzioni</h3>
                    </div>
                  </div>
                </CardContent>
              </Link>
          </div>
        </section>

        {/* Calendario Condominiale */}
        <section className="space-y-3 pb-8">
          <div className="flex items-center gap-2 px-1 mt-6">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">3</div>
            <h2 className="text-[11px] font-bold text-gray-500 tracking-widest">CALENDARIO CONDOMINIALE</h2>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <style>
              {`
                .rdp {
                  --rdp-cell-size: 40px;
                  --rdp-accent-color: #3b82f6;
                  --rdp-background-color: #dbeafe;
                  margin: 0;
                  width: 100%;
                }
                .rdp-months {
                  justify-content: center;
                  width: 100%;
                }
                .rdp-month {
                  width: 100%;
                }
                .rdp-table {
                  width: 100%;
                  max-width: 100%;
                }
                .rdp-head_cell {
                  font-size: 0.8rem;
                  font-weight: 700;
                  color: #94a3b8;
                  text-transform: uppercase;
                }
                .rdp-day_selected {
                  background-color: #1e3a8a !important;
                }
              `}
            </style>
            <div className="flex justify-center -mt-2 mb-2">
              <DayPicker
                mode="single"
                locale={it}
                selected={date}
                onSelect={setDate}
                modifiers={{ event: [event1, event2] }}
                modifiersClassNames={{
                  event: "font-bold text-[#1e3a8a] bg-blue-50/80 rounded-full border border-blue-100 ring-2 ring-blue-50 relative",
                  today: "font-extrabold text-[#00d05e]"
                }}
              />
            </div>
            
            <div className="h-px bg-gray-50 my-6" />
            
            {/* Eventi in evidenza */}
            <div className="space-y-4">
              <h3 className="font-semibold tracking-tight text-slate-800 text-sm">Prossimi Eventi</h3>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center bg-blue-50/50 border border-blue-100 rounded-xl min-w-[3.5rem] h-14">
                  <span className="text-[10px] font-bold text-blue-400 uppercase leading-none">{event1.toLocaleString('it-IT', { month: 'short' })}</span>
                  <span className="text-lg font-extrabold text-[#1e3a8a] leading-none mt-1">{event1.getDate()}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 text-sm">Riunione Assemblea</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Approvazione preventivo facciata</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center bg-orange-50/50 border border-orange-100 rounded-xl min-w-[3.5rem] h-14">
                  <span className="text-[10px] font-bold text-orange-400 uppercase leading-none">{event2.toLocaleString('it-IT', { month: 'short' })}</span>
                  <span className="text-lg font-extrabold text-orange-600 leading-none mt-1">{event2.getDate()}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 text-sm">Lettura Contatori</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Tecnico: Mario Rossi (09:00 - 13:00)</p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* Floating Action Button bottom center */}
      <div className="fixed bottom-[96px] right-0 left-0 px-6 w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto z-40 pointer-events-none">
        <button className="w-full bg-[#00d05e] hover:bg-[#00b853] text-white shadow-xl shadow-[#00d05e]/30 rounded-2xl h-14 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 pointer-events-auto">
          <MessageSquare className="w-5 h-5" />
          COMUNICA CON AMMINISTRATORE
        </button>
      </div>

    </div>
  )
}

function DashboardTile({ icon, title, hasNotification }: { icon: React.ReactNode, title: string, hasNotification?: boolean }) {
  return (
    <Card className={`border-none shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer group bg-white rounded-3xl relative overflow-hidden`}>
      {hasNotification && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
      )}
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4 pt-8">
        <div className={`p-4 rounded-full bg-blue-50 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <span className="font-bold text-[13px] text-slate-800">{title}</span>
      </CardContent>
    </Card>
  )
}
