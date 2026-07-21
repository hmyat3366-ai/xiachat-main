import React from "react";
import { toast } from "react-hot-toast";

export const VisitorDetails = ({ conversation }: { conversation: any }) => {
  return (
    <div className="w-72 border-l border-slate-200/80 bg-white flex flex-col overflow-y-auto hidden lg:flex shrink-0">
      {/* Profile Card */}
      <div className="p-6 border-b border-slate-100 text-center bg-gradient-to-b from-indigo-50/60 to-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg">
          {conversation?.visitorId?.name?.charAt(0).toUpperCase() || "S"}
        </div>
        <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">{conversation?.visitorId?.name || "Anonymous"}</h2>
        <p className="text-xs text-slate-400 mb-4 mt-0.5">{conversation?.visitorId?.email || "No email provided"}</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Online</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {["Overview", "Notes", "Files"].map((tab, i) => (
          <button key={tab} className={`flex-1 py-3 text-[11px] font-bold tracking-wide transition-colors ${i === 0 ? "text-indigo-600 border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-600"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
        {[
          { label: "Sessions", value: "03" },
          { label: "Duration", value: "2m 10s" },
          { label: "Tickets", value: "00" },
        ].map((stat, i) => (
          <div key={stat.label} className={`text-center py-4 ${i !== 2 ? "border-r border-slate-100" : ""}`}>
            <span className="block text-sm font-bold text-slate-800">{stat.value}</span>
            <span className="text-[10px] text-slate-400 font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-5 overflow-y-auto">
        {/* Magic Browse */}
        <div>
          <button
            onClick={() => toast("Magic Browse is an Enterprise feature (Coming soon!)", { icon: "✨" })}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[13px] font-semibold rounded-xl transition-all"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Magic Browse
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">View user&apos;s screen in real-time</p>
        </div>

        {/* User Info */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Information</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Name", value: conversation?.visitorId?.name || "Anonymous" },
              { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", label: "IP", value: conversation?.visitorId?.ipAddress || "Unknown" },
              { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Email", value: conversation?.visitorId?.email || "—" },
              { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Location", value: conversation?.visitorId?.location || "Unknown" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <span className="text-[11px] text-slate-400 font-medium">{item.label}</span>
                  <span className="text-[11px] font-semibold text-slate-700 truncate ml-2 max-w-[120px]">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Technology</h3>
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {[
              { label: "Browser", value: conversation?.visitorId?.browser || "Unknown" },
              { label: "OS", value: conversation?.visitorId?.os || "Unknown" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center px-3 py-2.5 text-[12px]">
                <span className="text-slate-400 font-medium">{item.label}</span>
                <span className="font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Page */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Current Page</h3>
          <a
            href={conversation?.visitorId?.currentPage || "#"}
            target="_blank"
            rel="noreferrer"
            className="block text-[12px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline break-all bg-indigo-50 p-3 rounded-xl border border-indigo-100 transition-colors"
          >
            {conversation?.visitorId?.currentPage || "Unknown"}
          </a>
        </div>

        {/* Create Ticket */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">User Ticket</h3>
          <button className="w-full py-2.5 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Ticket
          </button>
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="relative pl-4 border-l-2 border-slate-100 space-y-4 ml-1">
            <div className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white shadow-sm" />
              <p className="text-[13px] font-semibold text-slate-700">Started Chat</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {conversation?.createdAt ? new Date(conversation.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
