import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Building, FileText, PieChart, Edit3, Receipt, Users, Calendar, Wrench, MessageSquare, ArrowRight, Bell, User, LogOut, Info, Globe, Megaphone } from "lucide-react"
import { Link } from "react-router-dom"
import { DayPicker } from "react-day-picker"
import { it } from "date-fns/locale"
import "react-day-picker/dist/style.css"
import { useData } from "@/lib/DataContext"
import { useLanguage } from "@/lib/LanguageContext"
import { motion, AnimatePresence } from "framer-motion"

export default function CondominoDashboard() {
  const { data } = useData();
  const { lang, toggleLang, t } = useLanguage();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [dbUser, setDbUser] = useState<any>(null);
  useEffect(() => {
    const saved = localStorage.getItem('treedoo_user');
    if (saved) setDbUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleScroll = () => {
      setIsNotificationsOpen(false);
    };

    // Ascoltiamo lo scroll su tutta la finestra in modalità "capture" 
    // per intercettare anche lo scroll dei contenitori interni come <main>
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isNotificationsOpen]);

  const handleLogout = () => {
    localStorage.removeItem('treedoo_user');
  };
  
  const eventsModifiers = data.eventi.map(e => new Date(e.date));

  // Calcolo saldo condominiale da scadenze pendenti
  const totalScadenze = data.scadenze.reduce((acc, curr) => acc + curr.amount, 0);
  const nextScadenza = data.scadenze.length > 0 ? data.scadenze[0] : null;

  return (
    <div className="animate-in fade-in duration-500 bg-[#faf8f5] min-h-screen pb-32 relative text-slate-800">
      
      {/* Top Header */}
      <header className="pt-8 pb-6 px-6 relative z-50 flex justify-between items-center bg-[#faf8f5]">
        <div className="flex items-center gap-0 select-none text-[26px] font-bold tracking-tightest">
          <span className="text-black">tree</span>
          <span className="text-emerald-500">doo</span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full ml-1" />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`relative w-10 h-10 rounded-full border bg-white flex items-center justify-center shadow-sm transition-colors ${isNotificationsOpen ? 'border-emerald-300 text-emerald-600' : 'border-gray-200 text-gray-500'}`}>
              <Bell className="w-5 h-5" />
              {(data.tickets.filter(t => t.status === 'open').length > 0 || data.posts.some(p => p.isAvviso)) && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            
            {/* Tendina Notifiche */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm" 
                    onClick={() => setIsNotificationsOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-24 right-6 left-6 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] p-4 origin-top-right"
                  >
                    <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
                      Notifiche
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Oggi</span>
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {/* Avvisi Amministratore */}
                      {data.posts.filter(p => p.isAvviso).map(post => (
                        <div key={post.id} className="flex gap-3 items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Avviso dall'Amministratore</p>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{post.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Aggiornamenti Ticket */}
                      {data.tickets.filter(t => t.status === 'open').map(ticket => (
                        <div key={ticket.id} className="flex gap-3 items-start border-b border-gray-100/50 pb-3 last:border-0 last:pb-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Aggiornamento Ticket</p>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">Il ticket "{ticket.desc.substring(0, 30)}..." è in lavorazione.</p>
                          </div>
                        </div>
                      ))}

                      {/* Nessuna notifica fallback */}
                      {data.posts.filter(p => p.isAvviso).length === 0 && data.tickets.filter(t => t.status === 'open').length === 0 && (
                        <div className="text-center py-6 text-xs text-gray-400">
                          Zero notifiche da leggere.
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[#d0f0db] text-[#1a3322] font-bold text-sm shadow-sm flex items-center justify-center transition-colors">
            {lang}
          </button>
        </div>
      </header>

      <div className="px-6 relative z-20 space-y-6">
        
        {/* User Info */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">— {t('salutation')}, {dbUser?.name?.split(' ')[0] || "UTENTE"}</p>
          <h1 className="text-[26px] font-bold leading-tight text-[#1a3322]">Via Garibaldi 15<br/><span className="text-gray-400">Int. 3A</span></h1>
        </div>

        {/* Big Balance Card */}
        <div className="bg-gradient-to-br from-[#1a3322] via-emerald-900 to-[#1a3322] rounded-[2rem] p-6 shadow-xl shadow-emerald-900/20 border border-emerald-800/50 relative overflow-hidden animate-in zoom-in-95 fade-in duration-1000 ease-out fill-mode-both">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <p className="text-[10px] font-bold text-[#a5cdb0] tracking-widest uppercase">{t('condominium_balance')}</p>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${totalScadenze > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-[#a5cdb0]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${totalScadenze > 0 ? 'bg-amber-400' : 'bg-[#4ade80]'}`} />
              {totalScadenze > 0 ? t('pending') : t('in_order')}
            </div>
          </div>
          <h2 className="text-[40px] font-extrabold text-white tracking-tight relative z-10 font-sans mb-8">
             € {totalScadenze > 0 ? totalScadenze.toFixed(2) : "0.00"}
          </h2>
          
          <div className="border-t border-white/10 pt-4 relative z-10">
             <p className="text-[10px] font-bold text-[#a5cdb0] tracking-widest uppercase mb-1">{t('next_deadline')}</p>
             <div className="flex justify-between items-end">
               <div>
                 <p className="text-sm font-bold text-white">{nextScadenza?.title || t('no_deadlines')}</p>
                 <p className="text-[11px] text-[#a5cdb0] font-medium mt-0.5">
                   {nextScadenza ? `${nextScadenza.dateStr.split(' ')[0]} • € ${nextScadenza.amount.toFixed(2)}` : '--'}
                 </p>
               </div>
               {totalScadenze > 0 && (
                 <button className="bg-[#4ade80] hover:bg-[#3bcc68] text-[#1a3322] px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-1.5">
                   {t('pay')} <ArrowRight className="w-3.5 h-3.5" />
                 </button>
               )}
             </div>
          </div>
        </div>
        
        {/* Gestione Amministrativa (2x2 Grid) */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-gray-200/60 flex items-center justify-center text-[9px] font-mono font-bold text-gray-500">01</div>
               <h2 className="text-[11px] font-mono font-bold text-gray-500 tracking-widest">{t('administrative')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/bilancio">
              <DashboardTile icon={<PieChart className="w-5 h-5 text-indigo-500" />} title={t('balance')} subtext={data.bilanci.length > 0 ? `${data.bilanci.length} ${t('published')}` : "Nessuno"} hasNotification={data.bilanci.length > 0} />
            </Link>
            <Link to="/regolamento">
              <DashboardTile icon={<FileText className="w-5 h-5 text-amber-500" />} title={t('regulations')} subtext={data.regolamento ? `Agg. ${data.regolamento.date.split('/')[2]}` : "Nessuno"} hasNotification={data.regolamento !== null} />
            </Link>
            <Link to="/verbali">
              <DashboardTile icon={<Edit3 className="w-5 h-5 text-rose-500" />} title={t('minutes')} subtext={data.verbali.length > 0 ? `${data.verbali.length} ${t('published')}` : "Nessuno"} hasNotification={data.verbali.length > 0} />
            </Link>
            <Link to="/bollette">
              <DashboardTile icon={<Receipt className="w-5 h-5 text-emerald-500" />} title={t('bills')} subtext="Consumi effettivi" isBollette />
            </Link>
          </div>
        </section>

        {/* Gestione Proprietà (List) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1 mt-6">
            <div className="w-5 h-5 rounded-full bg-gray-200/60 flex items-center justify-center text-[9px] font-mono font-bold text-gray-500">02</div>
            <h2 className="text-[11px] font-mono font-bold text-gray-500 tracking-widest">{t('property')}</h2>
          </div>
          <div className="bg-white rounded-3xl pb-2 shadow-sm border border-gray-100 space-y-1 overflow-hidden">
              {data.scadenze.length > 0 ? data.scadenze.map((s, index) => (
                <div key={s.id}>
                  <CardContent className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl ${s.urgent ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#fff4e5] text-[#b88645] border-[#f5dfc3]'} flex items-center justify-center border shadow-sm`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-slate-800 text-sm">{s.title}</h3>
                        <p className="text-[11px] font-mono text-slate-500 leading-tight">{s.urgent ? t('extraordinary') : t('ordinary')} • {s.dateStr.split(' ')[0]}</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mr-2">
                      €{s.amount.toFixed(0)}
                    </div>
                  </CardContent>
                  {index < data.scadenze.length - 1 && <div className="h-px bg-gray-100 mx-6" />}
                </div>
              )) : (
                <div className="p-5 text-center text-sm font-mono text-slate-500">Nessuna scadenza.</div>
              )}

              <div className="h-px bg-gray-100 mx-6" />

              <Link to="/ticket" className="block">
                <CardContent className="p-4 pt-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-200 shadow-sm">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{t('services')} Manutenzioni</h3>
                      <p className="text-[11px] font-mono text-slate-500">Apri ticket per guasti</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#4ade80] transition-colors" />
                </CardContent>
              </Link>
          </div>
        </section>

        {/* Calendario Condominiale */}
        <section className="space-y-3 pb-8">
          <div className="flex items-center gap-2 px-1 mt-6">
            <div className="w-5 h-5 rounded-full bg-gray-200/60 flex items-center justify-center text-[9px] font-mono font-bold text-gray-500">03</div>
            <h2 className="text-[11px] font-mono font-bold text-gray-500 tracking-widest">CALENDARIO</h2>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-gray-100 mt-2">
            <style>
              {`
                .rdp {
                  --rdp-cell-size: min(10vw, 36px);
                  --rdp-accent-color: #4ade80;
                  margin: 0 auto;
                  max-width: 100%;
                }
                @media (min-width: 400px) {
                  .rdp { --rdp-cell-size: 38px; }
                }
                @media (min-width: 640px) {
                  .rdp { --rdp-cell-size: 42px; }
                }
                .rdp-month {
                  width: 100%;
                }
                .rdp-table {
                  margin: 0 auto;
                  max-width: 100%;
                }
                .rdp-caption {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: relative;
                  margin-bottom: 0.5rem;
                }
                .rdp-nav {
                  position: absolute;
                  width: 100%;
                  display: flex;
                  justify-content: space-between;
                  top: 50%;
                  transform: translateY(-50%);
                  pointer-events: none;
                }
                .rdp-nav_button {
                  pointer-events: auto;
                }
                .rdp-head_cell {
                  font-size: 0.75rem;
                  font-weight: 700;
                  color: #94a3b8;
                  text-transform: uppercase;
                }
                .rdp-caption_label {
                  font-size: 1.1rem;
                  font-weight: 800;
                  text-transform: capitalize;
                }
                .rdp-day_selected {
                  background-color: #4ade80 !important;
                  color: #1a3322 !important;
                }
              `}
            </style>
            <div className="flex justify-center -mt-2 mb-2 w-full rdp-wrapper-clean">
              <DayPicker
                mode="single"
                locale={it}
                selected={date}
                onSelect={setDate}
                modifiers={{ event: eventsModifiers }}
                modifiersClassNames={{
                  event: "font-bold text-[#1a3322] bg-[#a5cdb0]/30 rounded-full border border-[#a5cdb0]/50 relative",
                  today: "font-extrabold text-[#4ade80]"
                }}
              />
            </div>
            
            <div className="h-px bg-gray-50 my-6" />
            
            {/* Eventi in evidenza */}
            <div className="space-y-4">
              <h3 className="font-semibold tracking-tight text-slate-800 text-sm">Prossimi Eventi</h3>
              
              {data.eventi.length > 0 ? data.eventi.map(ev => {
                 const evDate = new Date(ev.date);
                 return (
                   <div key={ev.id} className="flex gap-4">
                     <div className="flex flex-col items-center justify-center bg-blue-50/50 border border-blue-100 rounded-xl min-w-[3.5rem] h-14">
                       <span className="text-[10px] font-bold text-blue-400 uppercase leading-none">{evDate.toLocaleString('it-IT', { month: 'short' })}</span>
                       <span className="text-lg font-extrabold text-[#1e3a8a] leading-none mt-1">{evDate.getDate()}</span>
                     </div>
                     <div className="flex flex-col justify-center">
                       <h4 className="font-bold text-slate-800 text-sm">{ev.title}</h4>
                       <p className="text-xs text-slate-500 font-medium mt-0.5">{ev.desc}</p>
                     </div>
                   </div>
                 )
              }) : (
                 <p className="text-sm text-slate-500 py-2">Nessun evento a calendario.</p>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Floating Action Button Bottom Right */}
      <div className="fixed bottom-[80px] right-4 z-40 group">
        <Link to="/social?msgadmin=1" className="bg-[#4ade80] hover:bg-[#3bcc68] text-[#1a3322] shadow-xl shadow-[#4ade80]/30 rounded-full h-12 w-12 flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative border-2 border-white">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-[#1a3322] text-white text-xs font-bold rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t('contact_admin')}
          </span>
        </Link>
      </div>

    </div>
  )
}

function DashboardTile({ icon, title, subtext, hasNotification, isBollette }: { icon: React.ReactNode, title: string, subtext: string, hasNotification?: boolean, isBollette?: boolean }) {
  return (
    <Card className="rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-white group cursor-pointer h-[115px]">
      {hasNotification && (
        <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[#4ade80] z-10" />
      )}
      <CardContent className="p-4 flex flex-col h-full justify-between relative z-0">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-sm text-[#1a3322] leading-tight mb-0.5">{title}</h3>
          <p className="text-[9px] font-mono text-gray-400 font-bold">{subtext}</p>
        </div>
        
        {isBollette && (
          <div className="absolute bottom-3 right-3 opacity-60">
            {/* Sparkline decorativa SVG basata sul mockup verde */}
             <svg width="35" height="15" viewBox="0 0 35 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 13 L8 5 L15 1 L22 8 L30 11 L34 11" stroke="#1a3322" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="34" cy="11" r="2" fill="#4ade80"/>
             </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
