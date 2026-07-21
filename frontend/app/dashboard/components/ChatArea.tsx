import React, { RefObject, useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { ChannelIcon } from "./ChannelIcon";

interface Props {
  activeConversation: any;
  messages: any[];
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (textOverride?: string | React.MouseEvent | React.KeyboardEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isPrivateNote: boolean;
  setIsPrivateNote: (v: boolean) => void;
  handleAIAssist: () => void;
  showSavedReplies: boolean;
  setShowSavedReplies: (v: boolean) => void;
  savedReplies: any[];
  setShowCreateReplyModal: (v: boolean) => void;
  showArticles: boolean;
  setShowArticles: (v: boolean) => void;
  kbArticles: any[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  handleResolve: (id: string) => void;
  updateConversationMode: (id: string, mode: string) => void;
  onBack?: () => void;
}

import { toast } from "react-hot-toast";

export const ChatArea = ({
  activeConversation,
  messages,
  inputText,
  setInputText,
  handleSendMessage,
  handleKeyDown,
  isPrivateNote,
  setIsPrivateNote,
  handleAIAssist,
  showSavedReplies,
  setShowSavedReplies,
  savedReplies,
  setShowCreateReplyModal,
  showArticles,
  setShowArticles,
  kbArticles,
  messagesEndRef,
  handleResolve,
  updateConversationMode,
  onBack
}: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerContainerRef.current && !emojiPickerContainerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        handleSendMessage(data.url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FC]">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-lg mb-5">
          <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <p className="text-slate-700 font-bold text-base">No conversation selected</p>
        <p className="text-slate-400 text-sm mt-1">Pick a conversation from the inbox</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FC] relative">
      <div className="h-[60px] flex items-center justify-between px-4 lg:px-6 border-b border-slate-200/80 bg-white z-10 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1.5 -ml-1.5 mr-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md flex items-center justify-center text-white font-bold text-[14px] shrink-0">
            {activeConversation?.visitorId?.name?.charAt(0).toUpperCase() || 'V'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-[14px] font-bold text-slate-800 tracking-tight">{activeConversation?.visitorId?.name || 'Anonymous'}</h2>
              <div className="text-slate-400"><ChannelIcon type={activeConversation?.channel || 'web'} /></div>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
              Active on Website
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-start gap-1 ml-2 md:ml-4">
            {activeConversation?.mode === 'ai' ? (
              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 border border-purple-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                AI Handling
              </span>
            ) : (
              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 border border-blue-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                Agent Handling
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeConversation?.mode === 'ai' ? (
            <button 
              onClick={async () => {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/conversations/${activeConversation._id}/mode`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify({ mode: 'human' })
                });
                if (res.ok) {
                  updateConversationMode(activeConversation._id, 'human');
                  toast.success("You are now handling this conversation", { style: { background: '#18181B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
                }
              }}
              className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-medium rounded-md shadow-[0_2px_8px_rgba(79,70,229,0.3)] transition-all"
              title="Take Over Conversation"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              <span className="hidden sm:inline-block">Take Over</span>
            </button>
          ) : (
            <button 
              onClick={async () => {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/conversations/${activeConversation._id}/mode`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify({ mode: 'ai' })
                });
                if (res.ok) {
                  updateConversationMode(activeConversation._id, 'ai');
                  toast.success("AI has taken over the conversation", { style: { background: '#18181B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
                }
              }}
              className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#E4E4E7] text-[13px] font-medium rounded-md transition-all"
              title="Return to AI"
            >
              <svg className="w-4 h-4 shrink-0 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              <span className="hidden sm:inline-block">Return to AI</span>
            </button>
          )}
          
          <button 
            onClick={async () => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/conversations/${activeConversation._id}/mode`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify({ isTicket: true, status: 'pending' })
                });
                if (res.ok) {
                  toast.success("Converted to Ticket successfully", { style: { background: '#18181B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
                }
              } catch (e) {
                toast.error("Failed to convert to ticket");
              }
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#E4E4E7] text-[13px] font-medium rounded-md transition-all">
            <svg className="w-4 h-4 text-[#A1A1AA] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>
            Convert to Ticket
          </button>
          
          {activeConversation.status === 'resolved' ? (
            <div className="px-3 py-1.5 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-green-400 text-[13px] font-semibold rounded-md flex items-center gap-1.5 cursor-default shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Resolved
            </div>
          ) : (
            <button 
              onClick={() => handleResolve(activeConversation._id)}
              className="px-3 py-1.5 bg-[#4F46E5] text-white text-[13px] font-medium rounded-md shadow-[0_2px_8px_rgba(79,70,229,0.3)] hover:bg-[#4338CA] transition-all">
              Resolve
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FC]">
        <div className="text-center">
          <span className="inline-block text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">Today</span>
        </div>
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.type === "operator" ? "justify-end" : m.type === "internal" ? "justify-center" : "justify-start"}`}>
            {m.type === "internal" ? (
              <div className="max-w-[85%] w-full mb-4">
                <div className="bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)] px-4 py-3 rounded-xl text-[15px] leading-relaxed text-yellow-500 flex gap-3 shadow-sm backdrop-blur-md">
                  <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <p className="font-semibold text-yellow-400 text-xs mb-1">Internal Note by {m.sender}</p>
                    <p>{m.text}</p>
                  </div>
                </div>
              </div>
            ) : m.type === "campaign" ? (
              <div className="max-w-[85%] w-full mb-4">
                <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] px-4 py-3 rounded-xl text-[15px] leading-relaxed text-blue-400 flex gap-3 shadow-sm items-start relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-blue-400 text-xs uppercase tracking-wider">Automated Campaign Sent</p>
                      <p className="text-[10px] text-blue-500 font-semibold">{m.time}</p>
                    </div>
                    <p className="text-blue-300 font-medium italic">"{m.text}"</p>
                  </div>
                </div>
              </div>
            ) : m.type === "ai" ? (
              <div className="max-w-[85%] w-full mb-4 flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(168,85,247,0.15)] text-purple-400 flex items-center justify-center shrink-0 border border-[rgba(168,85,247,0.3)] shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  </div>
                  <div>
                    <div className="bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)] px-4 py-2.5 rounded-2xl rounded-tl-sm text-[14px] leading-relaxed text-[#E4E4E7] shadow-sm backdrop-blur-md">
                      {m.text}
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] mt-1.5 font-medium text-left flex items-center gap-1">
                      {m.time}
                      <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                      <span>Generated by AI</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`max-w-[85%] sm:max-w-[70%] mb-4 ${m.type === "operator" ? "order-1" : "order-2"}`}>
                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  m.type === "operator" 
                    ? "bg-indigo-600 text-white rounded-tr-sm shadow-[0_4px_16px_rgba(99,102,241,0.25)]" 
                    : "bg-white text-slate-700 rounded-tl-sm border border-slate-200/80 shadow-sm"
                }`}>
                  {m.text && m.text.includes("res.cloudinary.com") ? (
                    m.text.includes("/image/upload/") || m.text.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <a href={m.text} target="_blank" rel="noreferrer">
                        <img src={m.text} alt="Attachment" className="max-w-full sm:max-w-[200px] max-h-[200px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                      </a>
                    ) : (
                      <a href={m.text} target="_blank" rel="noreferrer" className={`flex items-center gap-2 underline ${m.type === "operator" ? "text-indigo-100 hover:text-white" : "text-[#4F46E5] hover:text-[#818CF8]"}`}>
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span className="truncate max-w-[150px]">Attached File</span>
                      </a>
                    )
                  ) : (
                    m.text
                  )}
                </div>
                <div className={`text-[10px] text-slate-400 mt-1.5 font-medium ${m.type === "operator" ? "text-right" : "text-left"}`}>
                  {m.time}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-4 bg-white border-t border-slate-200/80 shrink-0 z-10">
        {activeConversation.status === 'resolved' ? (
          <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
            This conversation has been resolved. You cannot send new messages.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-2 px-1">
              <button 
                onClick={() => setIsPrivateNote(!isPrivateNote)}
                className={`flex items-center gap-1.5 px-3 min-h-[36px] text-xs sm:text-sm font-semibold rounded-lg transition-all border ${
                  isPrivateNote 
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[inset_0_0_12px_rgba(234,179,8,0.1)]' 
                    : 'bg-[rgba(234,179,8,0.1)] text-yellow-500 hover:bg-[rgba(234,179,8,0.15)] border-[rgba(234,179,8,0.2)]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                {isPrivateNote ? 'Typing Private Note' : 'Private Note'}
              </button>
              <button 
                onClick={handleAIAssist}
                className="flex items-center gap-1.5 px-3 min-h-[36px] text-xs sm:text-sm font-semibold rounded-lg bg-[rgba(168,85,247,0.1)] text-purple-400 hover:bg-[rgba(168,85,247,0.15)] transition-all border border-[rgba(168,85,247,0.2)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                AI Assist
              </button>
              <div className="flex-1" />
              <button 
                onClick={() => setShowSavedReplies(!showSavedReplies)}
                className="flex items-center gap-1.5 px-3 min-h-[36px] text-xs sm:text-sm font-semibold rounded-lg text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA] transition-all relative"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                Saved Replies
              </button>
            </div>
            
            {/* Saved Replies Popover */}
            {showSavedReplies && (
              <div className="absolute bottom-[100px] right-4 lg:right-[300px] mb-2 w-[calc(100vw-2rem)] sm:w-80 bg-[#18181B] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.05)] bg-[#09090B] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#FAFAFA]">Saved Replies (Templates)</span>
                  <button onClick={() => setShowSavedReplies(false)} className="text-[#A1A1AA] hover:text-[#FAFAFA]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {savedReplies.map(reply => (
                    <button 
                      key={reply._id || reply.id}
                      onClick={() => {
                        setInputText(reply.content);
                        setShowSavedReplies(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.02)] transition-colors flex items-start gap-3 group"
                    >
                      <div className="bg-[rgba(255,255,255,0.05)] text-[#A1A1AA] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.1)] shrink-0 mt-0.5">
                        {reply.shortcut}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#E4E4E7] mb-0.5 group-hover:text-[#4F46E5]">{reply.title}</p>
                        <p className="text-[11px] text-[#A1A1AA] line-clamp-2">{reply.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-[rgba(255,255,255,0.05)] bg-[#09090B]">
                  <button 
                    onClick={() => {
                      setShowSavedReplies(false);
                      setShowCreateReplyModal(true);
                    }}
                    className="w-full py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-xs font-bold text-[#E4E4E7] rounded-lg hover:bg-[rgba(255,255,255,0.06)] hover:text-[#4F46E5] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Create New Template
                  </button>
                </div>
              </div>
            )}
            
            <div className={`flex flex-col border rounded-xl overflow-hidden transition-all shadow-sm focus-within:shadow-md ${
              isPrivateNote ? 'border-amber-300 bg-amber-50 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20' : 'border-slate-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10'
            }`}>
              <textarea 
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value.endsWith("/")) setShowSavedReplies(true);
                  else if (e.target.value === "") setShowSavedReplies(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder={isPrivateNote ? "Type a private internal note..." : "Type a message... (Press '/' for templates)"} 
                className={`w-full min-h-[70px] bg-transparent border-none resize-none py-3 px-4 text-[14px] text-slate-800 focus:outline-none placeholder:text-slate-400 ${isPrivateNote ? 'placeholder-amber-400/70' : ''}`}
              />
              <div className={`px-2 py-2 border-t flex items-center justify-between ${
                isPrivateNote ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'
              }`}>
                <div className="flex gap-1">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="*/*" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors ${
                      isPrivateNote ? 'text-yellow-600 hover:bg-yellow-500/20' : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                  </button>
                  <div className="relative" ref={emojiPickerContainerRef}>
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`w-11 h-11 flex items-center justify-center rounded-lg transition-colors ${
                        isPrivateNote ? 'text-yellow-600 hover:bg-yellow-500/20' : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#FAFAFA]'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm3.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" /></svg>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <EmojiPicker 
                          onEmojiClick={(e) => {
                            setInputText(inputText + e.emoji);
                          }} 
                          autoFocusSearch={false} 
                          emojiStyle={EmojiStyle.FACEBOOK}
                          theme={Theme.DARK}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className={`flex items-center gap-2 px-5 h-10 rounded-lg text-[14px] font-semibold transition-all shadow-sm ${
                    !inputText.trim()
                      ? isPrivateNote ? 'bg-amber-100 text-amber-400 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isPrivateNote ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-md' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  {isPrivateNote ? 'Add Note' : 'Send'}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-[11px] text-[#A1A1AA] font-medium flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded-[4px] border border-[rgba(255,255,255,0.1)] text-[9px] font-sans">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.05)] rounded-[4px] border border-[rgba(255,255,255,0.1)] text-[9px] font-sans">Shift + Enter</kbd> for new line
              </span>
              <div className="relative">
                <button 
                  onClick={() => setShowArticles(!showArticles)}
                  className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#818CF8] transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  Insert Article
                </button>
                {showArticles && (
                  <div className="absolute bottom-full right-0 mb-2 w-[calc(100vw-2rem)] sm:w-72 bg-[#18181B] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.05)] bg-[#09090B] flex justify-between items-center">
                      <span className="text-xs font-bold text-[#FAFAFA]">Knowledge Base</span>
                      <button onClick={() => setShowArticles(false)} className="text-[#A1A1AA] hover:text-[#FAFAFA]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {kbArticles.map(article => (
                        <button 
                          key={article.id}
                          onClick={() => {
                            setInputText(inputText + (inputText ? " " : "") + article.content);
                            setShowArticles(false);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.02)] transition-colors group"
                        >
                          <p className="text-xs font-semibold text-[#E4E4E7] mb-0.5 group-hover:text-[#4F46E5]">{article.title}</p>
                          <p className="text-[10px] text-[#A1A1AA] line-clamp-1">{article.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
