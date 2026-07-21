import React, { useState, useMemo } from "react";
import { ChannelIcon } from "./ChannelIcon";

interface Props {
  conversations: any[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string) => void;
}

export const ConversationList = ({ conversations, activeConversationId, setActiveConversationId }: Props) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved">("open");

  const uniqueTabs = useMemo(() => {
    const tabs = new Map<string, { id: string; label: string; count: number }>();
    const filteredByStatus = conversations.filter(c =>
      statusFilter === "open" ? c.status !== "resolved" : c.status === "resolved"
    );
    filteredByStatus.forEach(c => {
      let id = c.channel || "web";
      let label = id.charAt(0).toUpperCase() + id.slice(1);
      if (id === "web" && c.sourceUrl) {
        try {
          const urlStr = c.sourceUrl.startsWith("http") ? c.sourceUrl : `https://${c.sourceUrl}`;
          const url = new URL(urlStr);
          id = `web-${url.hostname}`;
          label = `Web (${url.hostname})`;
        } catch (e) {
          id = `web-${c.sourceUrl}`;
          label = `Web (${c.sourceUrl})`;
        }
      }
      if (tabs.has(id)) {
        tabs.get(id)!.count += 1;
      } else {
        tabs.set(id, { id, label, count: 1 });
      }
    });
    return Array.from(tabs.values());
  }, [conversations, statusFilter]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      if (statusFilter === "open" && c.status === "resolved") return false;
      if (statusFilter === "resolved" && c.status !== "resolved") return false;
      if (searchQuery && !c.visitorId?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeTab === "all") return true;
      let id = c.channel || "web";
      if (id === "web" && c.sourceUrl) {
        try {
          const urlStr = c.sourceUrl.startsWith("http") ? c.sourceUrl : `https://${c.sourceUrl}`;
          const url = new URL(urlStr);
          id = `web-${url.hostname}`;
        } catch (e) {
          id = `web-${c.sourceUrl}`;
        }
      }
      return id === activeTab;
    });
  }, [conversations, activeTab, searchQuery, statusFilter]);

  const openCount = conversations.filter(c => c.status !== "resolved").length;
  const resolvedCount = conversations.filter(c => c.status === "resolved").length;

  return (
    <div className="w-full lg:w-[300px] flex flex-col bg-[#F8F9FC] border-r border-slate-200/80 shrink-0 z-10 h-full">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-5 border-b border-slate-200/80 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">Inbox</h1>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-full border border-indigo-100">
            {conversations.length}
          </span>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="px-4 pt-3 pb-3 bg-white border-b border-slate-200/80 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent rounded-lg text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        {/* Status Toggle */}
        <div className="flex bg-slate-100 p-[3px] rounded-lg border border-slate-200/60">
          <button
            onClick={() => setStatusFilter("open")}
            className={`flex-1 text-[12px] font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === "open"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "open" ? "bg-green-500" : "bg-slate-400"}`} />
            Open
            {openCount > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusFilter === "open" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>{openCount}</span>}
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`flex-1 text-[12px] font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === "resolved"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <svg className={`w-3 h-3 ${statusFilter === "resolved" ? "text-indigo-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resolved
          </button>
        </div>

        {/* Channel Tabs */}
        {uniqueTabs.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              All
            </button>
            {uniqueTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-[#F8F9FC]">
        {filteredConversations.length === 0 && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No conversations found</p>
            <p className="text-slate-300 text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}

        {filteredConversations.map(c => {
          const isActive = activeConversationId === c._id;
          const initials = (c.visitorId?.name || "V").charAt(0).toUpperCase();
          const gradients = [
            "from-violet-500 to-purple-600",
            "from-blue-500 to-indigo-600",
            "from-emerald-500 to-teal-600",
            "from-rose-500 to-pink-600",
            "from-amber-500 to-orange-600",
          ];
          const gradientIdx = (c.visitorId?.name || "V").charCodeAt(0) % gradients.length;

          return (
            <div
              key={c._id}
              onClick={() => setActiveConversationId(c._id)}
              className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-slate-200/50 transition-all duration-150 ${
                isActive
                  ? "bg-white border-l-2 border-l-indigo-500 shadow-sm"
                  : "hover:bg-white/70 border-l-2 border-l-transparent"
              }`}
            >
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0 bg-gradient-to-br ${gradients[gradientIdx]} shadow-md`}>
                {initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`text-[13px] font-semibold truncate pr-2 ${isActive ? "text-indigo-700" : "text-slate-700"}`}>
                    {c.visitorId?.name || "Anonymous"}
                    {c.unreadCount > 0 && activeConversationId !== c._id && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">{c.unreadCount > 9 ? "9+" : c.unreadCount}</span>
                    )}
                  </h3>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(c.lastMessageAt || c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className={`text-[12px] truncate mb-2 leading-tight ${isActive ? "text-indigo-500 font-medium" : "text-slate-400"}`}>
                  {c.status !== "open"
                    ? "✓ Resolved"
                    : (() => {
                        if (c.lastMessage) return c.lastMessage;
                        const lastTime = c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0;
                        const minutesAgo = (Date.now() - lastTime) / 60000;
                        if (minutesAgo < 2) return "🟢 Active now...";
                        if (minutesAgo < 30) return `Last reply ${Math.floor(minutesAgo)}m ago`;
                        return "Idle — no recent activity";
                      })()}
                </p>

                <div className="flex items-center gap-1.5">
                  <div className="text-slate-400">
                    <ChannelIcon type={c.channel || "web"} sourceUrl={c.sourceUrl} />
                  </div>
                  {c.mode === "ai" ? (
                    <span className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      AI
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Agent
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
