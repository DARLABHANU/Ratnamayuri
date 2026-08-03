import { Check, Package, Truck, MapPin, Home, Clock } from "lucide-react";
import { OrderStatus, StatusHistoryEntry } from "@/types";
import { ORDER_STATUS_STEPS, getStatusStepIndex, formatDateTime } from "@/lib/utils";

const STEP_ICONS = [Clock, Check, Package, Truck, MapPin, Home];
const STEP_LABELS = ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

interface Props {
  status: OrderStatus;
  history?: StatusHistoryEntry[];
}

export default function OrderTracker({ status, history }: Props) {
  const currentStep = getStatusStepIndex(status);
  const isCancelled = status === "cancelled" || status === "refunded";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center">
        <p className="font-garamond text-xs font-bold text-red-700 uppercase tracking-wider">{status}</p>
        <p className="font-garamond text-xs text-red-600 mt-1">This order has been {status}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-garamond">
      {/* Step tracker */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-[#E5E0D5] hidden lg:block" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-[#0D2619] hidden lg:block transition-all duration-700"
          style={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STATUS_STEPS.length - 1)) * 100}%` : "0%" }}
        />

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {ORDER_STATUS_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={step} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                    done ? "bg-[#0D2619] border-[#0D2619] text-white" : "bg-white border-[#E5E0D5] text-[#8C9890]"
                  } ${active ? "ring-4 ring-[#E8F5E9]" : ""}`}
                >
                  <Icon size={16} />
                </div>
                <p className={`font-garamond text-xs font-bold mt-2 leading-tight ${done ? "text-[#1C2E24]" : "text-[#8C9890]"}`}>
                  {STEP_LABELS[i]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* History timeline */}
      {history && history.length > 0 && (
        <div className="border-t border-[#F0ECE1] pt-4">
          <h4 className="font-garamond text-xs font-bold text-[#8C9890] tracking-wider mb-3 uppercase">ORDER TIMELINE</h4>
          <div className="space-y-3">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? "bg-[#0D2619]" : "bg-[#E5E0D5]"}`} />
                  {i < history.length - 1 && <div className="w-px flex-1 bg-[#E5E0D5] mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="font-garamond text-xs font-bold text-[#1C2E24] capitalize">
                    {entry.status.replace(/_/g, " ")}
                  </p>
                  {entry.note && (
                    <p className="font-garamond text-xs text-[#556B5D] mt-0.5">{entry.note}</p>
                  )}
                  <p className="font-garamond text-[10px] text-[#8C9890] mt-0.5">
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
