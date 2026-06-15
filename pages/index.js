import Head from "next/head";
import { useState, useEffect, useMemo, useRef } from "react";
import airportsData from "../data/airports.json";

function formatWaitTime(minutes) {
  if (minutes === undefined || minutes === null || minutes < 0) return "Wait time not available";
  if (minutes === 0) return "1-5m";
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes}m`;
}

function StatusCard({ lounge, refreshTrigger, onStatusLoaded, isFavorite, onToggleFavorite, onOpenDetails, hasAlert, onToggleAlert }) {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    onStatusLoaded(lounge.slug, { loading: true });

    async function fetchStatus() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/status?slug=${lounge.slug}`);
        if (!res.ok) {
          throw new Error("Offline");
        }
        const data = await res.json();
        if (active) {
          setStatusData(data);
          setLoading(false);
          onStatusLoaded(lounge.slug, {
            status: data.status,
            estimatedWaitMinutes: data.estimatedWaitMinutes,
            partiesWaiting: data.partiesWaiting,
            loading: false,
            error: false
          });
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
          onStatusLoaded(lounge.slug, {
            status: "CLOSED",
            estimatedWaitMinutes: 0,
            partiesWaiting: 0,
            loading: false,
            error: true
          });
        }
      }
    }

    fetchStatus();
    return () => {
      active = false;
    };
  }, [lounge.slug, refreshTrigger]);

  const waitTime = statusData?.status === "YELLOW" ? statusData.estimatedWaitMinutes : 0;
  const waitStyle = useMemo(() => {
    if (waitTime > 30) {
      return {
        border: "border-rose-500/20 dark:border-rose-500/10",
        bg: "bg-rose-500/5 dark:bg-rose-500/5",
        text: "text-rose-600 dark:text-rose-400",
        label: "text-rose-500/80 dark:text-rose-400/80",
        split: "border-rose-500/20 dark:border-rose-500/10"
      };
    }
    if (waitTime > 15) {
      return {
        border: "border-amber-500/20 dark:border-amber-500/10",
        bg: "bg-amber-500/5 dark:bg-amber-500/5",
        text: "text-amber-600 dark:text-amber-400",
        label: "text-amber-500/80 dark:text-amber-400/80",
        split: "border-amber-500/20 dark:border-amber-500/10"
      };
    }
    return {
      border: "border-emerald-500/20 dark:border-emerald-500/10",
      bg: "bg-emerald-500/5 dark:bg-emerald-500/5",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "text-emerald-500/80 dark:text-emerald-400/80",
      split: "border-emerald-500/20 dark:border-emerald-500/10"
    };
  }, [waitTime]);

  const joinUrl = `https://waitwhile.com/locations/${lounge.slug}/welcome?qr=true`;

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900/80 shadow-sm hover:shadow-xl dark:shadow-none hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 ${
      isFavorite 
        ? 'border-indigo-500/50 dark:border-indigo-500/40 shadow-md shadow-indigo-500/5 dark:shadow-[0_0_15px_rgba(99,102,241,0.05)] bg-indigo-50/10 dark:bg-zinc-900/60' 
        : 'border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700/80'
    }`}>
      {/* Decorative gradient blur background on hover */}
      <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl transition-all duration-300 group-hover:bg-indigo-500/10 group-hover:blur-2xl"></div>

      <div>
        {/* Card Header: Airport Code, City, Terminal & Star Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-lg px-3 py-1 text-sm font-bold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700/50 shrink-0" title={lounge.city}>
              {lounge.code}
            </span>
            <div className="flex flex-col min-w-0 leading-none gap-1">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[110px] sm:max-w-[180px]">
                {lounge.city}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[110px] sm:max-w-[180px]">
                {lounge.terminal}
              </span>
            </div>
          </div>
          
          {/* Favorite & Alert Buttons */}
          <div className="flex items-center gap-2">
            {!loading && !error && statusData && (statusData.status !== "GREEN" || hasAlert) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAlert(lounge.slug, statusData.status);
                }}
                className={`flex items-center justify-center p-1.5 rounded-full border transition-all duration-200 focus:outline-none cursor-pointer hover:scale-110 ${
                  hasAlert
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/25 border-indigo-500/20 shadow-sm animate-bounce"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 border-zinc-200 dark:border-zinc-800"
                }`}
                title={
                  hasAlert
                    ? "Cancel Waitlist Alert"
                    : statusData.status === "CLOSED"
                    ? "Notify when Waitlist Opens"
                    : "Notify when Walk-in Ready (Line clears)"
                }
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onToggleFavorite(lounge.slug)}
              className="text-zinc-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-200 focus:outline-none cursor-pointer"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              {isFavorite ? (
                <svg className="h-5 w-5 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.837-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Lounge Name & Pinned Indicator */}
        <div className="mt-4 flex items-start gap-2 justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-200">
            {lounge.name}
          </h2>
          {isFavorite && (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
              Pinned
            </span>
          )}
        </div>
      </div>

      {/* Live Status & Estimated Wait times */}
      <div className="my-6">
        {loading ? (
          // Skeleton Pulse Loader
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
        ) : error ? (
          // Error/Offline State
          <div className="rounded-lg bg-red-955/20 border border-red-900/30 p-3 text-xs text-red-400">
            <p className="font-semibold">Live connection lost</p>
            <p className="opacity-80">Tap Walk Guide to view terminal information.</p>
          </div>
        ) : (
          // Loaded State
          <div className="space-y-4">
            {/* Status Banner */}
            <div className="flex items-center">
              {statusData.status === "GREEN" && (
                statusData.isOfflineFallback ? (
                  <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Open (Scheduled)
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Walk Right In
                  </div>
                )
              )}
              {statusData.status === "YELLOW" && (
                <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Line Active
                </div>
              )}
              {statusData.status === "CLOSED" && (
                <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/40 px-3 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>
                  Lounge Closed
                </div>
              )}
              {statusData.isOfflineFallback && (
                <span className="ml-2 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20" title={`Live queue tracker offline: ${statusData.offlineReason || 'Timeout'}`}>
                  ⚠️ Live Offline
                </span>
              )}
            </div>

            {/* Wait Details */}
            {statusData.status === "YELLOW" && (
              <div className={`grid grid-cols-2 gap-4 rounded-xl border p-3 text-center transition-colors duration-300 ${waitStyle.border} ${waitStyle.bg}`}>
                <div>
                  <span className={`block text-[11px] font-semibold uppercase tracking-wider ${waitStyle.label}`}>Est. Wait</span>
                  <span className={`text-lg font-extrabold ${waitStyle.text}`}>
                    {formatWaitTime(statusData.estimatedWaitMinutes)}
                  </span>
                </div>
                <div className={`border-l ${waitStyle.split}`}>
                  <span className={`block text-[11px] font-semibold uppercase tracking-wider ${waitStyle.label}`}>Queue Size</span>
                  <span className={`text-lg font-extrabold ${waitStyle.text}`}>
                    {statusData.partiesWaiting} {statusData.partiesWaiting === 1 ? "party" : "parties"}
                  </span>
                </div>
              </div>
            )}

            {statusData.status === "GREEN" && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {statusData.isOfflineFallback ? (
                  <>Lounge is within operational hours. <span className="font-semibold text-zinc-600 dark:text-zinc-300">Live queue size is unavailable.</span></>
                ) : (
                  <>Lounge is currently under capacity. <span className="font-semibold text-zinc-600 dark:text-zinc-300">No virtual waitlist active.</span></>
                )}
              </p>
            )}

            {statusData.status === "CLOSED" && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Currently outside operational hours or offline.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Action Button / Status Bar & Guide Trigger */}
      <div className="mt-auto space-y-3">
        <div>
          {loading ? (
            <div className="h-[44px] w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ) : error ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-center text-sm font-semibold text-red-500 dark:text-red-400">
              Status Offline
            </div>
          ) : statusData && statusData.status === "YELLOW" ? (
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-center text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:from-indigo-700 hover:to-blue-700 hover:shadow-indigo-700/35 active:scale-[0.98]"
            >
              Join Waitlist Remotely
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          ) : statusData && statusData.status === "GREEN" ? (
            statusData.isOfflineFallback ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400">
                Check-in at Lounge Desk
              </div>
            ) : (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-3 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Walk-in Directly (No Line)
              </div>
            )
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 py-3 text-center text-sm font-bold text-zinc-400 dark:text-zinc-500">
              Lounge Closed
            </div>
          )}
        </div>

        {/* Feature Highlight Badge Trigger */}
        <button
          onClick={() => onOpenDetails(lounge)}
          className="flex w-full items-center justify-between rounded-xl bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all active:scale-[0.98] shadow-sm hover:shadow"
        >
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            📍 Walk Guide & Menu
          </span>
          <span>View →</span>
        </button>
      </div>
    </div>
  );
}


// Airline typical gate mapping for simulation
const AIRLINE_GATES = {
  SFO: {
    UA: { name: "United Airlines", concourse: "F", baseGate: 12 },
    AA: { name: "American Airlines", concourse: "B", baseGate: 10 },
    DL: { name: "Delta Air Lines", concourse: "C", baseGate: 5 },
    AS: { name: "Alaska Airlines", concourse: "D", baseGate: 6 },
    WN: { name: "Southwest Airlines", concourse: "B", baseGate: 18 },
    B6: { name: "JetBlue", concourse: "B", baseGate: 8 },
    NK: { name: "Spirit Airlines", concourse: "B", baseGate: 14 },
    F9: { name: "Frontier Airlines", concourse: "B", baseGate: 16 }
  },
  ATL: {
    DL: { name: "Delta Air Lines", concourse: "A", baseGate: 18 },
    AA: { name: "American Airlines", concourse: "T", baseGate: 8 },
    UA: { name: "United Airlines", concourse: "T", baseGate: 4 },
    WN: { name: "Southwest Airlines", concourse: "C", baseGate: 12 },
    NK: { name: "Spirit Airlines", concourse: "D", baseGate: 10 },
    B6: { name: "JetBlue", concourse: "D", baseGate: 6 }
  },
  SEA: {
    AS: { name: "Alaska Airlines", concourse: "D", baseGate: 8 },
    DL: { name: "Delta Air Lines", concourse: "A", baseGate: 6 },
    UA: { name: "United Airlines", concourse: "A", baseGate: 12 },
    AA: { name: "American Airlines", concourse: "B", baseGate: 8 },
    WN: { name: "Southwest Airlines", concourse: "B", baseGate: 4 }
  },
  DEFAULT: {
    UA: { name: "United Airlines", concourse: "B", baseGate: 10 },
    AA: { name: "American Airlines", concourse: "A", baseGate: 8 },
    DL: { name: "Delta Air Lines", concourse: "B", baseGate: 4 },
    WN: { name: "Southwest Airlines", concourse: "A", baseGate: 6 },
    AS: { name: "Alaska Airlines", concourse: "B", baseGate: 12 }
  }
};

// Typical flight lookup/generator based on origin and destination
export function getTypicalFlightNumber(origin, dest) {
  const o = (origin || "").toUpperCase().trim();
  const d = (dest || "").toUpperCase().trim();
  if (o.length !== 3 || d.length !== 3) return "";

  const popular = {
    "SFO-ATL": "DL 105",
    "ATL-SFO": "DL 820",
    "ATL-BUF": "WN 123",
    "BUF-ATL": "WN 124",
    "SFO-BUF": "UA 2045",
    "BUF-SFO": "UA 2046",
    "SFO-SEA": "AS 342",
    "SEA-SFO": "AS 312",
    "SFO-LAS": "WN 850",
    "LAS-SFO": "UA 1920",
    "ATL-DFW": "DL 1184",
    "DFW-ATL": "AA 1624",
    "SEA-LAS": "AS 624",
    "LAS-SEA": "AS 625",
    "LAS-MCO": "WN 1420",
    "MCO-LAS": "WN 1421",
    "ATL-SEA": "DL 1205",
    "SEA-ATL": "DL 1206",
  };

  const key = `${o}-${d}`;
  if (popular[key]) return popular[key];

  let carrier = "UA";
  if (o === "ATL") carrier = "DL";
  else if (o === "SEA") carrier = "AS";
  else if (o === "DFW") carrier = "AA";
  else if (o === "LAS" || o === "MCO") carrier = "WN";
  else {
    const list = ["UA", "AA", "DL", "WN", "AS"];
    const idx = (o.charCodeAt(0) + o.charCodeAt(1) + o.charCodeAt(2)) % list.length;
    carrier = list[idx];
  }

  const seed = (o.charCodeAt(0) + o.charCodeAt(1) + o.charCodeAt(2) + d.charCodeAt(0) + d.charCodeAt(1) + d.charCodeAt(2));
  const num = (seed * 7) % 899 + 100;
  return `${carrier} ${num}`;
}

export function sortFlightsByTime(flights, date) {
  if (!flights || flights.length === 0) return [];
  
  const getMinutesSinceMidnight = (timeStr) => {
    if (!timeStr) return 0;
    const cleaned = timeStr.toUpperCase().replace(/\s+/g, "");
    const match = cleaned.match(/^(\d+):(\d+)(AM|PM)/);
    if (!match) return 0;
    let hr = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const ampm = match[3];
    
    if (ampm === "PM" && hr < 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;
    
    return hr * 60 + min;
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const isToday = date === todayStr;
  
  const mapped = flights.map(f => ({
    ...f,
    minutes: getMinutesSinceMidnight(f.departureTime)
  }));

  if (isToday) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const upcoming = mapped.filter(f => f.minutes >= currentMinutes);
    const departed = mapped.filter(f => f.minutes < currentMinutes);
    
    upcoming.sort((a, b) => a.minutes - b.minutes);
    departed.sort((a, b) => a.minutes - b.minutes);
    
    return [...upcoming, ...departed];
  } else {
    return [...mapped].sort((a, b) => a.minutes - b.minutes);
  }
}

// Main walk estimation engine
export function estimateWalkTime(airportCode, loungeSlug, loungeTerminal, userGateInput) {
  if (!userGateInput) return null;

  // 1. Parse Gate (extract Letter Prefix and Digits, e.g. Gate B12 -> concourse B, gateNum 12)
  const cleaned = userGateInput.toUpperCase().trim().replace(/GATE/g, "").replace(/\s+/g, "");
  const gateMatch = cleaned.match(/^([A-Z]*)(?:-)?(\d+)$/);
  
  let userConcourse = "";
  let userGateNum = 1;
  
  if (gateMatch) {
    userConcourse = gateMatch[1] || "";
    userGateNum = parseInt(gateMatch[2], 10);
  } else {
    // Fallback if formatting is weird
    const firstDigitIndex = cleaned.search(/\d/);
    if (firstDigitIndex !== -1) {
      userConcourse = cleaned.substring(0, firstDigitIndex);
      userGateNum = parseInt(cleaned.substring(firstDigitIndex), 10) || 1;
    } else {
      userConcourse = cleaned;
      userGateNum = 1;
    }
  }

  // If concourse is empty, try to assign a default
  if (!userConcourse && userGateNum) {
    userConcourse = "A"; // default fallback
  }

  let walkTimeMinutes = 5;
  let distanceFeet = 1250;
  let instructions = "Walk airside to the lounge.";
  let exitsSecurity = false;
  let transitSuggestion = "";

  // 2. Airport-specific Walk Calculations
  if (airportCode === "SFO") {
    // Lounge is in T1 near Gate B4 (Harvey Milk Terminal 1, Concourse B)
    if (userConcourse === "B") {
      const diff = Math.abs(userGateNum - 4);
      distanceFeet = diff * 80 + 200;
      walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
      instructions = `Lounge is in your terminal. Walk airside toward Gate B4. Lounge is located near Gate B4 on the mezzanine level.`;
    } else if (userConcourse === "A") {
      distanceFeet = 1200;
      walkTimeMinutes = 5;
      instructions = "Walk airside from International Terminal A to Terminal 1 near Gate B4 (connected post-security).";
    } else if (userConcourse === "C" || userConcourse === "D") {
      distanceFeet = 2500;
      walkTimeMinutes = 10;
      instructions = "Walk airside from Terminal 2 to Terminal 1 near Gate B4 via the post-security connector.";
      transitSuggestion = "🚶 Stay Airside: Walk via the post-security connector hallways connecting Terminals 2 and 1. Follow signs for Terminal 1.";
    } else if (userConcourse === "E" || userConcourse === "F" || userConcourse === "G") {
      distanceFeet = 3800;
      walkTimeMinutes = 15;
      instructions = "Walk airside from Terminal 3 / International G to Terminal 1 near Gate B4 via the post-security connector. Note: It's a long walk, but fully connected airside.";
      transitSuggestion = "🚶 Stay Airside: Walk via the post-security connector. If you prefer not to walk, you can exit security, take the SFO AirTrain (Red or Blue line) to Harvey Milk Terminal 1, and re-clear security.";
    } else {
      walkTimeMinutes = 12;
      distanceFeet = 3000;
      instructions = "Head to Harvey Milk Terminal 1 and look for signs to Gate B4. Lounge is on the mezzanine level.";
    }
  } 
  else if (airportCode === "ATL") {
    // Lounge is in Concourse F next to Gate F3
    const stations = { "F": 0, "E": 1, "D": 2, "C": 3, "B": 4, "A": 5, "T": 6 };
    const userConcourseChar = userConcourse.substring(0, 1).toUpperCase();
    const userStationVal = stations[userConcourseChar] !== undefined ? stations[userConcourseChar] : 3;
    
    if (userConcourseChar === "F") {
      const diff = Math.abs(userGateNum - 3);
      distanceFeet = diff * 60 + 150;
      walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
      instructions = "Lounge is in your concourse. Take the escalator to the Mezzanine level next to Gate F3.";
    } else {
      // Must take Plane Train
      walkTimeMinutes = userStationVal * 2 + 4; // 2 mins per station + 4 mins walk/escalator time
      distanceFeet = userStationVal * 1200 + 400;
      instructions = `Head to the center point of Concourse ${userConcourseChar}, take the Plane Train to Concourse F, and go up to the Mezzanine level.`;
      transitSuggestion = `🚆 ATL Plane Train: Take the post-security Plane Train (runs every 2 minutes) from Concourse ${userConcourseChar} to Concourse F. Exit at Concourse F and follow signs to Gate F3.`;
    }
  }
  else if (airportCode === "SEA") {
    // Lounges: A11 (A Concourse) or S9 (South Satellite)
    const isLoungeA = loungeSlug.includes("sea-a");
    const userConcourseChar = userConcourse.substring(0, 1).toUpperCase();
    
    if (isLoungeA) {
      if (userConcourseChar === "A") {
        const diff = Math.abs(userGateNum - 11);
        distanceFeet = diff * 70 + 200;
        walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
        instructions = "Lounge is in your concourse. Walk opposite Gate A11.";
      } else if (userConcourseChar === "B") {
        distanceFeet = 1500;
        walkTimeMinutes = 6;
        instructions = "Walk airside to Concourse A and locate the lounge opposite Gate A11.";
      } else if (userConcourseChar === "C") {
        distanceFeet = 2200;
        walkTimeMinutes = 9;
        instructions = "Walk airside to Concourse A and locate the lounge opposite Gate A11.";
      } else if (userConcourseChar === "D") {
        distanceFeet = 2800;
        walkTimeMinutes = 11;
        instructions = "Walk airside to Concourse A and locate the lounge opposite Gate A11.";
      } else if (userConcourseChar === "S") {
        distanceFeet = 2000;
        walkTimeMinutes = 8;
        instructions = "Take the South Satellite Train (STS) to Concourse A, and walk opposite Gate A11.";
        transitSuggestion = "🚆 SEA STS Tram: Take the South Satellite loop train (STS) directly to Concourse A. The station is located near Gate A9.";
      } else if (userConcourseChar === "N") {
        distanceFeet = 3500;
        walkTimeMinutes = 14;
        instructions = "Take the North Satellite Train (STS) to Concourse D, walk to Concourse A, and walk opposite Gate A11.";
        transitSuggestion = "🚆 SEA STS Tram: Take the North Satellite loop train (STS) to Concourse D, walk to Concourse A, and find the lounge opposite Gate A11.";
      }
    } else {
      // Concourse S, Gate S9
      if (userConcourseChar === "S") {
        const diff = Math.abs(userGateNum - 9);
        distanceFeet = diff * 70 + 150;
        walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
        instructions = "Lounge is in your satellite terminal. Go up to the Mezzanine level near Gate S9.";
      } else if (userConcourseChar === "A") {
        distanceFeet = 2000;
        walkTimeMinutes = 8;
        instructions = "Walk to the Concourse A train station, take the STS train to South Satellite (Concourse S), and go to the mezzanine level.";
        transitSuggestion = "🚆 SEA STS Tram: Go to the Concourse A train station (near Gate A9) and take the South Satellite train (STS) to Concourse S.";
      } else {
        distanceFeet = 3200;
        walkTimeMinutes = 12;
        instructions = "Walk to Concourse A, take the STS train to South Satellite (Concourse S), and head to the mezzanine level near Gate S9.";
        transitSuggestion = "🚆 SEA STS Tram: Walk airside to Concourse A and take the South Satellite train (STS) from the station near Gate A9 to Concourse S.";
      }
    }
  }
  else if (airportCode === "LAS") {
    // Lounges: D33 (Terminal 1 - D Gates) or E2 (Terminal 3 - E Gates)
    const isLoungeD = loungeSlug.includes("las-t1");
    const userConcourseChar = userConcourse.substring(0, 1).toUpperCase();
    
    if (isLoungeD) {
      if (userConcourseChar === "D") {
        const diff = Math.abs(userGateNum - 33);
        distanceFeet = diff * 70 + 200;
        walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
        instructions = "Lounge is in your concourse. Take the elevator/escalator to the upper level near Gate D33.";
      } else if (userConcourseChar === "A" || userConcourseChar === "B" || userConcourseChar === "C") {
        distanceFeet = 2000;
        walkTimeMinutes = 8;
        instructions = "Take the Terminal 1 tram to D Gates, and take the escalator to the upper level near Gate D33.";
        transitSuggestion = `🚊 T1 Gate Tram: Take the Terminal 1 Blue Line tram from Concourse ${userConcourseChar} to D Gates. Escalators to the tram are well-marked.`;
      } else if (userConcourseChar === "E") {
        distanceFeet = 4500;
        walkTimeMinutes = 25;
        exitsSecurity = true;
        instructions = "⚠️ Terminal change requires exiting security! Take the inter-terminal shuttle bus from Terminal 3 to Terminal 1, clear security at the D Gates checkpoint, and take the escalator to the upper level.";
        transitSuggestion = "🚍 Inter-Terminal Shuttle: Exit Terminal 3, take the free landside Inter-Terminal Shuttle Bus (runs every 12-15 minutes) to Terminal 1, clear security at the D Gates checkpoint, and take the tram/escalator to D33.";
      }
    } else {
      // Terminal 3 - E Gates (Gate E2)
      if (userConcourseChar === "E") {
        const diff = Math.abs(userGateNum - 2);
        distanceFeet = diff * 80 + 150;
        walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
        instructions = "Lounge is in Terminal 3. Walk airside to Gate E2.";
      } else {
        // From D or A/B/C
        distanceFeet = 4500;
        walkTimeMinutes = 25;
        exitsSecurity = true;
        instructions = "⚠️ Terminal change requires exiting security! Take the shuttle bus or landside tram to Terminal 3, clear security at the Terminal 3 checkpoint, and walk to Gate E2.";
        transitSuggestion = "🚍 Inter-Terminal Shuttle: Exit Terminal 1, take the free landside Inter-Terminal Shuttle Bus to Terminal 3, clear security at the Terminal 3 checkpoint, and walk to Gate E2.";
      }
    }
  }
  else if (airportCode === "MCO") {
    // MCO Gates: A (1-29, 100-129) and B (30-59, 60-99).
    // Lounges: A1 (Gates 1-29 near Gate 29) or A4 (Concourse 4 near Gate 91)
    const isLoungeA1 = loungeSlug.includes("mco-a1"); // Gates 1-29
    const userConcourseChar = userConcourse.substring(0, 1).toUpperCase();
    
    if (isLoungeA1) {
      const isUserInGates1To29 = userConcourseChar === "A" && userGateNum <= 29;
      if (isUserInGates1To29) {
        const diff = Math.abs(userGateNum - 29);
        distanceFeet = diff * 60 + 150;
        walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
        instructions = "Lounge is in your concourse pod. Walk near Gate 29.";
      } else {
        distanceFeet = 4000;
        walkTimeMinutes = 20;
        exitsSecurity = true;
        instructions = "⚠️ Concourse pods are separate! Exit security, cross the main terminal, clear security at Gates 1-29, and take the tram to the lounge near Gate 29.";
        transitSuggestion = "🚊 Airside Tram & Landside Walk: Take the automated tram from your current gates back to the Main Terminal, exit security, walk across the Central Landside Terminal to the Gates 1-29 checkpoint, re-clear security, and take the tram to Gate 29.";
      }
    } else {
      // Concourse 4 (Gates 70-99, near Gate 91)
      const isUserInConcourse4 = (userConcourseChar === "B" && userGateNum >= 70 && userGateNum <= 99) || (userConcourseChar === "B" && userGateNum >= 90);
      if (isUserInConcourse4) {
        const diff = Math.abs(userGateNum - 91);
        distanceFeet = diff * 60 + 150;
        walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
        instructions = "Lounge is in your concourse pod. Walk near Gate 91.";
      } else {
        distanceFeet = 4000;
        walkTimeMinutes = 20;
        exitsSecurity = true;
        instructions = "⚠️ Concourse pods are separate! Exit security, cross the main terminal, clear security at Gates 70-99, and take the tram to Concourse 4 near Gate 91.";
        transitSuggestion = "🚊 Airside Tram & Landside Walk: Take the automated tram back to the Main Terminal, exit security, walk across the Central Landside Terminal to the Gates 70-99 checkpoint, re-clear security, and take the tram to Concourse 4 near Gate 91.";
      }
    }
  }
  else if (airportCode === "DFW") {
    const userConcourseChar = userConcourse.substring(0, 1).toUpperCase();
    if (userConcourseChar === "D") {
      const diff = Math.abs(userGateNum - 27);
      distanceFeet = diff * 70 + 200;
      walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
      instructions = "Lounge is in Terminal D. Walk airside to Gate D27.";
    } else {
      // Must take Skylink
      walkTimeMinutes = 8;
      distanceFeet = 2000;
      instructions = `Take the post-security Skylink train to Terminal D, and walk to Gate D27.`;
      transitSuggestion = `🚆 DFW Skylink: Take the post-security high-speed Skylink train (runs every 2 minutes) from Terminal ${userConcourseChar} to Terminal D. Stations are located near Gates ${userConcourseChar === 'A' ? 'A13/A16' : userConcourseChar === 'B' ? 'B9/B12' : userConcourseChar === 'C' ? 'C18/C22' : 'E13/E14'}. Exit at the Terminal D station (near Gate D24/D36) and walk to Gate D27.`;
    }
  }
  else {
    // Default generic calculation (e.g. SJC, BOS, MSY, etc.)
    const userConcourseChar = userConcourse.substring(0, 1).toUpperCase();
    if (userConcourseChar === loungeTerminal.replace(/\s+/g, "").substring(0, 1).toUpperCase()) {
      const diff = Math.abs(userGateNum - 10); // Assume average location gate 10
      distanceFeet = diff * 70 + 200;
      walkTimeMinutes = Math.max(1, Math.round(distanceFeet / 250));
      instructions = `Walk airside to the lounge near the center of Concourse ${userConcourseChar}.`;
    } else {
      distanceFeet = 2000;
      walkTimeMinutes = 8;
      instructions = "Walk airside to the other concourse/terminal and follow overhead signs to the lounge.";
      if (distanceFeet > 1500) {
        transitSuggestion = "🚶 Long Distance: Walk via the airside corridors or terminal walkways. Look for moving sidewalks or airport terminal shuttle buses connecting terminals.";
      }
    }
  }

  return {
    walkTime: walkTimeMinutes,
    distanceFeet: distanceFeet,
    instructions: instructions,
    exitsSecurity: exitsSecurity,
    transitSuggestion: transitSuggestion
  };
}

// Simulated flight info resolver
export function resolveFlightGate(airportCode, flightNumberInput) {
  if (!flightNumberInput) return null;
  
  const cleaned = flightNumberInput.toUpperCase().trim().replace(/\s+/g, "");
  const match = cleaned.match(/^([A-Z]{2}|\d[A-Z]|[A-Z]\d)(\d+)$/);
  
  if (!match) return null;
  
  const airline = match[1];
  const flightNum = parseInt(match[2], 10);
  
  const airportConfig = AIRLINE_GATES[airportCode] || AIRLINE_GATES["DEFAULT"];
  const airlineInfo = airportConfig[airline] || AIRLINE_GATES["DEFAULT"][airline];
  
  if (!airlineInfo) {
    // Generate a default mock airline if not recognized (e.g. UA, AA, DL fallbacks)
    const mockAirlines = ["UA", "AA", "DL", "WN"];
    const chosenCode = mockAirlines[flightNum % mockAirlines.length];
    const resolved = (AIRLINE_GATES[airportCode] || AIRLINE_GATES["DEFAULT"])[chosenCode];
    
    // Seed gate number
    const gateNum = (flightNum % 22) + 1;
    return {
      airlineName: "Partner Airline",
      concourse: resolved.concourse,
      gate: `${resolved.concourse}${gateNum}`
    };
  }
  
  // Seed gate number based on baseGate
  const variance = (flightNum % 14) - 7; // -7 to +6
  const gateNum = Math.max(1, airlineInfo.baseGate + variance);
  return {
    airlineName: airlineInfo.name,
    concourse: airlineInfo.concourse,
    gate: `${airlineInfo.concourse}${gateNum}`
  };
}

// Custom Slide-out Side Drawer (desktop) & Swipe-up Bottom Sheet (mobile) component
function LoungeDetailsDrawer({ lounge, isOpen, onClose, loungeAlerts = {}, setLoungeAlerts }) {
  const [renderedLounge, setRenderedLounge] = useState(lounge);
  const [activeTab, setActiveTab] = useState("menu");
  const [gateInput, setGateInput] = useState("");
  const [flightInput, setFlightInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [flightDate, setFlightDate] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const [walkResult, setWalkResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [availableWalkFlights, setAvailableWalkFlights] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }
    return "denied";
  };

  const currentAlerts = renderedLounge ? (loungeAlerts[renderedLounge.slug] || {
    walkInReady: false,
    lineActive: false,
    waitTimeUnder: 0
  }) : { walkInReady: false, lineActive: false, waitTimeUnder: 0 };

  const handleToggleAlert = async (type, value) => {
    if (!renderedLounge) return;
    let perm = notificationPermission;
    if (perm !== "granted") {
      perm = await requestNotificationPermission();
    }

    if (perm !== "granted") {
      return;
    }

    const updatedAlerts = { ...currentAlerts };
    if (type === "walkInReady") {
      updatedAlerts.walkInReady = value;
    } else if (type === "lineActive") {
      updatedAlerts.lineActive = value;
    } else if (type === "waitTimeUnder") {
      updatedAlerts.waitTimeUnder = value;
    }

    const hasAny = updatedAlerts.walkInReady || updatedAlerts.lineActive || updatedAlerts.waitTimeUnder > 0;
    const nextLoungeAlerts = { ...loungeAlerts };
    if (hasAny) {
      nextLoungeAlerts[renderedLounge.slug] = updatedAlerts;
    } else {
      delete nextLoungeAlerts[renderedLounge.slug];
    }

    setLoungeAlerts(nextLoungeAlerts);
    localStorage.setItem("pp_lounge_alerts", JSON.stringify(nextLoungeAlerts));
  };

  // Sync rendered lounge when prop updates (avoids empty flash when drawer is closing)
  useEffect(() => {
    if (lounge) {
      setRenderedLounge(lounge);
    }
  }, [lounge]);

  // Reset inputs when selected lounge changes
  useEffect(() => {
    if (lounge) {
      setGateInput("");
      setFlightInput("");
      setDestInput("");
      setAvailableWalkFlights([]);
      setWalkResult(null);
      setCalcError("");
      setActiveTab("menu");
    }
  }, [lounge?.slug]);

  // Fetch real available flights inside Walk Guide drawer when destination is entered
  useEffect(() => {
    const cleanDest = destInput.trim().toUpperCase();
    if (cleanDest.length === 3 && renderedLounge?.code) {
      fetch(`/api/flight?action=search&airportCode=${renderedLounge.code}&destination=${cleanDest}&date=${flightDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.flights && data.flights.length > 0) {
            const sorted = sortFlightsByTime(data.flights, flightDate);
            setAvailableWalkFlights(sorted);
            // Auto-select first flight (upcoming first)
            if (!flightInput) {
              setFlightInput(sorted[0].flightNumber);
            }
          } else {
            setAvailableWalkFlights([]);
          }
        })
        .catch(err => {
          console.error("Error fetching walk flights:", err);
          setAvailableWalkFlights([]);
        });
    } else {
      setAvailableWalkFlights([]);
    }
  }, [destInput, renderedLounge?.code, flightDate]);

  // Disable body scroll behind drawer when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!renderedLounge) return null;

  const handleCalculateWalk = () => {
    setCalcError("");
    setWalkResult(null);

    let activeFlight = flightInput;
    if (!activeFlight && destInput.trim().length === 3 && renderedLounge?.code) {
      activeFlight = getTypicalFlightNumber(renderedLounge.code, destInput);
      setFlightInput(activeFlight);
    }

    if (activeFlight) {
      setCalculating(true);
      
      const cleaned = activeFlight.toUpperCase().trim().replace(/\s+/g, "");
      const match = cleaned.match(/^([A-Z]{2}|\d[A-Z]|[A-Z]\d)(\d+)$/);
      
      if (!match) {
        setCalcError("Invalid flight format. Try UA 105 or AA 22.");
        setCalculating(false);
        return;
      }
      
      const carrier = match[1];
      const flightNumber = match[2];
      
      fetch(`/api/flight?carrier=${carrier}&flightNumber=${flightNumber}&date=${flightDate}&airportCode=${renderedLounge.code}&destination=${destInput}`)
        .then((res) => {
          if (!res.ok) throw new Error("Connection failed");
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            setCalcError(data.error);
          } else {
            const resolvedGate = data.gate;
            const resolvedTerminal = data.terminal;
            
            // Auto-populate the resolved flight number in the text inputs for visual feedback
            if (data.carrier && data.flightNumber && (destInput || !flightInput)) {
              setFlightInput(`${data.carrier}${data.flightNumber}`);
            }

            if (resolvedGate && resolvedGate !== "TBD") {
              const walk = estimateWalkTime(renderedLounge.code, renderedLounge.slug, renderedLounge.terminal, resolvedGate);
              setWalkResult({
                ...walk,
                resolvedGate,
                resolvedTerminal,
                airlineName: data.airlineName,
                carrier: data.carrier,
                flightNumber: data.flightNumber,
                status: data.status,
                scheduledTime: data.scheduledTime,
                route: data.route,
                isFallback: data.isFallback
              });
            } else {
              // Terminal fallback
              const fallbackGateInput = resolvedTerminal || carrier;
              const walk = estimateWalkTime(renderedLounge.code, renderedLounge.slug, renderedLounge.terminal, fallbackGateInput);
              setWalkResult({
                ...walk,
                resolvedGate: "TBD",
                resolvedTerminal: resolvedTerminal || "N/A",
                airlineName: data.airlineName,
                carrier: data.carrier,
                flightNumber: data.flightNumber,
                status: data.status,
                scheduledTime: data.scheduledTime,
                route: data.route,
                isFallback: data.isFallback,
                gateTbd: true
              });
            }
          }
        })
        .catch((err) => {
          console.error("Flight API check failed:", err);
          const resolved = resolveFlightGate(renderedLounge.code, flightInput);
          if (resolved) {
            const walk = estimateWalkTime(renderedLounge.code, renderedLounge.slug, renderedLounge.terminal, resolved.gate);
            setWalkResult({
              ...walk,
              resolvedGate: resolved.gate,
              airlineName: resolved.airlineName,
              isFallback: true,
              status: "Offline Fallback"
            });
          } else {
            setCalcError("Could not check flight status. Try entering gate directly.");
          }
        })
        .finally(() => {
          setCalculating(false);
        });
    } else if (gateInput) {
      const walk = estimateWalkTime(renderedLounge.code, renderedLounge.slug, renderedLounge.terminal, gateInput);
      if (walk) {
        setWalkResult(walk);
      } else {
        setCalcError("Please enter a valid gate (e.g. B12).");
      }
    } else {
      setCalcError("Please enter a gate or flight number.");
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div 
        className={`relative flex flex-col w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl transition-transform duration-300 ease-out
          md:w-[460px] md:h-full md:border-t-0 md:border-l
          ${isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full"}
          h-[80vh] bottom-0 md:bottom-auto rounded-t-3xl md:rounded-t-none md:rounded-l-3xl`}
      >
        {/* Mobile Drag Indicator / Close Helper */}
        <div className="flex justify-center py-3 md:hidden">
          <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" onClick={onClose} />
        </div>

        {/* Content Header */}
        <div className="px-6 pb-4 pt-2 md:pt-6 border-b border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg px-2 py-0.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700/50">
                {renderedLounge.code}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {renderedLounge.city} • {renderedLounge.terminal}
              </span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
              {renderedLounge.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Details Bar */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80">
            <div>
              <span className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">Hours (Local)</span>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{renderedLounge.open_time} - {renderedLounge.close_time}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">Access Info</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">Priority Pass (Airside)</span>
            </div>
          </div>

          {/* Live Alerts Manager Widget */}
          <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/5 dark:border-indigo-500/20 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span>🔔</span> Live Waitlist Alerts
              </h4>
              {Object.keys(currentAlerts).some(k => currentAlerts[k]) && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              )}
            </div>

            {notificationPermission === "denied" ? (
              <div className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 leading-normal">
                ⚠️ <strong>Notifications blocked:</strong> Please reset/enable desktop notifications in your browser's site settings to receive live waitlist alerts.
              </div>
            ) : notificationPermission !== "granted" ? (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
                  Get notified instantly when the waitlist conditions change. Keep this tab open to allow the background tracking system to trigger alerts.
                </p>
                <button
                  onClick={requestNotificationPermission}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-xs font-extrabold shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Enable Desktop Notifications
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 leading-normal">
                  Select events to monitor. We'll fire a push notification as soon as wait times change.
                </p>

                {/* Option 1: Walk-in Ready */}
                <label className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors duration-150">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notify when Walk-in Ready</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Alerts when line clears (Line is Green)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentAlerts.walkInReady}
                    onChange={(e) => handleToggleAlert("walkInReady", e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800 cursor-pointer"
                  />
                </label>

                {/* Option 2: Line Active */}
                <label className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors duration-150">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notify when Waitlist Opens</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Alerts when line opens (Line is Yellow)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentAlerts.lineActive}
                    onChange={(e) => handleToggleAlert("lineActive", e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800 cursor-pointer"
                  />
                </label>

                {/* Option 3: Wait time drops below */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-900/50 transition-colors duration-150">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notify when wait time is under</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Set maximum acceptable wait threshold</span>
                  </div>
                  <select
                    value={currentAlerts.waitTimeUnder}
                    onChange={(e) => handleToggleAlert("waitTimeUnder", parseInt(e.target.value, 10))}
                    className="text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 p-1.5 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>Disabled</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tab Headers */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("menu")}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === "menu"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200"
              }`}
            >
              🍴 Menu
            </button>
            <button
              onClick={() => setActiveTab("amenities")}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === "amenities"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200"
              }`}
            >
              ✨ Amenities
            </button>
            <button
              onClick={() => setActiveTab("walking")}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                activeTab === "walking"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200"
              }`}
            >
              🚶 Walk Guide
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mb-2">
                  📍 Directions & Location
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/40">
                  {renderedLounge.directions || "Follow signs inside secure area."}
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mb-2">
                  ✨ Complimentary Menu Items
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/40">
                  {renderedLounge.menu_highlights && renderedLounge.menu_highlights.length > 0 && (
                    <ul className="space-y-3">
                      {renderedLounge.menu_highlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                          <span className="text-indigo-500 dark:text-indigo-400 mt-1 shrink-0">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "amenities" && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mb-2">
                ✨ Lounge Amenities & Facilities
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                {/* WiFi */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📶</span>
                    <div>
                      <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">High-Speed Wi-Fi</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">Complimentary fast connection</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Free</span>
                </div>

                {/* Food & Drinks */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🍲</span>
                    <div>
                      <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {renderedLounge.amenities?.food_drinks === "hot-buffet" ? "Hot Buffet & Bar" : "Snacks & Full Bar"}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {renderedLounge.amenities?.food_drinks === "hot-buffet" ? "Complimentary hot dishes & premium alcohol" : "Complimentary cold foods, sweets & bar"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Included</span>
                </div>

                {/* Showers */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  renderedLounge.amenities?.showers === "yes" 
                    ? "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/80" 
                    : renderedLounge.amenities?.showers === "premium" 
                    ? "bg-zinc-50 dark:bg-zinc-900/30 border-amber-500/20 dark:border-amber-500/10" 
                    : "opacity-60 bg-zinc-100/50 dark:bg-zinc-900/10 border-dashed border-zinc-200 dark:border-zinc-800/40"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚿</span>
                    <div>
                      <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">Spa-Style Showers</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {renderedLounge.amenities?.showers === "yes" 
                          ? "Shower suites available for guests" 
                          : renderedLounge.amenities?.showers === "premium" 
                          ? "Spa-style shower facilities available ($25 Fee)" 
                          : "No shower suites in this location"}
                      </span>
                    </div>
                  </div>
                  {renderedLounge.amenities?.showers === "yes" && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Free</span>
                  )}
                  {renderedLounge.amenities?.showers === "premium" && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">$25 Fee</span>
                  )}
                  {renderedLounge.amenities?.showers === "no" && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500">N/A</span>
                  )}
                </div>

                {/* Kids Play Area */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  renderedLounge.amenities?.kids_play_area 
                    ? "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/80" 
                    : "opacity-60 bg-zinc-100/50 dark:bg-zinc-900/10 border-dashed border-zinc-200 dark:border-zinc-800/40"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👶</span>
                    <div>
                      <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">Kids Play Area</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {renderedLounge.amenities?.kids_play_area ? "Forest-themed play room for children" : "No kids playroom available"}
                      </span>
                    </div>
                  </div>
                  {renderedLounge.amenities?.kids_play_area ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Yes</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500">No</span>
                  )}
                </div>

                {/* Meeting Rooms & Workspaces */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  renderedLounge.amenities?.meeting_rooms 
                    ? "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200/60 dark:border-zinc-800/80" 
                    : "opacity-60 bg-zinc-100/50 dark:bg-zinc-900/10 border-dashed border-zinc-200 dark:border-zinc-800/40"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💻</span>
                    <div>
                      <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">Workspaces & Meeting Rooms</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {renderedLounge.amenities?.meeting_rooms ? "Meeting spaces & desk pods with power" : "Semi-private seating, no dedicated desks"}
                      </span>
                    </div>
                  </div>
                  {renderedLounge.amenities?.meeting_rooms ? (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Yes</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-850 text-zinc-450 dark:text-zinc-500">No</span>
                  )}
                </div>

                {/* Runway Views */}
                {renderedLounge.amenities?.runway_views && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">✈️</span>
                      <div>
                        <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">Runway Views</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Floor-to-ceiling windows with aircraft sights</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Premium View</span>
                  </div>
                )}

                {/* Seat Drink Ordering */}
                {renderedLounge.amenities?.seat_ordering && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/80">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📱</span>
                      <div>
                        <span className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">In-Seat Ordering</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Scan QR to order cocktails directly to your seat</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Yes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "walking" && (
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/40 space-y-4">
                <p className="text-xs text-zinc-500 leading-normal">
                  Calculate walking distance from your specific gate to this lounge. Enter a gate letter/number directly, or query your flight number to retrieve live gates.
                </p>

                {/* Staggered Vertically on Mobile / Side-by-Side on Desktop */}
                <div className="space-y-4">
                  {/* Gate Input */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                      Target Gate
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                        📍
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. B12"
                        value={gateInput}
                        disabled={flightInput.length > 0}
                        onChange={(e) => setGateInput(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 pl-9 text-sm text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Visual Divider */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 flex-1" />
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0">OR</span>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 flex-1" />
                  </div>

                  {/* Flight, Destination, & Date inputs stack vertically on Mobile */}
                  <div className="flex flex-col gap-4">
                    {/* Destination Lookup */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Destination Airport (Optional Lookup)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                          🛫
                        </span>
                        <input
                          type="text"
                          maxLength={3}
                          placeholder="e.g. ATL"
                          value={destInput}
                          disabled={gateInput.length > 0}
                          onChange={(e) => setDestInput(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 pl-9 text-sm text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-bold disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Flight Number
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                          ✈️
                        </span>
                        {availableWalkFlights.length > 0 ? (
                          <select
                            value={flightInput}
                            disabled={gateInput.length > 0}
                            onChange={(e) => setFlightInput(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 pl-9 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 font-semibold"
                          >
                            <option value="">-- Select Flight --</option>
                            {availableWalkFlights.map((f) => (
                              <option key={f.flightNumber} value={f.flightNumber}>
                                {f.airlineName} {f.flightNumber} ({f.departureTime})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. UA 105"
                            value={flightInput}
                            disabled={gateInput.length > 0}
                            onChange={(e) => setFlightInput(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 pl-9 text-sm text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className={gateInput.length > 0 ? "opacity-55" : ""}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={flightDate}
                        disabled={gateInput.length > 0}
                        onChange={(e) => setFlightDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculator buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCalculateWalk}
                    disabled={calculating || (!gateInput && !flightInput && !destInput)}
                    className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 py-3 text-center text-sm font-bold text-white shadow transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]"
                  >
                    {calculating ? "Checking flight info..." : "Calculate Walk"}
                  </button>
                  {(gateInput || flightInput || destInput) && (
                    <button
                      onClick={() => { setGateInput(""); setFlightInput(""); setDestInput(""); setWalkResult(null); setCalcError(""); }}
                      className="px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-bold bg-white dark:bg-zinc-900 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {calcError && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-semibold bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                    ⚠️ {calcError}
                  </p>
                )}
              </div>

              {/* Dynamic walk calculation reports */}
              {walkResult && !calculating && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 space-y-4">
                  {walkResult.airlineName && (
                    <div className="flex flex-col gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>Flight Details</span>
                        {walkResult.isFallback && (
                          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Typical Assignment
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        <span>{walkResult.airlineName} {(walkResult.carrier && walkResult.flightNumber) ? `${walkResult.carrier}${walkResult.flightNumber}` : flightInput.toUpperCase().replace(/\s+/g, "")}</span>
                        <span className="text-zinc-400 dark:text-zinc-500">•</span>
                        <span className="text-indigo-600 dark:text-indigo-400">Gate {walkResult.resolvedGate}</span>
                        {walkResult.resolvedTerminal && walkResult.resolvedTerminal !== "N/A" && (
                          <>
                            <span className="text-zinc-400 dark:text-zinc-500">•</span>
                            <span>{walkResult.resolvedTerminal}</span>
                          </>
                        )}
                      </div>
                      {(walkResult.status || walkResult.scheduledTime) && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {walkResult.route && <span>{walkResult.route}</span>}
                          {walkResult.scheduledTime && walkResult.scheduledTime !== "N/A" && (
                            <>
                              <span>•</span>
                              <span>Departs: {walkResult.scheduledTime}</span>
                            </>
                          )}
                          {walkResult.status && (
                            <>
                              <span>•</span>
                              <span className={`font-semibold ${walkResult.status.toLowerCase().includes('cancel') ? 'text-red-500' : 'text-emerald-500'}`}>{walkResult.status}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calculations details */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 shrink-0 min-w-[70px] shadow-sm">
                      <span className={`text-2xl font-extrabold leading-none ${walkResult.exitsSecurity ? 'text-red-500 dark:text-red-400' : walkResult.walkTime > 12 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {walkResult.walkTime}m
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5">Walk Time</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-bold text-zinc-705 dark:text-zinc-300">
                          {walkResult.distanceFeet.toLocaleString()} ft (~{(walkResult.distanceFeet * 0.3048).toFixed(0)}m)
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {walkResult.instructions}
                      </p>
                    </div>
                  </div>

                  {/* Alternate transport suggestions */}
                  {walkResult.transitSuggestion && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 p-3.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                        <span>🚊 Terminal Transit Guide</span>
                      </div>
                      <span>{walkResult.transitSuggestion}</span>
                    </div>
                  )}

                  {/* Security border crossings warning */}
                  {walkResult.exitsSecurity && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500 dark:text-red-400 leading-normal font-medium">
                      <span className="shrink-0 font-bold uppercase">Warning:</span>
                      <span>This path exits the secure airport layout. You must clear security again to access your departures gate. Allow an additional 20-30 minutes.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


function LoungeInsightsDashboard() {
  const busiestAirportsData = [
    { code: "ATL", name: "Hartsfield-Jackson Atlanta", peakWait: 55, avgWait: 32, loungeCount: 1, popularity: 98, color: "from-rose-500 to-red-650" },
    { code: "SFO", name: "San Francisco International", peakWait: 45, avgWait: 26, loungeCount: 1, popularity: 92, color: "from-orange-500 to-amber-650" },
    { code: "DFW", name: "Dallas-Fort Worth International", peakWait: 40, avgWait: 22, loungeCount: 1, popularity: 87, color: "from-amber-500 to-yellow-650" },
    { code: "LAS", name: "Harry Reid International", peakWait: 35, avgWait: 18, loungeCount: 2, popularity: 85, color: "from-yellow-500 to-lime-650" },
    { code: "SEA", name: "Seattle-Tacoma International", peakWait: 30, avgWait: 15, loungeCount: 2, popularity: 78, color: "from-indigo-500 to-blue-650" },
  ];

  const hourlyCrowdData = [
    { hour: "5 AM", wait: 5, density: "Low" },
    { hour: "6 AM", wait: 12, density: "Moderate" },
    { hour: "7 AM", wait: 28, density: "High" },
    { hour: "8 AM", wait: 45, density: "Peak" },
    { hour: "9 AM", wait: 40, density: "Peak" },
    { hour: "10 AM", wait: 25, density: "High" },
    { hour: "11 AM", wait: 15, density: "Moderate" },
    { hour: "12 PM", wait: 18, density: "Moderate" },
    { hour: "1 PM", wait: 10, density: "Low" },
    { hour: "2 PM", wait: 8, density: "Low" },
    { hour: "3 PM", wait: 15, density: "Moderate" },
    { hour: "4 PM", wait: 25, density: "High" },
    { hour: "5 PM", wait: 38, density: "Peak" },
    { hour: "6 PM", wait: 42, density: "Peak" },
    { hour: "7 PM", wait: 30, density: "High" },
    { hour: "8 PM", wait: 20, density: "Moderate" },
    { hour: "9 PM", wait: 10, density: "Low" },
    { hour: "10 PM", wait: 5, density: "Low" },
  ];

  const travelTips = [
    {
      title: "Remote Check-In Hack",
      text: "When waitlists are active (Yellow status), click 'Join Waitlist Remotely' from our tracker as soon as you land or arrive at the terminal. You don't need to stand at the desk to queue.",
      icon: "📲"
    },
    {
      title: "Airport Airside Walkways",
      text: "At SFO, Harvey Milk Terminal 1 (The Club SFO) is connected airside to Terminals 2 and 3. You can walk post-security to the lounge without re-clearing checkpoints.",
      icon: "🚶"
    },
    {
      title: "Bypass ATL Line at Concourse F",
      text: "ATL Concourse F (The Club ATL) gets extremely busy during international flight banks. If you have domestic departures, Concourse T or D lounges are sometimes less crowded.",
      icon: "✈️"
    },
    {
      title: "Reserve Amenities First",
      text: "At lounges offering Showers (DFW, SJC Gate A15, LAS Terminal 3), request access at the front desk immediately upon entry. Shower queues operate separately and can stretch up to 1 hour.",
      icon: "🚿"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn duration-200">
      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm">
          <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">Busiest Hub</span>
          <span className="mt-1.5 block text-2xl font-extrabold text-zinc-800 dark:text-white">ATL (Concourse F)</span>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Avg waitlist queue length: 55+ minutes during peak bank hours.</p>
          <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-rose-500 font-extrabold text-3xl select-none">🔥</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm">
          <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">Best Time to Visit</span>
          <span className="mt-1.5 block text-2xl font-extrabold text-zinc-800 dark:text-white">1:00 PM - 3:00 PM</span>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Mid-day lull between morning business banks and evening departures.</p>
          <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-emerald-500 font-extrabold text-3xl select-none">✨</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm">
          <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">Peak Travel Waves</span>
          <span className="mt-1.5 block text-2xl font-extrabold text-zinc-800 dark:text-white">Mon 8 AM / Fri 5 PM</span>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Heaviest crowds due to combining business commuters & weekend travelers.</p>
          <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-amber-500 font-extrabold text-3xl select-none">⏳</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Hourly Crowd Heatmap */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-6 backdrop-blur-md shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">⏰ Hourly Crowd Density (Daily Average)</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Cross-lounge average queue times by hours of operation (local time).</p>
          
          <div className="overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[480px]">
              <div className="h-56 flex items-end justify-between gap-1.5 sm:gap-2 pt-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {hourlyCrowdData.map((item, idx) => {
                  const maxWait = 45;
                  const percent = (item.wait / maxWait) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      {/* Tooltip on hover */}
                      <div className="absolute mb-48 scale-0 group-hover:scale-100 transition-all duration-150 origin-bottom bg-zinc-900 dark:bg-zinc-800 text-white dark:text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg z-20 pointer-events-none text-center min-w-[70px]">
                        <span className="block">{item.hour}</span>
                        <span className="block text-indigo-400 dark:text-indigo-300">{item.wait}m wait</span>
                        <span className="block opacity-75 text-[8px]">{item.density}</span>
                      </div>
                      
                      {/* Visual Bar */}
                      <div 
                        style={{ height: `${percent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-90 relative ${
                          item.density === "Peak" 
                            ? "bg-rose-500/80 group-hover:bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]" 
                            : item.density === "High"
                            ? "bg-amber-500/80 group-hover:bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                            : "bg-emerald-500/80 group-hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        }`}
                      >
                        {/* Glowing indicator inside peak bars */}
                        {item.density === "Peak" && (
                          <span className="absolute top-0 inset-x-0 h-0.5 bg-white/40 rounded-t-md"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* X-Axis Labels */}
              <div className="flex justify-between text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 px-1">
                <span>5 AM</span>
                <span>9 AM</span>
                <span>1 PM</span>
                <span>5 PM</span>
                <span>9 PM</span>
                <span>10 PM</span>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500/80"></span> Low / No Wait (0-15m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-amber-500/80"></span> High Crowd (16-30m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-rose-500/80"></span> Peak Waitlist (31m+)
            </span>
          </div>
        </div>

        {/* Busiest Airports Ranking */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-6 backdrop-blur-md shadow-sm">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">📊 Busiest Lounge Hubs</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Ranked by maximum wait times and daily queue frequency.</p>
          
          <div className="space-y-4">
            {busiestAirportsData.map((airport, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                      {airport.code}
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] sm:max-w-xs">
                      {airport.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                    {airport.peakWait}m max
                  </span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${airport.color}`} 
                    style={{ width: `${(airport.peakWait / 60) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                  <span>Avg Wait: {airport.avgWait}m</span>
                  <span>Popularity Score: {airport.popularity}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Travel Tips & Hacks Grid */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-6 backdrop-blur-md shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">💡 Pro Tips: Bypassing Lounge Lines</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Savvy traveler tricks to maximize comfort and minimize wait times.</p>
        
        <div className="grid gap-6 md:grid-cols-2">
          {travelTips.map((tip, idx) => (
            <div key={idx} className="flex gap-4 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-800/40 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
              <span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{tip.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function LoungeFaqPanel() {
  const faqs = [
    {
      q: "Why do some lounges show a \"Live Offline\" badge?",
      a: "Some partner lounges (such as No1 Lounges in London Heathrow/Gatwick or Kyra Lounge in Hong Kong) do not use the Waitwhile queue network, or their servers may occasionally limit queries. To remain resilient, LoungeQ automatically shifts to an offline fallback calculation: it checks the current local hour in the lounge's specific timezone and determines if it is scheduled to be open or closed, changing the card badge to 'Open (Scheduled)'."
    },
    {
      q: "How are the Lounge Walking Guides calculated?",
      a: "When you enter a flight number or route, LoungeQ fetches active daily flight records from public flight schedules to resolve your departure gate and terminal. It then computes the post-security walking distance and time from the lounge to that gate, complete with helpful tips (like taking the Plane Train at ATL or the Skylink at DFW) based on airport terminal maps."
    },
    {
      q: "Are flight schedules and gates updated in real-time?",
      a: "Yes. The Layover Trip Planner and Walking Guide dropdowns query live flight data schedules operating on the selected travel day, helping you avoid gate hallucinations."
    },
    {
      q: "Is Priority Pass LoungeQ free to use?",
      a: "Yes, 100% free! LoungeQ is a community-driven, non-commercial tool designed to help travelers plan their airport layovers. We do not require signups, show ads, or track user data."
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* About Section */}
      <section className="rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-6 backdrop-blur-md shadow-sm dark:shadow-none">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
          <span>ℹ️</span> About Priority Pass LoungeQ
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
          <strong>Priority Pass LoungeQ</strong> is an independent, community-focused traveler utility. It is designed to solve a common friction point for frequent flyers: walking across massive airport terminals only to find their target lounge has a long waitlist line. By consolidating live waitlist states, crowd statistics, layover route planning, and walking maps, we help you make smart decisions about where to wait.
        </p>

        {/* Disclaimer Callout */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex gap-3 items-start">
          <span className="text-lg">⚠️</span>
          <div>
            <strong className="font-extrabold uppercase tracking-wide block mb-1">Affiliation Disclaimer</strong>
            Priority Pass LoungeQ is an independent open-source tool built for traveler community convenience. This application is **not affiliated with, endorsed by, sponsored by, or associated in any way** with Priority Pass, the Collinson Group, Chase, or any airport lounge brand or operator. All trademarks and registered names belong to their respective owners.
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 px-1">
          <span>❓</span> Frequently Asked Questions
        </h2>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white/60 dark:bg-zinc-900/20 overflow-hidden transition-all duration-200 hover:border-indigo-500/30 dark:hover:border-indigo-500/20"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left px-5 py-4 text-sm font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <span>{faq.q}</span>
                  <span className={`text-xs text-zinc-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}>
                    ▼
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-60 border-t border-zinc-200/40 dark:border-white/5' : 'max-h-0'
                  } overflow-hidden`}
                >
                  <p className="px-5 py-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}


export default function Home() {
  const [search, setSearch] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState("dark"); // Default to dark theme
  const [userTimezone, setUserTimezone] = useState("");
  const [themeModeDesc, setThemeModeDesc] = useState("");
  
  // Parent state syncing status info from children cards
  const [liveStatuses, setLiveStatuses] = useState({});
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'green', 'yellow', 'closed'
  const [filterAmenity, setFilterAmenity] = useState("all");
  const [filterRegion, setFilterRegion] = useState("north-america");
  const [loungeAlerts, setLoungeAlerts] = useState({});
  const [sortBy, setSortBy] = useState("iata"); // 'iata', 'status', 'waitTime'
  const [activeLounge, setActiveLounge] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Layover trip planner states
  const [activeMode, setActiveMode] = useState("search"); // "search" or "planner"
  const [startAirport, setStartAirport] = useState("");
  const [plannerFlights, setPlannerFlights] = useState([{ flightInput: "", date: new Date().toLocaleDateString('sv-SE'), destination: "" }]);
  const [plannerResults, setPlannerResults] = useState(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState("");
  const [availableFlights, setAvailableFlights] = useState({});
  const fetchedRoutes = useRef({});

  const flightDestsKey = useMemo(() => {
    return plannerFlights.map(f => f.destination).join(",");
  }, [plannerFlights]);

  const flightInputsKey = useMemo(() => {
    return plannerFlights.map(f => f.flightInput).join(",");
  }, [plannerFlights]);

  // Dynamically fetch actual available flights for entered origin/destination routes
  useEffect(() => {
    plannerFlights.forEach((flight, idx) => {
      const origin = idx === 0 ? startAirport : plannerFlights[idx - 1]?.destination;
      const destination = flight.destination;
      const date = flight.date;
      
      if (origin?.trim().length === 3 && destination?.trim().length === 3 && date) {
        const key = `${origin}-${destination}-${date}`;
        if (fetchedRoutes.current[key]) return;
        fetchedRoutes.current[key] = true;
        
        fetch(`/api/flight?action=search&airportCode=${origin}&destination=${destination}&date=${date}`)
          .then(res => res.json())
          .then(data => {
            if (data.flights && data.flights.length > 0) {
              const sorted = sortFlightsByTime(data.flights, date);
              setAvailableFlights(prev => ({
                ...prev,
                [idx]: sorted
              }));
              
              // Auto-select the first real flight found (the first upcoming one!)
              setPlannerFlights(current => {
                if (!current[idx]?.flightInput) {
                  const updated = [...current];
                  updated[idx] = { ...updated[idx], flightInput: sorted[0].flightNumber };
                  return updated;
                }
                return current;
              });
            }
          })
          .catch(err => console.error("Error fetching routes:", err));
      }
    });
  }, [startAirport, flightDestsKey]);

  const addPlannerFlight = () => {
    setPlannerFlights((prev) => [...prev, { flightInput: "", date: new Date().toLocaleDateString('sv-SE'), destination: "" }]);
  };

  const removePlannerFlight = (index) => {
    setPlannerFlights((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePlannerFlight = (index, field, value) => {
    setPlannerFlights((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePlanTrip = async () => {
    setPlannerError("");
    setPlannerResults(null);

    const cleanStart = startAirport.toUpperCase().trim();
    if (!cleanStart || cleanStart.length !== 3) {
      setPlannerError("Please enter a valid 3-letter Starting Airport Code (e.g. SFO).");
      return;
    }

    for (let i = 0; i < plannerFlights.length; i++) {
      const leg = plannerFlights[i];
      const cleanDest = leg.destination.toUpperCase().trim();
      if (!cleanDest || cleanDest.length !== 3) {
        setPlannerError(`Leg ${i + 1}: Please enter a valid 3-letter destination airport.`);
        return;
      }
    }

    setPlannerLoading(true);
    let currentAirport = cleanStart;
    const resolvedPath = [];

    try {
      for (let i = 0; i < plannerFlights.length; i++) {
        const leg = plannerFlights[i];
        const destAirport = leg.destination.toUpperCase().trim();
        let flightVal = leg.flightInput.trim();
        
        if (!flightVal) {
          flightVal = getTypicalFlightNumber(currentAirport, destAirport);
        }
        
        const cleanedFlight = flightVal.toUpperCase().trim().replace(/\s+/g, "");
        const match = cleanedFlight.match(/^([A-Z]{2}|\d[A-Z]|[A-Z]\d)(\d+)$/);
        
        if (!match) {
          throw new Error(`Leg ${i + 1}: Invalid flight number format (try UA105 or AA22).`);
        }
        
        const carrier = match[1];
        const flightNumber = match[2];

        // Fetch flight info from API using currentAirport as origin
        const res = await fetch(`/api/flight?carrier=${leg.flightInput.trim() ? carrier : ""}&flightNumber=${leg.flightInput.trim() ? flightNumber : ""}&date=${leg.date}&airportCode=${currentAirport}&destination=${destAirport}`);
        let data = {};
        if (res.ok) {
          data = await res.json();
        }

        if (data.error) {
          throw new Error(`Leg ${i + 1}: ${data.error}`);
        }

        resolvedPath.push({
          airportCode: currentAirport,
          type: i === 0 ? "origin" : "layover",
          flight: {
            carrier: data.carrier || carrier,
            flightNumber: data.flightNumber || flightNumber,
            date: leg.date,
            destination: destAirport,
            airlineName: data.airlineName || carrier,
            gate: data.gate || "TBD",
            terminal: data.terminal || "N/A",
            status: data.status || "Scheduled",
            scheduledTime: data.scheduledTime || "N/A",
            route: `${currentAirport} ➔ ${destAirport}`,
            isFallback: data.isFallback !== false
          }
        });

        currentAirport = destAirport;
      }

      // Add the final destination airport
      resolvedPath.push({
        airportCode: currentAirport,
        type: "destination",
        flight: null
      });

      setPlannerResults(resolvedPath);
      setPlannerFlights((prev) => {
        return prev.map((flight, idx) => {
          const resolvedLeg = resolvedPath[idx];
          if (resolvedLeg && resolvedLeg.flight) {
            return {
              ...flight,
              flightInput: `${resolvedLeg.flight.carrier}${resolvedLeg.flight.flightNumber}`
            };
          }
          return flight;
        });
      });
    } catch (err) {
      setPlannerError(err.message || "An error occurred while compiling your trip layout.");
    } finally {
      setPlannerLoading(false);
    }
  };

  // Load theme and favorites on mount
  useEffect(() => {
    let detectedTheme = "dark";
    let tzName = "";
    let isDay = false;
    
    try {
      tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tzName);
      
      const hour = new Date().getHours();
      isDay = hour >= 6 && hour < 18;
      detectedTheme = isDay ? "light" : "dark";
      setThemeModeDesc(isDay ? "Day Mode" : "Night Mode");
    } catch (e) {
      console.error("Failed to detect timezone/hour", e);
    }

    // Theme configuration
    const savedTheme = sessionStorage.getItem("pp_lounge_theme");
    const savedThemeMode = sessionStorage.getItem("pp_lounge_theme_mode"); // "day" or "night"
    const currentMode = isDay ? "day" : "night";

    let activeTheme = detectedTheme;
    // Only use the saved manual theme if it was set during the same day/night cycle
    if (savedTheme && savedThemeMode === currentMode) {
      activeTheme = savedTheme;
    } else {
      // Clear outdated overrides so it auto-shifts
      sessionStorage.removeItem("pp_lounge_theme");
      sessionStorage.removeItem("pp_lounge_theme_mode");
    }

    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Favorites configuration
    const savedFavs = localStorage.getItem("pp_lounge_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    // Alerts configuration
    const savedAlerts = localStorage.getItem("pp_lounge_alerts");
    if (savedAlerts) {
      try {
        setLoungeAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error("Failed to parse lounge alerts", e);
      }
    }
  }, []);

  // Toggle Theme between light and dark
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    
    // Track the cycle when the manual override occurred
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    const currentMode = isDay ? "day" : "night";

    sessionStorage.setItem("pp_lounge_theme", nextTheme);
    sessionStorage.setItem("pp_lounge_theme_mode", currentMode);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (slug) => {
    const nextFavorites = favorites.includes(slug)
      ? favorites.filter((f) => f !== slug)
      : [...favorites, slug];
    setFavorites(nextFavorites);
    localStorage.setItem("pp_lounge_favorites", JSON.stringify(nextFavorites));
  };

  // Toggle alert directly from card
  const handleToggleAlertCard = async (slug, status) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      let perm = Notification.permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
      }
      if (perm !== "granted") {
        alert("Please enable desktop notifications in your browser settings to set lounge alerts.");
        return;
      }
    }

    const nextLoungeAlerts = { ...loungeAlerts };
    if (nextLoungeAlerts[slug]) {
      delete nextLoungeAlerts[slug];
    } else {
      if (status === "CLOSED") {
        nextLoungeAlerts[slug] = {
          walkInReady: false,
          lineActive: true,
          waitTimeUnder: 0
        };
      } else {
        nextLoungeAlerts[slug] = {
          walkInReady: true,
          lineActive: false,
          waitTimeUnder: 0
        };
      }
    }

    setLoungeAlerts(nextLoungeAlerts);
    localStorage.setItem("pp_lounge_alerts", JSON.stringify(nextLoungeAlerts));
  };

  // Status callback from cards
  const handleStatusLoaded = (slug, info) => {
    setLiveStatuses((prev) => ({
      ...prev,
      [slug]: info
    }));
  };

  // Auto-refresh interval (every 60 seconds) to update live status queue conditions
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const prevStatusesRef = useRef({});

  // Background status transition monitoring for active lounge alerts
  useEffect(() => {
    if (Object.keys(loungeAlerts).length === 0) {
      prevStatusesRef.current = { ...liveStatuses };
      return;
    }

    const nextLoungeAlerts = { ...loungeAlerts };
    let alertsChanged = false;

    Object.keys(loungeAlerts).forEach((slug) => {
      const alert = loungeAlerts[slug];
      const prevInfo = prevStatusesRef.current[slug];
      const currInfo = liveStatuses[slug];

      if (!prevInfo || !currInfo || prevInfo.loading || currInfo.loading) {
        return;
      }

      const statusChanged = prevInfo.status !== currInfo.status;
      const waitTimeChanged = prevInfo.estimatedWaitMinutes !== currInfo.estimatedWaitMinutes;

      if (!statusChanged && !waitTimeChanged) {
        return;
      }

      let triggered = false;
      let notificationMsg = "";

      const loungeObj = airportsData.find((a) => a.slug === slug);
      const name = loungeObj ? loungeObj.name : slug;

      if (alert.walkInReady && currInfo.status === "GREEN" && prevInfo.status !== "GREEN") {
        triggered = true;
        notificationMsg = `Good news! ${name} is now Walk-in Ready (No waitlist)!`;
      }

      if (alert.lineActive && currInfo.status === "YELLOW" && prevInfo.status !== "YELLOW") {
        triggered = true;
        notificationMsg = `${name} waitlist is active. Queue is now active!`;
      }

      if (
        alert.waitTimeUnder > 0 &&
        currInfo.status === "YELLOW" &&
        currInfo.estimatedWaitMinutes >= 0 &&
        currInfo.estimatedWaitMinutes <= alert.waitTimeUnder &&
        (prevInfo.status !== "YELLOW" || prevInfo.estimatedWaitMinutes > alert.waitTimeUnder)
      ) {
        triggered = true;
        notificationMsg = `${name} wait time has dropped to ${formatWaitTime(currInfo.estimatedWaitMinutes)} (under your ${alert.waitTimeUnder}m threshold)!`;
      }

      if (triggered) {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Priority Pass LoungeQ", {
            body: notificationMsg,
            icon: "/favicon.ico"
          });
        }
        delete nextLoungeAlerts[slug];
        alertsChanged = true;
      }
    });

    if (alertsChanged) {
      setLoungeAlerts(nextLoungeAlerts);
      localStorage.setItem("pp_lounge_alerts", JSON.stringify(nextLoungeAlerts));
    }

    prevStatusesRef.current = { ...liveStatuses };
  }, [liveStatuses, loungeAlerts]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterAmenity("all");
    setSortBy("iata");
  };

  const isFiltered = search !== "" || filterStatus !== "all" || filterAmenity !== "all" || sortBy !== "iata";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== "all") count++;
    if (filterAmenity !== "all") count++;
    if (sortBy !== "iata") count++;
    return count;
  }, [filterStatus, filterAmenity, sortBy]);

  // Compute live global statistics
  const stats = useMemo(() => {
    let regionAirports;
    if (filterRegion === "favorites") {
      regionAirports = airportsData.filter((a) => favorites.includes(a.slug));
    } else if (filterRegion === "all") {
      regionAirports = airportsData;
    } else {
      regionAirports = airportsData.filter((a) => a.region === filterRegion);
    }

    const report = {
      total: regionAirports.length,
      open: 0,
      activeLines: 0,
      avgWait: 0
    };
    
    let totalWait = 0;
    let waitCount = 0;

    regionAirports.forEach((lounge) => {
      const info = liveStatuses[lounge.slug];
      if (!info || info.loading) return;
      if (info.status === "GREEN" || info.status === "YELLOW") {
        report.open++;
      }
      if (info.status === "YELLOW") {
        report.activeLines++;
        totalWait += info.estimatedWaitMinutes || 0;
        waitCount++;
      }
    });

    report.avgWait = waitCount > 0 ? Math.round(totalWait / waitCount) : 0;
    return report;
  }, [liveStatuses, filterRegion, favorites]);

  // Process sorting & filtering
  const processedLounges = useMemo(() => {
    // 0. Filter by region first
    let results;
    if (filterRegion === "favorites") {
      results = airportsData.filter((a) => favorites.includes(a.slug));
    } else if (filterRegion === "all") {
      results = airportsData;
    } else {
      results = airportsData.filter((a) => a.region === filterRegion);
    }

    // 1. Search text filter
    results = results.filter(
      (lounge) =>
        lounge.code.toLowerCase().includes(search.toLowerCase()) ||
        lounge.name.toLowerCase().includes(search.toLowerCase()) ||
        lounge.terminal.toLowerCase().includes(search.toLowerCase()) ||
        (lounge.city && lounge.city.toLowerCase().includes(search.toLowerCase()))
    );

    // 2. Status Category filter
    if (filterStatus !== "all") {
      results = results.filter((lounge) => {
        const live = liveStatuses[lounge.slug];
        if (!live || live.loading) return true; // Keep loading cards visible
        return live.status.toLowerCase() === filterStatus;
      });
    }

    // 2b. Amenity filter
    if (filterAmenity !== "all") {
      results = results.filter((lounge) => {
        const ams = lounge.amenities;
        if (!ams) return false;
        
        switch (filterAmenity) {
          case "showers":
            return ams.showers === "yes" || ams.showers === "premium";
          case "kids_play_area":
            return ams.kids_play_area === true;
          case "meeting_rooms":
            return ams.meeting_rooms === true;
          case "food_drinks":
            return ams.food_drinks === "hot-buffet";
          case "runway_views":
            return ams.runway_views === true;
          case "seat_ordering":
            return ams.seat_ordering === true;
          default:
            return true;
        }
      });
    }

    // 3. Sort logic
    results.sort((a, b) => {
      // Rule A: Starred favorites always float to the top
      const aFav = favorites.includes(a.slug);
      const bFav = favorites.includes(b.slug);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      // Rule B: Sort selection within groups
      if (sortBy === "iata") {
        return a.code.localeCompare(b.code);
      }

      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "city") {
        return a.city.localeCompare(b.city);
      }
      
      if (sortBy === "status") {
        // Status weight: Yellow (1), Green (2), Closed (3)
        const getWeight = (slug) => {
          const live = liveStatuses[slug];
          if (!live || live.loading) return 4;
          if (live.status === "YELLOW") return 1;
          if (live.status === "GREEN") return 2;
          return 3;
        };
        return getWeight(a.slug) - getWeight(b.slug);
      }

      if (sortBy === "waitTime") {
        const getWait = (slug) => {
          const live = liveStatuses[slug];
          if (!live || live.loading) return 9999;
          if (live.status === "YELLOW") return live.estimatedWaitMinutes;
          if (live.status === "GREEN") return 0;
          return 9999; // Closed at bottom
        };
        return getWait(a.slug) - getWait(b.slug);
      }

      if (sortBy === "waitTimeDesc") {
        const getWait = (slug) => {
          const live = liveStatuses[slug];
          if (!live || live.loading) return -1;
          if (live.status === "YELLOW") return live.estimatedWaitMinutes;
          if (live.status === "GREEN") return 0;
          return -1; // Closed at bottom
        };
        return getWait(b.slug) - getWait(a.slug);
      }

      return 0;
    });

    return results;
  }, [search, filterStatus, filterAmenity, filterRegion, sortBy, liveStatuses, favorites]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-zinc-100 to-slate-50 dark:from-zinc-950 dark:via-slate-900 dark:to-zinc-950 font-sans text-zinc-800 dark:text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      <Head>
        <title>Priority Pass LoungeQ | Live Airport Lounge Waitlist & Queue Tracker</title>
        <meta
          name="description"
          content="Live remote waitlist status and estimated queue times for Priority Pass lounges worldwide."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Section (mobile row, tablet flex) */}
        <header className="relative mb-8 flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">
              <span className="bg-gradient-to-r from-zinc-800 to-zinc-600 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent">Priority Pass</span>{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">LoungeQ</span>
            </h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              <span>Independent live Priority Pass lounge queue monitor</span>
              {userTimezone && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-400/20 w-fit shadow-sm">
                  🌐 {userTimezone} ({themeModeDesc})
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/40 text-zinc-750 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all duration-205 shadow-sm focus:outline-none"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 shadow-sm transition-all duration-200"
              id="btn-refresh-all"
              title="Refresh Queue Times"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 dark:text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline sm:ml-1.5 text-xs sm:text-sm font-bold">Refresh</span>
            </button>
          </div>
        </header>

        {/* Live Statistics Panel */}
        {/* Mobile View: Compact Status Bar (saves vertical space, no cutoffs) */}
        <section className="block md:hidden mb-6">
          <div className="grid grid-cols-4 divide-x divide-zinc-200/60 dark:divide-white/10 rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 py-2.5 px-0.5 backdrop-blur-md shadow-sm">
            {/* Tracked */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs min-h-[16px]">🏢</span>
              <span className="mt-0.5 text-xs min-[375px]:text-sm font-extrabold text-zinc-900 dark:text-white leading-none">{stats.total}</span>
              <span className="mt-1 text-[8px] min-[375px]:text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lounges</span>
            </div>
            {/* Open */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs min-h-[16px]">🟢</span>
              <span className="mt-0.5 text-xs min-[375px]:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">{stats.open}</span>
              <span className="mt-1 text-[8px] min-[375px]:text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Open</span>
            </div>
            {/* Active Lines */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs min-h-[16px]">⚠️</span>
              <span className="mt-0.5 text-xs min-[375px]:text-sm font-extrabold text-amber-600 dark:text-amber-400 leading-none">{stats.activeLines}</span>
              <span className="mt-1 text-[8px] min-[375px]:text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lines</span>
            </div>
            {/* Avg Wait */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs min-h-[16px]">⏱️</span>
              <span className="mt-0.5 text-xs min-[375px]:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">
                {stats.activeLines > 0 ? `${stats.avgWait}m` : "None"}
              </span>
              <span className="mt-1 text-[8px] min-[375px]:text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate max-w-full px-0.5">Avg Wait</span>
            </div>
          </div>
        </section>

        {/* Desktop View: Spacious Grid Panels */}
        <section className="hidden md:grid md:grid-cols-4 gap-4 mb-8 w-full">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm dark:shadow-none transition-all hover:scale-[1.02] duration-200">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Tracked Lounges</span>
            <span className="mt-1.5 block text-3xl font-extrabold text-zinc-900 dark:text-white">{stats.total}</span>
            <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-zinc-700 dark:text-zinc-300">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm dark:shadow-none transition-all hover:scale-[1.02] duration-200">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Lounges Open</span>
            <span className="mt-1.5 block text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.open}</span>
            <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-emerald-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm dark:shadow-none transition-all hover:scale-[1.02] duration-200">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Active Lines</span>
            <span className="mt-1.5 block text-3xl font-extrabold text-amber-600 dark:text-amber-400">{stats.activeLines}</span>
            <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-amber-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-5 backdrop-blur-sm shadow-sm dark:shadow-none transition-all hover:scale-[1.02] duration-200">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Avg Wait Time</span>
            <span className="mt-1.5 block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.activeLines > 0 ? `${stats.avgWait}m` : "No Line"}
            </span>
            <div className="absolute right-3 bottom-3 opacity-10 dark:opacity-20 text-indigo-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </section>
        <section className="mb-6 flex gap-1 sm:gap-2 border-b border-zinc-200 dark:border-white/5 pb-0.5 overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth snap-x snap-mandatory">
          <button
            onClick={() => setActiveMode("search")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all relative px-4 flex items-center gap-1.5 cursor-pointer focus:outline-none shrink-0 snap-start ${
              activeMode === "search"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-black"
                : "border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-200"
            }`}
          >
            <span>🔍</span>
            <span>Search Lounges</span>
          </button>
          <button
            onClick={() => setActiveMode("planner")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all relative px-4 flex items-center gap-1.5 cursor-pointer focus:outline-none shrink-0 snap-start ${
              activeMode === "planner"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-black"
                : "border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-200"
            }`}
          >
            <span>✈️</span>
            <span>Layover Trip Planner</span>
          </button>
          <button
            onClick={() => setActiveMode("trends")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all relative px-4 flex items-center gap-1.5 cursor-pointer focus:outline-none shrink-0 snap-start ${
              activeMode === "trends"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-black"
                : "border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-200"
            }`}
          >
            <span>📊</span>
            <span>Crowd Insights & Trends</span>
          </button>
          <button
            onClick={() => setActiveMode("faq")}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-all relative px-4 flex items-center gap-1.5 cursor-pointer focus:outline-none shrink-0 snap-start ${
              activeMode === "faq"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-black"
                : "border-transparent text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-200"
            }`}
          >
            <span>❓</span>
            <span>About & FAQ</span>
          </button>
        </section>

        {activeMode === "search" && (
          <>
            {/* Filters and Search Bar Container (sticky top viewport with glassmorphism) */}
            <section className="sticky top-0 z-30 mb-8 -mx-4 px-4 py-3 md:mx-0 md:px-6 md:py-4 md:rounded-2xl border-b md:border border-zinc-200/50 dark:border-white/5 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm">
              {/* Region Selector Pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-zinc-200/60 dark:border-white/5 scrollbar-none scroll-smooth">
                {[
                  { id: "favorites", label: "Bookmarked", icon: "⭐" },
                  { id: "all", label: "All Regions", icon: "🌐" },
                  { id: "north-america", label: "North America", icon: "🌎" },
                  { id: "south-america", label: "South America", icon: "🏔️" },
                  { id: "asia", label: "Asia", icon: "🏮" },
                  { id: "europe", label: "Europe", icon: "🏰" },
                  { id: "oceania", label: "Oceania", icon: "🦘" }
                ].map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => setFilterRegion(reg.id)}
                    className={`px-3.5 py-1.5 text-[11px] font-extrabold uppercase rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer focus:outline-none flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      filterRegion === reg.id
                        ? "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500"
                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-white/10 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>{reg.icon}</span>
                    <span>{reg.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                
                {/* Search & Filter Header Row */}
                <div className="flex items-center gap-2 w-full flex-1">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 dark:text-zinc-555">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search Airport, City, Lounge or Terminal..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/40 py-2.5 pl-12 pr-4 text-sm text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      id="input-search-iata"
                    />
                  </div>

                  {/* Mobile Filter Toggle Button */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={`md:hidden flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                      showMobileFilters || activeFilterCount > 0
                        ? "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span>⚙️</span>
                    <span className="hidden xs:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-black h-4.5 w-4.5 ${
                        showMobileFilters || activeFilterCount > 0 ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
                      }`}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Mobile Quick Clear Button */}
                  {isFiltered && (
                    <button
                      onClick={() => { handleResetFilters(); setShowMobileFilters(false); }}
                      className="md:hidden flex items-center justify-center p-2.5 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400 cursor-pointer active:scale-95 transition-all shadow-sm"
                      title="Clear All Filters"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter & Sort selectors: Collapsible on mobile, always visible on desktop (md:flex) */}
                <div className={`${showMobileFilters ? "block" : "hidden"} md:block w-full md:w-auto shrink-0 transition-all duration-200`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:flex md:items-center md:gap-3">
                    <div className="flex items-center gap-1.5 w-full bg-white dark:bg-zinc-900/40 px-3 py-2 border border-zinc-200/60 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 shrink-0">Queue:</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none w-full cursor-pointer"
                      >
                        <option value="all">All Lounges</option>
                        <option value="green">Walk-in Ready</option>
                        <option value="yellow">Active Line</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 w-full bg-white dark:bg-zinc-900/40 px-3 py-2 border border-zinc-200/60 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 shrink-0">Amenity:</label>
                      <select
                        value={filterAmenity}
                        onChange={(e) => setFilterAmenity(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none w-full cursor-pointer"
                      >
                        <option value="all">All Amenities</option>
                        <option value="showers">🚿 Showers</option>
                        <option value="kids_play_area">👶 Kids Play</option>
                        <option value="meeting_rooms">💻 Workspaces</option>
                        <option value="food_drinks">🍲 Hot Buffet</option>
                        <option value="runway_views">✈️ Runway Views</option>
                        <option value="seat_ordering">📱 Seat Ordering</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 w-full bg-white dark:bg-zinc-900/40 px-3 py-2 border border-zinc-200/60 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 shrink-0">Sort:</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none w-full cursor-pointer"
                      >
                        <option value="iata">Airport Code (A-Z)</option>
                        <option value="name">Lounge Name (A-Z)</option>
                        <option value="city">City Name (A-Z)</option>
                        <option value="status">Queue Status</option>
                        <option value="waitTime">Wait Time (Shortest)</option>
                        <option value="waitTimeDesc">Wait Time (Longest)</option>
                      </select>
                    </div>

                    {isFiltered && (
                      <button
                        onClick={handleResetFilters}
                        className="hidden md:flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-red-500/30 dark:border-red-500/20 hover:border-red-500/80 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-2 text-xs font-extrabold text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 active:scale-95 shadow-sm text-center w-full md:w-auto"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Lounges Grid */}
            {processedLounges.length > 0 ? (
              <main className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {processedLounges.map((lounge) => (
                  <StatusCard
                    key={lounge.slug}
                    lounge={lounge}
                    refreshTrigger={refreshTrigger}
                    onStatusLoaded={handleStatusLoaded}
                    isFavorite={favorites.includes(lounge.slug)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={setActiveLounge}
                    hasAlert={!!loungeAlerts[lounge.slug]}
                    onToggleAlert={handleToggleAlertCard}
                  />
                ))}
              </main>
            ) : filterRegion === "favorites" ? (
              <div className="my-16 text-center max-w-md mx-auto p-6 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-zinc-900/20 backdrop-blur-sm shadow-sm">
                <div className="mx-auto h-12 w-12 text-yellow-500 dark:text-yellow-450 text-3xl mb-4 flex items-center justify-center animate-pulse">⭐</div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Bookmarked Lounges list is empty</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Tap the star icon on any lounge card across any region to save it here for quick access next time.
                </p>
                <button
                  onClick={() => setFilterRegion("all")}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-extrabold shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Explore Lounges
                </button>
              </div>
            ) : (
              <div className="my-16 text-center">
                <svg className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-zinc-400 dark:text-zinc-455">No lounges found</h3>
                <p className="mt-1 text-sm text-zinc-500">Try matching by airport IATA code, terminal, or adjust your status filter.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-extrabold shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}

        {activeMode === "planner" && (
          <div className="space-y-8 animate-fadeIn duration-200">
            {/* Flight Path Form */}
            <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/30 p-6 backdrop-blur-md shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                <span>✈️</span> Layover Lounge Companion
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                Enter your itinerary stops and flight numbers. We will retrieve live terminal gates and map all lounge options along your journey.
              </p>

              <div className="space-y-4">
                {/* Starting Airport */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550 sm:text-right">
                    Start Airport:
                  </label>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="e.g. SFO"
                      value={startAirport}
                      onChange={(e) => setStartAirport(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-800 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-white/5 my-2" />

                {/* Flights List */}
                <div className="space-y-3">
                  {plannerFlights.map((flight, idx) => (
                    <div 
                      key={idx} 
                      className="relative border border-zinc-150 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:p-3"
                    >
                      {/* Leg indicator */}
                      <span className="inline-flex items-center justify-center rounded-lg h-6 w-6 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                        {idx + 1}
                      </span>

                      {/* Flight Number */}
                      <div className="flex-1 min-w-0">
                        <label className="block sm:hidden text-[9px] font-bold text-zinc-450 uppercase mb-1">Flight Number</label>
                        {availableFlights[idx] && availableFlights[idx].length > 0 ? (
                          <select
                            value={flight.flightInput}
                            onChange={(e) => updatePlannerFlight(idx, "flightInput", e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                          >
                            <option value="">-- Select Flight --</option>
                            {availableFlights[idx].map((f) => (
                              <option key={f.flightNumber} value={f.flightNumber}>
                                {f.airlineName} {f.flightNumber} ({f.departureTime})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Flight # (e.g. UA105)"
                            value={flight.flightInput}
                            onChange={(e) => updatePlannerFlight(idx, "flightInput", e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                          />
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex-1 min-w-0">
                        <label className="block sm:hidden text-[9px] font-bold text-zinc-450 uppercase mb-1">Departure Date</label>
                        <input
                          type="date"
                          value={flight.date}
                          onChange={(e) => updatePlannerFlight(idx, "date", e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-white focus:outline-none"
                        />
                      </div>

                      {/* Destination Airport */}
                      <div className="flex-1 min-w-0">
                        <label className="block sm:hidden text-[9px] font-bold text-zinc-450 uppercase mb-1">Destination Airport</label>
                        <input
                          type="text"
                          maxLength={3}
                          placeholder="To (e.g. ATL)"
                          value={flight.destination}
                          onChange={(e) => updatePlannerFlight(idx, "destination", e.target.value.toUpperCase())}
                          className="w-full rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-white focus:outline-none uppercase font-bold"
                        />
                      </div>

                      {/* Remove Button */}
                      {plannerFlights.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlannerFlight(idx)}
                          className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                          title="Remove Leg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Form Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <button
                    type="button"
                    onClick={addPlannerFlight}
                    className="rounded-xl border border-dashed border-zinc-300 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 px-4 py-2.5 text-xs font-bold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-98 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>➕</span> Add Layover Leg
                  </button>

                  <div className="flex items-center gap-3">
                    {plannerResults && (
                      <button
                        type="button"
                        onClick={() => { setPlannerResults(null); setStartAirport(""); setPlannerFlights([{ flightInput: "", date: new Date().toLocaleDateString('sv-SE'), destination: "" }]); }}
                        className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-650 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Reset Itinerary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePlanTrip}
                      disabled={plannerLoading}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-xs font-black shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      {plannerLoading ? "Analyzing flight path..." : "Find Lounges Along Path"}
                    </button>
                  </div>
                </div>

                {plannerError && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-semibold bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                    ⚠️ {plannerError}
                  </p>
                )}
              </div>
            </div>

            {/* Itinerary Timeline Display */}
            {plannerResults && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  🗺️ Resolved Lounge Journey Path
                </h3>

                <div className="relative border-l border-zinc-200 dark:border-white/5 ml-4 pl-6 space-y-8 pb-4">
                  {plannerResults.map((stop, idx) => {
                    const lounges = airportsData.filter(l => l.code === stop.airportCode);
                    const airportInfo = airportsData.find(l => l.code === stop.airportCode) || {};

                    return (
                      <div key={idx} className="relative group">
                        {/* Timeline Bullet */}
                        <span className="absolute left-[-31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-950 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950">
                          {stop.type === "destination" ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          )}
                        </span>

                        <div className="space-y-4">
                          {/* Airport Title header */}
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-550 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 uppercase tracking-wider shadow-sm">
                              {stop.type === "origin" ? "🏁 Origin Stop" : stop.type === "layover" ? "🚏 Layover Transfer" : "📍 Destination Stop"}
                            </span>
                            <h4 className="mt-1 text-lg font-black text-zinc-900 dark:text-white flex items-baseline gap-2">
                              <span>{stop.airportCode}</span>
                              <span className="text-xs font-semibold text-zinc-450 dark:text-zinc-500">
                                {airportInfo.city ? `${airportInfo.city}` : "Airport stop"}
                              </span>
                            </h4>
                          </div>

                          {/* Flight details for this stop */}
                          {stop.flight && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-white/5 py-2 px-3.5 text-xs font-semibold text-zinc-650 dark:text-zinc-350 w-fit shadow-sm">
                              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                ✈️ {stop.flight.airlineName} {stop.flight.carrier} {stop.flight.flightNumber}
                              </span>
                              <span className="text-zinc-350 dark:text-zinc-700">•</span>
                              <span>To {stop.flight.destination}</span>
                              <span className="text-zinc-350 dark:text-zinc-700">•</span>
                              <span>Departs: <span className="font-bold text-zinc-800 dark:text-zinc-200">{stop.flight.scheduledTime}</span></span>
                              <span className="text-zinc-350 dark:text-zinc-700">•</span>
                              <span>Gate: <span className="font-bold text-zinc-800 dark:text-zinc-200">{stop.flight.terminal} (Gate {stop.flight.gate})</span></span>
                              {stop.flight.isFallback && (
                                <>
                                  <span className="text-zinc-350 dark:text-zinc-700">•</span>
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Typical</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Lounges lists */}
                          <div className="pl-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Available Lounges ({lounges.length})</span>
                            {lounges.length > 0 ? (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {lounges.map((lounge) => (
                                  <div 
                                    key={lounge.slug}
                                    onClick={() => setActiveLounge(lounge)}
                                    className="cursor-pointer rounded-xl border border-zinc-200/80 dark:border-white/5 bg-white/55 dark:bg-zinc-900/10 p-3 hover:scale-[1.01] hover:border-indigo-500/50 dark:hover:border-indigo-400/40 transition-all duration-200 shadow-sm relative group flex flex-col justify-between h-[100px]"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                          {lounge.name}
                                        </h5>
                                        <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-500 whitespace-nowrap">
                                          {lounge.terminal.split(" ")[0]}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2">
                                        {lounge.directions || "Located airside."}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-2 mt-2">
                                      <span className="text-[9px] text-zinc-500 dark:text-zinc-450">
                                        ⏱️ Wait: <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                          {liveStatuses[lounge.slug]?.estimatedWaitMinutes ? formatWaitTime(liveStatuses[lounge.slug].estimatedWaitMinutes) : "Walk-in"}
                                        </span>
                                      </span>
                                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                        View Details →
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic p-3 rounded-xl border border-dashed border-zinc-200 dark:border-white/5 bg-zinc-50/20 dark:bg-zinc-950/10 inline-block">
                                ℹ️ No Priority Pass lounges located at this airport stop.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeMode === "trends" && (
          <LoungeInsightsDashboard />
        )}

        {activeMode === "faq" && (
          <LoungeFaqPanel />
        )}

        {/* Footer */}
        <footer className="mt-20 border-t border-zinc-200 dark:border-white/5 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} Priority Pass LoungeQ. All data fetched directly from public Waitwhile interfaces.</p>
          <p className="mt-1 font-semibold text-zinc-500 dark:text-zinc-600">Not affiliated with Priority Pass, Collinson Group, Chase, or any lounge operator. Built purely as a free traveler community utility.</p>
        </footer>
      </div>

      {/* Lounge Details Drawer / Bottom Sheet */}
      <LoungeDetailsDrawer
        lounge={activeLounge}
        isOpen={!!activeLounge}
        onClose={() => setActiveLounge(null)}
        loungeAlerts={loungeAlerts}
        setLoungeAlerts={setLoungeAlerts}
      />
    </div>
  );
}
