"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xiachat.onrender.com";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchVisitors = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const workspaceId = user.workspaces?.[0] || "";

      // FIX: Include auth token in request
      const res = await fetch(`${API_URL}/api/visitors/${workspaceId}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        const mappedContacts = data.data.map((v: any) => ({
          id: v._id,
          name: v.name || "Anonymous Visitor",
          email: v.email || "No email",
          phone: v.phone || "-",
          company: v.company || (v.os ? `${v.os} User` : "Unknown"),
          status: v.status || (v.name && v.name !== "Anonymous Visitor" ? "Customer" : "Lead"),
          lastSeen: new Date(v.lastActive || v.createdAt).toLocaleString(),
          ipAddress: v.ipAddress,
          browser: v.browser,
          location: v.location,
        }));
        setContacts(mappedContacts);
      }
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIX: Add fetchVisitors to dependency array
  React.useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", company: "" });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // FIX: Include auth token in PUT request
      const res = await fetch(`${API_URL}/api/visitors/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setContacts(contacts.map(c => c.id === selectedContact.id ? { ...c, ...editForm } : c));
        setSelectedContact({ ...selectedContact, ...editForm });
        setShowEditModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportToSheets = () => {
    try {
      setExporting(true);

      if (contacts.length === 0) {
        alert("No contacts to export.");
        setExporting(false);
        return;
      }

      // Build rows from already-loaded contacts state
      const rows = contacts.map((c) => ({
        Name: c.name,
        Email: c.email,
        Phone: c.phone,
        Company: c.company,
        Status: c.status,
        "Last Seen": c.lastSeen,
        "IP Address": c.ipAddress || "",
        Browser: c.browser || "",
        Location: c.location || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

      // Auto-fit column widths
      const cols = Object.keys(rows[0]).map((key) => ({
        wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || "").length)),
      }));
      worksheet["!cols"] = cols;

      const filename = `xiachat-contacts-${new Date().toISOString().slice(0, 10)}.xlsx`;
      // Use Blob approach for reliable browser download in Next.js
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isCreatingContact, setIsCreatingContact] = useState(false);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setIsCreatingContact(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const workspaceId = user.workspaces?.[0] || "";

      const res = await fetch(`${API_URL}/api/visitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ workspaceId, name: createForm.name.trim(), email: createForm.email, phone: createForm.phone, company: createForm.company, status: "Lead" }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchVisitors();
      } else {
        setContacts(prev => [{ id: Date.now(), name: createForm.name.trim(), email: createForm.email || "No email", phone: createForm.phone || "-", company: createForm.company || "Unknown", status: "Lead", lastSeen: "Just now" }, ...prev]);
      }
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", phone: "", company: "" });
    } catch (err) {
      console.error("Failed to create contact:", err);
      alert("Failed to create contact. Please try again.");
    } finally {
      setIsCreatingContact(false);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-[#F8F9FC] relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="h-auto min-h-16 flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3 border-b border-slate-200/80 shrink-0 gap-3 bg-[#F8F9FC]/80 backdrop-blur-xl">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Contacts</h1>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              {loading ? "Loading contacts..." : `${contacts.length} contacts · Manage your CRM`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export to Google Sheets Button */}
            <button
              onClick={handleExportToSheets}
              disabled={exporting || contacts.length === 0}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 border ${
                exportSuccess
                  ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-green-400'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:border-[rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {exportSuccess ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Excel Downloaded! ✓</span>
                </>
              ) : exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  {/* Excel icon */}
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 18l-1.5-2.5L5.5 18H4l2.2-3.3L4.1 12h1.5l1.4 2.3 1.4-2.3H10l-2.1 2.7L10 18H8.5zm5.5 0h-4v-6h1.5v4.5H14V18z"/>
                  </svg>
                  <span className="hidden sm:inline">Export to Excel</span>
                  <span className="sm:hidden">Export</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={isCreatingContact}
              className="px-4 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-colors shadow-[0_2px_8px_rgba(79,70,229,0.3)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingContact ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              )}
              <span className="hidden sm:inline">{isCreatingContact ? 'Creating...' : 'New Contact'}</span>
              <span className="sm:hidden">{isCreatingContact ? '...' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by name, email, or company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:border-[#4F46E5] transition-all placeholder:text-slate-400" 
            />
          </div>
          <select className="px-3 py-2 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:border-[#4F46E5]">
            <option>All Segments</option>
            <option>Customers</option>
            <option>Leads</option>
            <option>Partners</option>
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full md:min-w-[800px]">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold sticky top-0 z-10">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4 hidden md:table-cell">Company</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 hidden md:table-cell">Last Seen</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-sm">
              {filteredContacts.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedContact(c)}
                  className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${selectedContact?.id === c.id ? 'bg-[rgba(79,70,229,0.1)]' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[rgba(79,70,229,0.2)] text-[#818CF8] flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium">{c.email}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium hidden md:table-cell">{c.company}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      c.status === 'Customer' ? 'bg-[rgba(34,197,94,0.15)] text-green-400 border border-[rgba(34,197,94,0.2)]' : 
                      c.status === 'Lead' ? 'bg-[rgba(59,130,246,0.15)] text-blue-400 border border-[rgba(59,130,246,0.2)]' : 'bg-[rgba(168,85,247,0.15)] text-purple-400 border border-[rgba(168,85,247,0.2)]'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 hidden md:table-cell">{c.lastSeen}</td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No contacts found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Slide-over Profile Details */}
      {selectedContact && (
        <div className="w-full sm:w-80 border-l border-slate-200/80 bg-[#F8F9FC] flex flex-col shadow-xl absolute right-0 top-0 bottom-0 z-20">
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80">
            <h2 className="font-bold text-slate-800">Contact Details</h2>
            <button 
              onClick={() => setSelectedContact(null)}
              className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-6 border-b border-slate-100 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] text-white flex items-center justify-center font-bold text-3xl mx-auto mb-4 shadow-[0_8px_24px_rgba(79,70,229,0.4)]">
              {selectedContact.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{selectedContact.name}</h3>
            <p className="text-sm text-slate-400 mt-1">{selectedContact.company}</p>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  <span className="text-slate-800">{selectedContact.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.08-7.074-6.996l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                  <span className="text-slate-800">{selectedContact.phone}</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actions</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/dashboard`)} 
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-colors shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.436 3 11.996c0 2.29.98 4.346 2.58 5.768.1.1.18.23.23.36l.51 3.06c.07.45.54.72.97.54l3.13-1.33c.27-.12.58-.16.88-.1a9.23 9.23 0 003.7.35z" /></svg>
                  Send Message
                </button>
                <button 
                  onClick={() => {
                    setEditForm({ name: selectedContact.name, email: selectedContact.email, phone: selectedContact.phone, company: selectedContact.company, status: selectedContact.status });
                    setShowEditModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200/80 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-slate-800">Edit Contact</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 h-11 border border-slate-200/80 bg-white rounded-lg text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 h-11 border border-slate-200/80 bg-white rounded-lg text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Phone</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 h-11 border border-slate-200/80 bg-white rounded-lg text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Company</label>
                <input type="text" value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full px-3 h-11 border border-slate-200/80 bg-white rounded-lg text-sm text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-3 h-11 border border-slate-200/80 bg-white rounded-lg text-sm text-slate-800">
                  <option value="Lead">Lead</option>
                  <option value="Customer">Customer</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
              </div>
              <div className="p-4 bg-[#F8F9FC] border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 h-11 min-w-[90px] border border-slate-200/80 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 h-11 min-w-[120px] bg-[#4F46E5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338CA]">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Contact Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#F8F9FC]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">New Contact</h2>
              <button onClick={() => { setShowCreateModal(false); setCreateForm({ name: "", email: "", phone: "", company: "" }); }} className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  autoFocus
                  required
                  className="w-full px-4 h-11 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 placeholder:text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:border-[#4F46E5] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  placeholder="john@example.com"
                  className="w-full px-4 h-11 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 placeholder:text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:border-[#4F46E5] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={e => setCreateForm({...createForm, phone: e.target.value})}
                  placeholder="+1 234 567 890"
                  className="w-full px-4 h-11 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 placeholder:text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:border-[#4F46E5] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company</label>
                <input
                  type="text"
                  value={createForm.company}
                  onChange={e => setCreateForm({...createForm, company: e.target.value})}
                  placeholder="Acme Corp"
                  className="w-full px-4 h-11 bg-white border border-slate-200/80 rounded-lg text-sm text-slate-800 placeholder:text-[#52525B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/50 focus:border-[#4F46E5] transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateForm({ name: "", email: "", phone: "", company: "" }); }}
                  className="flex-1 h-11 border border-slate-200/80 text-slate-400 text-sm font-semibold rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!createForm.name.trim() || isCreatingContact}
                  className="flex-1 h-11 bg-[#4F46E5] text-white text-sm font-semibold rounded-lg hover:bg-[#4338CA] transition-colors shadow-[0_2px_8px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingContact ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>Creating...</>
                  ) : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


