"use client";

import React, { useState, useEffect } from "react";

export default function AIAgentSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [message, setMessage] = useState("");

  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiModel, setAiModel] = useState("llama-3-8b-free");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiSystemPrompt, setAiSystemPrompt] = useState('နင်က Customer Support AI Assistant ဖြစ်တယ်။ Customer ကို ယဉ်ယဉ်ကျေးကျေး မြန်မာလို ပြန်နှုတ်ဆက်ပါ။ Customer မေးတာတွေကို ဖြေပေးပါ။ မဖြေနိုင်ရင် "Admin မကြာခင် ပြန်လည်ဖြေကြားပေးပါလိမ့်မယ်ရှင်၊ ခဏလေး စောင့်ဆိုင်းပေးပါနော်" လို့ ပြောပြီး စောင့်ခိုင်းပါ။');
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  const isModelFree = (modelName: string) => {
    return modelName && (modelName.includes('free') || modelName.includes('llama') || modelName.includes('gemma') || modelName.includes('qwen') || modelName.includes('laguna'));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.workspaces && user.workspaces.length > 0) {
        setWorkspaceId(user.workspaces[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${workspaceId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setWorkspaceData(data.data);
          let currentModel = data.data.aiModel || "llama-3-8b-free";
          const isFree = currentModel.includes('free') || currentModel.includes('llama') || currentModel.includes('gemma') || currentModel.includes('qwen') || currentModel.includes('laguna');
          if (!isFree) currentModel = "llama-3-8b-free";
          const hasAccess = data.data.plan === 'pro' || isModelFree(currentModel);
          if (!hasAccess) {
            setAiEnabled(false);
          } else {
            setAiEnabled(data.data.aiEnabled || false);
          }
          setAiModel(currentModel);
          setAiApiKey(data.data.aiApiKey || "");
          if (data.data.aiSystemPrompt) setAiSystemPrompt(data.data.aiSystemPrompt);
        }
      })
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${workspaceId}/ai-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ aiEnabled, aiModel, aiApiKey, aiSystemPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-[#F8F9FC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading AI Settings...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] overflow-y-auto font-sans">

      {/* Page Header */}
      <div className="px-6 sm:px-8 py-5 bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Agent Configuration</h1>
            <p className="text-sm text-slate-400 mt-0.5">Setup your AI Assistant to answer customer queries automatically.</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 max-w-4xl">

        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">

          {/* Toggle Section */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${aiEnabled ? 'bg-indigo-100' : 'bg-slate-100'} transition-colors`}>
                <svg className={`w-5 h-5 ${aiEnabled ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 flex flex-wrap items-center gap-2">
                  Enable AI Auto-Pilot
                  {workspaceData?.plan !== 'pro' && !isModelFree(aiModel) && (
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">PRO PLAN ONLY</span>
                  )}
                  {isModelFree(aiModel) && (
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">FREE MODEL ACTIVE</span>
                  )}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">When enabled, AI will automatically reply to visitors.</p>
              </div>
            </div>
            <label className={`relative inline-flex items-center shrink-0 ${workspaceData?.plan === 'pro' || isModelFree(aiModel) ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={aiEnabled}
                disabled={!(workspaceData?.plan === 'pro' || isModelFree(aiModel))}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
            </label>
          </div>

          {/* Fields Section */}
          <div className={`p-5 sm:p-6 space-y-6 ${!aiEnabled ? 'opacity-40 pointer-events-none' : ''} transition-all`}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* API Key */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">OpenAI API Key</label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800 font-mono placeholder:text-slate-400 transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Your API key is securely stored and never shared.
                </p>
              </div>

              {/* Model Select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">AI Model</label>
                <div className="relative">
                  <select
                    value={aiModel}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setAiModel(newModel);
                      if (workspaceData?.plan !== 'pro' && !isModelFree(newModel)) {
                        setAiEnabled(false);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800 appearance-none font-medium transition-all"
                  >
                    <option value="llama-3-8b-free">Llama 3 8B Instruct (Free)</option>
                    <option value="gemma-2-9b-free">Gemma 2 9B Instruct (Free)</option>
                    <option value="qwen-2.5-7b-free">Qwen 2.5 7B Instruct (Free)</option>
                    <option value="laguna-m-1-free">Laguna M.1 (Free)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* System Prompt */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-slate-700">System Prompt (Instructions)</label>
                <button className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors">Load Template</button>
              </div>
              <textarea
                rows={6}
                value={aiSystemPrompt}
                onChange={(e) => setAiSystemPrompt(e.target.value)}
                placeholder="You are a helpful customer support assistant..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none text-slate-800 leading-relaxed placeholder:text-slate-400 transition-all"
              />
              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  <strong>💡 Tip:</strong> Tell the AI exactly how you want it to behave. For example:
                  <span className="italic block mt-1.5 text-indigo-500 opacity-90">&quot;Always reply in Burmese unless asked in English. Keep answers short and polite. Do not offer discounts.&quot;</span>
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", label: "Auto-Replies", desc: "AI responds instantly 24/7", color: "indigo" },
            { icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25", label: "Knowledge Base", desc: "Learns from your articles", color: "violet" },
            { icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", label: "Human Handoff", desc: "Escalates when needed", color: "blue" },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg bg-${card.color}-50 flex items-center justify-center shrink-0`}>
                <svg className={`w-4.5 h-4.5 text-${card.color}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-700">{card.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pb-8">
          <button className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm">
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}
