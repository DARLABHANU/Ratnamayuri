"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock, ShieldAlert, Loader2, Send } from "lucide-react";
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
      // Simulate premium API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Thank you! Your message has been received. Our Concierge Team will reply within 24 business hours.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EE]">
      <Navbar />
      
      <main className="flex-1 bg-[#FAF6EE] py-16 px-4">
        <div className="max-w-6xl mx-auto bg-white border border-[#E8D5B0] p-8 md:p-12 shadow-sm rounded-lg animate-fade-up space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="font-cinzel text-[10px] tracking-widest text-[#C9973E] block font-bold">CUSTOMER SUPPORT</span>
            <h1 className="font-cormorant text-4xl text-[#5A1212] italic">Contact Our Concierge</h1>
            <p className="font-garamond text-sm text-[#6B7280] max-w-lg mx-auto leading-relaxed">
              Have a question about our handloom collections, custom sizing, or order delivery? We are here to assist you.
            </p>
            <div className="w-12 h-[1px] bg-[#C9973E] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-6">
            
            {/* Column 1: Contact Details & KYC Merchant Info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold mb-4 uppercase">
                  Registered Business Profile
                </h2>
                <p className="font-garamond text-[#5A1212]/95 text-base leading-relaxed">
                  Ratnamayuri is a legally registered luxury enterprise in India. For Razorpay payment gateway audit and customer reference, our registration details are provided below:
                </p>
              </div>

              <div className="space-y-6 text-[#5A1212]/95 font-garamond text-sm md:text-base">
                
                {/* Registered Name */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[#FAF6EE] border border-[#E8D5B0] rounded-full text-[#C9973E] mt-1">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-[10px] tracking-widest text-[#C9973E] font-bold">Legal Entity Name</h3>
                    <p className="font-semibold text-deep mt-0.5">RATNAMAYURI JEWELLERY &amp; SAREES</p>
                  </div>
                </div>

                {/* Office Address */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[#FAF6EE] border border-[#E8D5B0] rounded-full text-[#C9973E] mt-1">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-[10px] tracking-widest text-[#C9973E] font-bold">Registered Office Address</h3>
                    <p className="mt-0.5 leading-relaxed text-deep">
                      Opposite Sivalayam Temple, Main Road, Guntur District,<br />
                      Andhra Pradesh - 522001, India.
                    </p>
                  </div>
                </div>

                {/* Support Helpline */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[#FAF6EE] border border-[#E8D5B0] rounded-full text-[#C9973E] mt-1">
                    <Phone size={16} />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-[10px] tracking-widest text-[#C9973E] font-bold">Customer Helpline / WhatsApp</h3>
                    <p className="font-semibold text-deep mt-0.5">+91 83318 10689</p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[#FAF6EE] border border-[#E8D5B0] rounded-full text-[#C9973E] mt-1">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-[10px] tracking-widest text-[#C9973E] font-bold">Support Email</h3>
                    <p className="font-semibold text-deep mt-0.5">
                      <a href="mailto:ratnamayurii@gmail.com" className="hover:underline">
                        ratnamayurii@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[#FAF6EE] border border-[#E8D5B0] rounded-full text-[#C9973E] mt-1">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-[10px] tracking-widest text-[#C9973E] font-bold">Support Hours</h3>
                    <p className="mt-0.5 leading-relaxed text-deep">
                      Monday to Saturday: 10:00 AM to 7:00 PM IST<br />
                      <span className="text-xs text-[#6B7280]">Offline on Sundays and public holidays.</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Column 2: Message Form */}
            <div className="bg-[#FAF6EE]/30 border border-[#E8D5B0] p-6 md:p-8 rounded-lg">
              <h2 className="font-cinzel text-xs tracking-wider text-[#5A1212] font-extrabold mb-6 uppercase">
                Send Us a Direct Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block font-cinzel text-[9px] tracking-widest text-[#C9973E] font-bold mb-1.5 uppercase">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-[#E8D5B0] px-4 py-2.5 text-sm font-garamond text-deep focus:outline-none focus:border-[#C9973E]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-cinzel text-[9px] tracking-widest text-[#C9973E] font-bold mb-1.5 uppercase">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-[#E8D5B0] px-4 py-2.5 text-sm font-garamond text-deep focus:outline-none focus:border-[#C9973E]"
                    />
                  </div>
                  <div>
                    <label className="block font-cinzel text-[9px] tracking-widest text-[#C9973E] font-bold mb-1.5 uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-[#E8D5B0] px-4 py-2.5 text-sm font-garamond text-deep focus:outline-none focus:border-[#C9973E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-cinzel text-[9px] tracking-widest text-[#C9973E] font-bold mb-1.5 uppercase">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white border border-[#E8D5B0] px-4 py-2.5 text-sm font-garamond text-deep focus:outline-none focus:border-[#C9973E]"
                  />
                </div>

                <div>
                  <label className="block font-cinzel text-[9px] tracking-widest text-[#C9973E] font-bold mb-1.5 uppercase">
                    Message / Inquiry Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white border border-[#E8D5B0] px-4 py-2.5 text-sm font-garamond text-deep focus:outline-none focus:border-[#C9973E] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#C9973E] hover:bg-[#B8842A] text-white py-3 font-cinzel text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {submitting ? (
                    <><Loader2 size={12} className="animate-spin" /> SENDING MESSAGE...</>
                  ) : (
                    <>
                      SEND MESSAGE <Send size={12} />
                    </>
                  )}
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
