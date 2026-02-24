"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    Download,
    Mail,
    Eye,
    ChevronDown,
    ChevronUp,
    ArrowUpDown,
    RefreshCw,
    Crown,
    Sparkles,
    Users,
    DollarSign,
    Activity,
    Loader2,
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface UserData {
    id: string;
    name: string;
    email: string;
    picture: string | null;
    authMethod: string;
    plan: string;
    status: string;
    hasAdsAccess: boolean;
    createdAt: string;
    lastActiveAt: string;
    monthQueries: number;
    monthTokens: number;
    monthAiCost: number;
    monthRevenue: number;
    monthMargin: number;
    aiMessagesUsed: number;
    aiMessagesLimit: number;
    bonusTokens: number;
    totalQueries: number;
    totalTokens: number;
    totalAiCost: number;
}

interface Summary {
    totalUsers: number;
    activeUsers: number;
    paidUsers: number;
    totalMRR: number;
    totalMonthCost: number;
    totalMargin: number;
    planDistribution: { free: number; starter: number; pro: number };
}

type SortField = "name" | "createdAt" | "lastActiveAt" | "monthQueries" | "monthAiCost" | "plan";

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function planBadge(plan: string) {
    const styles: Record<string, string> = {
        pro: "bg-purple-600/20 text-purple-400 border border-purple-600/30",
        starter: "bg-blue-600/20 text-blue-400 border border-blue-600/30",
        free: "bg-gray-700/30 text-gray-400 border border-gray-700",
    };
    const icons: Record<string, React.ReactNode> = {
        pro: <Crown className="w-3 h-3" />,
        starter: <Sparkles className="w-3 h-3" />,
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[plan] || styles.free}`}>
            {icons[plan]} {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </span>
    );
}

function statusDot(status: string) {
    const color = status === "active" ? "bg-green-500" : status === "trialing" ? "bg-amber-500" : "bg-red-500";
    return <div className={`w-2 h-2 rounded-full ${color} shrink-0`} title={status} />;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setSummary(data.summary || null);
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users
        .filter((u) => {
            const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            const matchPlan = planFilter === "all" || u.plan === planFilter;
            const matchStatus = statusFilter === "all" || u.status === statusFilter;
            return matchSearch && matchPlan && matchStatus;
        })
        .sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case "name": cmp = a.name.localeCompare(b.name); break;
                case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
                case "lastActiveAt": cmp = new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime(); break;
                case "monthQueries": cmp = a.monthQueries - b.monthQueries; break;
                case "monthAiCost": cmp = a.monthAiCost - b.monthAiCost; break;
                case "plan": cmp = a.plan.localeCompare(b.plan); break;
            }
            return sortDir === "desc" ? -cmp : cmp;
        });

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortField(field); setSortDir("desc"); }
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <button onClick={() => toggleSort(field)} className="ml-1 text-gray-500 hover:text-gray-300">
            {sortField === field ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
        </button>
    );

    const exportCSV = () => {
        const headers = ["Name", "Email", "Plan", "Status", "Joined", "Last Active", "Month Queries", "Month AI Cost", "Month Revenue", "Month Margin", "Total Queries", "Total AI Cost"];
        const rows = filtered.map(u => [
            u.name, u.email, u.plan, u.status,
            new Date(u.createdAt).toLocaleDateString(),
            new Date(u.lastActiveAt).toLocaleDateString(),
            u.monthQueries, u.monthAiCost.toFixed(2), u.monthRevenue, u.monthMargin.toFixed(2),
            u.totalQueries, u.totalAiCost.toFixed(2),
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `admasterpro-users-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Users</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {summary ? `${summary.totalUsers} total · ${summary.activeUsers} active · ${summary.paidUsers} paid` : "Loading..."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchUsers} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 border border-gray-700">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 border border-gray-700">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" /> Total Users</div>
                        <div className="text-xl font-bold text-white mt-1">{summary.totalUsers}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Crown className="w-3 h-3" /> Paid Users</div>
                        <div className="text-xl font-bold text-blue-400 mt-1">{summary.paidUsers}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> MRR</div>
                        <div className="text-xl font-bold text-green-400 mt-1">${summary.totalMRR.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3" /> AI Cost (Month)</div>
                        <div className="text-xl font-bold text-amber-400 mt-1">${summary.totalMonthCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Margin</div>
                        <div className={`text-xl font-bold mt-1 ${summary.totalMargin >= 0 ? "text-green-400" : "text-red-400"}`}>
                            ${summary.totalMargin.toFixed(2)}
                        </div>
                    </div>
                </div>
            )}

            {/* Plan distribution bar */}
            {summary && summary.totalUsers > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Plan Distribution</div>
                    <div className="flex rounded-lg overflow-hidden h-6">
                        {summary.planDistribution.free > 0 && (
                            <div className="bg-gray-600 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${(summary.planDistribution.free / summary.totalUsers) * 100}%` }}>
                                Free ({summary.planDistribution.free})
                            </div>
                        )}
                        {summary.planDistribution.starter > 0 && (
                            <div className="bg-blue-600 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${(summary.planDistribution.starter / summary.totalUsers) * 100}%` }}>
                                Starter ({summary.planDistribution.starter})
                            </div>
                        )}
                        {summary.planDistribution.pro > 0 && (
                            <div className="bg-purple-600 flex items-center justify-center text-[10px] text-white font-medium" style={{ width: `${(summary.planDistribution.pro / summary.totalUsers) * 100}%` }}>
                                Pro ({summary.planDistribution.pro})
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past_due">Past Due</option>
                </select>
            </div>

            {/* Users table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No users found</p>
                    <p className="text-gray-600 text-sm mt-1">{users.length === 0 ? "No users have signed up yet." : "Try adjusting your filters."}</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                                    <th className="text-left px-4 py-3">User <SortIcon field="name" /></th>
                                    <th className="text-left px-4 py-3">Plan <SortIcon field="plan" /></th>
                                    <th className="text-right px-4 py-3">Queries (Mo) <SortIcon field="monthQueries" /></th>
                                    <th className="text-right px-4 py-3">AI Cost (Mo) <SortIcon field="monthAiCost" /></th>
                                    <th className="text-right px-4 py-3">Margin</th>
                                    <th className="text-left px-4 py-3">Joined <SortIcon field="createdAt" /></th>
                                    <th className="text-left px-4 py-3">Last Active <SortIcon field="lastActiveAt" /></th>
                                    <th className="text-center px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {filtered.map((user) => (
                                    <React.Fragment key={user.id}>
                                        <tr className="hover:bg-gray-800/40 cursor-pointer transition" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium overflow-hidden shrink-0">
                                                        {user.picture ? <img src={user.picture} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-white font-medium truncate flex items-center gap-1.5">
                                                            {statusDot(user.status)} {user.name}
                                                            {user.hasAdsAccess && <span className="text-[9px] bg-green-600/20 text-green-400 px-1 rounded">Ads</span>}
                                                        </div>
                                                        <div className="text-gray-500 text-xs truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{planBadge(user.plan)}</td>
                                            <td className="px-4 py-3 text-right text-gray-300">{user.monthQueries}</td>
                                            <td className="px-4 py-3 text-right text-gray-300">${user.monthAiCost.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={user.monthMargin >= 0 ? "text-green-400" : "text-red-400"}>${user.monthMargin.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(user.lastActiveAt)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button className="p-1.5 text-gray-500 hover:text-white rounded transition" title="View Details"><Eye className="w-3.5 h-3.5" /></button>
                                                    <button className="p-1.5 text-gray-500 hover:text-blue-400 rounded transition" title="Email User"><Mail className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedUser === user.id && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-4 bg-gray-800/30">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">Auth Method</div>
                                                            <div className="text-sm text-gray-300 mt-0.5">{user.authMethod === "google" ? "Google OAuth" : "Email"}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">Messages Used</div>
                                                            <div className="text-sm text-gray-300 mt-0.5">{user.aiMessagesUsed} / {user.aiMessagesLimit}{user.bonusTokens > 0 ? ` (+${user.bonusTokens} bonus)` : ""}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">All-Time Queries</div>
                                                            <div className="text-sm text-gray-300 mt-0.5">{user.totalQueries.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">All-Time AI Cost</div>
                                                            <div className="text-sm text-gray-300 mt-0.5">${user.totalAiCost.toFixed(2)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">Month Tokens</div>
                                                            <div className="text-sm text-gray-300 mt-0.5">{user.monthTokens.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">All-Time Tokens</div>
                                                            <div className="text-sm text-gray-300 mt-0.5">{user.totalTokens.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">Revenue (Month)</div>
                                                            <div className="text-sm text-green-400 mt-0.5">${user.monthRevenue}/mo</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase">Google Ads Access</div>
                                                            <div className="text-sm mt-0.5">{user.hasAdsAccess ? <span className="text-green-400">Connected</span> : <span className="text-gray-500">Not connected</span>}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
                        Showing {filtered.length} of {users.length} users · Live data from PostgreSQL
                    </div>
                </div>
            )}
        </div>
    );
}
