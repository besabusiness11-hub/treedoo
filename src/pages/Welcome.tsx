import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Hexagon, Building, ArrowRight, User, Briefcase, Sprout, Sparkles, Camera, Loader2, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

export default function Welcome() {
  const navigate = useNavigate()
  const savedUser = localStorage.getItem('treedoo_user')
  const [dbUser, setDbUser] = useState<any>(savedUser ? JSON.parse(savedUser) : null)
  const [step, setStep] = useState<"splash" | "meaning" | "role" | "onboarding" | "login">("splash")
  const [showDoo, setShowDoo] = useState(false)
  const [role, setRole] = useState<"tree" | "admin" | null>(null)
  const [obStep, setObStep] = useState<"upload" | "analyzing" | "confirm">("upload")

  // Auto-transition from splash to meaning after the logo animation builds impact
  useEffect(() => {
    if (step === "splash") {
      const dooTimer = setTimeout(() => setShowDoo(true), 1000)
      const timer = setTimeout(() => {
        if (dbUser) {
           setStep("login")
        } else {
           setStep("meaning")
        }
      }, 3200)
      return () => { clearTimeout(timer); clearTimeout(dooTimer); }
    }
  }, [step, dbUser])

  const handleAIUpload = () => {
     setObStep("analyzing")
     setTimeout(() => setObStep("confirm"), 2500)
  }

  const handleComplete = () => {
     let userName = "Utente";
     if (role === "tree") {
       const el = document.getElementById("user-name-input") as HTMLInputElement;
       userName = el ? el.value : "Laura Rossi";
     } else {
       const el = document.getElementById("admin-name-input") as HTMLInputElement;
       userName = el ? el.value : "Studio Amministrazioni Rossi";
     }
     localStorage.setItem('treedoo_user', JSON.stringify({ role, name: userName }));

     if (role === "tree") navigate("/dashboard")
     else navigate("/admin")
  }

  return (
    <div 
      className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-blue-200 via-white to-gray-50 w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto shadow-2xl relative overflow-hidden"
      onClick={() => step === "splash" && setStep("meaning")}
    >
      {/* Top Content Area - Responsive Flex Shift */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 220, damping: 30 }}
        className={`flex-1 flex flex-col items-center justify-center p-6 z-10 w-full relative ${
          step === "splash" ? "pb-6" : "pb-[450px]"
        }`}
      >
        <motion.div layoutId="title" className="space-y-4 flex flex-col items-center justify-center text-slate-900 w-full mt-10">
          <div className="flex items-baseline justify-center overflow-visible">
            <motion.div 
              layout 
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, mass: 1 }}
              className="text-[4rem] font-extrabold tracking-tight leading-none drop-shadow-sm text-slate-900 z-10"
            >
              TREE
            </motion.div>
            <AnimatePresence>
              {showDoo && (
                <motion.div
                  initial={{ y: -500, opacity: 0, rotate: 120, scale: 0.3 }}
                  animate={{ y: 0, opacity: 1, rotate: -4, scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 8, mass: 1.2 }}
                  className="text-[4rem] font-extrabold tracking-tight leading-none drop-shadow-2xl text-blue-600 origin-bottom-right z-20"
                >
                  DOO
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-6 flex items-center justify-center">
            <AnimatePresence>
              {step === "splash" && showDoo && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-emerald-700 font-medium tracking-wide text-[13px] flex items-center justify-center gap-1.5 opacity-80"
                >
                  <Sparkles className="w-4 h-4" /> L'ecosistema intelligente
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {step !== "splash" && (
          <motion.div
             initial={{ y: "100%" }}
             animate={{ y: 0 }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             className="absolute inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.08)] w-full h-[540px] max-h-[88vh] z-20 overflow-hidden flex flex-col"
          >
            <AnimatePresence mode="wait">
              {step === "login" && dbUser ? (
                 <motion.div 
                   key="login"
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -50 }}
                   className="p-8 h-full flex flex-col pt-10"
                 >
                    <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                      <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-6 shadow-xl border border-emerald-50 relative">
                        {dbUser.role === "tree" ? <User className="w-10 h-10" /> : <Briefcase className="w-10 h-10" />}
                        <div className="absolute -bottom-2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                           {dbUser.role === "tree" ? "Tree" : "Studio"}
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 text-center">Bentornat{dbUser.name.endsWith('a') ? 'a' : 'o'}!</h2>
                      <p className="text-slate-500 text-center mt-2 text-sm leading-relaxed px-4">Abbiamo trovato un profilo salvato nel database locale.</p>
                      
                      <div className="mt-8 bg-gray-50 border border-gray-100 w-full p-4 rounded-3xl flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400">
                           <User className="w-6 h-6" />
                         </div>
                         <div className="flex-1">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Corrente</p>
                           <p className="text-sm font-bold text-slate-800">{dbUser.name}</p>
                         </div>
                      </div>
                    </div>
                    
                    <div className="pb-safe space-y-3">
                      <button 
                        onClick={() => {
                           if (dbUser.role === "tree") navigate("/dashboard");
                           else navigate("/admin");
                        }}
                        className="w-full h-14 rounded-2xl bg-[#00d05e] hover:bg-[#00b853] text-white font-bold text-sm shadow-xl shadow-[#00d05e]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        ACCEDI COME {dbUser.name.split(' ')[0].toUpperCase()} <ArrowRight className="w-5 h-5" />
                      </button>
                      <button 
                         onClick={() => {
                           localStorage.removeItem('treedoo_user');
                           setDbUser(null);
                           setStep("meaning"); 
                         }}
                         className="w-full h-12 rounded-2xl bg-gray-100 text-slate-500 font-bold text-sm hover:bg-gray-200 transition-all"
                      >
                         Usa un altro account
                      </button>
                    </div>
                 </motion.div>
              ) : step === "meaning" ? (
                 <motion.div 
                   key="meaning"
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -50 }}
                   className="p-8 h-full flex flex-col pt-10 overflow-y-auto w-full"
                 >
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <Sprout className="w-5 h-5 text-emerald-500" />
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Il significato di Treedoo</h2>
                    </div>

                    <div className="space-y-4">
                       {/* TREE Block */}
                       <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-100/60 text-left">
                         <h3 className="font-extrabold text-emerald-900 text-[16px] flex items-center justify-between mb-3">
                           <span>1. TREE</span>
                           <span className="font-semibold text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">Ecosistema Vivo</span>
                         </h3>
                         <ul className="space-y-2 text-[12.5px] text-emerald-950/70 leading-relaxed">
                           <li><strong className="text-emerald-800">Radici:</strong> La solidità delle fondamenta fiscali e dell'amministrazione.</li>
                           <li><strong className="text-emerald-800">Tronco:</strong> L'edificio fisico e le parti comuni da manutenere costantemente.</li>
                           <li><strong className="text-emerald-800">Rami e Foglie:</strong> Ogni singola unità e condòmino. L'albero vive unito da una linfa di pura comunicazione.</li>
                         </ul>
                       </div>

                       {/* DOO Block */}
                       <div className="bg-blue-50/60 p-5 rounded-3xl border border-blue-100/60 text-left">
                         <h3 className="font-extrabold text-blue-900 text-[16px] flex items-center justify-between mb-3">
                           <span>2. DOO</span>
                           <span className="font-semibold text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">Azione & AI</span>
                         </h3>
                         <ul className="space-y-2 text-[12.5px] text-blue-950/70 leading-relaxed">
                           <li><strong className="text-blue-800">Dinamismo (To do):</strong> Dal pagare le scadenze alla risoluzione istantanea di guasti idraulici.</li>
                           <li><strong className="text-blue-800">Innovazione AI:</strong> L'intelligenza interviene automatizzando le azioni e trasformando la burocrazia in un flusso rapido e <strong>friction-zero</strong>.</li>
                         </ul>
                       </div>
                    </div>

                    <div className="mt-8 pb-safe">
                      <button 
                        onClick={() => setStep("role")}
                        className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-95 whitespace-nowrap px-4"
                      >
                        <div className="flex items-center gap-1.5 mr-1">
                           <span className="text-slate-400 text-xs font-medium">1... 2...</span>
                           <span className="text-emerald-400 font-extrabold tracking-wider text-base">TREE!</span>
                        </div>
                        <span className="w-[1px] h-4 bg-slate-700 hidden sm:block"></span>
                        <span>INIZIAMO</span>
                        <ArrowRight className="w-5 h-5 opacity-80 shrink-0" />
                      </button>
                    </div>
                 </motion.div>
              ) : step === "role" ? (
                 <motion.div 
                   key="role"
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -50 }}
                   className="p-8 h-full flex flex-col pt-10"
                 >
                    <h2 className="text-2xl font-bold text-slate-900 mb-1 text-center">Chi sei?</h2>
                    <p className="text-slate-500 text-sm text-center mb-8">Seleziona il tuo profilo operativo.</p>
                    
                    <div className="space-y-4 w-full pb-safe mt-6">
                      <button 
                        onClick={() => { setRole("tree"); setStep("onboarding"); setObStep("upload"); }}
                        className="group relative flex items-center gap-4 w-full bg-[#00d05e] hover:bg-[#00b853] text-white p-5 h-auto rounded-3xl transition-all active:scale-95 shadow-xl shadow-[#00d05e]/30"
                      >
                        <div className="bg-white/20 p-3 rounded-2xl border border-white/20">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-lg font-bold">Sono un Tree</div>
                          <div className="text-emerald-50 font-medium text-xs leading-tight mt-1 opacity-90">Abitante o proprietario. Attiva l'ecosistema di quartiere.</div>
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity mr-2" />
                      </button>

                      <button 
                        onClick={() => { setRole("admin"); setStep("onboarding"); setObStep("upload"); }}
                        className="group relative flex items-center gap-4 w-full bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-slate-700 p-5 h-auto rounded-3xl transition-all active:scale-95 shadow-sm"
                      >
                        <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200">
                          <Briefcase className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-lg font-bold">Amministratore</div>
                          <div className="text-slate-400 font-medium text-xs leading-tight mt-1">Gestione stabili, AI e rinegoziazione contratti.</div>
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity mr-2" />
                      </button>
                    </div>
                 </motion.div>
              ) : step === "onboarding" ? (
                 <motion.div 
                   key="onboarding"
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="p-8 h-full flex flex-col pt-8"
                 >
                    <div className="flex justify-between items-center mb-8 px-1">
                       <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                         {role === "tree" ? "Profilo Tree" : "Profilo Studio"}
                       </h2>
                       <button className="text-[11px] font-bold text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-full hover:bg-slate-200" onClick={() => setObStep("confirm")}>
                         Compila a mano
                       </button>
                    </div>

                    {obStep === "upload" && (
                       <div className="flex-1 flex flex-col items-center justify-center -mt-8 pb-4">
                         <div className="text-center mb-6 space-y-2">
                           <h3 className="text-[22px] font-extrabold text-slate-800 leading-tight">Zero Sbatti.<br/> Usa l'AI.</h3>
                           <p className="text-slate-500 text-[13px] px-2 leading-relaxed">
                             Scatta una foto a {role === 'tree' ? "una bolletta o la carta d'identità" : "la visura o tesserino ANACI"} e compileremo tutto noi al volo.
                           </p>
                         </div>

                         <div 
                           onClick={handleAIUpload}
                           className="w-full border-2 border-dashed border-emerald-200 bg-gradient-to-b from-white to-emerald-50/50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50 transition-colors h-52 group shadow-sm"
                         >
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-100 text-emerald-500 mb-4 group-hover:scale-110 transition-transform relative">
                               <Camera className="w-7 h-7" />
                               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                            </div>
                            <span className="font-bold text-slate-800 text-[15px]">Scansiona Documento</span>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1 bg-white px-3 py-1 rounded-full mt-3 shadow-sm border border-emerald-100 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3"/> OCR Magic Attivo
                            </span>
                         </div>
                       </div>
                    )}

                    {obStep === "analyzing" && (
                       <div className="flex-1 flex flex-col items-center justify-center -mt-8 space-y-5">
                          <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex justify-center items-center relative">
                            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin absolute" />
                            <Sparkles className="w-4 h-4 text-emerald-400 absolute animate-pulse" />
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-slate-800 text-lg">Estrazione OCR in corso...</h3>
                            <p className="text-[13px] text-slate-500 mt-2 max-w-[200px] mx-auto leading-relaxed">
                              L'Intelligenza Artificiale sta popolando l'anagrafica per te.
                            </p>
                          </div>
                       </div>
                    )}

                    {obStep === "confirm" && (
                       <div className="flex-1 flex flex-col h-full relative">
                          <div className="flex items-center gap-3 bg-emerald-50/80 text-emerald-700 p-3.5 rounded-2xl border border-emerald-100 mb-6 mx-1">
                            <div className="bg-white p-1 rounded-full shadow-sm">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                            </div>
                            <p className="text-xs font-bold leading-tight flex-1">Anagrafica popolata dall'AI. Modifica se necessario.</p>
                          </div>

                          <div className="space-y-4 overflow-y-auto pb-24 px-1">
                            {role === "tree" ? (
                              <>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Nome e Cognome</label>
                                  <input id="user-name-input" type="text" defaultValue="Laura Rossi" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Residenza Condominiale</label>
                                  <input type="text" defaultValue="Via della Repubblica 42, Milano" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all" />
                                </div>
                                <div className="flex gap-3">
                                  <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Scala</label>
                                    <input type="text" defaultValue="B" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all text-center" />
                                  </div>
                                  <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Interno</label>
                                    <input type="text" defaultValue="4" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all text-center" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Nome Studio</label>
                                  <input id="admin-name-input" type="text" defaultValue="Studio Amministrazioni Rossi" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-blue-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Partita IVA</label>
                                  <input type="text" defaultValue="IT12345678901" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-blue-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Codice ANACI</label>
                                  <input type="text" defaultValue="14562" className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-blue-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all" />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="absolute bottom-4 left-0 right-0 pt-4 bg-white">
                            <button 
                              onClick={handleComplete}
                              className={`w-full flex items-center justify-center gap-2 text-white h-14 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
                                role === 'tree' ? 'bg-[#00d05e] hover:bg-[#00b853] shadow-[#00d05e]/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                              }`}
                            >
                              ACCEDI A TREEDOO <ArrowRight className="w-5 h-5 opacity-80" />
                            </button>
                          </div>
                       </div>
                    )}
                 </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
