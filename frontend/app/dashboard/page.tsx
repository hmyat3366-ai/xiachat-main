"use client";

import React, { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import { ConversationList } from "./components/ConversationList";
import { ChatArea } from "./components/ChatArea";
import { VisitorDetails } from "./components/VisitorDetails";
import { CreateTemplateModal } from "./components/CreateTemplateModal";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [showArticles, setShowArticles] = useState(false);
  const [showSavedReplies, setShowSavedReplies] = useState(false);
  const [savedReplies, setSavedReplies] = useState<any[]>([]);
  const [showCreateReplyModal, setShowCreateReplyModal] = useState(false);
  const [newShortcut, setNewShortcut] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchConversations = (workspaceId: string) => {
    const token = localStorage.getItem("token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
    fetch(`${API_URL}/api/conversations/${workspaceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setConversations(data.data);
          // Only set active if none is selected
          setActiveConversationId(prev => prev || data.data[0]._id);
        }
      })
      .catch(err => console.error("Error fetching convos:", err));
  };

  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const workspaceId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;
    
    if (workspaceId) {
      fetchConversations(workspaceId);
    }

    const fetchSavedReplies = async () => {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
      try {
        const res = await fetch(`${API_URL}/api/saved-replies/${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSavedReplies(data.data);
        }
      } catch (err) {
        console.error("Error fetching saved replies:", err);
      }
    };
    if (workspaceId) {
      fetchSavedReplies();
    }

    const token = localStorage.getItem("token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
    socketRef.current = io(API_URL, {
      forceNew: true,
      auth: { token }
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to Real-time Chat Server");
      const wId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;
      socketRef.current?.emit("join_workspace", wId);
    });
    if (socketRef.current.connected) {
      const wId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;
      socketRef.current?.emit("join_workspace", wId);
    }

    socketRef.current.on("receive_message", (data) => {
      // 1. Update Messages if it's the active conversation
      if (data.conversationId === activeConversationIdRef.current) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }

      // 2. Update Conversations list
      setConversations(prev => {
        const convExists = prev.find(c => c._id === data.conversationId);
        if (convExists) {
          const updatedList = prev.map(c => 
            c._id === data.conversationId 
              ? { 
                  ...c, 
                  lastMessageAt: new Date().toISOString(),
                  lastMessage: data.text,
                  unreadCount: (data.conversationId !== activeConversationIdRef.current && data.senderType === 'visitor') 
                    ? (c.unreadCount || 0) + 1 
                    : (c.unreadCount || 0)
                } 
              : c
          );
          return updatedList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        } else {
          // New conversation, fetch
          const wId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;
          if (wId) {
            fetchConversations(wId);
          }
          return prev;
        }
      });
    });

    socketRef.current.on("conversation_updated", (data) => {
      setConversations(prev => {
        return prev.map(c => c._id === data._id ? { ...c, ...data } : c);
      });
    });

    socketRef.current.on("new_conversation", (data) => {
      setConversations(prev => {
        if (prev.find(c => c._id === data._id)) return prev;
        return [data, ...prev];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    const token = localStorage.getItem("token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
    fetch(`${API_URL}/api/messages/${activeConversationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const formatted = data.data.map((m: any) => ({
            id: m._id,
            sender: m.senderName || (m.senderType === 'operator' ? 'You (Agent)' : 'Visitor'),
            type: m.senderType,
            text: m.text,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formatted);
        }
      });
  }, [activeConversationId]);

  const kbArticles = [
    { id: 1, title: "How to connect WhatsApp", content: "You can connect WhatsApp by going to Settings > Channels > Add WhatsApp and following the QR code instructions." },
    { id: 2, title: "Billing & Subscription FAQ", content: "Our billing works on a monthly cycle. You can update your payment method in Workspace Settings > Billing." },
    { id: 3, title: "Setting up AI Agent", content: "To set up your AI Agent, go to the AI Agent tab, upload your logo, and add your business instructions." },
  ];

  const handleCreateReply = async () => {
    if (!newShortcut || !newTitle || !newContent) return;
    
    const storedUser = localStorage.getItem("user");
    const workspaceId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
      const res = await fetch(`${API_URL}/api/saved-replies/${workspaceId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, shortcut: newShortcut, content: newContent })
      });
      const data = await res.json();
      if (data.success) {
        setSavedReplies([...savedReplies, data.data]);
        setNewShortcut("");
        setNewTitle("");
        setNewContent("");
        setShowCreateReplyModal(false);
        toast.success("Template created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create template");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAIAssist = async () => {
    if (!inputText.trim()) return;
    
    const toastId = toast.loading("AI is rewriting your message...");
    
    try {
      const storedUser = localStorage.getItem("user");
      const workspaceId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";

      const res = await fetch(`${API_URL}/api/ai-assist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ text: inputText, workspaceId })
      });
      
      const data = await res.json();
      if (data.success && data.enhancedText) {
        setInputText(data.enhancedText);
        toast.success("Message enhanced!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to enhance message", { id: toastId });
      }
    } catch (err) {
      toast.error("Network error while connecting to AI", { id: toastId });
      console.error(err);
    }
  };

  const handleSendMessage = (textOverride?: string | React.MouseEvent | React.KeyboardEvent) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
    if (!textToSend.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "You (Agent)",
      type: isPrivateNote ? "internal" : "operator",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Instead of optimistically updating the UI here,
    // we let the server broadcast it back so multiple agent tabs stay in sync
    const storedUser = localStorage.getItem("user");
    const workspaceId = storedUser ? JSON.parse(storedUser).workspaces?.[0] : null;

    if (socketRef.current && activeConversationId) {
      socketRef.current.emit("send_message", { 
        ...newMessage, 
        conversationId: activeConversationId, 
        workspaceId: workspaceId,
        room: `conv_${activeConversationId}` 
      });
    }

    if (typeof textOverride !== 'string') {
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";
      const res = await fetch(`${API_URL}/api/conversations/${id}/resolve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => prev.map(c => c._id === id ? { ...c, status: 'resolved' } : c));
        if (activeConversationId === id) {
          const nextConv = conversations.find(c => c._id !== id && c.status !== 'resolved');
          setActiveConversationId(nextConv ? nextConv._id : null);
        }
      }
    } catch (err) {
      console.error("Error resolving conversation:", err);
    }
  };
  const updateConversationMode = (id: string, mode: string) => {
    setConversations(prev => prev.map(c => c._id === id ? { ...c, mode } : c));
  };

  const activeConversation = conversations.find(c => c._id === activeConversationId);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#F8F9FC]">
      <div className={`shrink-0 h-full ${isMobileChatOpen ? 'hidden lg:flex' : 'flex w-full lg:w-auto'}`}>
        <ConversationList 
          conversations={conversations} 
          activeConversationId={activeConversationId} 
          setActiveConversationId={(id) => {
            setActiveConversationId(id);
            setConversations(prev => prev.map(c => c._id === id ? { ...c, unreadCount: 0 } : c));
            setIsMobileChatOpen(true);
          }} 
        />
      </div>

      <div className={`flex-1 flex h-full overflow-hidden bg-[#F8F9FC] ${isMobileChatOpen ? 'flex' : 'hidden lg:flex'}`}>
        <ChatArea 
          activeConversation={activeConversation}
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
          isPrivateNote={isPrivateNote}
          setIsPrivateNote={setIsPrivateNote}
          handleAIAssist={handleAIAssist}
          showSavedReplies={showSavedReplies}
          setShowSavedReplies={setShowSavedReplies}
          savedReplies={savedReplies}
          setShowCreateReplyModal={setShowCreateReplyModal}
          showArticles={showArticles}
          setShowArticles={setShowArticles}
          kbArticles={kbArticles}
          messagesEndRef={messagesEndRef}
          handleResolve={handleResolve}
          updateConversationMode={updateConversationMode}
          onBack={() => setIsMobileChatOpen(false)}
        />
      </div>

      {/* VisitorDetails is hidden on mobile by default, keeping it md/lg hidden as it already is lg:flex */}
      <VisitorDetails conversation={activeConversation} />

      <CreateTemplateModal 
        showCreateReplyModal={showCreateReplyModal}
        setShowCreateReplyModal={setShowCreateReplyModal}
        newShortcut={newShortcut}
        setNewShortcut={setNewShortcut}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newContent={newContent}
        setNewContent={setNewContent}
        handleCreateReply={handleCreateReply}
      />
    </div>
  );
}
