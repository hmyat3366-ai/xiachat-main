"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("integrations");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWebsiteSettings, setShowWebsiteSettings] = useState(false);
  const [isWebsiteConnected, setIsWebsiteConnected] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [connectedDomains, setConnectedDomains] = useState<{domain: string, date: string}[]>([]);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Team State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  
  // Get Workspace ID dynamically
  const [userWorkspaceId, setUserWorkspaceId] = useState("");
  const [userWebsite, setUserWebsite] = useState("yourwebsite.com");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  React.useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUserId(u.id || u._id || null);
      if (u.workspaces && u.workspaces.length > 0) {
        setUserWorkspaceId(u.workspaces[0]);
      }
      if (u.website) {
        setUserWebsite(u.website.replace(/^https?:\/\//, '').replace(/\/$/, ''));
      }
    }
  }, []);

  const currentUserRole = React.useMemo(() => {
    if (!currentUserId || !teamMembers.length) return null;
    const member = teamMembers.find(m => m.userId?._id === currentUserId || m.userId?.id === currentUserId);
    return member?.role || null;
  }, [currentUserId, teamMembers]);

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Knowledge Base State
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const [showAddKbModal, setShowAddKbModal] = useState(false);
  const [newKbTitle, setNewKbTitle] = useState("");
  const [newKbContent, setNewKbContent] = useState("");
  
  // Website Scanning State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/knowledge/${userWorkspaceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setKbEntries(data.data);
      }
    } catch (err) {
      console.error("Error fetching knowledge base:", err);
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle || !newKbContent) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/knowledge/${userWorkspaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title: newKbTitle, content: newKbContent, type: 'text' })
      });
      const data = await res.json();
      if (data.success) {
        setKbEntries([data.data, ...kbEntries]);
        setNewKbTitle("");
        setNewKbContent("");
        setShowAddKbModal(false);
      }
    } catch (err) {
      console.error("Error adding knowledge:", err);
    }
  };

  const handleScanWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl) return;
    setIsScanning(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/knowledge/${userWorkspaceId}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url: scanUrl })
      });
      const data = await res.json();
      if (data.success || res.status === 202) {
        setScanUrl("");
        setShowScanModal(false);
        toast.success("Website crawl started in the background. It may take a few minutes.", { duration: 5000 });
        // Refresh knowledge list after 5 seconds to show initial results
        setTimeout(() => fetchKnowledge(), 5000);
      } else {
        toast.error(data.error || "Failed to scan website.");
      }
    } catch (err) {
      console.error("Error scanning website:", err);
      toast.error("An error occurred during scanning.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeleteKnowledge = async (kbId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/knowledge/${userWorkspaceId}/${kbId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setKbEntries(kbEntries.filter(kb => kb._id !== kbId));
      }
    } catch (err) {
      console.error("Error deleting knowledge:", err);
    }
  };

  const fetchWorkspaceSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${userWorkspaceId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaceData(data.data);
        if (data.data.allowedDomains) {
          setConnectedDomains(data.data.allowedDomains.map((d: string) => ({ domain: d, date: "Active" })));
          if (data.data.allowedDomains.length > 0) {
            setIsWebsiteConnected(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchKnowledge();
    fetchWorkspaceSettings();

    // Fetch team members
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${userWorkspaceId}/members`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeamMembers(data.members || []);
          setPendingInvites(data.invitations || []);
        }
      });
  }, [userWorkspaceId]);

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    setIsUpgrading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/billing/${userWorkspaceId}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate checkout");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/billing/${userWorkspaceId}/create-portal-session`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open billing portal");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const channels = [
    { name: "Website Chat Widget", desc: "Live chat for your website", icon: "🌐", connected: true, pro: false },
    { name: "WhatsApp Business", desc: "Connect your WhatsApp Business API", icon: "📱", connected: false, pro: true },
    { name: "Facebook Messenger", desc: "Reply to messages from your Facebook Page", icon: "💬", connected: false, pro: true },
    { name: "Instagram Direct", desc: "Manage IG DMs from your inbox", icon: "📸", connected: false, pro: true },
    { name: "Email (IMAP/SMTP)", desc: "Receive and send emails via support address", icon: "✉️", connected: false, pro: true },
    { name: "Telegram", desc: "Connect a Telegram Bot", icon: "✈️", connected: false, pro: true },
  ].sort((a, b) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] overflow-hidden">
      <div className="h-[60px] flex items-center px-6 border-b border-slate-200/80 shrink-0 bg-white shadow-sm">
        <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">Settings</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-white p-2 lg:p-4 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 lg:gap-0 lg:space-y-1 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 lg:pb-0">
            <button 
              onClick={() => setActiveTab("workspace")}
              className={`shrink-0 flex items-center px-4 lg:px-3 py-2 lg:py-2.5 text-sm font-semibold rounded-full lg:rounded-lg transition-colors whitespace-nowrap ${activeTab === 'workspace' ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              Workspace
            </button>
            <button 
              onClick={() => setActiveTab("integrations")}
              className={`shrink-0 flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 text-sm font-semibold rounded-full lg:rounded-lg transition-colors whitespace-nowrap ${activeTab === 'integrations' ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <span>Channels & Integrations</span>
              <span className="bg-[#4F46E5] text-white text-[10px] px-1.5 py-0.5 rounded-full">New</span>
            </button>
            <button 
              onClick={() => setActiveTab("team")}
              className={`shrink-0 flex items-center px-4 lg:px-3 py-2 lg:py-2.5 text-sm font-semibold rounded-full lg:rounded-lg transition-colors whitespace-nowrap ${activeTab === 'team' ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              Team Members
            </button>
            <button 
              onClick={() => setActiveTab("knowledge")}
              className={`shrink-0 flex items-center gap-2 px-4 lg:px-3 py-2 lg:py-2.5 text-sm font-semibold rounded-full lg:rounded-lg transition-colors whitespace-nowrap ${activeTab === 'knowledge' ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <span>Knowledge Base</span>
              <span className="bg-[rgba(168,85,247,0.15)] text-purple-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">AI</span>
            </button>
            <button 
              onClick={() => setActiveTab("billing")}
              className={`shrink-0 flex items-center px-4 lg:px-3 py-2 lg:py-2.5 text-sm font-semibold rounded-full lg:rounded-lg transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              Billing
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto bg-[#F8F9FC]">
          {activeTab === "workspace" && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-8">Workspace Settings</h2>

              <div className="space-y-8">
                {/* Profile */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Workspace Logo</h3>
                  <div className="flex items-center gap-6">
                    <img src="/logo.png" alt="Workspace Logo" className="w-16 h-16 rounded-xl shadow-sm border border-slate-100" />
                    <button className="px-4 py-2 border border-slate-200/80 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      Change Logo
                    </button>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* General Info */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Workspace Name</label>
                    <input type="text" defaultValue="Xia Chat" className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-1.5">Website URL</label>
                    <input type="url" defaultValue="https://xiachat.com" className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#4F46E5]" />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Danger Zone */}
                <div>
                  <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm text-slate-400 mb-4">Permanently delete this workspace and all its data. This action cannot be undone.</p>
                  <button className="px-4 py-2 bg-[rgba(239,68,68,0.1)] text-red-400 text-sm font-semibold rounded-lg hover:bg-[rgba(239,68,68,0.15)] transition-colors border border-[rgba(239,68,68,0.2)]">
                    Delete Workspace
                  </button>
                </div>
              </div>

              <div className="mt-10">
                <button className="px-6 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4F46E5]-hover transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Channels & Integrations</h2>
                <p className="text-slate-400 text-sm">Connect all your communication channels to reply from a single inbox.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {channels.map((ch) => {
                  const isProOrEnterprise = workspaceData?.plan === 'pro' || workspaceData?.plan === 'enterprise';
                  const needsUpgrade = ch.pro && !isProOrEnterprise;
                  
                  return (
                  <div key={ch.name} className="border border-slate-200/80 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl relative">
                        {ch.icon}
                        {ch.pro && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                            PRO
                          </div>
                        )}
                      </div>
                      {ch.connected ? (
                        <span className="bg-[rgba(34,197,94,0.15)] text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Connected</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Not Connected</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">{ch.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-1">{ch.desc}</p>
                    
                    {ch.connected ? (
                      <button 
                        onClick={() => ch.name === "Website Chat Widget" ? setShowSetupModal(true) : needsUpgrade ? setShowUpgradeModal(true) : setShowSetupModal(true)}
                        className="w-full py-2 border border-slate-200/80 text-slate-400 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Configure
                      </button>
                    ) : (
                      <button 
                        onClick={() => needsUpgrade ? setShowUpgradeModal(true) : (ch.pro && isProOrEnterprise) ? null : setShowSetupModal(true)}
                        className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors shadow-sm ${needsUpgrade ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600' : (ch.pro && isProOrEnterprise) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#4F46E5] text-white hover:bg-[#4F46E5]-hover'}`}
                      >
                        {needsUpgrade ? 'Unlock with Pro' : (ch.pro && isProOrEnterprise) ? 'Coming Soon' : 'Connect'}
                      </button>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="max-w-4xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Team Members</h2>
                  <p className="text-slate-400 text-sm">Manage who has access to this workspace and their roles.</p>
                </div>
                {currentUserRole !== 'agent' && (
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    disabled={isGeneratingInvite}
                    className="w-full sm:w-auto px-4 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4F46E5]-hover transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="whitespace-nowrap">Invite Member</span>
                  </button>
                )}
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Active Members */}
                    {teamMembers.map((member, idx) => (
                      <tr key={idx} className="hover:bg-transparent transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] text-white flex items-center justify-center font-bold text-xs">
                              {member.userId?.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{member.userId?.name || "Unknown User"}</p>
                              <p className="text-slate-400 text-xs">{member.userId?.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {currentUserRole !== 'agent' && member.role !== 'owner' ? (
                            <select 
                              className="bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-semibold rounded-md px-2 py-1 focus:outline-none focus:border-[#4F46E5] capitalize cursor-pointer"
                              value={member.role}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                if (confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${userWorkspaceId}/members/${member.userId._id}/role`, {
                                      method: "PATCH",
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                      },
                                      body: JSON.stringify({ role: newRole })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setTeamMembers(teamMembers.map(m => m.userId._id === member.userId._id ? { ...m, role: newRole } : m));
                                      alert("Role updated successfully.");
                                    } else {
                                      alert(data.error || "Failed to update role");
                                      // Revert select visually by re-rendering with old state
                                      setTeamMembers([...teamMembers]); 
                                    }
                                  } catch (error) {
                                    alert("Network error updating role.");
                                    setTeamMembers([...teamMembers]);
                                  }
                                }
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="agent">Agent</option>
                            </select>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold capitalize">{member.role}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(34,197,94,0.1)]0"></span>
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {currentUserRole !== 'agent' && member.role !== 'owner' && (
                            <button 
                              onClick={async () => {
                                if (confirm("Are you sure you want to remove this member?")) {
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${userWorkspaceId}/members/${member.userId._id}`, {
                                      method: "DELETE",
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                      }
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setTeamMembers(teamMembers.filter(m => m.userId._id !== member.userId._id));
                                    } else {
                                      alert(data.error || "Failed to remove member");
                                    }
                                  } catch (e) {
                                    alert("Error removing member");
                                  }
                                }
                              }}
                              className="text-red-400 hover:text-red-600 transition-colors p-1" title="Remove Member"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Pending Invites */}
                    {pendingInvites.map((invite, idx) => (
                      <tr key={idx} className="hover:bg-transparent transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-xs">
                              {invite.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{invite.email}</p>
                              <p className="text-slate-400 text-xs">Invitation Sent</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold capitalize">{invite.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            Pending Invite
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => {
                               const inviteLink = `${window.location.origin}/invite?token=${invite.token}`;
                               navigator.clipboard.writeText(inviteLink);
                               alert("Invite link copied to clipboard!");
                             }}
                             className="text-slate-400 hover:text-slate-400 transition-colors p-1 mr-2" title="Copy Invite Link"
                           >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                           </button>
                           <button 
                             onClick={async () => {
                               if (confirm("Are you sure you want to revoke this invitation?")) {
                                 try {
                                   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${userWorkspaceId}/invites/${invite._id}`, {
                                     method: "DELETE",
                                     headers: {
                                       'Authorization': `Bearer ${localStorage.getItem('token')}`
                                     }
                                   });
                                   const data = await res.json();
                                   if (data.success) {
                                     setPendingInvites(pendingInvites.filter(i => i._id !== invite._id));
                                     alert("Invitation revoked successfully.");
                                   } else {
                                     alert(data.error || "Failed to revoke invitation.");
                                   }
                                 } catch (e) {
                                   alert("Error revoking invitation.");
                                 }
                               }
                             }}
                             className="text-red-400 hover:text-red-600 transition-colors p-1" title="Revoke Invite"
                           >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                           </button>
                        </td>
                      </tr>
                    ))}
                    
                    {teamMembers.length === 0 && pendingInvites.length === 0 && (
                      <tr>
                         <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                           No team members found.
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="max-w-5xl animate-in fade-in duration-300">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Billing &amp; Subscription</h2>
                <p className="text-slate-400 text-sm">Manage your plan, payment methods, and invoices.</p>
              </div>

              {/* Current Plan Usage Summary */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-[#4F46E5] mb-1 uppercase tracking-wider">Current Plan</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {workspaceData?.plan === 'enterprise' ? 'Enterprise Plan' : workspaceData?.plan === 'pro' ? 'Pro Plan â€” $19/mo' : 'Free Plan â€” $0'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${(workspaceData?.plan === 'pro' || workspaceData?.plan === 'enterprise') ? 'bg-[rgba(79,70,229,0.15)] text-[#818CF8]' : 'bg-slate-100 text-slate-400'}`}>
                      {(workspaceData?.plan === 'pro' || workspaceData?.plan === 'enterprise') ? 'âœ¦ Active' : 'Free Tier'}
                    </span>
                    {(workspaceData?.plan === 'pro' || workspaceData?.plan === 'enterprise') && (
                      <button onClick={handleManageBilling} className="px-4 py-1.5 bg-slate-100 border border-slate-200/80 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors">Manage Billing</button>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400 font-medium">Monthly Conversations</span>
                      <span className="text-slate-800 font-bold">{workspaceData?.monthlyConversations || 0} / {workspaceData?.plan === 'free' || !workspaceData?.plan ? '1,000' : 'Unlimited'}</span>
                    </div>
                    <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-2 overflow-hidden">
                      {workspaceData?.plan !== 'free' && workspaceData?.plan ? (
                        <div className="bg-[#4F46E5] h-2 rounded-full w-full opacity-40"></div>
                      ) : (
                        <div className="bg-[#4F46E5] h-2 rounded-full transition-all" style={{ width: `${Math.min(((workspaceData?.monthlyConversations || 0) / 1000) * 100, 100)}%` }}></div>
                      )}
                    </div>
                    {(!workspaceData?.plan || workspaceData?.plan === 'free') && (workspaceData?.monthlyConversations || 0) >= 900 && (
                      <p className="text-xs text-amber-400 font-medium mt-1.5">âš  Approaching monthly limit</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400 font-medium">Team Members</span>
                      <span className="text-slate-800 font-bold">{workspaceData?.memberCount || 1} / {workspaceData?.plan === 'enterprise' ? 'Unlimited' : workspaceData?.plan === 'pro' ? '20' : '2'}</span>
                    </div>
                    <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(((workspaceData?.memberCount || 1) / (workspaceData?.plan === 'enterprise' ? 100 : workspaceData?.plan === 'pro' ? 20 : 2)) * 100, 100)}%` }}></div>
                    </div>
                    {(!workspaceData?.plan || workspaceData?.plan === 'free') && (workspaceData?.memberCount || 1) >= 2 && (
                      <p className="text-xs text-red-400 font-medium mt-1.5">âœ• Team member limit reached</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Plans matching landing page */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-[#4F46E5] uppercase tracking-wide mb-1">Choose a Plan</p>
                <h3 className="text-xl font-bold text-slate-800">Simple, transparent pricing.</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-5 mb-8">
                {/* Free */}
                <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${(!workspaceData?.plan || workspaceData?.plan === 'free') ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.04)]' : 'border-slate-100 bg-slate-50'}`}>
                  {(!workspaceData?.plan || workspaceData?.plan === 'free') && <div className="absolute -top-3 left-4"><span className="inline-flex items-center px-3 py-0.5 bg-[rgba(255,255,255,0.1)] text-slate-800 text-[10px] font-bold rounded-full border border-[rgba(255,255,255,0.15)]">Current Plan</span></div>}
                  <h3 className="text-base font-semibold text-slate-800 mb-1">Free</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-3xl font-bold text-slate-800">$0</span><span className="text-slate-400 text-sm">/ forever</span></div>
                  <p className="text-slate-400 text-xs mb-5">Perfect for personal projects and solo operators.</p>
                  <ul className="space-y-2 mb-6">
                    {['Up to 1,000 conversations / month','2 team members','Live chat widget','Shared inbox','Contacts & visitor tracking','7-day conversation history'].map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5 text-[#818CF8] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}
                      </li>
                    ))}
                  </ul>
                  {(!workspaceData?.plan || workspaceData?.plan === 'free') ? (
                    <div className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 bg-[rgba(255,255,255,0.04)] border border-slate-200/80">Your Current Plan</div>
                  ) : <div className="py-2.5 text-center text-xs text-slate-400">â€”</div>}
                </div>

                {/* Pro */}
                <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${workspaceData?.plan === 'pro' ? 'bg-[rgba(79,70,229,0.12)] border-[rgba(79,70,229,0.5)] shadow-[0_0_40px_rgba(79,70,229,0.15)]' : 'bg-[rgba(79,70,229,0.06)] border-[rgba(79,70,229,0.25)]'}`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-0.5 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full shadow-[0_2px_12px_rgba(79,70,229,0.5)]">{workspaceData?.plan === 'pro' ? 'Current Plan' : 'Most Popular'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">Pro</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-3xl font-bold text-slate-800">$19</span><span className="text-slate-400 text-sm">/ workspace / month</span></div>
                  <p className="text-slate-400 text-xs mb-5">For growing teams that need powerful tools.</p>
                  <ul className="space-y-2 mb-6">
                    {['Unlimited conversations','Up to 20 team members','AI Agent (GPT-4o powered)','Campaigns & bulk messaging','Advanced analytics','Remove Xia Chat branding'].map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5 text-[#818CF8] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}
                      </li>
                    ))}
                  </ul>
                  {workspaceData?.plan === 'pro' ? (
                    <button onClick={handleManageBilling} className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[rgba(255,255,255,0.1)] text-slate-600 hover:bg-[rgba(255,255,255,0.15)] transition-colors border border-slate-200">Manage Subscription</button>
                  ) : (
                    <button onClick={() => handleUpgrade('pro')} disabled={isUpgrading} className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors shadow-[0_2px_12px_rgba(79,70,229,0.4)] disabled:opacity-60 flex items-center justify-center gap-2">
                      {isUpgrading ? 'Processing...' : 'Upgrade to Pro â€” $19/mo'}
                    </button>
                  )}
                </div>

                {/* Enterprise */}
                <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${workspaceData?.plan === 'enterprise' ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.04)]' : 'border-slate-100 bg-slate-50'}`}>
                  {workspaceData?.plan === 'enterprise' && <div className="absolute -top-3 left-4"><span className="inline-flex items-center px-3 py-0.5 bg-[rgba(255,255,255,0.1)] text-slate-800 text-[10px] font-bold rounded-full border border-[rgba(255,255,255,0.15)]">Current Plan</span></div>}
                  <h3 className="text-base font-semibold text-slate-800 mb-1">Enterprise</h3>
                  <div className="flex items-baseline gap-1 mb-2"><span className="text-3xl font-bold text-slate-800">Custom</span></div>
                  <p className="text-slate-400 text-xs mb-5">For large organizations with custom requirements.</p>
                  <ul className="space-y-2 mb-6">
                    {['Custom API & integrations','Dedicated account manager','Custom AI model fine-tuning','SLA & uptime guarantee','White-glove onboarding'].map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5 text-[#818CF8] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>{f}
                      </li>
                    ))}
                  </ul>
                  {workspaceData?.plan === 'enterprise' ? (
                    <button onClick={handleManageBilling} className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/80">Manage Subscription</button>
                  ) : (
                    <a href="mailto:sales@xiachat.com" className="block w-full text-center py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/80">Contact Sales</a>
                  )}
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Billing History</h3>
                  <button className="text-sm font-semibold text-[#4F46E5] hover:underline">Download All</button>
                </div>
                <div className="p-8 text-center text-slate-400 text-sm font-medium">No invoices available yet.</div>
              </div>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="max-w-4xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Knowledge Base</h2>
                  <p className="text-slate-400 text-sm font-medium">Add text, FAQs, or scan your website to train your AI Assistant.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowScanModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl shadow-sm hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <span className="whitespace-nowrap">Scan Website</span>
                  </button>
                  <button 
                    onClick={() => setShowAddKbModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl shadow-[0_2px_10px_rgba(79,70,229,0.3)] hover:bg-[#4338CA] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="whitespace-nowrap">Add Knowledge</span>
                  </button>
                </div>
              </div>

              {workspaceData?.plan !== 'pro' && (
                <div className="mb-6 p-4 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-xl flex gap-3">
                   <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <div>
                     <p className="text-sm text-amber-400 font-bold mb-1">AI Features require a Pro Plan</p>
                     <p className="text-xs text-slate-400">You can add knowledge, but the AI won't automatically answer customer queries until you upgrade.</p>
                   </div>
                </div>
              )}

              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Title</th>
                        <th className="px-6 py-4 font-semibold">Type</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kbEntries.length === 0 ? (
                      <tr className="hover:bg-transparent transition-colors">
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-[rgba(168,85,247,0.15)] text-purple-400 rounded-full flex items-center justify-center mb-3">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                            </div>
                            <p className="font-semibold text-slate-800 mb-1">No Knowledge Added</p>
                            <p className="text-xs text-slate-400 max-w-sm">Train your AI by adding text, FAQs, or uploading documents. The AI uses this data to answer queries accurately.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      kbEntries.map(entry => (
                        <tr key={entry._id} className="hover:bg-transparent transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800 mb-1">{entry.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{entry.type}</span>
                          </td>
                          <td className="px-6 py-4">
                            {entry.status === 'active' ? (
                              <span className="text-green-600 font-semibold text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[rgba(34,197,94,0.1)]0"></span>Active</span>
                            ) : (
                              <span className="text-slate-400 font-semibold text-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Processing</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteKnowledge(entry._id)}
                              className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Website Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-[#F8F9FC]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Install Xia Chat on your website</h2>
              <button onClick={() => setShowSetupModal(false)} className="text-slate-400 hover:text-slate-400 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto">
              <p className="text-sm text-slate-400 mb-4">Copy and paste this code into the bottom of your website's <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-500 font-mono text-xs">&lt;body&gt;</code> tag.</p>
              
              <div className="relative">
                <pre className="bg-gray-900 text-gray-300 p-4 rounded-xl text-sm font-mono overflow-x-auto leading-relaxed">
                  <code>{`<script
  src="${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/public/widget.js"
  data-workspace-id="${userWorkspaceId}">
</script>`}</code>
                </pre>
                <button 
                  onClick={() => {
                    const code = `<script\n  src="${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/public/widget.js"\n  data-workspace-id="${userWorkspaceId}">\n</script>`;
                    navigator.clipboard.writeText(code).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${copied ? 'bg-[rgba(34,197,94,0.1)]0 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`} 
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </button>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                  Auto-detected Domains
                  <button onClick={fetchWorkspaceSettings} className="text-[#4F46E5] text-xs hover:underline flex items-center gap-1 font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Refresh List
                  </button>
                </h3>
                {connectedDomains.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center text-sm text-slate-400">
                    No domains detected yet. Embed the code on your website to see it here.
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-xl overflow-x-auto bg-white">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                          <th className="px-4 py-3">Website Domain</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {connectedDomains.map((item, i) => (
                          <tr key={i} className="hover:bg-transparent group">
                            <td className="px-4 py-3 text-sm font-medium text-slate-800 flex items-center gap-2">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                              {item.domain}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-green-600 font-semibold text-xs flex items-center justify-end gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[rgba(34,197,94,0.1)]0"></span>Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  Domains are automatically detected and added to this list when a widget is loaded on your website. 
                </p>
              </div>
             </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowSetupModal(false)} className="px-4 py-2 bg-white border border-slate-200/80 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 shrink-0"></div>
            
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 z-10 bg-white/50 backdrop-blur rounded-full p-1 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-6 sm:p-8 relative z-10 flex flex-col items-center text-center mt-4 overflow-y-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 transform -rotate-6">
                 <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                 </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Upgrade to Pro</h2>
              <p className="text-sm text-slate-400 mb-8 px-4">Connect unlimited channels like WhatsApp, Messenger, and Email by upgrading to our Pro plan.</p>
              
              <div className="w-full bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 text-left">
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-3xl font-bold text-slate-800">$29</span>
                  <span className="text-sm text-slate-400 mb-1">/ month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Connect WhatsApp, Messenger, IG & Email
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Unlimited Team Members
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Advanced AI Chatbot features
                  </li>
                </ul>
              </div>

              <button onClick={() => setShowUpgradeModal(false)} className="w-full py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-xl shadow-gray-900/20">
                Upgrade Now
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-sm text-slate-400 hover:text-slate-800 font-medium">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Invite Team Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-400 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-lg text-sm" 
                  placeholder="colleague@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Role</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-lg text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="agent">Agent (Can chat with visitors)</option>
                  <option value="admin">Admin (Can manage settings)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="px-4 py-2 bg-white border border-slate-200/80 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!inviteEmail) return alert("Please enter an email");
                  setIsGeneratingInvite(true);
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com"}/api/workspaces/${userWorkspaceId}/invite`, {
                      method: "POST",
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setPendingInvites([...pendingInvites, data.invite]);
                      setShowInviteModal(false);
                      setInviteEmail("");
                      const inviteLink = `${window.location.origin}/invite?token=${data.token}`;
                      prompt("Invite sent! (Simulated). Pass this link to the user:", inviteLink);
                    } else {
                      alert(data.error || "Failed to generate invite");
                    }
                  } catch (e) {
                    alert("Error sending invite");
                  } finally {
                    setIsGeneratingInvite(false);
                  }
                }}
                disabled={isGeneratingInvite}
                className="px-6 py-2 bg-[#4F46E5] text-white text-sm font-bold rounded-lg hover:bg-[#4F46E5]-hover transition-colors shadow-sm disabled:opacity-50"
              >
                {isGeneratingInvite ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Knowledge Modal */}
      {showAddKbModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Add Knowledge</h2>
              <button onClick={() => setShowAddKbModal(false)} className="text-slate-400 hover:text-slate-400 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddKnowledge} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Title</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200/80 rounded-lg text-sm" 
                    placeholder="e.g. Return Policy" 
                    value={newKbTitle}
                    onChange={(e) => setNewKbTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">Content</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-lg text-sm min-h-[120px]"
                    placeholder="Enter the information here. AI will use this to answer customer questions."
                    value={newKbContent}
                    onChange={(e) => setNewKbContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowAddKbModal(false)} 
                  className="px-4 py-2 bg-white border border-slate-200/80 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Save Knowledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Website Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#F8F9FC] border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                Scan Website
              </h2>
              <button onClick={() => setShowScanModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleScanWebsite} className="flex flex-col p-6 space-y-5">
              <div className="bg-[rgba(79,70,229,0.1)] border border-[rgba(79,70,229,0.2)] rounded-lg p-3 text-sm text-[#818CF8]">
                Enter a URL to auto-extract text content for the AI Knowledge Base.
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">Website URL</label>
                <input 
                  type="url"
                  required
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-slate-800"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isScanning}
                  className="px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-semibold rounded-xl shadow-lg hover:bg-[#4338CA] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Scanning...
                    </>
                  ) : "Start Scan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-white h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}



