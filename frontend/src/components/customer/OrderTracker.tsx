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
      <div className="bg-red-50 border border-red-200 p-4 text-center">
        <p className="font-cinzel text-sm tracking-wide text-red-700 uppercase">{status}</p>
        <p className="font-garamond text-sm text-red-500 mt-1">This order has been {status}.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Step tracker */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gold-100 hidden lg:block" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-gold-500 hidden lg:block transition-all duration-700"
          style={{ width: currentStep >= 0 ? `${(currentStep / (ORDER_STATUS_STEPS.length - 1)) * 100}%` : "0%" }}
        />

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {ORDER_STATUS_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={step} className="flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10
                  ${done ? "bg-deep border-deep" : "bg-white border-gold-200"}
                  ${active ? "ring-4 ring-gold-200" : ""}`}>
                  <Icon size={16} className={done ? "text-gold-400" : "text-muted"} />
                </div>
                <p className={`font-cinzel text-xs tracking-wide mt-2 leading-tight
                  ${done ? "text-brown" : "text-muted"}`}>
                  {STEP_LABELS[i]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* History timeline */}
      {history && history.length > 0 && (
        <div className="mt-6 border-t border-gold-100 pt-4">
          <h4 className="font-cinzel text-xs tracking-widest text-muted mb-3">ORDER TIMELINE</h4>
          <div className="space-y-3">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1 ${i === 0 ? "bg-gold-500" : "bg-gold-200"}`} />
                  {i < history.length - 1 && <div className="w-px flex-1 bg-gold-100 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="font-cinzel text-xs tracking-wide text-brown capitalize">
                    {entry.status.replace(/_/g, " ")}
                  </p>
                  {entry.note && (
                    <p className="font-garamond text-sm text-muted">{entry.note}</p>
                  )}
                  <p className="font-garamond text-xs text-muted mt-0.5">
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
