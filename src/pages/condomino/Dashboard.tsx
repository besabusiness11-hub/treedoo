import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Building, FileText, PieChart, Edit3, Receipt, Users, Calendar, Wrench, MessageSquare, ArrowRight, Bell, User, LogOut, Info, Globe, Megaphone, Check, MapPin, ChevronDown, Plus, Trash2, X, Loader2, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { DayPicker } from "react-day-picker"
import { it } from "date-fns/locale"
import "react-day-picker/dist/style.css"
import { useData } from "@/lib/DataContext"
import { useLanguage } from "@/lib/LanguageContext"
import { useResidences } from "@/lib/ResidenceContext"
import { useAuth } from "@/lib/AuthContext"
import { usePushNotifications } from "@/lib/usePushNotifications"
import { motion, AnimatePresence } from "framer-motion"
import { ollamaService } from "@/lib/ollama"

export default function CondominoDashboard() {
  const { data, addTicket, payScadenza } = useData();
  const { lang, toggleLang, t } = useLanguage();
  const { residences, currentResidence, setResidence, addResidence, removeResidence, autoSwitch, setAutoSwitch, isNearAny } = useResidences();
  const { user: dbUser, logout } = useAuth();
  const { state: pushState, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Add Residence states
  const [isAddingResidence, setIsAddingResidence] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newInt, setNewInt] = useState("");
  const [isLocatingNew, setIsLocatingNew] = useState(false);

  // TreeBot states
  const [isTreebotOpen, setIsTreebotOpen] = useState(false);
  const [treebotInput, setTreebotInput] = useState("");
  const [treebotHistory, setTreebotHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Ciao! Sono TreeBot, il tuo assistente condominiale virtuale. Come posso aiutarti?' }
  ]);
  const [isTreebotThinking, setIsTreebotThinking] = useState(false);

  useEffect(() => {
    if (!isNotificationsOpen && !isSettingsOpen) return;

    const handleScroll = () => {
      setIsNotificationsOpen(false);
      setIsSettingsOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isNotificationsOpen, isSettingsOpen]);

  const handleLogout = () => {
    logout();
  };

  const handleTreebotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treebotInput.trim() || isTreebotThinking) return;

    const userQuery = treebotInput.trim();
    const newHistory = [...treebotHistory, { role: 'user' as const, content: userQuery }];
    setTreebotHistory(newHistory);
    setTreebotInput("");
    setIsTreebotThinking(true);

    try {
      let response = await ollamaService.chatWithTreebot(treebotHistory, userQuery);

      // Handle Escalation
      if (response.includes("ESCALATION_ADMIN")) {
        const parts = response.split("|||");
        response = parts[1] ? parts[1].trim() : "Non sono in grado di gestire questa richiesta specifica. Ho inviato un resoconto all'amministratore.";

        // Save ticket/message for admin
        addTicket({
          desc: `[TreeBot Escalation] L'utente ha chiesto: "${userQuery}". Il bot non ha saputo rispondere.`,
          type: "altro",
          author: dbUser?.name || "Condomino"
        });
      }

      setTreebotHistory([...newHistory, { role: 'assistant', content: response }]);
    } catch (err) {
      setTreebotHistory([...newHistory, { role: 'assistant', content: "Errore di connessione." }]);
    } finally {
      setIsTreebotThinking(false);
    }
  };

  const eventsModifiers = {
    meeting: data.eventi.filter(e => e.type === 'meeting').map(e => new Date(e.date)),
    maintenance: data.eventi.filter(e => e.type === 'maintenance').map(e => new Date(e.date)),
    social: data.eventi.filter(e => e.type === 'social').map(e => new Date(e.date)),
    holiday: data.eventi.filter(e => e.type === 'holiday').map(e => new Date(e.date)),
  };

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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

          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-10 h-10 rounded-full font-bold text-sm shadow-sm flex items-center justify-center transition-all border ${isSettingsOpen ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-[#d0f0db] text-[#1a3322] border-emerald-100 hover:bg-emerald-200'}`}
            >
              <Globe className="w-5 h-5" />
            </button>

            {/* Settings Dropdown */}
            <AnimatePresence>
              {isSettingsOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-24 right-6 left-6 sm:left-auto sm:w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[60] p-5 origin-top-right overflow-hidden"
                  >
                    <div className="space-y-6">
                      {/* Language Section */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">{t('language')}</p>
                        <div className="flex gap-2">
                          {['IT', 'EN'].map((l) => (
                            <button
                              key={l}
                              onClick={() => { if (lang !== l) toggleLang(); }}
                              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border ${lang === l ? 'bg-[#1a3322] text-white border-[#1a3322]' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
                            >
                              {l === 'IT' ? 'Italiano' : 'English'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Residences Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{t('my_residences')}</p>
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${autoSwitch ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                            <span className={`w-1 h-1 rounded-full ${autoSwitch ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-tight">GPS</span>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                          {residences.map((res) => (
                            <div key={res.id} className="relative group">
                              <button
                                onClick={() => { setResidence(res.id); setIsSettingsOpen(false); }}
                                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${currentResidence.id === res.id ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:border-emerald-200'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${currentResidence.id === res.id ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                    <Building className="w-4 h-4" />
                                  </div>
                                  <div className="max-w-[140px]">
                                    <p className={`text-xs font-bold truncate ${currentResidence.id === res.id ? 'text-emerald-900' : 'text-slate-700'}`}>{res.address}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{res.interior}</p>
                                  </div>
                                </div>
                                {currentResidence.id === res.id && <Check className="w-4 h-4 text-emerald-500" />}
                              </button>
                              {residences.length > 1 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeResidence(res.id); }}
                                  className="absolute -right-1 -top-1 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-red-100 hover:bg-red-100 shadow-sm"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Residence Form/Button */}
                        <div className="mt-3">
                          {isAddingResidence ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-2"
                            >
                              <input
                                type="text"
                                placeholder={t('enter_address')}
                                value={newAddr}
                                onChange={(e) => setNewAddr(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder={t('enter_interior')}
                                value={newInt}
                                onChange={(e) => setNewInt(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setIsAddingResidence(false)}
                                  className="flex-1 py-2 text-[11px] font-bold text-gray-400 hover:text-gray-600"
                                >
                                  {t('cancel')}
                                </button>
                                <button
                                  disabled={!newAddr || isLocatingNew}
                                  onClick={async () => {
                                    setIsLocatingNew(true);
                                    try {
                                      const pos = await new Promise<GeolocationPosition>((res, rej) => {
                                        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true });
                                      });
                                      addResidence({
                                        address: newAddr,
                                        interior: newInt || "Int. 1",
                                        lat: pos.coords.latitude,
                                        lng: pos.coords.longitude
                                      });
                                      setIsAddingResidence(false);
                                      setNewAddr("");
                                      setNewInt("");
                                    } catch {
                                      // Fallback mock if GPS fails
                                      addResidence({ address: newAddr, interior: newInt || "Int. 1", lat: 0, lng: 0 });
                                      setIsAddingResidence(false);
                                      setNewAddr("");
                                      setNewInt("");
                                    } finally {
                                      setIsLocatingNew(false);
                                    }
                                  }}
                                  className="flex-[2] bg-emerald-500 text-white rounded-xl py-2 text-[11px] font-bold shadow-sm flex items-center justify-center gap-2"
                                >
                                  {isLocatingNew ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  {t('confirm')}
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <button
                              onClick={() => setIsAddingResidence(true)}
                              className="w-full py-2.5 rounded-2xl border border-dashed border-gray-200 text-gray-400 hover:text-emerald-500 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                              <Plus className="w-4 h-4" /> {t('add_residence')}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Push Notifications Toggle */}
                      {pushState !== 'unsupported' && (
                        <div className="pt-2 border-t border-gray-50">
                          <button
                            onClick={() => pushState === 'subscribed' ? unsubscribePush() : subscribePush()}
                            disabled={pushState === 'loading' || pushState === 'denied'}
                            className="w-full flex items-center justify-between p-1 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${pushState === 'subscribed' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-bold text-slate-700">Notifiche Push</span>
                                {pushState === 'denied' && <p className="text-[10px] text-red-500">Bloccate dal browser</p>}
                              </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${pushState === 'subscribed' ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${pushState === 'subscribed' ? 'translate-x-4' : 'translate-x-0'} ${pushState === 'loading' ? 'animate-pulse' : ''}`} />
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Auto Switch Toggle */}
                      <div className="pt-2 border-t border-gray-50">
                        <button
                          onClick={() => setAutoSwitch(!autoSwitch)}
                          className="w-full flex items-center justify-between p-1 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${autoSwitch ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                              <MapPin className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{t('auto_switch')}</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${autoSwitch ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${autoSwitch ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="pt-2 border-t border-gray-50">
                        <motion.button
                          onClick={() => { setIsSettingsOpen(false); handleLogout(); }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full flex items-center gap-3 p-1 text-red-500 hover:text-red-600 group"
                        >
                          <motion.div
                            whileHover={{ x: 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 group-hover:bg-red-100 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                          </motion.div>
                          <span className="text-xs font-bold">Esci dall'account</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="px-6 relative z-20 space-y-6">

        {/* User Info */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">— {t('salutation')}, {dbUser?.name?.split(' ')[0] || "UTENTE"}</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-[26px] font-bold leading-tight text-[#1a3322]">
              {currentResidence.address}<br />
              <span className="text-gray-400">{currentResidence.interior}</span>
            </h1>
            <AnimatePresence>
              {autoSwitch && isNearAny && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  title="Posizione verificata"
                />
              )}
            </AnimatePresence>
          </div>
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
              {nextScadenza && !nextScadenza.paid && (
                <button
                  onClick={() => payScadenza(nextScadenza.id)}
                  className="bg-[#4ade80] hover:bg-[#3bcc68] text-[#1a3322] px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-1.5"
                >
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
                  <div className="flex items-center gap-2">
                    {s.paid ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1"><Check className="w-3 h-3" /> Pagato</span>
                    ) : (
                      <button
                        onClick={() => payScadenza(s.id)}
                        className="text-xs font-bold text-[#1a3322] bg-[#4ade80] hover:bg-[#3bcc68] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Paga €{s.amount.toFixed(0)}
                      </button>
                    )}
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

        {/* Calendario Condominiale - NEW DESIGN */}
        <section className="space-y-4 pb-8">
          <div className="flex items-center gap-2 px-1 mt-6">
            <div className="w-5 h-5 rounded-full bg-gray-200/60 flex items-center justify-center text-[9px] font-mono font-bold text-gray-500">03</div>
            <h2 className="text-[11px] font-mono font-bold text-gray-500 tracking-widest uppercase">Planning</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] p-5 sm:p-7 shadow-sm border border-gray-100 mt-2 overflow-hidden">
            {/* Header Filter Bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-slate-400 border border-gray-100 shadow-inner">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Cerca evento o persona..." 
                  className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Chips / Tags */}
            <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
              {[
                { id: 'meeting', label: 'Assemblea', color: 'bg-indigo-500' },
                { id: 'maintenance', label: 'Manutenzione', color: 'bg-amber-500' },
                { id: 'social', label: 'Social', color: 'bg-emerald-500' },
                { id: 'holiday', label: 'Festività', color: 'bg-rose-500' }
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilter(activeFilter === chip.id ? null : chip.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${activeFilter === chip.id ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-gray-100 text-slate-500 hover:border-gray-200'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${chip.color}`} />
                  <span className="text-[11px] font-bold uppercase tracking-tight">{chip.label}</span>
                  {activeFilter === chip.id && <X className="w-3 h-3 ml-1" />}
                </button>
              ))}
            </div>

            <style>
              {`
                .rdp {
                  --rdp-cell-size: min(11vw, 42px);
                  --rdp-accent-color: #1a3322;
                  margin: 0 auto;
                }
                .rdp-caption_label {
                  font-size: 1.25rem;
                  font-weight: 800;
                  color: #1a3322;
                  letter-spacing: -0.02em;
                }
                .rdp-head_cell {
                  font-size: 0.7rem;
                  font-weight: 700;
                  color: #94a3b8;
                  text-transform: uppercase;
                  padding-bottom: 1rem;
                }
                .rdp-day {
                  font-weight: 600;
                  font-size: 0.9rem;
                  border-radius: 14px;
                  position: relative;
                }
                .rdp-day_selected {
                  background-color: #1a3322 !important;
                  color: white !important;
                  box-shadow: 0 4px 12px rgba(26, 51, 34, 0.2);
                }
                .rdp-day_today {
                  color: #10b981;
                  font-weight: 800;
                }

                /* Dots under numbers */
                .dot-container {
                  position: absolute;
                  bottom: 4px;
                  left: 0;
                  right: 0;
                  display: flex;
                  justify-content: center;
                  gap: 2px;
                }
                .dot {
                  width: 3px;
                  height: 3px;
                  border-radius: 50%;
                }
              `}
            </style>

            <div className="flex justify-center w-full">
              <DayPicker
                mode="single"
                locale={it}
                selected={date}
                onSelect={setDate}
                modifiers={eventsModifiers}
                components={{
                  DayButton: (props) => {
                    const { day, modifiers, ...buttonProps } = props;
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <button {...buttonProps} className={`${buttonProps.className} w-full h-full`}>
                          {day.date.getDate()}
                        </button>
                        <div className="dot-container pointer-events-none">
                          {modifiers.meeting && <span className="dot bg-indigo-500" />}
                          {modifiers.maintenance && <span className="dot bg-amber-500" />}
                          {modifiers.social && <span className="dot bg-emerald-500" />}
                          {modifiers.holiday && <span className="dot bg-rose-500" />}
                        </div>
                      </div>
                    );
                  }
                }}
              />
            </div>

            <div className="h-px bg-gray-50 my-8" />

            {/* Event List - Image style */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-400 text-[11px] uppercase tracking-widest">
                  Eventi per {date ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : 'Seleziona data'}
                </h3>
              </div>

              <div className="space-y-6">
                {data.eventi
                  .filter(ev => {
                    if (!date) return false;
                    const evDate = new Date(ev.date);
                    const isSameDay = evDate.getDate() === date.getDate() &&
                                     evDate.getMonth() === date.getMonth() &&
                                     evDate.getFullYear() === date.getFullYear();
                    const matchesFilter = activeFilter ? ev.type === activeFilter : true;
                    return isSameDay && matchesFilter;
                  })
                  .map(ev => (
                    <motion.div 
                      key={ev.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4 relative"
                    >
                      {/* Side vertical bar */}
                      <div className={`w-1 rounded-full ${
                        ev.type === 'meeting' ? 'bg-indigo-500' :
                        ev.type === 'maintenance' ? 'bg-amber-500' :
                        ev.type === 'social' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`} />
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            ev.type === 'meeting' ? 'text-indigo-500' :
                            ev.type === 'maintenance' ? 'text-amber-500' :
                            ev.type === 'social' ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {ev.type}
                          </p>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5">{ev.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{ev.desc}</p>
                        </div>
                        
                        {ev.participants && (
                          <div className="flex -space-x-2">
                            {ev.participants.map((p, idx) => (
                              <img 
                                key={idx} 
                                src={p} 
                                alt="avatar" 
                                className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover"
                              />
                            ))}
                            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-bold text-gray-400 shadow-sm">
                              +2
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                
                {data.eventi.filter(ev => {
                  if (!date) return false;
                  const evDate = new Date(ev.date);
                  return evDate.getDate() === date.getDate() && 
                         evDate.getMonth() === date.getMonth() &&
                         (activeFilter ? ev.type === activeFilter : true);
                }).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Nessun evento per oggi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Floating Action Button Bottom Right (TreeBot) */}
      <div className="fixed bottom-[80px] right-4 z-40 group">
        <button onClick={() => setIsTreebotOpen(true)} className="bg-[#4ade80] hover:bg-[#3bcc68] text-[#1a3322] shadow-xl shadow-[#4ade80]/30 rounded-full h-14 w-14 flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative border-2 border-white">
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-[#1a3322] text-white text-xs font-bold rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chiedi a TreeBot
          </span>
        </button>
      </div>

      {/* TreeBot Modal */}
      <AnimatePresence>
        {isTreebotOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] sm:h-[600px] border border-gray-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1a3322] to-emerald-900 text-white p-4 flex items-center justify-between shadow-md relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 text-emerald-200">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">TreeBot</h3>
                    <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">Assistente Amministratore</p>
                  </div>
                </div>
                <button onClick={() => setIsTreebotOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <span className="font-bold text-sm">✕</span>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {treebotHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] ${msg.role === 'user'
                        ? 'bg-[#1a3322] text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-gray-200 rounded-bl-none shadow-sm'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTreebotThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleTreebotSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 relative z-10">
                <input
                  type="text"
                  value={treebotInput}
                  onChange={(e) => setTreebotInput(e.target.value)}
                  placeholder="Chiedi qualcosa sul regolamento..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={isTreebotThinking || !treebotInput.trim()}
                  className="w-12 h-12 bg-[#4ade80] hover:bg-[#3bcc68] text-[#1a3322] rounded-xl flex items-center justify-center font-bold disabled:opacity-50 transition-colors shrink-0"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <path d="M1 13 L8 5 L15 1 L22 8 L30 11 L34 11" stroke="#1a3322" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="34" cy="11" r="2" fill="#4ade80" />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
