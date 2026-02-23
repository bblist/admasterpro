"use client";

import React, { useState } from "react";
import {
    Search,
    Filter,
    Download,
    MoreVertical,
    Mail,
    Eye,
    Ban,
    ChevronDown,
    UserPlus,
    ArrowUpDown,
} from "lucide-react";

// Demo users data
const allUsers = [
    { id: 1, name: "Metro Law Group", email: "billing@metrolaw.com", plan: "Agency", status: "active", joined: "2025-08-12", lastActive: "2 min ago", adSpend: 45200, savedByAI: 8900, queries: 342, campaigns: 18 },
    { id: 2, name: "Premier Real Estate", email: "ads@premierrealty.com", plan: "Agency", status: "active", joined: "2025-09-03", lastActive: "15 min ago", adSpend: 38900, savedByAI: 6200, queries: 287, campaigns: 14 },
    { id: 3, name: "Pacific Auto Dealers", email: "marketing@pacificauto.com", plan: "Agency", status: "active", joined: "2025-07-22", lastActive: "1 hour ago", adSpend: 32100, savedByAI: 7800, queries: 456, campaigns: 22 },
    { id: 4, name: "Downtown Dental Network", email: "office@downtowndental.com", plan: "Agency", status: "active", joined: "2025-10-15", lastActive: "3 hours ago", adSpend: 28500, savedByAI: 4300, queries: 198, campaigns: 9 },
    { id: 5, name: "Citywide HVAC Services", email: "admin@citywidehvac.com", plan: "Pro", status: "active", joined: "2025-11-01", lastActive: "30 min ago", adSpend: 24800, savedByAI: 5100, queries: 523, campaigns: 8 },
    { id: 6, name: "Mike's Plumbing Co", email: "mike@mikesplumbing.com", plan: "Pro", status: "active", joined: "2026-02-24", lastActive: "2 hours ago", adSpend: 4200, savedByAI: 890, queries: 67, campaigns: 3 },
    { id: 7, name: "Sarah's Bakery", email: "sarah@sarahsbakery.com", plan: "Free", status: "active", joined: "2026-02-24", lastActive: "5 hours ago", adSpend: 800, savedByAI: 120, queries: 12, campaigns: 2 },
    { id: 8, name: "Elite Auto Repair", email: "admin@eliteauto.com", plan: "Pro", status: "active", joined: "2026-02-24", lastActive: "8 hours ago", adSpend: 12500, savedByAI: 2100, queries: 89, campaigns: 5 },
    { id: 9, name: "Sunrise Yoga Studio", email: "hello@sunriseyoga.com", plan: "Pro", status: "active", joined: "2026-02-23", lastActive: "1 day ago", adSpend: 2100, savedByAI: 450, queries: 34, campaigns: 2 },
    { id: 10, name: "Joe's Pizza Chain", email: "joe@joespizza.com", plan: "Pro", status: "active", joined: "2025-12-10", lastActive: "4 hours ago", adSpend: 8900, savedByAI: 1800, queries: 156, campaigns: 6 },
    { id: 11, name: "Bright Smile Orthodontics", email: "info@brightsmile.com", plan: "Pro", status: "trial", joined: "2026-02-20", lastActive: "2 days ago", adSpend: 3200, savedByAI: 400, queries: 23, campaigns: 2 },
    { id: 12, name: "Green Lawn Masters", email: "book@greenlawn.com", plan: "Free", status: "active", joined: "2026-01-15", lastActive: "6 hours ago", adSpend: 1500, savedByAI: 200, queries: 45, campaigns: 3 },
    { id: 13, name: "Quick Fix IT Solutions", email: "support@quickfixit.com", plan: "Pro", status: "churned", joined: "2025-10-05", lastActive: "14 days ago", adSpend: 0, savedByAI: 3200, queries: 8, campaigns: 0 },
    { id: 14, name: "Lakeside Pet Clinic", email: "vet@lakesidepet.com", plan: "Free", status: "active", joined: "2026-02-18", lastActive: "1 day ago", adSpend: 600, savedByAI: 80, queries: 19, campaigns: 1 },
    { id: 15, name: "Mountain View Gym", email: "team@mvgym.com", plan: "Pro", status: "active", joined: "2025-11-28", lastActive: "20 min ago", adSpend: 6700, savedByAI: 1400, queries: 201, campaigns: 4 },
];

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);

    const filtered = allUsers.filter((u) => {
        const matchSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchPlan = planFilter === "all" || u.plan === planFilter;
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchPlan && matchStatus;
    });

    const totalSpend = filtered.reduce((s, u) => s + u.adSpend, 0);
    const totalSaved = filtered.reduce((s, u) => s + u.savedByAI, 0);

    const toggleSelect = (id: number) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Users</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {allUsers.length} total users · {allUsers.filter((u) => u.status === "active").length} active
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 border border-gray-700">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        <UserPlus className="w-4 h-4" />
                        Invite User
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500">Filtered Users</div>
                    <div className="text-xl font-bold text-white mt-1">{filtered.length}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500">Total Ad Spend</div>
                    <div className="text-xl font-bold text-green-400 mt-1">
                        ${totalSpend.toLocaleString()}/mo
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500">Saved by AI</div>
                    <div className="text-xl font-bold text-blue-400 mt-1">
                        ${totalSaved.toLocaleString()}/mo
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs text-gray-500">Avg Queries/User</div>
                    <div className="text-xl font-bold text-purple-400 mt-1">
                        {filtered.length > 0
                            ? Math.round(filtered.reduce((s, u) => s + u.queries, 0) / filtered.length)
                            : 0}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="all">All Plans</option>
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Agency">Agency</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="churned">Churned</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left p-4 text-gray-500 font-medium w-8">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-600"
                                        checked={selectedUsers.length === filtered.length && filtered.length > 0}
                                        onChange={() =>
                                            setSelectedUsers(
                                                selectedUsers.length === filtered.length
                                                    ? []
                                                    : filtered.map((u) => u.id)
                                            )
                                        }
                                    />
                                </th>
                                <th className="text-left p-4 text-gray-500 font-medium">Business</th>
                                <th className="text-left p-4 text-gray-500 font-medium">Plan</th>
                                <th className="text-left p-4 text-gray-500 font-medium">Status</th>
                                <th className="text-left p-4 text-gray-500 font-medium">
                                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-300">
                                        Ad Spend <ArrowUpDown className="w-3 h-3" />
                                    </span>
                                </th>
                                <th className="text-left p-4 text-gray-500 font-medium">AI Saved</th>
                                <th className="text-left p-4 text-gray-500 font-medium">Queries</th>
                                <th className="text-left p-4 text-gray-500 font-medium">Last Active</th>
                                <th className="text-left p-4 text-gray-500 font-medium w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user) => (
                                <React.Fragment key={user.id}>
                                    <tr
                                        className={`border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors ${expandedUser === user.id ? "bg-gray-800/30" : ""
                                            }`}
                                        onClick={() =>
                                            setExpandedUser(expandedUser === user.id ? null : user.id)
                                        }
                                    >
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-600"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`text-xs font-medium px-2 py-1 rounded-full ${user.plan === "Agency"
                                                        ? "bg-purple-900/40 text-purple-400"
                                                        : user.plan === "Pro"
                                                            ? "bg-blue-900/40 text-blue-400"
                                                            : "bg-gray-800 text-gray-400"
                                                    }`}
                                            >
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`flex items-center gap-1.5 text-xs ${user.status === "active"
                                                        ? "text-green-400"
                                                        : user.status === "trial"
                                                            ? "text-amber-400"
                                                            : "text-red-400"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${user.status === "active"
                                                            ? "bg-green-500"
                                                            : user.status === "trial"
                                                                ? "bg-amber-500"
                                                                : "bg-red-500"
                                                        }`}
                                                />
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-green-400 font-medium">
                                            ${user.adSpend.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-blue-400">
                                            ${user.savedByAI.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-gray-300">{user.queries}</td>
                                        <td className="p-4 text-gray-500 text-xs">{user.lastActive}</td>
                                        <td className="p-4">
                                            <ChevronDown
                                                className={`w-4 h-4 text-gray-500 transition-transform ${expandedUser === user.id ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </td>
                                    </tr>
                                    {/* Expanded detail row */}
                                    {expandedUser === user.id && (
                                        <tr key={`${user.id}-detail`} className="bg-gray-800/20">
                                            <td colSpan={9} className="p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500">Joined</div>
                                                        <div className="text-sm text-white">{user.joined}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">Campaigns</div>
                                                        <div className="text-sm text-white">{user.campaigns}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">Monthly Ad Spend</div>
                                                        <div className="text-sm text-green-400 font-medium">
                                                            ${user.adSpend.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500">AI Savings / Month</div>
                                                        <div className="text-sm text-blue-400 font-medium">
                                                            ${user.savedByAI.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 text-xs rounded-lg hover:bg-blue-600/30 border border-blue-600/30">
                                                        <Eye className="w-3 h-3" /> View Profile
                                                    </button>
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 text-gray-300 text-xs rounded-lg hover:bg-gray-700 border border-gray-700">
                                                        <Mail className="w-3 h-3" /> Send Email
                                                    </button>
                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 text-xs rounded-lg hover:bg-red-600/30 border border-red-600/30">
                                                        <Ban className="w-3 h-3" /> Suspend
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                    <div className="text-xs text-gray-500">
                        Showing {filtered.length} of {allUsers.length} users
                        {selectedUsers.length > 0 && (
                            <span className="text-blue-400 ml-2">
                                · {selectedUsers.length} selected
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">1</button>
                        <button className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded hover:bg-gray-700">2</button>
                        <button className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded hover:bg-gray-700">3</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
