// ============================================================================
// TRADYX ADMIN BACKEND & CONTROL CENTER COMPONENT (src/components/AdminPanel.tsx)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
    getRegisteredUsersList, 
    getSystemLogs, 
    getAnomalyReports, 
    submitAnomalyReport,
    getAdminMetrics,
    forceVerifyUserEmail,
    updateUserTier,
    toggleUserSuspension,
    deleteUserAccount
} from '../services/authService';
import { 
    getStoredBroadcast, 
    createOrUpdateBroadcast 
} from '../services/broadcastService';
import { 
    getGeminiAggregateMetrics, 
    getGeminiCallLogs, 
    getDefaultGeminiModel, 
    setDefaultGeminiModel 
} from '../services/geminiMetricsService';
import { 
    exportTradesToCSV, 
    exportUsersToJSON, 
    checkDatabaseHealth 
} from '../services/dataExportService';
import { useTradeStore } from '../store/useTradeStore';
import { 
    UserAccount, 
    SystemLogEntry, 
    AnomalyReport, 
    AnomalySeverity, 
    UserTier, 
    UserStatus, 
    BroadcastStyle, 
    GeminiModelId, 
    GeminiCallLog, 
    SystemBroadcast 
} from '../types/auth';
import { 
    ShieldAlert, 
    Users, 
    Terminal, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Clock, 
    PlusCircle, 
    Filter,
    ShieldCheck,
    Bot,
    TrendingUp,
    Search,
    Activity,
    RefreshCw,
    Megaphone,
    Download,
    Database,
    Cpu,
    DollarSign,
    Zap,
    Ban,
    Check,
    Trash2,
    Lock,
    Unlock,
    Server,
    Radio,
    FileSpreadsheet,
    FileJson,
    Layers,
    Globe,
    Settings,
    MailCheck
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [tab, setTab] = useState<'USERS' | 'GEMINI' | 'BROADCAST' | 'DATABASE' | 'LOGS'>('USERS');
    
    // Core Datasets State
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [logs, setLogs] = useState<SystemLogEntry[]>([]);
    const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
    const [overviewMetrics, setOverviewMetrics] = useState({
        totalActiveUsers: 0,
        totalTradesSimulated: 0,
        totalAICallsMade: 0,
        totalSystemErrors: 0
    });

    // Module 1: Users State & GDPR Modal
    const [userSearch, setUserSearch] = useState('');
    const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Module 2: Gemini AI Metrics State
    const [geminiMetrics, setGeminiMetrics] = useState(getGeminiAggregateMetrics());
    const [geminiLogs, setGeminiLogs] = useState<GeminiCallLog[]>(getGeminiCallLogs());
    const [selectedModel, setSelectedModel] = useState<GeminiModelId>(getDefaultGeminiModel());

    // Module 3: Broadcast State
    const initialBcast = getStoredBroadcast();
    const [broadcastTitle, setBroadcastTitle] = useState(initialBcast?.title || '');
    const [broadcastMessage, setBroadcastMessage] = useState(initialBcast?.message || '');
    const [broadcastStyle, setBroadcastStyle] = useState<BroadcastStyle>(initialBcast?.style || 'INFO');
    const [broadcastActive, setBroadcastActive] = useState<boolean>(initialBcast?.active ?? true);
    const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

    // Module 4: Database & Backup State
    const [dbHealth, setDbHealth] = useState({ pingMs: 24, status: 'CONNECTED', storageStatus: 'HEALTHY' });
    const [isPinging, setIsPinging] = useState(false);

    // Trade Store for CSV Export
    const { trades, fetchTrades } = useTradeStore();

    // Module 5: Logs & Anomalies Filters
    const [logFilter, setLogFilter] = useState<'ALL' | 'AUTH' | 'AI' | 'TRADE' | 'ERROR'>('ALL');
    const [logSearch, setLogSearch] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newSeverity, setNewSeverity] = useState<AnomalySeverity>('MEDIUM');
    const [showNewReportForm, setShowNewReportForm] = useState(false);

    const loadAllAdminData = async () => {
        const uList = await getRegisteredUsersList();
        const lList = await getSystemLogs();
        const aList = await getAnomalyReports();
        const mData = await getAdminMetrics();
        setUsers(uList);
        setLogs(lList);
        setAnomalies(aList);
        setOverviewMetrics(mData);

        // Gemini telemetry update
        setGeminiMetrics(getGeminiAggregateMetrics());
        setGeminiLogs(getGeminiCallLogs());

        // DB Health test
        setIsPinging(true);
        const health = await checkDatabaseHealth();
        setDbHealth(health);
        setIsPinging(false);
    };

    useEffect(() => {
        loadAllAdminData();
        fetchTrades('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    }, []);

    // ------------------------------------------------------------------------
    // MODULE 1: RAPID USER ACTIONS (Manual Email Verification, Tier, Suspend, Delete)
    // ------------------------------------------------------------------------
    const handleForceVerifyEmail = async (userId: string) => {
        setIsActionLoading(true);
        await forceVerifyUserEmail(userId);
        await loadAllAdminData();
        setIsActionLoading(false);
    };

    const handleChangeTier = async (userId: string, newTier: UserTier) => {
        setIsActionLoading(true);
        await updateUserTier(userId, newTier);
        await loadAllAdminData();
        setIsActionLoading(false);
    };

    const handleToggleSuspension = async (userId: string) => {
        setIsActionLoading(true);
        await toggleUserSuspension(userId);
        await loadAllAdminData();
        setIsActionLoading(false);
    };

    const handleConfirmGDPRDelete = async () => {
        if (!userToDelete) return;
        setIsActionLoading(true);
        await deleteUserAccount(userToDelete.id);
        setUserToDelete(null);
        await loadAllAdminData();
        setIsActionLoading(false);
    };

    // Filter Users by Email, ID, or Tier
    const filteredUsers = users.filter(u => {
        const search = userSearch.toLowerCase();
        return u.email.toLowerCase().includes(search) ||
               u.id.toLowerCase().includes(search) ||
               (u.tier && u.tier.toLowerCase().includes(search)) ||
               (u.full_name && u.full_name.toLowerCase().includes(search));
    });

    // ------------------------------------------------------------------------
    // MODULE 2: GEMINI MODEL SELECTOR CHANGE
    // ------------------------------------------------------------------------
    const handleModelChange = (model: GeminiModelId) => {
        setSelectedModel(model);
        setDefaultGeminiModel(model);
        setGeminiMetrics(getGeminiAggregateMetrics());
    };

    // ------------------------------------------------------------------------
    // MODULE 3: BROADCAST ANNOUNCEMENT FORM SUBMIT
    // ------------------------------------------------------------------------
    const handleSaveBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        createOrUpdateBroadcast(broadcastTitle, broadcastMessage, broadcastStyle, broadcastActive);
        setBroadcastNotice("✅ Annuncio broadcast aggiornato con successo! Il banner è ora sincronizzato.");
        setTimeout(() => setBroadcastNotice(null), 4000);
    };

    // ------------------------------------------------------------------------
    // MODULE 4: EXPORT ACTIONS
    // ------------------------------------------------------------------------
    const handleExportTradesCSV = () => {
        exportTradesToCSV(trades);
    };

    const handleExportUsersJSON = () => {
        exportUsersToJSON(users);
    };

    // ------------------------------------------------------------------------
    // MODULE 5: ANOMALY REPORT CREATION
    // ------------------------------------------------------------------------
    const handleCreateAnomaly = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        await submitAnomalyReport(newTitle, newDesc, newSeverity, 'riccardosalvia2@gmail.com');
        setNewTitle('');
        setNewDesc('');
        setShowNewReportForm(false);
        await loadAllAdminData();
    };

    // Filter Logs
    const filteredLogs = logs.filter(l => {
        const matchesSearch = l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
                              (l.user_email && l.user_email.toLowerCase().includes(logSearch.toLowerCase())) ||
                              l.type.toLowerCase().includes(logSearch.toLowerCase());
        
        if (!matchesSearch) return false;

        if (logFilter === 'AUTH') return l.type.startsWith('AUTH_');
        if (logFilter === 'AI') return l.type === 'AI_QUERY';
        if (logFilter === 'TRADE') return l.type === 'TRADE_LOGGED';
        if (logFilter === 'ERROR') return l.type === 'SYSTEM_ERROR' || l.type === 'ANOMALY';
        return true;
    });

    return (
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 font-sans">
            
            {/* Console Master Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 border border-purple-500/40 rounded-2xl text-purple-400 shadow-xl shadow-purple-950/50">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                            TRADYX Control Center & Administrative Suite
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Supabase RBAC Auth | Gemini API Telemetry | Data Backup & Global Broadcast
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadAllAdminData}
                        disabled={isPinging}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition border border-slate-700 active:scale-95 disabled:opacity-50"
                        title="Aggiorna Dati e PnL Audit"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
                        <span>Aggiorna Dati</span>
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-bold font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        ADMIN ACTIVE
                    </div>
                </div>
            </div>

            {/* 📊 OVERVIEW METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Utenti Registrati</span>
                        <div className="p-2 bg-cyan-950/80 border border-cyan-800 rounded-xl text-cyan-400">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{users.length}</div>
                    <div className="text-[11px] text-cyan-400/90 font-mono">Account attivi nel sistema</div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chiamate AI Gemini</span>
                        <div className="p-2 bg-purple-950/80 border border-purple-800 rounded-xl text-purple-400">
                            <Bot className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{geminiMetrics.totalCalls}</div>
                    <div className="text-[11px] text-purple-400/90 font-mono">Modello: {selectedModel}</div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Broadcast Stato</span>
                        <div className="p-2 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-400">
                            <Megaphone className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{broadcastActive ? 'ATTIVO' : 'DISATTIVO'}</div>
                    <div className="text-[11px] text-emerald-400/90 font-mono">Stile: {broadcastStyle}</div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Ping Latency</span>
                        <div className="p-2 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-400">
                            <Database className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{dbHealth.pingMs} ms</div>
                    <div className="text-[11px] text-amber-400/90 font-mono">{dbHealth.status}</div>
                </div>
            </div>

            {/* 🗂️ MAIN 5 MODULE NAVIGATION TABS */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                <button
                    onClick={() => setTab('USERS')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
                        tab === 'USERS' 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20' 
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Scheda Utenti ({users.length})
                </button>

                <button
                    onClick={() => setTab('GEMINI')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
                        tab === 'GEMINI' 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20' 
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Bot className="w-4 h-4" />
                    Gemini AI Metrics
                </button>

                <button
                    onClick={() => setTab('BROADCAST')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
                        tab === 'BROADCAST' 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Megaphone className="w-4 h-4" />
                    Broadcast & Avvisi
                </button>

                <button
                    onClick={() => setTab('DATABASE')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
                        tab === 'DATABASE' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/20' 
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Database className="w-4 h-4" />
                    Database & Backup
                </button>

                <button
                    onClick={() => setTab('LOGS')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
                        tab === 'LOGS' 
                            ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg' 
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                >
                    <Terminal className="w-4 h-4" />
                    Logs & Anomalie
                </button>
            </div>

            {/* ==================================================================== */}
            {/* 👥 TAB 1: GESTIONE UTENTI AVANZATA (Scheda Utenti + Azioni Rapide) */}
            {/* ==================================================================== */}
            {tab === 'USERS' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-400" />
                            Registro Utenti & Azioni Rapide Supabase (Email Verification, Tier, Block, Delete):
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Filtra per Email, ID o Piano..."
                                className="bg-slate-950 border border-slate-800 text-white rounded-xl py-1.5 pl-9 pr-3 text-xs w-full outline-none focus:border-cyan-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/80">
                        <table className="w-full text-left text-xs font-mono">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950">
                                    <th className="py-3.5 px-4">ID Utente</th>
                                    <th className="py-3.5 px-4">Email & Nome</th>
                                    <th className="py-3.5 px-4">Data Iscrizione</th>
                                    <th className="py-3.5 px-4">Verifica Email</th>
                                    <th className="py-3.5 px-4">Ruolo</th>
                                    <th className="py-3.5 px-4">Piano / Tier</th>
                                    <th className="py-3.5 px-4">Stato Account</th>
                                    <th className="py-3.5 px-4 text-center">Azioni Rapide</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                                            Nessun utente trovato con i criteri di ricerca inseriti.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-900/60 transition">
                                            <td className="py-3.5 px-4 text-slate-400 font-bold text-[11px]">
                                                {u.id}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-white">
                                                {u.email}
                                                {u.full_name && (
                                                    <div className="text-[10px] text-slate-400 font-sans">{u.full_name}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-400">
                                                {new Date(u.created_at).toLocaleDateString('it-IT')}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {u.email_confirmed ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        CONFERMATA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 animate-pulse">
                                                        <Clock className="w-3 h-3" />
                                                        IN ATTESA
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                                    u.role === 'admin' 
                                                        ? 'bg-purple-950 text-purple-300 border-purple-700' 
                                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {/* Tier Selector Dropdown */}
                                                <select
                                                    value={u.tier || 'Free'}
                                                    onChange={(e) => handleChangeTier(u.id, e.target.value as UserTier)}
                                                    className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-lg text-[11px] font-bold px-2 py-1 outline-none focus:border-cyan-500 cursor-pointer"
                                                >
                                                    <option value="Free">Free</option>
                                                    <option value="Pro">Pro</option>
                                                    <option value="VIP Quant">VIP Quant</option>
                                                </select>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {u.status === 'suspended' ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                                                        SOSPESO
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                        ATTIVO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Manual Email Verification Button */}
                                                    {!u.email_confirmed && (
                                                        <button
                                                            onClick={() => handleForceVerifyEmail(u.id)}
                                                            disabled={isActionLoading}
                                                            className="flex items-center gap-1 px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold transition"
                                                            title="Forza verifica email manuale su Supabase"
                                                        >
                                                            <MailCheck className="w-3 h-3" />
                                                            <span>Verifica Email</span>
                                                        </button>
                                                    )}

                                                    {/* Suspend / Unblock Toggle */}
                                                    <button
                                                        onClick={() => handleToggleSuspension(u.id)}
                                                        disabled={isActionLoading}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                                                            u.status === 'suspended'
                                                                ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                                                                : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border-amber-800'
                                                        }`}
                                                        title={u.status === 'suspended' ? 'Riabilita Account' : 'Sospendi Account'}
                                                    >
                                                        {u.status === 'suspended' ? <Unlock className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                                        <span>{u.status === 'suspended' ? 'Sblocca' : 'Blocca'}</span>
                                                    </button>

                                                    {/* Delete User Button (GDPR Modal Trigger) */}
                                                    <button
                                                        onClick={() => setUserToDelete(u)}
                                                        disabled={isActionLoading}
                                                        className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[10px] font-bold transition"
                                                        title="Elimina Utente (GDPR)"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 🔒 MODALE CONFIRMA ELIMINAZIONE GDPR UTENTE */}
                    {userToDelete && (
                        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-rose-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-3 text-rose-400">
                                    <div className="p-3 bg-rose-950 border border-rose-800 rounded-2xl">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-extrabold text-white">Eliminazione Utente (GDPR)</h4>
                                        <p className="text-xs text-rose-300 font-mono">Azione irreversibile ai sensi della privacy policy</p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Sei sicuro di voler eliminare definitivamente l'account <strong className="text-white font-mono">{userToDelete.email}</strong> (ID: <code className="text-cyan-400">{userToDelete.id}</code>)?
                                    <br /><br />
                                    Tutti i dati personali e i log delle operazioni verranno cancellati in modo sicuro e definitivo.
                                </p>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setUserToDelete(null)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmGDPRDelete}
                                        disabled={isActionLoading}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Conferma Eliminazione GDPR</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==================================================================== */}
            {/* 🤖 TAB 2: MONITORAGGIO LIVE API GEMINI & CONTROLLO COSTI */}
            {/* ==================================================================== */}
            {tab === 'GEMINI' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-purple-950/40 border border-purple-800/80 rounded-2xl">
                        <div className="space-y-1">
                            <h4 className="text-sm font-extrabold text-purple-200 flex items-center gap-2">
                                <Bot className="w-5 h-5 text-purple-400" />
                                Configurazione Modello Predefinito Globale AI Coach:
                            </h4>
                            <p className="text-xs text-purple-300/80">
                                Il modello selezionato verrà utilizzato globalmente per tutte le risposte generate dall'AI Psychology Coach.
                            </p>
                        </div>
                        <div className="w-full sm:w-64">
                            <select
                                value={selectedModel}
                                onChange={(e) => handleModelChange(e.target.value as GeminiModelId)}
                                className="bg-slate-950 border border-purple-500/80 text-purple-200 font-extrabold text-xs rounded-xl p-3 w-full outline-none focus:border-purple-400 cursor-pointer shadow-lg"
                            >
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard Veloce)</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Ultima Gen)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Ragionamento Avanzato)</option>
                            </select>
                        </div>
                    </div>

                    {/* Gemini Specific Counter Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-950 border border-purple-900/60 rounded-2xl space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-purple-400" />
                                Token Totali Stimati
                            </div>
                            <div className="text-2xl font-black text-white font-mono">
                                {geminiMetrics.totalTokens.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                In: {geminiMetrics.totalInputTokens.toLocaleString()} | Out: {geminiMetrics.totalOutputTokens.toLocaleString()}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950 border border-purple-900/60 rounded-2xl space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                Costo Approssimativo USD ($)
                            </div>
                            <div className="text-2xl font-black text-emerald-400 font-mono">
                                ${geminiMetrics.totalCostUSD.toFixed(4)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                Calcolato su listino ufficiale API Gemini
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950 border border-purple-900/60 rounded-2xl space-y-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                Latenza Media Risposte
                            </div>
                            <div className="text-2xl font-black text-amber-300 font-mono">
                                {geminiMetrics.avgLatencyMs} ms
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                Media sulle ultime chiamate effettuate
                            </div>
                        </div>
                    </div>

                    {/* Recent Calls Table */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-purple-400" />
                            Registro Chiamate API Gemini Recenti:
                        </div>

                        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/80">
                            <table className="w-full text-left text-xs font-mono">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-950">
                                        <th className="py-3 px-4">Timestamp</th>
                                        <th className="py-3 px-4">Utente / Email</th>
                                        <th className="py-3 px-4">Modello Usato</th>
                                        <th className="py-3 px-4">Tokens In / Out</th>
                                        <th className="py-3 px-4">Latenza (ms)</th>
                                        <th className="py-3 px-4">Stato Richiesta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {geminiLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-900/60 transition">
                                            <td className="py-3 px-4 text-slate-400">
                                                {new Date(log.timestamp).toLocaleTimeString('it-IT')}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white">
                                                {log.user_email}
                                            </td>
                                            <td className="py-3 px-4 text-purple-300 font-bold">
                                                {log.model}
                                            </td>
                                            <td className="py-3 px-4 text-slate-300">
                                                {log.inputTokens} / {log.outputTokens}
                                            </td>
                                            <td className="py-3 px-4 text-amber-400 font-bold">
                                                {log.latencyMs} ms
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                                    log.status === '200 OK' 
                                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================================== */}
            {/* 📣 TAB 3: SISTEMA BROADCAST NOTIFICHE & BANNER GLOBALE */}
            {/* ==================================================================== */}
            {tab === 'BROADCAST' && (
                <div className="space-y-6">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-emerald-400" />
                        Creazione Annuncio di Sistema Broadcast & Banner Globale Dashboard:
                    </div>

                    {broadcastNotice && (
                        <div className="p-3 bg-emerald-950 border border-emerald-500/80 rounded-2xl text-emerald-200 text-xs font-bold shadow-lg">
                            {broadcastNotice}
                        </div>
                    )}

                    <form onSubmit={handleSaveBroadcast} className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Titolo dell'Annuncio</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="es. 🚀 Manutenzione Programmata Server"
                                    className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 w-full text-sm outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Tipologia / Stile Banner</label>
                                <select
                                    value={broadcastStyle}
                                    onChange={(e) => setBroadcastStyle(e.target.value as BroadcastStyle)}
                                    className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 w-full text-sm outline-none focus:border-emerald-500"
                                >
                                    <option value="INFO">Info System (Blu / Cyan)</option>
                                    <option value="PROMO">Promo / Update (Verde Smeraldo)</option>
                                    <option value="WARNING">Warning / Manutenzione (Giallo / Rosso)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Testo del Messaggio Broadcast</label>
                            <textarea
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                rows={3}
                                placeholder="Inserisci il testo dettagliato dell'annuncio per tutti gli utenti collegati..."
                                className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 w-full text-sm outline-none focus:border-emerald-500 resize-none"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={broadcastActive}
                                    onChange={(e) => setBroadcastActive(e.target.checked)}
                                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                />
                                <span>Switch On/Off "Attiva Annuncio in cima alla Dashboard"</span>
                            </label>

                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xl transition active:scale-95 flex items-center gap-2"
                            >
                                <Megaphone className="w-4 h-4" />
                                <span>Pubblica Annuncio Globale</span>
                            </button>
                        </div>
                    </form>

                    {/* Live Preview Card */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Anteprima Live del Banner in Cima alla Dashboard:
                        </div>
                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                            broadcastStyle === 'PROMO' ? 'bg-emerald-950 border-emerald-500 text-emerald-100' :
                            broadcastStyle === 'WARNING' ? 'bg-amber-950 border-amber-500 text-amber-100' :
                            'bg-slate-900 border-cyan-500 text-cyan-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                <Megaphone className="w-5 h-5 animate-bounce shrink-0" />
                                <div>
                                    <div className="font-extrabold text-sm uppercase">{broadcastTitle || 'Titolo Annuncio'}</div>
                                    <div className="text-xs opacity-90">{broadcastMessage || 'Testo messaggio annuncio'}</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-black/40 border border-white/20 uppercase font-bold">
                                {broadcastActive ? 'STATO: ATTIVO' : 'STATO: DISATTIVO'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================================== */}
            {/* 💾 TAB 4: ESPORTAZIONE DATI & DATABASE HEALTH */}
            {/* ==================================================================== */}
            {tab === 'DATABASE' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CSV Export Card */}
                        <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-extrabold text-white">Esportazione Dataset Trade (CSV)</h4>
                                    <p className="text-xs text-slate-400 font-mono">Download completo diario operativo loggato</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Scarica tutte le operazioni di trading registrate nel database (Asset, PnL, Prezzi di ingresso/uscita, Note e Stato Emotivo) in formato CSV compatibile con Excel e Google Sheets.
                            </p>
                            <button
                                onClick={handleExportTradesCSV}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Esporta Tutti i Trade (CSV)</span>
                            </button>
                        </div>

                        {/* JSON Export Card */}
                        <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                            <div className="flex items-center gap-3 text-cyan-400">
                                <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-2xl">
                                    <FileJson className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-extrabold text-white">Esportazione Anagrafica Utenti (JSON)</h4>
                                    <p className="text-xs text-slate-400 font-mono">Backup strutturato registro anagrafico</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Esporta l'intero registro degli utenti registrati su Supabase (ID, Email, Ruolo RBAC, Tier attivo, Stato verifica) in formato JSON formattato.
                            </p>
                            <button
                                onClick={handleExportUsersJSON}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Esporta Registro Utenti (JSON)</span>
                            </button>
                        </div>
                    </div>

                    {/* Database Health Widget */}
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Database className="w-5 h-5" />
                                <h4 className="text-sm font-extrabold text-white">Supabase Connection & Database Health Metrics</h4>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                {dbHealth.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <div className="text-slate-400 text-[10px]">PING LATENCY</div>
                                <div className="text-xl font-bold text-white">{dbHealth.pingMs} ms</div>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <div className="text-slate-400 text-[10px]">STORAGE STATUS</div>
                                <div className="text-sm font-bold text-emerald-400">{dbHealth.storageStatus}</div>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                <div className="text-slate-400 text-[10px]">REPLICATION / UPTIME</div>
                                <div className="text-sm font-bold text-cyan-300">99.98% High Availability</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================================================================== */}
            {/* 📜 TAB 5: SCHEDA SYSTEM LOGS & ANOMALIE */}
            {/* ==================================================================== */}
            {tab === 'LOGS' && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-cyan-400" />
                                Visualizzazione Cronologica Audit Logs (Accessi, API Gemini, Trade, Errori):
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button
                                        onClick={() => setLogFilter('ALL')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${logFilter === 'ALL' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Tutti ({logs.length})
                                    </button>
                                    <button
                                        onClick={() => setLogFilter('AUTH')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${logFilter === 'AUTH' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Accessi
                                    </button>
                                    <button
                                        onClick={() => setLogFilter('AI')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${logFilter === 'AI' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Gemini AI
                                    </button>
                                    <button
                                        onClick={() => setLogFilter('TRADE')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${logFilter === 'TRADE' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Trade
                                    </button>
                                    <button
                                        onClick={() => setLogFilter('ERROR')}
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${logFilter === 'ERROR' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Errori
                                    </button>
                                </div>

                                <div className="relative flex-1 md:w-48">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                                    <input
                                        type="text"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        placeholder="Cerca nei log..."
                                        className="bg-slate-950 border border-slate-800 text-white rounded-xl py-1.5 pl-9 pr-3 text-xs w-full outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2.5 max-h-[380px] overflow-y-auto">
                            {filteredLogs.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 font-sans text-xs">
                                    Nessun log trovato per i filtri selezionati.
                                </div>
                            ) : (
                                filteredLogs.map((l) => (
                                    <div key={l.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-900/70 border border-slate-800/90 rounded-xl hover:border-slate-700 transition gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                                    l.type === 'AUTH_SIGNIN' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' :
                                                    l.type === 'AUTH_SIGNUP' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                                                    l.type === 'TRADE_LOGGED' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                                                    l.type === 'AI_QUERY' ? 'bg-purple-950 text-purple-400 border-purple-800' :
                                                    'bg-rose-950 text-rose-400 border-rose-800'
                                                }`}>
                                                    {l.type}
                                                </span>
                                                <span className="text-slate-200 font-bold">{l.message}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Utente: <span className="text-slate-400">{l.user_email || 'System'}</span>
                                                {l.details && (
                                                    <span className="ml-2 text-slate-500 font-mono text-[9px]">
                                                        Payload: {JSON.stringify(l.details)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 whitespace-nowrap">
                                            {new Date(l.timestamp).toLocaleString('it-IT')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Technical Anomalies Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                Segnalazione Problemi Tecnici & Anomalie:
                            </div>
                            <button
                                onClick={() => setShowNewReportForm(!showNewReportForm)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl transition shadow active:scale-95"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Segnala Anomalia
                            </button>
                        </div>

                        {showNewReportForm && (
                            <form onSubmit={handleCreateAnomaly} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Titolo Anomalia</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="es. Errore caricamento grafico WebGL"
                                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm outline-none focus:border-cyan-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Livello di Severità</label>
                                        <select
                                            value={newSeverity}
                                            onChange={(e) => setNewSeverity(e.target.value as AnomalySeverity)}
                                            className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm outline-none focus:border-cyan-500"
                                        >
                                            <option value="LOW">LOW (Bassa)</option>
                                            <option value="MEDIUM">MEDIUM (Media)</option>
                                            <option value="HIGH">HIGH (Critica)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Descrizione Dettagliata</label>
                                    <input
                                        type="text"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Descrivi l'errore o il comportamento anomalo riscontrato..."
                                        className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 w-full text-sm outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                                >
                                    Salva Segnalazione Anomalia
                                </button>
                            </form>
                        )}

                        <div className="space-y-3">
                            {anomalies.map((a) => (
                                <div key={a.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                                a.severity === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                                a.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                                'bg-slate-800 text-slate-300'
                                            }`}>
                                                SEVERITY: {a.severity}
                                            </span>
                                            <span className="text-sm font-bold text-white">{a.title}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">{a.description}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            Segnalato da: {a.user_email} • {new Date(a.created_at).toLocaleString('it-IT')}
                                        </div>
                                    </div>

                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            a.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                                        }`}>
                                            {a.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
