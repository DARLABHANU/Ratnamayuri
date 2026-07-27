"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, UserCheck, UserX, ShieldCheck, Store, Percent, Trash2, Award } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";
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

  // Tabs state
  const [activeTab, setActiveTab] = useState<"users" | "merchants">("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(params.get("role") || "");
  const [page, setPage] = useState(1);
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  // Merchant profiles state
  const [merchants, setMerchants] = useState<any[]>([]);
  const [merchantsTotal, setMerchantsTotal] = useState(0);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [merchantsPage, setMerchantsPage] = useState(1);
  const [commissionInputs, setCommissionInputs] = useState<Record<number, number>>({});
  const [actionMerchantId, setActionMerchantId] = useState<number | null>(null);

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to permanently delete user "${user.full_name}" (${user.email}) from the database?`)) return;
    setActionUserId(user.id);
    try {
      await adminApi.deleteUser(user.id);
      toast.success("User permanently deleted from database");
      loadUsers();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteMerchant = async (merchantProfile: any) => {
    if (!confirm(`Are you sure you want to permanently delete merchant store "${merchantProfile.business_name}" from the database?`)) return;
    setActionMerchantId(merchantProfile.id);
    try {
      await adminApi.deleteMerchant(merchantProfile.id);
      toast.success("Merchant profile permanently deleted from database");
      loadMerchants();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionMerchantId(null);
    }
  };

  const createPromoterCoupon = async (user: User) => {
    const code = window.prompt(`Create unique ₹199 promoter coupon code for ${user.full_name}:`, `PROMO${user.id}`);
    if (!code) return;
    setActionUserId(user.id);
    try {
      await adminApi.createCoupon({
        code: code.trim().toUpperCase(),
        description: `Affiliate Promoter coupon for ${user.full_name}`,
        discount_type: "fixed",
        discount_value: 199,
        promoter_commission: 100,
        platform_profit: 30,
        promoter_id: String(user.id),
      });
      toast.success(`Promoter coupon "${code.trim().toUpperCase()}" created for ${user.full_name}!`);
      loadUsers();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionUserId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !["admin","support"].includes(role || "")) { router.push("/auth/login"); return; }
    if (activeTab === "users") {
      loadUsers();
    } else {
      loadMerchants();
    }
  }, [isAuthenticated, role, roleFilter, page, activeTab, merchantsPage]);

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

  const loadMerchants = async () => {
    setMerchantsLoading(true);
    try {
      const { data } = await adminApi.merchants({ page: merchantsPage, page_size: 20 });
      setMerchants(data.items);
      setMerchantsTotal(data.total);

      const inputs: Record<number, number> = {};
      data.items.forEach((m: any) => {
        inputs[m.id] = m.commission_rate ?? 10;
      });
      setCommissionInputs(inputs);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setMerchantsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadUsers(); };

  const toggleActive = async (user: User) => {
    setActionUserId(user.id);
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? "User deactivated" : "User activated");
      if (activeTab === "users") loadUsers();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setActionUserId(null); }
  };

  const approveUser = async (user: User) => {
    if (user.is_verified) return;
    setActionUserId(user.id);
    try {
      await adminApi.updateUser(user.id, { is_verified: true });
      toast.success("User verified & approved successfully");
      loadUsers();
    } catch (err) { toast.error(getApiError(err)); }
    finally { setActionUserId(null); }
  };

  const approveMerchantProfile = async (merchantProfile: any) => {
    setActionMerchantId(merchantProfile.id);
    const rate = commissionInputs[merchantProfile.id] ?? 10;
    try {
      await adminApi.approveMerchant(merchantProfile.id, {
        is_approved: true,
        commission_rate: rate
      });
      toast.success(`Merchant "${merchantProfile.business_name}" approved successfully!`);
      loadMerchants();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionMerchantId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <span className="section-tag">MANAGEMENT</span>
        <h1 className="section-title">User & Store <em className="italic">Management</em></h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gold-200 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-2.5 font-cinzel text-xs tracking-widest border-b-2 transition-all ${
            activeTab === "users"
              ? "border-gold-500 text-gold-700 font-medium"
              : "border-transparent text-muted hover:text-brown"
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab("merchants")}
          className={`px-6 py-2.5 font-cinzel text-xs tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "merchants"
              ? "border-gold-500 text-gold-700 font-medium"
              : "border-transparent text-muted hover:text-brown"
          }`}
        >
          <Store size={14} /> Merchant Profiles
        </button>
      </div>

      {activeTab === "users" ? (
        <div>
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
                <div className="overflow-x-auto">
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
                            ${user.role === "admin" ? "!bg-red-700 !text-white font-semibold" :
                              user.role === "merchant" ? "!bg-purple-600 !text-white font-semibold" :
                              user.role === "support" ? "!bg-blue-600 !text-white font-semibold" :
                              "!bg-slate-600 !text-white font-semibold"}`}>
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
                          <div className="flex items-center gap-2">
                            {actionUserId === user.id ? (
                              <Loader2 size={14} className="animate-spin text-gold-500" />
                            ) : (
                              <>
                                <button onClick={() => toggleActive(user)} title={user.is_active ? "Deactivate" : "Activate"}
                                  className="text-muted hover:text-brown transition-colors">
                                  {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                </button>
                                {user.is_verified ? (
                                  <span title="Verified & Approved" className="text-green-600">
                                    <ShieldCheck size={15} className="text-green-500" />
                                  </span>
                                ) : (
                                  <button onClick={() => approveUser(user)} title="Verify & Approve"
                                    className="text-muted hover:text-green-600 transition-colors">
                                    <ShieldCheck size={15} />
                                  </button>
                                )}
                                <button onClick={() => createPromoterCoupon(user)} title="Make Promoter (Assign ₹199 Coupon Code)"
                                  className="text-gold-600 hover:text-gold-500 transition-colors ml-1">
                                  <Award size={15} />
                                </button>
                                <button onClick={() => handleDeleteUser(user)} title="Permanently Delete User"
                                  className="text-muted hover:text-red-600 transition-colors ml-1">
                                  <Trash2 size={15} />
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
              </div>

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
      ) : (
        <div className="card overflow-hidden">
          {merchantsLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-gold-500" size={28} /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-ivory">
                  <tr>
                    <th className="table-th text-left">Store Details</th>
                    <th className="table-th text-left">Merchant Owner</th>
                    <th className="table-th text-left font-cinzel">Commission %</th>
                    <th className="table-th text-left font-cinzel">Status</th>
                    <th className="table-th text-left font-cinzel">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((m) => (
                    <tr key={m.id} className="hover:bg-ivory/50 transition-colors">
                      <td className="table-td">
                        <p className="font-garamond text-sm font-medium text-brown">{m.business_name}</p>
                        <p className="font-garamond text-xs text-muted">{m.business_type || "Store"}</p>
                      </td>
                      <td className="table-td">
                        <p className="font-garamond text-xs text-brown">{m.user?.full_name || `User #${m.user_id}`}</p>
                        <p className="font-garamond text-xs text-muted">{m.user?.email}</p>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={commissionInputs[m.id] ?? m.commission_rate ?? 10}
                            onChange={(e) => setCommissionInputs({
                              ...commissionInputs,
                              [m.id]: Number(e.target.value)
                            })}
                            className="w-16 bg-white border border-gold-200 text-xs px-2 py-1 rounded text-brown font-semibold focus:outline-none focus:border-gold-500"
                            min={0}
                            max={100}
                          />
                          <span className="font-cinzel text-xs text-muted">%</span>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className={`badge text-xs ${m.is_approved ? "!bg-emerald-100 !text-emerald-800" : "!bg-amber-100 !text-amber-800"}`}>
                          {m.is_approved ? "APPROVED" : "PENDING"}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          {actionMerchantId === m.id ? (
                            <Loader2 size={14} className="animate-spin text-gold-500" />
                          ) : (
                            <>
                              <button
                                onClick={() => approveMerchantProfile(m)}
                                className={`text-xs px-3 py-1 rounded font-cinzel font-bold tracking-wider transition-colors ${
                                  m.is_approved 
                                    ? "bg-gold-50 text-gold-700 hover:bg-gold-100 border border-gold-300"
                                    : "bg-emerald-800 text-gold-300 hover:bg-emerald-900"
                                }`}
                              >
                                {m.is_approved ? "UPDATE RATE" : "APPROVE STORE"}
                              </button>
                              <button
                                onClick={() => handleDeleteMerchant(m)}
                                title="Permanently Delete Merchant Store"
                                className="text-muted hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {merchants.length === 0 && (
                    <tr><td colSpan={5} className="table-td text-center py-10 font-garamond text-muted">No merchant profiles found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

              <div className="p-4 border-t border-gold-100 flex justify-between items-center">
                <p className="font-garamond text-xs text-muted">{merchantsTotal} total merchant stores</p>
                <div className="flex gap-2">
                  <button onClick={() => setMerchantsPage(p => Math.max(1, p - 1))} disabled={merchantsPage === 1}
                    className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">← Prev</button>
                  <button onClick={() => setMerchantsPage(p => p + 1)} disabled={merchants.length < 20}
                    className="btn-ghost text-xs px-3 py-1 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={24} /></div>}>
      <UsersContent />
    </Suspense>
  );
}
