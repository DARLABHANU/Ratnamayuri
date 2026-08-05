"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Search } from "lucide-react";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";

function MerchantReviewsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [reviews, setReviews] = useState<any[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [fiveStarCount, setFiveStarCount] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadReviews();
  }, [isAuthenticated, role]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const { data } = await merchantApi.reviews({ page_size: 50 });
      const list = Array.isArray(data) ? data : data?.items || [];
      setReviews(list);
      setTotalReviews(list.length);
      
      if (list.length > 0) {
        const totalRating = list.reduce((sum: number, r: any) => sum + r.rating, 0);
        setAverageRating(Number((totalRating / list.length).toFixed(1)));
        setFiveStarCount(list.filter((r: any) => r.rating === 5).length);
      }
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.comment?.toLowerCase().includes(search.toLowerCase()) || 
    r.reviewer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={13} className={i < rating ? "fill-[#B85C00] text-[#B85C00]" : "text-[#E5E0D5]"} />
    ));
  };

  return (
    <div className="space-y-6 text-[#1C2E24] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1C2E24]">Product Reviews</h1>

      <div className="bg-white border border-[#E5E0D5] rounded-3xl p-6 shadow-xs space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#F0ECE1]">
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Total Reviews</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D2619]">{totalReviews}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Average Rating</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{averageRating}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">5-Star Reviews</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{fiveStarCount}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#6B7A70] block mb-1">Pending Reply</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#E65100]">0</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C9890]" />
          <input type="text" placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF8F3] border border-[#E5E0D5] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1C2E24] placeholder-[#8C9890] focus:outline-none focus:border-[#0D2619]" />
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6 text-xs text-[#8C9890]">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#8C9890]">No reviews found</div>
          ) : (
            filteredReviews.map((r) => (
              <div key={r.id} className="p-4 bg-[#FAF8F3] border border-[#E5E0D5] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#1C2E24]">{r.customer_name}</span>
                    <span className="text-[11px] text-[#8C9890] ml-2">on <span className="font-semibold text-[#556B5D]">{r.product_name}</span></span>
                  </div>
                  <span className="text-[11px] text-[#8C9890]">{formatDate(r.created_at)}</span>
                </div>
                <div className="flex items-center gap-0.5">{renderStars(r.rating)}</div>
                <p className="text-xs text-[#556B5D] leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function MerchantReviewsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D2619]" size={28} /></div>}>
      <MerchantReviewsContent />
    </Suspense>
  );
}
