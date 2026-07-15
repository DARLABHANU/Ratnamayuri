"use client";

import { useEffect, useState } from "react";
import { Truck, MapPin, Navigation, Phone, CheckCircle } from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  order: Order;
}

export default function LiveTrackingMap({ order }: Props) {
  const status = order.status;
  const isDelivered = status === "delivered";
  const isOutForDelivery = status === "out_for_delivery";
  
  // Dynamic offset/telemetry animation state
  const [progress, setProgress] = useState(isDelivered ? 100 : isOutForDelivery ? 80 : 35);
  const [eta, setEta] = useState(isDelivered ? 0 : isOutForDelivery ? 12 : 180);
  const [distance, setDistance] = useState(isDelivered ? 0 : isOutForDelivery ? 1.8 : 28.5);
  const [currentLoc, setCurrentLoc] = useState("");

  // Simulated GPS jitter & speed tracker
  const [speed, setSpeed] = useState(isDelivered ? 0 : 32);

  useEffect(() => {
    // Set static values based on status
    if (isDelivered) {
      setProgress(100);
      setEta(0);
      setDistance(0);
      setCurrentLoc(order.current_location || "Delivered to your doorstep");
      setSpeed(0);
      return;
    }

    if (isOutForDelivery) {
      setProgress(82);
      setEta(12);
      setDistance(1.8);
      setCurrentLoc(order.current_location || "Local Distribution Hub, Guntur");
      setSpeed(28);
    } else {
      setProgress(35);
      setEta(145);
      setDistance(42.3);
      setCurrentLoc(order.current_location || "En route - National Highway transit point");
      setSpeed(65);
    }

    // GPS Telemetry drift simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return prev;
        const drift = Math.random() * 0.15;
        return Number((prev + drift).toFixed(2));
      });

      setDistance((prev) => {
        if (prev <= 0.2) return 0.2;
        const reduction = Math.random() * 0.05;
        return Number((prev - reduction).toFixed(1));
      });

      setEta((prev) => {
        if (prev <= 2) return 2;
        return prev - (Math.random() > 0.7 ? 1 : 0);
      });

      setSpeed((prev) => {
        if (prev === 0) return 0;
        const change = Math.floor(Math.random() * 9) - 4;
        return Math.max(15, Math.min(85, prev + change));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [status]);

  // Route paths matching a luxury, organic mapping curve
  const pathData = "M 40,150 C 120,50 200,250 280,100 C 340,30 420,180 500,80 C 580,20 660,180 740,100";
  
  // Calculate point along path based on progress
  const getTruckPosition = (percentage: number) => {
    // Simplified SVG path interpolation for our custom curve:
    // M 40,150 -> C 120,50 200,250 280,100 -> C 340,30 420,180 500,80 -> C 580,20 660,180 740,100
    const pct = percentage / 100;
    const x = 40 + (700 * pct);
    
    // Cubic Bézier curve height approximation:
    let y = 150;
    if (pct < 0.35) {
      const t = pct / 0.35;
      y = 150 * (1-t)*(1-t)*(1-t) + 3*50*t*(1-t)*(1-t) + 3*250*t*t*(1-t) + 100*t*t*t;
    } else if (pct < 0.7) {
      const t = (pct - 0.35) / 0.35;
      y = 100 * (1-t)*(1-t)*(1-t) + 3*30*t*(1-t)*(1-t) + 3*180*t*t*(1-t) + 80*t*t*t;
    } else {
      const t = (pct - 0.7) / 0.3;
      y = 80 * (1-t)*(1-t)*(1-t) + 3*20*t*(1-t)*(1-t) + 3*180*t*t*(1-t) + 100*t*t*t;
    }
    return { x, y: y + 20 };
  };

  const truckPos = getTruckPosition(progress);

  return (
    <div className="space-y-6">
      {/* Visual Map Canvas Grid */}
      <div className="relative w-full h-[240px] bg-[#FAF9F6] border border-gold-200 overflow-hidden shadow-inner rounded-lg">
        {/* Abstract topographic grid pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ 
            backgroundImage: "radial-gradient(#C9A96E 1px, transparent 1px), radial-gradient(#C9A96E 1px, transparent 1px)", 
            backgroundSize: "20px 20px", 
            backgroundPosition: "0 0, 10px 10px" 
          }} 
        />

        {/* Vector SVG Map Paths */}
        <svg className="w-full h-full p-6 absolute inset-0" viewBox="0 0 800 240" preserveAspectRatio="none">
          {/* Base inactive highway curve */}
          <path d={pathData} fill="none" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
          
          {/* Active tracker line */}
          <path d={pathData} fill="none" stroke="#6B1A1A" strokeWidth="4" strokeLinecap="round" 
            strokeDasharray="800" strokeDashoffset={800 - (8 * progress)} className="transition-all duration-1000 ease-out" />
          
          {/* Source Pin (Merchant) */}
          <g transform="translate(40, 170)">
            <circle r="8" fill="#FAF6EE" stroke="#6B1A1A" strokeWidth="3" />
            <circle r="4" fill="#6B1A1A" />
            <text y="-14" textAnchor="middle" className="font-cinzel text-[10px] fill-brown font-bold tracking-wider">
              RATNAMAYURI
            </text>
          </g>

          {/* Destination Pin (Customer Home) */}
          <g transform="translate(740, 120)">
            <circle r="10" fill="#FAF6EE" stroke="#5A1212" strokeWidth="3" className="animate-pulse" />
            <circle r="5" fill="#5A1212" />
            <text y="-16" textAnchor="middle" className="font-cinzel text-[10px] fill-brown font-bold tracking-wider">
              YOUR RESIDENCE
            </text>
          </g>

          {/* Dynamic Moving Truck Node */}
          {!isDelivered && (
            <g transform={`translate(${truckPos.x}, ${truckPos.y})`} className="transition-all duration-1000 ease-out">
              {/* Radar pulse circles */}
              <circle r="22" fill="#6B1A1A" className="animate-ping" style={{ opacity: 0.15 }} />
              <circle r="14" fill="#6B1A1A" className="animate-pulse" style={{ opacity: 0.3 }} />
              
              {/* Vehicle marker */}
              <circle r="10" fill="#6B1A1A" stroke="#FAF6EE" strokeWidth="2" />
              <g transform="translate(-5, -5)">
                <Truck size={10} className="text-white" />
              </g>
            </g>
          )}
        </svg>

        {/* Courier dispatch card */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-gold-200/80 p-3 shadow-md max-w-[280px] rounded-md">
          <div className="flex gap-2.5 items-center">
            <div className="w-8 h-8 rounded-full bg-deep flex items-center justify-center text-gold-400 font-cinzel text-[10px] font-bold">
              {isDelivered ? "✓" : "ETA"}
            </div>
            <div>
              <p className="font-cinzel text-[10px] text-muted tracking-wider leading-none">COURIER DISPATCH</p>
              <h4 className="font-garamond text-xs font-bold text-brown leading-tight mt-1">
                {order.tracking_number ? `Delhivery — ${order.tracking_number}` : "Blue Dart Express"}
              </h4>
            </div>
          </div>
        </div>

        {/* Telemetry Indicator */}
        {!isDelivered && (
          <div className="absolute top-3 right-3 bg-deep text-gold-400 px-3 py-1 font-mono text-[9px] tracking-widest border border-gold-400/30 flex items-center gap-1.5 shadow rounded-md">
            <Navigation size={8} className="animate-spin text-green-500" />
            <span>GPS LOG: {speed} KM/H · LAT/LON DYNAMIC</span>
          </div>
        )}
      </div>

      {/* Live Status Telemetry Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-gold-200/80 text-center">
          <p className="font-cinzel text-[10px] text-muted tracking-widest">CURRENT LOCATION</p>
          <p className="font-garamond text-xs font-semibold text-brown mt-1.5 line-clamp-1">
            {currentLoc}
          </p>
        </div>
        <div className="card p-4 border-gold-200/80 text-center">
          <p className="font-cinzel text-[10px] text-muted tracking-widest">ESTIMATED ARRIVAL</p>
          <p className="font-cinzel text-sm font-bold text-brown mt-1">
            {isDelivered ? "ARRIVED" : eta > 60 ? `${Math.floor(eta/60)} HR ${eta%60} MIN` : `${eta} MINUTES`}
          </p>
        </div>
        <div className="card p-4 border-gold-200/80 text-center">
          <p className="font-cinzel text-[10px] text-muted tracking-widest">REMAINING DISTANCE</p>
          <p className="font-cinzel text-sm font-bold text-brown mt-1">
            {isDelivered ? "0.0 KM" : `${distance} KILOMETERS`}
          </p>
        </div>
        
        {/* Logistics Support Helplines */}
        <div className="card p-3 border-gold-200/80 bg-gold-50/20 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-cinzel text-[9px] text-muted tracking-widest leading-none">DRIVER HELPLINE</p>
            <p className="font-garamond text-[11px] font-bold text-brown truncate mt-1">Ramesh Kumar (Delhivery)</p>
          </div>
          <a href="tel:+919876543210" className="p-2 bg-deep hover:bg-gold-600 hover:text-deep text-gold-400 rounded-full transition-all flex-shrink-0">
            <Phone size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
