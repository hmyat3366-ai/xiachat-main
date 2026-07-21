"use client";

import React, { useState, useEffect } from "react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({
    totalConversations: 0,
    totalReplies: 0,
    chartData: [0, 0, 0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    const workspaceId = user.workspaces?.[0] || "";
    const token = localStorage.getItem("token");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/analytics/${workspaceId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => { if (data.success) setAnalytics(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: "Total Conversations", value: analytics.totalConversations, change: "+12%", positive: true, icon: "M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z", color: "indigo" },
    { label: "Messages Sent", value: analytics.totalReplies, change: "+8%", positive: true, icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5", color: "violet" },
    { label: "Resolution Rate", value: "94%", change: "+2%", positive: true, icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
    { label: "CSAT Score", value: "4.8", change: "/ 5", positive: null, icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", color: "amber" },
  ];

  const colorMap: any = {
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] overflow-y-auto">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-6 border-b border-slate-200/80 shrink-0 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">Analytics</h1>
          {loading && <span className="text-xs text-slate-400 font-medium">Loading data...</span>}
        </div>
        <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-medium transition-all">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This month</option>
          <option>Last month</option>
        </select>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const c = colorMap[m.color];
            return (
              <div key={m.label} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}>
                    <svg className={`w-5 h-5 ${c.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                    </svg>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.positive === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : m.positive === false ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {m.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{m.value}</p>
                <p className="text-[12px] text-slate-400 font-medium">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[14px] font-bold text-slate-800">Conversations over time</h3>
              <span className="text-[11px] text-slate-400 font-medium">This week</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-2 px-2">
              {analytics.chartData.map((h: number, i: number) => {
                const maxH = Math.max(...analytics.chartData, 10);
                const percent = (h / maxH) * 100;
                return (
                  <div key={i} className="w-full relative group flex flex-col items-center">
                    <div
                      className="w-full bg-indigo-100 hover:bg-indigo-500 rounded-t-lg transition-colors cursor-pointer"
                      style={{ height: `${Math.max(percent, 8)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap pointer-events-none">
                        {h} chats
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* Heatmap Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[14px] font-bold text-slate-800">Busiest Hours</h3>
              <span className="text-[11px] text-slate-400 font-medium">Peak times</span>
            </div>
            <div className="h-48 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex flex-col items-center justify-center border border-indigo-100/60 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-semibold">Heatmap Visualization</p>
              <p className="text-slate-400 text-xs">Coming in next update</p>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Avg. Response Time", value: "1m 24s", sub: "from first message" },
            { label: "New Contacts This Week", value: "24", sub: "↑ 6 from last week" },
            { label: "AI Handled", value: "67%", sub: "of total conversations" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm">
              <p className="text-[11px] text-slate-400 font-medium mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-[11px] text-slate-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
