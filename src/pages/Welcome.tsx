import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, User, Briefcase, Sprout, Camera, Loader2, CheckCircle2, MapPin, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useAuth } from "@/lib/AuthContext"
import { api, Condominio } from "@/lib/api"

export default function Welcome() {
  const navigate = useNavigate()
  const { user, login, register, loading: authLoading } = useAuth()
  const [step, setStep] = useState<"splash" | "meaning" | "role" | "onboarding" | "login">("splash")
  const [showDoo, setShowDoo] = useState(false)
  const [role, setRole] = useState<"tree" | "admin" | null>(null)
  const [obStep, setObStep] = useState<"confirm">("confirm")
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle")

  // Form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [condominii, setCondominii] = useState<Condominio[]>([])
  const [selectedCondominioId, setSelectedCondominioId] = useState("")
  const [newCondominioName, setNewCondominioName] = useState("")
  const [loginEmail, setLoginEmail] = useState(() => localStorage.getItem('treedoo_last_email') || "")
  const [loginPassword, setLoginPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'amministratore') navigate('/admin')
      else navigate('/dashboard')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (step === "onboarding") {
      api.condominii.listPublic().then(setCondominii).catch(() => {})
    }
  }, [step])

  useEffect(() => {
    if (step === "splash") {
      const dooTimer = setTimeout(() => setShowDoo(true), 1000)
      const timer = setTimeout(() => {
        const lastEmail = localStorage.getItem('treedoo_last_email')
        setStep(lastEmail ? "login" : "meaning")
      }, 3200)
      return () => { clearTimeout(timer); clearTimeout(dooTimer); }
    }
  }, [step])

  const requestLocation = () => {
    setLocationStatus("loading")
    if (!navigator.geolocation) { setLocationStatus("denied"); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        localStorage.setItem('treedoo_location', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now() }))
        setLocationStatus("granted")
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setFormError("Compila tutti i campi obbligatori"); return }
    if (password.length < 6) { setFormError("Password minimo 6 caratteri"); return }
    if (role === "admin" && !newCondominioName.trim()) { setFormError("Inserisci il nome del condominio"); return }
    if (role === "tree" && !selectedCondominioId) { setFormError("Seleziona il condominio"); return }
    setFormError("")
    setIsSubmitting(true)
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role === "admin" ? "amministratore" : "condomino",
        ...(role === "admin" ? { condominio_name: newCondominioName.trim() } : { condominio_id: selectedCondominioId }),
      })
      localStorage.setItem('treedoo_last_email', email.trim().toLowerCase())
    } catch (e: any) {
      setFormError(e.message || "Errore durante la registrazione")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) { setFormError("Inserisci email e password"); return }
    setFormError("")
    setIsSubmitting(true)
    try {
      await login(loginEmail.trim().toLowerCase(), loginPassword)
      localStorage.setItem('treedoo_last_email', loginEmail.trim().toLowerCase())
    } catch (e: any) {
      setFormError("Credenziali errate. Riprova.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDevLogin = async () => {
    setFormError("")
    setIsSubmitting(true)
    try {
      await login('dev@treedoo.it', 'dev123')
    } catch {
      try {
        await register({ name: 'Developer', email: 'dev@treedoo.it', password: 'dev123', role: 'amministratore', condominio_name: 'Dev Condominio' })
      } catch (e: any) {
        setFormError(e.message || 'Dev login failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#f0fdf4] to-white">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div
      className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-[#f0fdf4] to-white w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto shadow-2xl relative overflow-hidden"
      onClick={() => step === "splash" && setStep("meaning")}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 220, damping: 30 }}
        className={`flex-1 flex flex-col items-center justify-center p-6 z-10 w-full relative ${step === "splash" ? "pb-6" : "pb-[450px]"}`}
      >
        <motion.div layoutId="title" className="space-y-4 flex flex-col items-center justify-center text-slate-900 w-full mt-10">
          <div className="flex items-center justify-center overflow-visible gap-0">
            <motion.div layout initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="text-[4.5rem] font-bold tracking-tightest leading-none text-slate-900">
              tree
            </motion.div>
            <AnimatePresence mode="wait">
              {showDoo && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="text-[4.5rem] font-bold tracking-tightest leading-none text-emerald-500 relative flex items-baseline">
                  doo
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="w-4 h-4 bg-emerald-500 rounded-full ml-2 mb-2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-8 flex items-center justify-center mt-2" />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {step !== "splash" && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.08)] w-full h-[540px] max-h-[88vh] z-20 overflow-hidden flex flex-col"
          >
            <AnimatePresence mode="wait">
              {/* LOGIN STEP */}
              {step === "login" && (
                <motion.div key="login" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-8 h-full flex flex-col pt-10">
                  <div className="flex-1 flex flex-col -mt-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Bentornato!</h2>
                    <p className="text-slate-400 text-sm mb-6">Accedi al tuo profilo Treedoo.</p>

                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white rounded-xl px-4 font-medium text-slate-800 outline-none transition-all text-sm"
                      />
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          placeholder="Password"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                          className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white rounded-xl px-4 pr-12 font-medium text-slate-800 outline-none transition-all text-sm"
                        />
                        <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {formError && <p className="text-red-500 text-xs font-medium">{formError}</p>}
                    </div>
                  </div>

                  <div className="pb-safe space-y-3">
                    <button
                      onClick={handleLogin}
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-2xl bg-[#00d05e] hover:bg-[#00b853] text-white font-bold text-sm shadow-xl shadow-[#00d05e]/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ACCEDI <ArrowRight className="w-5 h-5" /></>}
                    </button>
                    <button
                      onClick={() => { setFormError(""); setStep("meaning"); }}
                      className="w-full h-12 rounded-2xl bg-gray-100 text-slate-500 font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                      Crea nuovo account
                    </button>
                    {import.meta.env.DEV && (
                      <button
                        onClick={handleDevLogin}
                        disabled={isSubmitting}
                        className="w-full h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        🛠 Dev Login
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* MEANING STEP */}
              {step === "meaning" && (
                <motion.div key="meaning" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-8 h-full flex flex-col pt-10 overflow-y-auto w-full">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Sprout className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Il significato di Treedoo</h2>
                  </div>
                  <div className="space-y-4">
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
                    <button onClick={() => setStep("role")} className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-95 whitespace-nowrap px-4">
                      <div className="flex items-center gap-1.5 mr-1">
                        <span className="text-slate-400 text-xs font-medium">1... 2...</span>
                        <span className="text-emerald-400 font-extrabold tracking-wider text-base">TREE!</span>
                      </div>
                      <span className="w-[1px] h-4 bg-slate-700 hidden sm:block" />
                      <span>INIZIAMO</span>
                      <ArrowRight className="w-5 h-5 opacity-80 shrink-0" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ROLE STEP */}
              {step === "role" && (
                <motion.div key="role" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="p-8 h-full flex flex-col pt-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1 text-center">Chi sei?</h2>
                  <p className="text-slate-500 text-sm text-center mb-8">Seleziona il tuo profilo operativo.</p>
                  <div className="space-y-4 w-full pb-safe mt-6">
                    <button onClick={() => { setRole("tree"); setStep("onboarding"); }} className="group relative flex items-center gap-4 w-full bg-[#00d05e] hover:bg-[#00b853] text-white p-5 h-auto rounded-3xl transition-all active:scale-95 shadow-xl shadow-[#00d05e]/30">
                      <div className="bg-white/20 p-3 rounded-2xl border border-white/20"><User className="w-6 h-6" /></div>
                      <div className="text-left flex-1">
                        <div className="text-lg font-bold">Sono un Tree</div>
                        <div className="text-emerald-50 font-medium text-xs leading-tight mt-1 opacity-90">Abitante o proprietario. Attiva l'ecosistema di quartiere.</div>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity mr-2" />
                    </button>
                    <button onClick={() => { setRole("admin"); setStep("onboarding"); }} className="group relative flex items-center gap-4 w-full bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-slate-700 p-5 h-auto rounded-3xl transition-all active:scale-95 shadow-sm">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200"><Briefcase className="w-6 h-6 text-slate-500" /></div>
                      <div className="text-left flex-1">
                        <div className="text-lg font-bold">Amministratore</div>
                        <div className="text-slate-400 font-medium text-xs leading-tight mt-1">Gestione stabili, AI e rinegoziazione contratti.</div>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity mr-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ONBOARDING / REGISTER STEP */}
              {step === "onboarding" && (
                <motion.div key="onboarding" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, y: 20 }} className="p-8 h-full flex flex-col pt-8">
                  <div className="flex justify-between items-center mb-6 px-1">
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      {role === "tree" ? "Profilo Tree" : "Profilo Studio"}
                    </h2>
                    <button className="text-[11px] font-bold text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-full hover:bg-slate-200" onClick={() => setStep("role")}>
                      ← Indietro
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col h-full relative">
                    <div className="space-y-3 overflow-y-auto pb-24 px-1">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">
                          {role === "tree" ? "Nome e Cognome *" : "Nome Studio *"}
                        </label>
                        <input
                          type="text"
                          placeholder={role === "tree" ? "es. Marco Bianchi" : "es. Studio Amm. Verdi"}
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Email *</label>
                        <input
                          type="email"
                          placeholder="la-tua@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Password * (min. 6 caratteri)</label>
                        <div className="relative">
                          <input
                            type={showPwd ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 pr-12 font-bold text-slate-800 outline-none transition-all"
                          />
                          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Condominio selection */}
                      {role === "tree" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Seleziona Condominio *</label>
                          {condominii.length === 0 ? (
                            <div className="w-full h-12 bg-amber-50 border border-amber-100 rounded-xl px-4 flex items-center text-sm text-amber-700 font-medium">
                              Nessun condominio registrato. Chiedi all'amministratore di creare il tuo stabile.
                            </div>
                          ) : (
                            <select
                              value={selectedCondominioId}
                              onChange={e => setSelectedCondominioId(e.target.value)}
                              className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white rounded-xl px-4 font-bold text-slate-800 outline-none transition-all text-sm"
                            >
                              <option value="">— Scegli il tuo condominio —</option>
                              {condominii.map(c => <option key={c.id} value={c.id}>{c.name}{c.address ? ` — ${c.address}` : ''}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                      {role === "admin" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest">Nome Condominio da gestire *</label>
                          <input
                            type="text"
                            placeholder="es. Condominio Le Querce"
                            value={newCondominioName}
                            onChange={e => setNewCondominioName(e.target.value)}
                            className="w-full h-12 bg-gray-50 border border-gray-100 focus:border-emerald-500 focus:bg-white focus:shadow-sm rounded-xl px-4 font-bold text-slate-800 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Geolocalizzazione */}
                      <div className="space-y-1.5 mt-2">
                        <label className="text-[10px] font-extrabold text-slate-400 px-1 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Posizione (opzionale)
                        </label>
                        {locationStatus === "idle" && (
                          <button type="button" onClick={requestLocation} className="w-full h-12 bg-blue-50 border border-blue-100 rounded-xl px-4 font-bold text-blue-700 text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                            <MapPin className="w-4 h-4" /> Attiva posizione per servizi locali
                          </button>
                        )}
                        {locationStatus === "loading" && (
                          <div className="w-full h-12 bg-blue-50 border border-blue-100 rounded-xl px-4 flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" /> Localizzazione in corso...
                          </div>
                        )}
                        {locationStatus === "granted" && (
                          <div className="w-full h-12 bg-emerald-50 border border-emerald-100 rounded-xl px-4 flex items-center justify-center gap-2 text-sm text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Posizione attiva
                          </div>
                        )}
                        {locationStatus === "denied" && (
                          <div className="w-full h-12 bg-amber-50 border border-amber-100 rounded-xl px-4 flex items-center justify-center gap-2 text-sm text-amber-700 font-medium">
                            Posizione non disponibile
                          </div>
                        )}
                      </div>

                      {formError && <p className="text-red-500 text-sm font-medium text-center">{formError}</p>}
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 pt-4 bg-white">
                      <button
                        onClick={handleRegister}
                        disabled={isSubmitting}
                        className={`w-full flex items-center justify-center gap-2 text-white h-14 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-60 ${role === 'tree' ? 'bg-[#00d05e] hover:bg-[#00b853] shadow-[#00d05e]/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ACCEDI A TREEDOO <ArrowRight className="w-5 h-5 opacity-80" /></>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
