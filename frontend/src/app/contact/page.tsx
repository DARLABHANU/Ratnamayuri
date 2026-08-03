"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Thank you! Your message has been received. Our Concierge Team will reply within 24 business hours.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch {
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F3] font-garamond text-[#1C2E24]">
      <Navbar />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-[#0D2619] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-1 rounded-md uppercase inline-block">
              CUSTOMER SUPPORT
            </span>
            <h1 className="font-cormorant text-3xl md:text-4xl font-bold text-[#1C2E24]">Contact Our Concierge</h1>
            <p className="text-xs text-[#8C9890] max-w-lg mx-auto leading-relaxed">
              Have a question about our handloom collections, custom sizing, or order delivery? We are here to assist you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Info Cards (1 col) */}
            <div className="space-y-4">
              <div className="bg-white border border-[#E5E0D5] p-6 rounded-3xl shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mb-2">
                  <Phone size={18} />
                </div>
                <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Phone Support</h3>
                <p className="text-xs text-[#556B5D]">+91 (800) 123-4567</p>
                <p className="text-[11px] text-[#8C9890]">Mon - Sat: 10:00 AM - 7:00 PM IST</p>
              </div>

              <div className="bg-white border border-[#E5E0D5] p-6 rounded-3xl shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center mb-2">
                  <Mail size={18} />
                </div>
                <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Email Support</h3>
                <p className="text-xs text-[#556B5D]">support@ratnamayuri.com</p>
                <p className="text-[11px] text-[#8C9890]">24/7 Response Desk</p>
              </div>

              <div className="bg-white border border-[#E5E0D5] p-6 rounded-3xl shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center mb-2">
                  <MapPin size={18} />
                </div>
                <h3 className="font-cormorant text-lg font-bold text-[#1C2E24]">Boutique Showroom</h3>
                <p className="text-xs text-[#556B5D] leading-relaxed">
                  Ratnamayuri Heritage House, MG Road, Jubilee Hills, Hyderabad, Telangana - 500033
                </p>
              </div>
            </div>

            {/* Contact Form (2 cols) */}
            <div className="md:col-span-2 bg-white border border-[#E5E0D5] p-8 rounded-3xl shadow-xs space-y-6">
              <h2 className="font-cormorant text-2xl font-bold text-[#1C2E24] border-b border-[#F0ECE1] pb-3">Send Us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ananya@example.com"
                      className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1C2E24] block mb-1">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Inquiry about Kanchipuram Saree"
                      className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl px-4 py-2.5 font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#1C2E24] block mb-1">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can our concierge team assist you today?"
                    className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-xl p-4 text-xs font-semibold text-[#1C2E24] focus:outline-none focus:border-[#0D2619] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#0D2619] hover:bg-[#19402B] text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>SEND MESSAGE</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
