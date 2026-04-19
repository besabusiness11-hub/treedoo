import React from "react"
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from "react-router-dom"
import { Home, ClipboardList, Users, Settings, UserCircle, Bell, Megaphone } from "lucide-react"
import Welcome from "./pages/Welcome"
import CondominoDashboard from "./pages/condomino/Dashboard"
import TicketForm from "./pages/condomino/TicketForm"
import SocialHub from "./pages/condomino/SocialHub"
import AdminDashboard from "./pages/admin/Dashboard"
import Bollette from "./pages/condomino/Bollette"
import { cn } from "./lib/utils"

function MainLayout() {
  const location = useLocation()
  
  return (
    <div className="flex flex-col min-h-[100dvh] w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-gray-50 relative shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 rounded-t-2xl">
        <NavItem to="/dashboard" icon={<Home />} label="Home" active={location.pathname === "/dashboard"} />
        <NavItem to="/social" icon={<Users />} label="Vicinato" active={location.pathname === "/social"} />
        <NavItem to="/ticket" icon={<ClipboardList />} label="Ticket" active={location.pathname === "/ticket"} />
        <NavItem to="/bollette" icon={<FileTextIcon />} label="Bollette" active={location.pathname === "/bollette"} />
      </nav>
    </div>
  )
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  )
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={cn("flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-blue-900 transition-colors", active && "text-blue-900")}>
      <div className={cn("[&>svg]:w-6 [&>svg]:h-6", active && "[&>svg]:fill-blue-100")}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        
        {/* Condomino Routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<CondominoDashboard />} />
          <Route path="/ticket" element={<TicketForm />} />
          <Route path="/social" element={<SocialHub />} />
          <Route path="/bollette" element={<Bollette />} />
        </Route>

        {/* Admin Route */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
