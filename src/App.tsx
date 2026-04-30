import React from "react"
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation, Navigate } from "react-router-dom"
import { Home, Settings, Users } from "lucide-react"
import Welcome from "./pages/Welcome"
import CondominoDashboard from "./pages/condomino/Dashboard"
import TicketForm from "./pages/condomino/TicketForm"
import SocialHub from "./pages/condomino/SocialHub"
import AdminDashboard from "./pages/admin/Dashboard"
import Bollette from "./pages/condomino/Bollette"
import Bilancio from "./pages/condomino/Bilancio"
import Regolamento from "./pages/condomino/Regolamento"
import Verbali from "./pages/condomino/Verbali"
import { cn } from "./lib/utils"
import { useAuth } from "./lib/AuthContext"

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'amministratore') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function MainLayout() {
  const location = useLocation()
  return (
    <div className="flex flex-col min-h-[100dvh] w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-gray-50 relative shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 rounded-t-2xl">
        <NavItem to="/dashboard" icon={<Home />} label="Home" active={location.pathname === "/dashboard"} />
        <NavItem to="/social" icon={<Users />} label="Vicinato" active={location.pathname === "/social"} />
        <NavItem to="/bollette" icon={<FileTextIcon />} label="Bollette" active={location.pathname === "/bollette"} />
        <NavItem to="/ticket" icon={<Settings />} label="Gestione" active={location.pathname === "/ticket"} />
      </nav>
    </div>
  )
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  )
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 transition-all ${active ? "text-[#1a3322] -translate-y-1" : "text-gray-400 hover:text-gray-600"}`}>
      <div className={`relative ${active ? "animate-in zoom-in-50 duration-300" : ""}`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${active ? "drop-shadow-md" : ""}` })}
        {active && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#4ade80] rounded-full border border-white shadow-[0_0_8px_rgba(74,222,128,0.5)]" />}
      </div>
      <span className={`text-[10px] font-bold ${active ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>{label}</span>
    </Link>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
          <Route path="/dashboard" element={<CondominoDashboard />} />
          <Route path="/ticket" element={<TicketForm />} />
          <Route path="/social" element={<SocialHub />} />
          <Route path="/bollette" element={<Bollette />} />
          <Route path="/bilancio" element={<Bilancio />} />
          <Route path="/regolamento" element={<Regolamento />} />
          <Route path="/verbali" element={<Verbali />} />
        </Route>

        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  )
}
