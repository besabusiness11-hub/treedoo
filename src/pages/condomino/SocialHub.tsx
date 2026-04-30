import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, MapPin, ShoppingBag, Newspaper, ChevronRight, ChevronDown, ChevronUp, Sparkles, AlertTriangle, TrendingUp, Loader2, Navigation, Send, ShieldAlert, LocateFixed } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useData } from "@/lib/DataContext"
import { useAuth } from "@/lib/AuthContext"
import { ollamaService } from "@/lib/ollama"
import { containsBannedWords, filterBannedWords } from "@/lib/DataContext"

// Reverse geocoding per ottenere il nome della zona
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`, {
      headers: { 'Accept-Language': 'it' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    return addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.town || addr?.city || addr?.village || null;
  } catch { return null; }
}

type LocaleNearby = {
  name: string;
  type: string;
  distance: string;
  address?: string;
};

const POSTS_PER_PAGE = 4;

export default function SocialHub() {
  const { data, addPost, replyToPost } = useData()
  const [activeTab, setActiveTab] = useState<"bacheca" | "avvisi">("bacheca")
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showNeighborhood, setShowNeighborhood] = useState(false)
  const [showLocali, setShowLocali] = useState(false)
  
  const { user: dbUser } = useAuth();
  const [hasLocation, setHasLocation] = useState(false);
  const [userZona, setUserZona] = useState<string | null>(null);
  const [locationRequesting, setLocationRequesting] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState<"locali" | "marketplace" | null>(null);

  const loc = useLocation();
  useEffect(() => {
    if (loc.search.includes("msgadmin=1")) {
      setActiveTab("bacheca");
      setNewPostContent("@Amministratore - ");
      setTimeout(() => {
        const input = document.getElementById("post-input");
        if (input) {
          input.focus();
          const len = input.getAttribute("value")?.length || 18;
          (input as HTMLTextAreaElement).setSelectionRange(len, len);
        }
      }, 100);
    }
  }, [loc]);

  useEffect(() => {
    
    // Controlla posizione salvata
    const savedLoc = localStorage.getItem('treedoo_location');
    if (savedLoc) {
      setHasLocation(true);
      const parsed = JSON.parse(savedLoc);
      if (parsed.zona) {
        setUserZona(parsed.zona);
      } else {
        // Reverse geocode per ottenere il nome della zona
        reverseGeocode(parsed.lat, parsed.lng).then(zona => {
          if (zona) {
            setUserZona(zona);
            localStorage.setItem('treedoo_location', JSON.stringify({ ...parsed, zona }));
          }
        });
      }
    }
  }, []);

  const requestLocation = async (feature: "locali" | "marketplace") => {
    setLocationRequesting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const zona = await reverseGeocode(lat, lng);
      const locData = { lat, lng, timestamp: Date.now(), zona };
      localStorage.setItem('treedoo_location', JSON.stringify(locData));
      setHasLocation(true);
      setUserZona(zona);
      setShowLocationPrompt(null);
      
      // Dopo l'attivazione, apri direttamente la funzione richiesta
      if (feature === "locali") {
        setShowLocali(true);
        // fetchLocali verrà chiamato con la posizione ora disponibile
        setTimeout(() => fetchLocali(), 100);
      } else if (feature === "marketplace") {
        setShowMarketplace(true);
      }
    } catch {
      // L'utente ha rifiutato o non è disponibile
      setShowLocationPrompt(null);
      if (feature === "locali") {
        setShowLocali(true);
        setLocaliError("Posizione non disponibile. Attiva la geolocalizzazione per scoprire i locali nella tua zona.");
      } else {
        // Il marketplace funziona comunque, solo senza contesto locale
        setShowMarketplace(true);
      }
    } finally {
      setLocationRequesting(false);
    }
  };

  const handleOpenLocali = () => {
    if (!hasLocation) {
      setShowLocationPrompt("locali");
    } else {
      setShowLocali(true);
      fetchLocali();
    }
  };

  const handleOpenMarketplace = () => {
    if (!hasLocation) {
      setShowLocationPrompt("marketplace");
    } else {
      setShowMarketplace(true);
    }
  };

  const [newPostContent, setNewPostContent] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  
  // Pagination
  const [visiblePosts, setVisiblePosts] = useState(POSTS_PER_PAGE);
  const [visibleAvvisi, setVisibleAvvisi] = useState(POSTS_PER_PAGE);

  // Reply system
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // Marketplace AI states
  const [marketInput, setMarketInput] = useState("");
  const [isGeneratingMarket, setIsGeneratingMarket] = useState(false);
  const [marketResult, setMarketResult] = useState<{title:string, desc:string, price:string}|null>(null);

  // Cerca Locali states
  const [localiLoading, setLocaliLoading] = useState(false);
  const [localiError, setLocaliError] = useState<string | null>(null);
  const [locali, setLocali] = useState<LocaleNearby[]>([]);
  const [localiCategory, setLocaliCategory] = useState<string>("all");
  const [localiSearch, setLocaliSearch] = useState<string>("");

  // Notizie Locali states
  const [newsLoading, setNewsLoading] = useState(false);
  const [localNews, setLocalNews] = useState<{title: string, content: string, date: string}[]>([]);

  const handleGenerateMarket = async () => {
    if (!marketInput) return;
    setIsGeneratingMarket(true);
    try {
      const res = await ollamaService.generateMarketplace(marketInput, userZona || undefined);
      setMarketResult(res);
    } catch(err) {
      console.error(err);
    } finally {
      setIsGeneratingMarket(false);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    if (!newPostContent.trim()) return;
    
    if (containsBannedWords(newPostContent)) {
      setPostError("Il tuo messaggio contiene parole inappropriate. Modifica il contenuto prima di pubblicare.");
      return;
    }
    
    addPost({
      author: dbUser?.name || "Condomino",
      content: newPostContent.trim(),
      isAvviso: false,
    });
    setNewPostContent("");
  };

  const handleReply = (postId: string) => {
    setReplyError(null);
    if (!replyContent.trim()) return;

    if (containsBannedWords(replyContent)) {
      setReplyError("La tua risposta contiene parole inappropriate. Modifica il contenuto.");
      return;
    }

    replyToPost(postId, {
      author: dbUser?.name || "Condomino",
      content: replyContent.trim(),
    });
    setReplyContent("");
    setReplyingTo(null);
  };

  const toggleReplies = (postId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const fetchLocali = async (searchQuery?: string) => {
    setLocaliLoading(true);
    setLocaliError(null);
    setLocali([]);
    const savedLoc = localStorage.getItem('treedoo_location');
    let lat: number, lng: number;
    if (savedLoc) {
      const parsed = JSON.parse(savedLoc);
      lat = parsed.lat; lng = parsed.lng;
    } else {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = pos.coords.latitude; lng = pos.coords.longitude;
        localStorage.setItem('treedoo_location', JSON.stringify({ lat, lng, timestamp: Date.now() }));
      } catch {
        setLocaliError("Posizione non disponibile. Attiva la geolocalizzazione nelle impostazioni del browser.");
        setLocaliLoading(false);
        return;
      }
    }
    try {
      const radius = 800;
      let query = '';
      if (searchQuery) {
        query = `[out:json][timeout:10];(node["name"~"${searchQuery}",i](around:3000,${lat},${lng});node["amenity"~"${searchQuery}",i](around:3000,${lat},${lng});node["shop"~"${searchQuery}",i](around:3000,${lat},${lng}););out body 20;`;
      } else {
        query = `[out:json][timeout:10];(node["amenity"~"restaurant|cafe|bar|pharmacy|bank|supermarket|post_office"](around:${radius},${lat},${lng});node["shop"~"supermarket|convenience|bakery|butcher|greengrocer"](around:${radius},${lat},${lng}););out body 20;`;
      }
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST', body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (!res.ok) throw new Error("Errore API");
      const result = await res.json();
      if (result.elements?.length > 0) {
        const typeMap: Record<string, string> = {
          restaurant: "Ristorante", cafe: "Caffetteria", bar: "Bar", pharmacy: "Farmacia",
          bank: "Banca", supermarket: "Supermercato", post_office: "Ufficio Postale",
          convenience: "Alimentari", bakery: "Panetteria", butcher: "Macelleria", greengrocer: "Fruttivendolo",
        };
        const mapped: LocaleNearby[] = result.elements.filter((el: any) => el.tags?.name).map((el: any) => {
          const dLat = (el.lat - lat) * 111320;
          const dLng = (el.lon - lng) * 111320 * Math.cos(lat * Math.PI / 180);
          const dist = Math.round(Math.sqrt(dLat ** 2 + dLng ** 2));
          const typeTag = el.tags.amenity || el.tags.shop || "locale";
          return {
            name: el.tags.name, type: typeMap[typeTag] || typeTag,
            distance: dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`,
            address: el.tags["addr:street"] ? `${el.tags["addr:street"]} ${el.tags["addr:housenumber"] || ""}`.trim() : undefined,
          };
        }).sort((a: LocaleNearby, b: LocaleNearby) => parseInt(a.distance) - parseInt(b.distance));
        setLocali(mapped);
      } else setLocali([]);
    } catch (err) { console.error(err); setLocaliError("Errore nel recupero dei locali. Riprova."); }
    finally { setLocaliLoading(false); }
  };

  const fetchLocalNews = async () => {
    if (!userZona) return;
    setNewsLoading(true);
    try {
      const news = await ollamaService.generateLocalNews(userZona);
      setLocalNews(news);
    } catch (e) {
      console.error(e);
    } finally {
      setNewsLoading(false);
    }
  };

  const bachecaPosts = data.posts.filter(p => !p.isAvviso);
  const avvisiPosts = data.posts.filter(p => p.isAvviso);
  const filteredLocali = localiCategory === "all" ? locali : locali.filter(l => l.type === localiCategory);
  const uniqueTypes = [...new Set(locali.map(l => l.type))];

  return (
    <>
      <div className="animate-in fade-in duration-500 bg-gray-50 min-h-screen pb-24 top-0 left-0">
        
        <header className="bg-gradient-to-br from-[#1a3322] via-emerald-900 to-[#1a3322] text-white pt-12 pb-6 px-6 rounded-b-[2.5rem] shadow-lg shadow-emerald-900/20 sticky top-0 z-10 border-b border-emerald-800/50">
          <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-md">Comunicazioni e Vicinato</h1>
          <p className="text-emerald-200/80 text-sm mt-1 font-medium">Bacheca di quartiere e segnalazioni</p>
        </header>

        <div className="px-6 space-y-8 pt-6 relative z-0">
          
          {/* Comunicazioni Interne */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1 text-gray-500">
              <Users className="w-4 h-4" />
              <h2 className="text-[11px] font-bold tracking-widest uppercase">Comunicazioni Interne</h2>
            </div>
            
            <div className="bg-gray-200/50 p-1 rounded-2xl flex relative max-w-[fit-content]">
               <button onClick={() => { setActiveTab("bacheca"); setVisiblePosts(POSTS_PER_PAGE); }} className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${activeTab === "bacheca" ? "bg-white shadow-sm text-slate-800" : "text-gray-500 hover:text-slate-700"}`}>
                  Bacheca Condomini
               </button>
               <button onClick={() => { setActiveTab("avvisi"); setVisibleAvvisi(POSTS_PER_PAGE); }} className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeTab === "avvisi" ? "bg-white shadow-sm text-slate-800" : "text-gray-500 hover:text-slate-700"}`}>
                  Avvisi Amministratore
                  {avvisiPosts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
               </button>
            </div>

            {activeTab === "bacheca" && (
              <div className="space-y-4">
                {/* New post form */}
                <form onSubmit={handleCreatePost} className="flex flex-col gap-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <textarea 
                    id="post-input"
                    className="w-full text-sm resize-none outline-none text-slate-700 bg-transparent" 
                    placeholder="Scrivi qualcosa in bacheca..." rows={2} 
                    value={newPostContent} onChange={(e) => { setNewPostContent(e.target.value); setPostError(null); }}
                    required
                  />
                  {postError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-xl text-xs font-medium">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {postError}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button type="submit" className="bg-[#1a3322] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[#1a3322]/90 transition">Pubblica</button>
                  </div>
                </form>

                {/* Posts list with pagination */}
                {bachecaPosts.length > 0 ? (
                  <>
                    {bachecaPosts.slice(0, visiblePosts).map(post => (
                      <Card key={post.id} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4 pb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#1a3322] bg-blue-50 text-xs flex-shrink-0">
                              {post.author.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-[14px] text-slate-800">{post.author}</span>
                                <span className="text-xs text-slate-400 font-medium">{post.date}</span>
                              </div>
                              <p className="text-[13px] text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            </div>
                          </div>

                          {/* Reply button & count */}
                          <div className="border-t border-gray-100 pt-3 flex items-center gap-4">
                            <button 
                              onClick={() => { setReplyingTo(replyingTo === post.id ? null : post.id); setReplyContent(""); setReplyError(null); }}
                              className="flex items-center gap-1.5 text-slate-400 hover:text-[#1a3322] transition-colors text-xs font-semibold"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                              {replyingTo === post.id ? "Chiudi" : "Rispondi"}
                            </button>
                            {post.replies > 0 && (
                              <button 
                                onClick={() => toggleReplies(post.id)}
                                className="flex items-center gap-1 text-[#1a3322] text-xs font-bold hover:underline"
                              >
                                {expandedReplies.has(post.id) ? "Nascondi" : `${post.replies} rispost${post.replies === 1 ? 'a' : 'e'}`}
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedReplies.has(post.id) ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>

                          {/* Replies list */}
                          {expandedReplies.has(post.id) && post.repliesList?.length > 0 && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-100">
                              {post.repliesList.map(reply => (
                                <div key={reply.id} className="flex items-start gap-3">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[#1a3322] bg-blue-50 text-[9px] flex-shrink-0 mt-0.5">
                                    {reply.author.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-bold text-xs text-slate-700">{reply.author}</span>
                                      <span className="text-[10px] text-slate-400">{reply.date}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply input */}
                          {replyingTo === post.id && (
                            <div className="mt-3 space-y-2">
                              <div className="flex gap-2">
                                <input 
                                  type="text" value={replyContent}
                                  onChange={(e) => { setReplyContent(e.target.value); setReplyError(null); }}
                                  placeholder="Scrivi una risposta..."
                                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#1e3a8a] focus:bg-white transition-all"
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(post.id); } }}
                                />
                                <button 
                                  onClick={() => handleReply(post.id)}
                                  disabled={!replyContent.trim()}
                                  className="w-10 h-10 rounded-xl bg-[#1a3322] text-white flex items-center justify-center hover:bg-[#1a3322]/90 disabled:opacity-40 transition-all flex-shrink-0"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                              {replyError && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-xl text-xs font-medium">
                                  <ShieldAlert className="w-3 h-3 flex-shrink-0" /> {replyError}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination buttons */}
                    {bachecaPosts.length > POSTS_PER_PAGE && (
                      <div className="flex gap-2 w-full">
                        {bachecaPosts.length > visiblePosts && (
                          <button 
                            onClick={() => setVisiblePosts(prev => prev + POSTS_PER_PAGE)}
                            className="flex-[2] py-3 text-[#1a3322] font-bold text-sm bg-white border border-gray-200 rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <ChevronDown className="w-4 h-4" />
                            Mostra altri {Math.min(POSTS_PER_PAGE, bachecaPosts.length - visiblePosts)}
                          </button>
                        )}
                        {visiblePosts > POSTS_PER_PAGE && (
                          <button 
                            onClick={() => { setVisiblePosts(POSTS_PER_PAGE); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex-[1] py-3 text-slate-500 font-bold text-sm bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ChevronUp className="w-4 h-4" />
                            Meno
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">Nessun post in bacheca.</p>
                )}
              </div>
            )}

            {activeTab === "avvisi" && (
              <div className="space-y-4">
                {avvisiPosts.length > 0 ? (
                  <>
                    {avvisiPosts.slice(0, visibleAvvisi).map(post => (
                      <Card key={post.id} className="rounded-2xl border border-red-100 bg-red-50/30 shadow-sm">
                        <CardContent className="p-5">
                          <div className="flex items-baseline gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="font-bold text-[15px] text-red-800">Avviso Amministratore</span>
                            <span className="text-xs text-red-400 font-medium border-l border-red-200 pl-2">{post.date}</span>
                          </div>
                          <p className="text-[13px] text-slate-700 leading-relaxed bg-white/60 p-3 rounded-xl border border-red-100/50">
                            {post.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {/* Pagination buttons */}
                    {avvisiPosts.length > POSTS_PER_PAGE && (
                      <div className="flex gap-2 w-full">
                        {avvisiPosts.length > visibleAvvisi && (
                          <button 
                            onClick={() => setVisibleAvvisi(prev => prev + POSTS_PER_PAGE)}
                            className="flex-[2] py-3 text-red-700 font-bold text-sm bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <ChevronDown className="w-4 h-4" />
                            Mostra altri {Math.min(POSTS_PER_PAGE, avvisiPosts.length - visibleAvvisi)}
                          </button>
                        )}
                        {visibleAvvisi > POSTS_PER_PAGE && (
                          <button 
                            onClick={() => { setVisibleAvvisi(POSTS_PER_PAGE); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex-[1] py-3 text-slate-500 font-bold text-sm bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ChevronUp className="w-4 h-4" />
                            Meno
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="rounded-2xl border border-gray-100 shadow-sm">
                    <CardContent className="p-8 text-center text-sm text-gray-400 font-medium">
                      Nessun nuovo avviso dall'amministratore.
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </section>

          {/* Apertura al Vicinato */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1 mt-4 text-gray-500">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">3</div>
              <h2 className="text-[11px] font-bold tracking-widest uppercase">Apertura al Vicinato</h2>
            </div>
            
            {/* Location status banner */}
            {!hasLocation && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-1">
                <LocateFixed className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-800 font-medium flex-1">Attiva la posizione per accedere ai servizi locali e ricevere annunci contestualizzati alla tua zona.</p>
              </div>
            )}
            {hasLocation && userZona && (
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-xs text-emerald-700 font-bold">{userZona}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div onClick={handleOpenLocali}>
                 <HubActionCard title="Cerca Locali" desc={hasLocation ? (userZona || "Servizi vicini") : "Attiva posizione"} icon={<MapPin className="text-[#1a3322] w-6 h-6"/>} color="bg-blue-50" needsLocation={!hasLocation} />
               </div>
               <div onClick={handleOpenMarketplace}>
                 <HubActionCard title="Marketplace" desc={hasLocation ? "AI + zona locale" : "Attiva posizione"} icon={<ShoppingBag className="text-emerald-600 w-6 h-6"/>} color="bg-emerald-50" hasAI needsLocation={!hasLocation} />
               </div>
            </div>
            
            <div onClick={() => { 
              if (!hasLocation) {
                setShowLocationPrompt("locali");
              } else {
                setShowNeighborhood(true); 
                fetchLocalNews(); 
              }
            }}>
              <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between relative">
                   {!hasLocation && (
                     <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <LocateFixed className="w-2 h-2" /> GPS
                     </div>
                   )}
                   <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center relative">
                      <Newspaper className="text-amber-600 w-6 h-6" />
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                         <Sparkles className="w-2 h-2" /> AI
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-800">Notizie Locali</h4>
                      <p className="text-xs text-slate-500 mt-0.5">News dal Comune/Quartiere</p>
                    </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors" />
                </CardContent>
              </Card>
            </div>
          </section>

        </div>
      </div>

      {/* Cerca Locali Modal */}
      {showLocali && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#0b1b3d]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-8 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-[#1a3322] rounded-lg text-white"><MapPin className="w-4 h-4" /></div>
                 <h2 className="text-lg font-bold text-slate-900">Locali e Servizi in Zona</h2>
              </div>
              <button onClick={() => setShowLocali(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>
            
            <div className="mb-4">
               <form onSubmit={(e) => { e.preventDefault(); fetchLocali(localiSearch); }} className="flex gap-2 h-12">
                 <input 
                   type="text" 
                   placeholder="Cerca pizzeria, farmacia, idraulico..." 
                   value={localiSearch} 
                   onChange={(e) => setLocaliSearch(e.target.value)} 
                   className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-[#1a3322] focus:bg-white transition-colors" 
                 />
                 <button type="submit" className="bg-[#1a3322] text-white px-5 rounded-xl text-sm font-bold hover:bg-[#1a3322]/90 shadow-sm transition-all">Cerca</button>
               </form>
            </div>
            {localiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#1a3322] animate-spin mb-3" />
                <p className="text-sm text-slate-600 font-medium">Ricerca servizi nella tua zona...</p>
              </div>
            ) : localiError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4"><Navigation className="w-7 h-7 text-amber-500" /></div>
                <p className="text-sm text-slate-700 font-medium">{localiError}</p>
                <button onClick={fetchLocali} className="mt-4 px-4 py-2 bg-[#1a3322] text-white rounded-xl text-sm font-bold hover:opacity-90 transition">Riprova</button>
              </div>
            ) : locali.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><MapPin className="w-7 h-7 text-gray-300" /></div>
                <p className="text-sm text-slate-600 font-medium">Nessun locale trovato nelle vicinanze</p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
                  <button onClick={() => setLocaliCategory("all")} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${localiCategory === "all" ? "bg-[#1a3322] text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}>Tutti ({locali.length})</button>
                  {uniqueTypes.map(type => (
                    <button key={type} onClick={() => setLocaliCategory(type)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${localiCategory === type ? "bg-[#1a3322] text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}>{type} ({locali.filter(l => l.type === type).length})</button>
                  ))}
                </div>
                <div className="overflow-y-auto flex-1 space-y-2">
                  {filteredLocali.map((locale, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-[#1a3322]" /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{locale.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-[#1a3322] bg-blue-50 px-2 py-0.5 rounded uppercase">{locale.type}</span>
                          {locale.address && <span className="text-xs text-slate-400 truncate">{locale.address}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-gray-200 flex-shrink-0">{locale.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Marketplace Modal */}
      {showMarketplace && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#0b1b3d]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-600" /><h2 className="text-lg font-bold text-slate-900">AI Marketplace</h2></div>
              <button onClick={() => setShowMarketplace(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>
            {!marketResult ? (
              <div className="space-y-4 animate-in zoom-in-95 mt-4">
                <p className="text-sm text-slate-600">Descrivi l'oggetto che vuoi vendere e l'IA strutturerà l'annuncio valutandone il prezzo.</p>
                {userZona && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">L'IA calibrerà il prezzo per il mercato di <strong>{userZona}</strong></p>
                  </div>
                )}
                <textarea value={marketInput} onChange={(e) => setMarketInput(e.target.value)} placeholder="Es: Ho una vecchia bici B'Twin azzurra usata da donna. Freni da sistemare ma ruote buone." className="w-full text-sm text-slate-700 bg-gray-50 border border-emerald-100 rounded-xl p-3 resize-none h-24 outline-none focus:bg-white transition-colors" />
                <button onClick={handleGenerateMarket} disabled={isGeneratingMarket || !marketInput} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex justify-center items-center gap-2 disabled:opacity-50 mt-2">
                  {isGeneratingMarket ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGeneratingMarket ? "Elaborazione tramite IA..." : "Genera Annuncio"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in zoom-in-95 mt-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-emerald-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-emerald-400"><ShoppingBag className="w-10 h-10" /></div>
                  <div className="space-y-1 w-full flex flex-col items-start text-left">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">AUTO-GENERATO (IA)</p>
                    <input type="text" value={marketResult.title} onChange={e => setMarketResult({...marketResult, title: e.target.value})} className="w-full font-bold text-slate-900 border-none bg-transparent hover:bg-gray-50 focus:bg-white rounded-lg p-1 -ml-1 outline-none" />
                    <textarea value={marketResult.desc} onChange={e => setMarketResult({...marketResult, desc: e.target.value})} className="w-full text-sm text-slate-500 border-none bg-transparent hover:bg-gray-50 focus:bg-white rounded-lg p-1 -ml-1 resize-none h-20 outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <div>
                     <p className="text-xs text-emerald-800 font-medium">Stima Valore Mercato</p>
                     <span className="text-2xl font-extrabold text-emerald-900">€ {marketResult.price}</span>
                   </div>
                </div>
                <button onClick={() => { addPost({ author: dbUser?.name || "Condomino", content: `[VENDO: €${marketResult.price}] ${marketResult.title}\n${marketResult.desc}`, isAvviso: false }); setShowMarketplace(false); setMarketResult(null); setMarketInput(""); }}
                  className="w-full h-14 rounded-2xl bg-[#00d05e] hover:bg-[#00b853] text-white font-bold text-sm shadow-xl shadow-[#00d05e]/30 transition-all active:scale-95 mt-4">
                  PUBBLICA ANNUNCIO IN BACHECA
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Notizie Locali Modal */}
      {showNeighborhood && (
        <div className="fixed inset-0 z-50 flex items-end bg-[#0b1b3d]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white"><Sparkles className="w-4 h-4" /></div>
                 <h2 className="text-lg font-bold text-slate-900">Notizie da {userZona}</h2>
              </div>
              <button onClick={() => setShowNeighborhood(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">Le ultime notizie e aggiornamenti locali rilevati dall'IA per la tua zona.</p>
              {newsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                  <p className="text-sm text-slate-600 font-medium">Ricerca notizie locali in corso...</p>
                </div>
              ) : localNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><Newspaper className="w-8 h-8 text-gray-400" /></div>
                  <h3 className="font-bold text-slate-800 text-lg">Nessuna notizia</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-[280px]">
                    Al momento non ci sono novità rilevanti per il tuo quartiere.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {localNews.map((news, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Newspaper className="w-24 h-24 text-amber-500" /></div>
                        <div className="relative z-10 space-y-3">
                          <div className="bg-amber-100 text-amber-800 w-fit px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{news.date}</div>
                          <h3 className="text-xl font-extrabold text-amber-900 leading-tight">{news.title}</h3>
                          <p className="text-sm text-amber-800 opacity-80 font-medium">{news.content}</p>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Prompt Modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1b3d]/40 backdrop-blur-sm animate-in fade-in duration-300 px-6">
          <div className="bg-white w-full max-w-sm mx-auto rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LocateFixed className="w-8 h-8 text-[#1a3322]" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Attiva la posizione</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {showLocationPrompt === "locali" 
                ? "Per mostrarti i locali e servizi nella tua zona, Treedoo ha bisogno di accedere alla tua posizione."
                : "Per calibrare i prezzi del Marketplace in base al mercato locale della tua zona, Treedoo ha bisogno della tua posizione."
              }
            </p>
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => requestLocation(showLocationPrompt)}
                disabled={locationRequesting}
                className="w-full h-12 rounded-2xl bg-[#1a3322] hover:bg-[#1a3322]/90 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {locationRequesting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Rilevamento posizione...</>
                ) : (
                  <><LocateFixed className="w-4 h-4" /> Attiva Posizione</>
                )}
              </button>
              <button 
                onClick={() => {
                  setShowLocationPrompt(null);
                  if (showLocationPrompt === "marketplace") {
                    setShowMarketplace(true); // Il marketplace funziona anche senza posizione
                  }
                }}
                className="w-full py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showLocationPrompt === "marketplace" ? "Continua senza posizione" : "Annulla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function HubActionCard({ title, desc, icon, color, hasAI, needsLocation }: { title: string, desc: string, icon: React.ReactNode, color: string, hasAI?: boolean, needsLocation?: boolean }) {
  return (
    <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start flex-col relative">
      {hasAI && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
           <Sparkles className="w-2 h-2" /> AI
        </div>
      )}
      {needsLocation && !hasAI && (
        <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
           <LocateFixed className="w-2 h-2" /> GPS
        </div>
      )}
      <CardContent className="p-5 space-y-4 w-full">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-[13px] text-slate-800 leading-tight">{title}</h4>
          <p className={`text-[11px] mt-1 ${needsLocation ? 'text-amber-500 font-semibold' : 'text-slate-500'}`}>{desc}</p>
        </div>
      </CardContent>
    </Card>
  )
}
