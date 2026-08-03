"use client";

import { useState } from "react";
import { Save, Lock, Bell, Palette, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function MerchantSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [withdrawalAlerts, setWithdrawalAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(false);

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("All password fields are required"); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
    toast.success("Password updated successfully!");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Store Settings</h1>

      {/* Change Password */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#F0ECE1] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center">
            <Lock size={18} className="text-[#0D2619]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Change Password</h3>
            <p className="text-[11px] text-[#8C9890]">Update your login credentials</p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-md">
          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              placeholder="Enter current password" />
          </div>
          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              placeholder="Enter new password" />
          </div>
          <div>
            <label className="font-bold text-[#1C2E24] block mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
              placeholder="Repeat new password" />
          </div>
          <button onClick={handlePasswordChange}
            className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
            <Save size={14} />
            <span>Update Password</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#F0ECE1] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center">
            <Bell size={18} className="text-[#0D2619]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1C2E24]">Notification Preferences</h3>
            <p className="text-[11px] text-[#8C9890]">Configure how you receive alerts</p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-md">
          {[
            { label: "Email Notifications", desc: "Receive updates via email", val: emailNotifications, set: setEmailNotifications },
            { label: "New Order Alerts", desc: "Notified when a new order arrives", val: orderAlerts, set: setOrderAlerts },
            { label: "Withdrawal Updates", desc: "Status changes on payout requests", val: withdrawalAlerts, set: setWithdrawalAlerts },
            { label: "Review Alerts", desc: "When customers leave a product review", val: reviewAlerts, set: setReviewAlerts },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between p-3 bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl cursor-pointer">
              <div>
                <span className="font-bold text-[#1C2E24]">{item.label}</span>
                <p className="text-[11px] text-[#8C9890] mt-0.5">{item.desc}</p>
              </div>
              <div className="relative">
                <input type="checkbox" checked={item.val} onChange={() => item.set(!item.val)} className="sr-only peer" />
                <div className="w-10 h-5 bg-[#E5E0D5] rounded-full peer-checked:bg-[#2E7D32] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          ))}
        </div>

        <button onClick={() => toast.success("Notification preferences saved!")}
          className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
          <Save size={14} />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
}
