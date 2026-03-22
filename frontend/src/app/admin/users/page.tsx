"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, UserCheck, UserX, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, UserRole } from "@/types";
import { formatDate, getApiError } from "@/lib/utils";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "",         label: "All Roles"  },
  { value: "customer", label: "Customers"  },
  { value: "merchant", label: "Merchants"  },
  { value: "support",  label: "Support"    },
  { value: "admin",    label: "Admins"     },
];

function UsersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated, role } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(params.get("role") || "");
  const [page, setPage] = useState(1);
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin","support"].includes(role || "")) { router.push("/auth/login"); return; }
    loadUsers();
  }, [isAuthenticated, role, roleFilter, page]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.users({ page, page_size: 20, role: roleFilter || undefined, search: search || undefined });
      setUsers(data.items);
      setTotal(data.total);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadUsers(); };

  const toggleActive = async (user: User) => {
    setActionUserId(user.id);
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? "User deactivated" : "User activated");
      loadUsers();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setActionUserId(null); }
  };

  const toggleVerified = async (user: User) => {
    setActionUserId(user.id);
    try {
      await adminApi.updateUser(user.id, { is_verified: !user.is_verified });
      toast.success(user.is_verified ? "Verification removed" : "User verified");
      loadUsers();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setActionUserId(null); }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">MANAGEMENT</span>
        <h1 className="section-title">User <em className="italic">Management</em></h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or account number…"
              className="input-field pl-9 py-2.5" />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 text-xs">SEARCH</button>
        </form>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input-field w-40 py-2.5 font-cinzel text-xs">
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-ivory">
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Account #</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="table-td">
                      <p className="font-garamond text-sm font-medium text-brown">{user.full_name}</p>
                      <p className="font-garamond text-xs text-muted">{user.email}</p>
                    </td>
                    <td className="table-td font-cinzel text-xs text-muted">{user.account_number}</td>
                    <td className="table-td">
                      <span className={`badge text-xs capitalize
                        ${user.role === "admin" ? "bg-red-100 text-red-700" :
                          user.role === "merchant" ? "bg-purple-100 text-purple-700" :
                          user.role === "support" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="table-td font-garamond text-xs text-muted">{formatDate(user.created_at)}</td>
                    <td className="table-td">
                      <div className="flex flex-col gap-1">
                        <span className={`font-cinzel text-xs ${user.is_active ? "text-green-600" : "text-red-500"}`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className={`font-cinzel text-xs ${user.is_verified ? "text-green-600" : "text-yellow-600"}`}>
                          {user.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        {actionUserId === user.id ? (
                          <Loader2 size={14} className="animate-spin text-gold-500" />
                        ) : (
                          <>
                            <button onClick={() => toggleActive(user)} title={user.is_active ? "Deactivate" : "Activate"}
                              className="text-muted hover:text-brown transition-colors">
                              {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button onClick={() => toggleVerified(user)} title={user.is_verified ? "Remove verification" : "Verify"}
                              className="text-muted hover:text-brown transition-colors">
                              <ShieldCheck size={14} className={user.is_verified ? "text-green-500" : ""} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="table-td text-center py-10 font-garamond text-muted">No users found</td></tr>
                )}
              </tbody>
            </table>

            <div className="p-4 border-t border-gold-100 flex justify-between items-center">
              <p className="font-garamond text-xs text-muted">{total} total users</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20}
                  className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return <Suspense fallback={<div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28}/></div>}><UsersContent /></Suspense>;
}
