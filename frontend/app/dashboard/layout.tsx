"use client";

import Link from "next/link";
import { ReactNode, useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { toast, Toaster } from "react-hot-toast";
import "../../lib/fetchInterceptor";

// Basic SVG Icons for the sidebar
function InboxIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function KnowledgeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function VisitorsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function CampaignsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function WidgetIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.879-6.839a1.125 1.125 0 00-1.397-1.397l-6.84 3.879a15.995 15.995 0 00-4.648 4.764m3.42 3.42a15.995 15.995 0 004.764-4.648l3.879-6.839a1.125 1.125 0 00-1.397-1.397l-6.84 3.879a15.995 15.995 0 00-4.648 4.764" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", icon: <InboxIcon />, label: "Inbox" },
  { href: "/dashboard/agent", icon: <AgentIcon />, label: "AI Agent" },
  { href: "/dashboard/visitors", icon: <VisitorsIcon />, label: "Visitors" },
  { href: "/dashboard/contacts", icon: <ContactsIcon />, label: "Contacts" },
  { href: "/dashboard/campaigns", icon: <CampaignsIcon />, label: "Campaigns" },
  { href: "/dashboard/analytics", icon: <AnalyticsIcon />, label: "Analytics" },
  { href: "/dashboard/widget", icon: <WidgetIcon />, label: "Widget" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [theme, setTheme] = useState("LIGHT");
  const [profileName, setProfileName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Capture OAuth tokens from URL if present
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlUser = params.get("user");

    if (urlToken && urlUser) {
      localStorage.setItem("token", urlToken);
      localStorage.setItem("user", decodeURIComponent(urlUser));
      
      // Clean up the URL without triggering a React Router navigation
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("token");
      newUrl.searchParams.delete("user");
      window.history.replaceState({}, document.title, newUrl.toString());
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    // Fetch interceptor is now handled globally via lib/fetchInterceptor

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setProfileName(parsedUser.name || "");

    // Fetch workspace data for badge
    const wsId = parsedUser.workspaces && parsedUser.workspaces.length > 0 ? parsedUser.workspaces[0] : null;
    if (wsId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${wsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setWorkspaceData(data.data);
          }
        });
    }

    // Request Notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Socket connection for global notifications
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
    socketRef.current = io(API_URL, {
      forceNew: true,
      auth: { token }
    });
    
    socketRef.current.on("connect", () => {
      socketRef.current?.emit("join_workspace", wsId);
    });
    
    socketRef.current.on("receive_message", (data) => {
      // If a visitor sends a message and we are NOT on the inbox page, increment badge
      if (data.senderType === "visitor") {
        // Play notification sound
        try {
          const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Audio play prevented by browser", e));
        } catch (e) {}

        // Show Desktop Notification if backgrounded
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification("New Message - Xia Chat", {
            body: data.text || "You received a new message from a visitor.",
            icon: "/logo.png"
          });
        }

        setUnreadCount((prev) => prev + 1);
        
        // Show in-app Toast Notification
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-in slide-in-from-top-4' : 'animate-out slide-out-to-top-4 fade-out'
            } max-w-sm w-full bg-[#09090B]/80 backdrop-blur-2xl shadow-[0_24px_48px_rgba(0,0,0,0.6)] rounded-2xl pointer-events-auto flex ring-1 ring-[rgba(255,255,255,0.08)] cursor-pointer text-[#FAFAFA] overflow-hidden`}
            onClick={() => {
              toast.dismiss(t.id);
              router.push("/dashboard");
            }}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] flex items-center justify-center text-white font-bold shadow-[0_4px_12px_rgba(79,70,229,0.4)]">
                    {data.sender ? data.sender.charAt(0).toUpperCase() : 'V'}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-[#FAFAFA]">
                    {data.sender || 'New Visitor'}
                  </p>
                  <p className="mt-1 text-sm text-[#A1A1AA] line-clamp-1">
                    {data.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ));
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      socketRef.current?.disconnect();
    };
  }, [router]);

  // Reset unread count when visiting the inbox
  useEffect(() => {
    if (pathname === "/dashboard") {
      setUnreadCount(0);
    }
  }, [pathname]);

  return (
    <div className="flex flex-col xl:flex-row h-[100dvh] bg-[#F8F9FC] overflow-hidden font-sans text-slate-800">
      {/* Mobile Header */}
      <div className="xl:hidden flex items-center justify-between h-14 bg-white border-b border-slate-200 text-slate-800 px-4 shrink-0 z-30 sticky top-0 shadow-sm">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="font-medium text-sm tracking-wide">Xia Chat</span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] flex items-center justify-center text-white text-xs font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 z-40 xl:hidden backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ─── PREMIUM GLASS SIDEBAR ─── */}
      <aside className={`fixed inset-y-0 left-0 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"} xl:relative xl:translate-x-0 w-[72px] flex flex-col items-center py-6 border-r border-slate-200/80 bg-white z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[2px_0_12px_rgba(0,0,0,0.06)] xl:shadow-none`}>
        <Link href="/dashboard" className="w-12 h-12 mb-6 group relative flex items-center justify-center" onClick={() => setMobileOpen(false)}>
          <img src="/logo.png" alt="Xia Chat Logo" className="w-9 h-9 group-hover:scale-105 transition-transform duration-300" />
        </Link>

        <nav className="flex-1 w-full flex flex-col items-center gap-2">
          {navItems.filter((item) => {
            const currentUserMember = workspaceData?.members?.find((m: any) => m.userId === user?.id || m.userId?._id === user?.id || m.userId === user?._id);
            const role = currentUserMember?.role || 'owner';
            if (role === 'owner' || role === 'admin') return true;
            if (role === 'manager') return ['Inbox', 'Visitors', 'Contacts', 'Analytics'].includes(item.label);
            if (role === 'agent') return ['Inbox'].includes(item.label);
            return false;
          }).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  if (item.label === "Inbox") setUnreadCount(0);
                  setMobileOpen(false);
                }}
                className={`group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' 
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-600 rounded-r-full"></div>
                )}
                <div className="transform group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                {item.label === "Inbox" && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
                {/* Glass Tooltip */}
                <div className="absolute left-16 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 whitespace-nowrap translate-x-1 group-hover:translate-x-0">
                  {item.label}
                  {item.label === "Inbox" && unreadCount > 0 && ` (${unreadCount})`}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 mt-auto">
          {(() => {
            const currentUserMember = workspaceData?.members?.find((m: any) => m.userId === user?.id || m.userId?._id === user?.id || m.userId === user?._id);
            const role = currentUserMember?.role || 'owner';
            if (role === 'owner' || role === 'admin') {
              return (
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMobileOpen(false)}
                  className="group relative w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                >
                  <div className="transform group-hover:rotate-45 transition-transform duration-300">
                    <SettingsIcon />
                  </div>
                  <div className="absolute left-16 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 whitespace-nowrap translate-x-1 group-hover:translate-x-0">
                    Settings
                  </div>
                </Link>
              );
            }
            return null;
          })()}
          <div className="relative" ref={profileRef}>
            <div 
              onClick={() => setProfileOpen(!profileOpen)}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 border ring-2 ring-transparent hover:ring-indigo-200 ${
                workspaceData?.plan === 'pro' 
                  ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-transparent text-slate-800 shadow-md' 
                  : 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent text-white shadow-md'
              }`}
            >
              <span className={`text-sm font-bold tracking-wider`}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
              {workspaceData?.plan === 'pro' && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[9px] font-bold px-1.5 py-[1px] rounded shadow-sm border border-white">
                  PRO
                </div>
              )}
            </div>
            
            {/* Premium Glass Dropdown */}
            {profileOpen && (
              <div className="absolute bottom-2 left-16 w-64 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-left-4 duration-200">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner ${workspaceData?.plan === 'pro' ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-[#FAFAFA]' : 'bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] text-[#FAFAFA]'}`}>
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || "User"}</p>
                      {workspaceData?.plan === 'pro' ? (
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">PRO</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">FREE</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user?.email || "No Workspace"}</p>
                  </div>
                </div>
                
                <div className="p-2 space-y-1">
                  <button onClick={() => { setProfileOpen(false); setShowProfileModal(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    My Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); setShowWorkspaceModal(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>
                    Switch Workspace
                  </button>
                </div>
                
                <div className="p-2 border-t border-slate-100">
                  <button onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.push("/login");
                  }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#EF4444] font-medium hover:bg-[#EF4444]/10 rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8F9FC] overflow-hidden relative">
        {children}
      </main>
      
      <Toaster position="top-right" />
      
      {/* Profile Modal - Premium Glass Card */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-[#09090B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#09090B]/80 backdrop-blur-2xl rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.8)] border border-[rgba(255,255,255,0.08)] w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[rgba(255,255,255,0.08)] shrink-0 bg-[rgba(255,255,255,0.02)]">
              <h2 className="text-base font-semibold text-[#FAFAFA]">My Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[rgba(255,255,255,0.06)] p-1.5 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex justify-center mb-2">
                <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[#FAFAFA] flex items-center justify-center text-4xl font-light shadow-inner relative group cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 font-bold">{profileName.charAt(0).toUpperCase() || "U"}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-[#FAFAFA] placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:border-[#4F46E5] transition-all shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 h-12 border border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.2)] rounded-xl text-sm text-[#A1A1AA] cursor-not-allowed shadow-inner" 
                />
              </div>
            </div>
            <div className="p-5 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowProfileModal(false)} className="px-5 h-11 bg-transparent border border-[rgba(255,255,255,0.1)] text-[#FAFAFA] text-sm font-medium rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-all">Cancel</button>
              <button onClick={() => {
                const updatedUser = { ...user, name: profileName };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);
                toast.success("Profile updated successfully!");
                setShowProfileModal(false);
              }} className="px-5 h-11 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl hover:bg-[#4338CA] transition-all shadow-[0_4px_15px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.6)]">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Workspace Modal - Premium Glass Card */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-[#09090B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#09090B]/80 backdrop-blur-2xl rounded-3xl shadow-[0_24px_48px_rgba(0,0,0,0.8)] border border-[rgba(255,255,255,0.08)] w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[rgba(255,255,255,0.08)] shrink-0 bg-[rgba(255,255,255,0.02)]">
              <h2 className="text-base font-semibold text-[#FAFAFA]">Switch Workspace</h2>
              <button onClick={() => setShowWorkspaceModal(false)} className="text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[rgba(255,255,255,0.06)] p-1.5 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {/* Current Workspace Card */}
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-[rgba(79,70,229,0.1)] border border-[rgba(79,70,229,0.3)] hover:bg-[rgba(79,70,229,0.15)] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] text-white flex items-center justify-center font-bold shadow-[0_4px_12px_rgba(79,70,229,0.4)]">
                    X
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#FAFAFA]">Xia Chat Workspace</p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">{workspaceData?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[rgba(79,70,229,0.2)] flex items-center justify-center text-[#4F46E5]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              </button>
              
              {/* Divider */}
              <div className="my-4 border-t border-[rgba(255,255,255,0.05)]"></div>
              
              {/* Create New Card */}
              <button onClick={() => {
                toast("Creating new workspaces will be available soon!");
              }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-all group border-dashed">
                <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.05)] text-[#A1A1AA] group-hover:text-[#FAFAFA] flex items-center justify-center font-bold transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#FAFAFA] transition-colors">Create Workspace</p>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Start a new project or company</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
