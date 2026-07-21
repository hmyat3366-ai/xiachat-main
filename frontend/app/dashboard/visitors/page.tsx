"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [notification, setNotification] = useState("");
  const router = useRouter();

  const fetchVisitors = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const workspaceId = user.workspaces?.[0] || "";
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/visitors/${workspaceId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map((v: any) => ({
          id: v._id,
          ip: v.ipAddress || "Unknown IP",
          location: v.location || "Unknown Location",
          page: v.currentPage || "/",
          timeOnPage: new Date(v.lastActive || v.createdAt).toLocaleTimeString(),
          browser: `${v.browser || 'Unknown'} / ${v.os || 'Unknown'}`,
          status: (Date.now() - new Date(v.lastActive || v.createdAt).getTime()) < 5 * 60000 ? "active" : "idle"
        }));
        setVisitors(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch visitors", err);
    }
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartChat = (visitorId: string) => {
    setNotification("Starting proactive chat with visitor...");
    setTimeout(() => { setNotification(""); router.push("/dashboard"); }, 1500);
  };

  const activeCount = visitors.filter(v => v.status === "active").length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] relative">
      {/* Toast */}
      {notification && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white text-slate-800 px-5 py-3 rounded-xl shadow-lg border border-slate-200 text-sm font-semibold z-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          {notification}
        </div>
      )}

      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-6 border-b border-slate-200/80 shrink-0 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">Active Visitors</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-700">{visitors.length} Online</span>
          </div>
        </div>
        <button onClick={fetchVisitors} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Online Now", value: visitors.length, color: "emerald" },
              { label: "Active Sessions", value: activeCount, color: "indigo" },
              { label: "Idle", value: visitors.length - activeCount, color: "slate" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Map / Radar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-slate-800">Live Global Traffic</h3>
              <span className="text-[11px] font-semibold text-slate-400">Real-time</span>
            </div>
            <div className="w-full h-56 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-xl flex items-center justify-center border border-indigo-100/60 relative overflow-hidden">
              <div className="absolute top-[40%] left-[20%]">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 shadow-md"></span>
                </span>
              </div>
              <div className="absolute top-[60%] left-[70%]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" style={{ animationDelay: '1s' }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-600 shadow-md"></span>
                </span>
              </div>
              <div className="absolute top-[30%] left-[55%]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" style={{ animationDelay: '0.5s' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 shadow-md"></span>
                </span>
              </div>
              <p className="text-indigo-200 font-black text-2xl tracking-widest uppercase select-none">Real-Time Radar</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-800">Current Sessions</h3>
              <span className="text-[11px] font-semibold text-slate-400">{visitors.length} visitor{visitors.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-full md:min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-slate-50/80">
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Location & IP</th>
                    <th className="px-6 py-3 hidden md:table-cell">Current Page</th>
                    <th className="px-6 py-3 hidden md:table-cell">Time</th>
                    <th className="px-6 py-3 hidden md:table-cell">Browser / OS</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {visitors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4">
                        {v.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Idle
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700">{v.location}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">{v.ip}</div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <a href="#" className="text-indigo-600 hover:underline font-medium text-[13px]">{v.page}</a>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs hidden md:table-cell">{v.timeOnPage}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden md:table-cell">{v.browser}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleStartChat(v.id)}
                          className="opacity-100 md:opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                        >
                          Start Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visitors.length === 0 && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 border border-slate-200">
                  <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-semibold text-sm">No active visitors</p>
                <p className="text-slate-400 text-xs mt-1">Waiting for website traffic...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
