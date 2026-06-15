# priority-pass-lounge-waitlist-monitor
Independent live Priority Pass lounge queue monitor

---

# Priority Pass Lounge Waitlist Tracker & Layover Companion

A premium, responsive Next.js application that helps Priority Pass members track lounge queues, estimate walk times to departure gates, plan layover lounge stops, and view historical crowd trends.

---

## 🚀 Key Features

### 1. Live Lounge Waitlist Queue Tracker
* **Real-time Status**: Pulls queue data for airport lounges managed through public check-in systems.
* **Wait Levels**: Categorizes crowds as:
  * 🟢 **Walk Right In**: Lounge under capacity; no queue.
  * 🟡 **Line Active**: Virtual waitlist active, showing live wait times (e.g. `26m`) and queue size (`39 parties`).
  * ⚪ **Lounge Closed**: Lounge is outside operational hours.
* **Remote Check-In Integration**: Direct links to open location check-ins and join queues from the browser.

### 2. Scraper Resilience & Timezone Fallbacks
* **Concurrency Protection**: The home screen launches simultaneous fetches. To prevent Waitwhile from rate-limiting or blocking requests, the `/api/status` endpoint uses a 60-second cache.
* **Offline Hour Calculations**: If a scrape fails due to timeout or block, the endpoint dynamically evaluates current timezone-aligned hours to serve estimated states (`GREEN` or `CLOSED`) along with a `⚠️ Live Offline` badge in the UI.

### 3. Layover Trip Lounge Planner
* **Multi-Leg Routing**: Enter your starting airport, dates, layover targets, and final destinations.
* **Sequential Flight Resolution**: Automatically fetches active flight details (gates, terminals, status, departure hours) for each leg using FlightAware.
* **Timeline Visualization**: Renders a travel timeline displaying lounges at each layover airport and flight connection details.

### 4. Interactive Walk Guide & Gate Calculator
* **Walking Distance Estimator**: Calculates post-security walking times and walking paths (feet) to target gates.
* **Live Flight Gate Sync**: Enters your destination inside a lounge card's Walk Guide drawer to load scheduled departures, sort upcoming flights, and calculate walks directly to your specific gate.
* **Alternate Terminals**: Warns users if a walk exits secure areas and suggests local trams/trains (e.g., ATL Plane Train, SFO AirTrain).

### 5. Crowd Insights & Trends Dashboard
* **Busiest Hubs Ranking**: Rankings of the highest peak wait times and daily queue frequency.
* **Hourly Density Heatmap**: Visualizes average wait times from 5 AM to 10 PM.
* **Insider Travel Tips**: Recommendations on remote queue check-in, connector corridors, and booking amenities.

---

## 🛠️ Architecture & Technology Stack

* **Framework**: [Next.js (Pages Router)](https://nextjs.org/)
* **Runtime**: Node.js 18+ (utilizes native `fetch` API)
* **Styling**: Tailwind CSS 4 & Vanilla CSS (supporting dynamic Light/Dark modes)
* **Layout Design**: Sleek glassmorphism, responsive flex grids, premium typography (Outfit/Inter).

---

## 🔌 API Endpoints & Logic

### 1. Waitlist Status Scraper (`/api/status`)
* **Endpoint**: `/api/status?slug={lounge-slug}`
* **Scraping Target**: `https://waitwhile.com/locations/{slug}`
* **Regex Extraction**:
  * Operational Status: `isOpenMatch = html.match(/\"isOpen\"\s*:\s*(true|false)/)`
  * Wait Seconds: `waitMatch = html.match(/\"wait\"\s*:\s*(-?\d+)/)`
  * Queue Size: `numWaitingMatch = html.match(/\"numWaiting\"\s*:\s*(\d+)/)`
* **Minutes Conversion**: `estimatedWaitMinutes = Math.round(waitSeconds / 60)`

### 2. Live Flight Gate Resolver (`/api/flight`)
* **Flight Detail Query**: `/api/flight?carrier={IATA}&flightNumber={Num}&date={YYYY-MM-DD}&airportCode={IATA}`
* **Flight Route Search**: `/api/flight?action=search&airportCode={Origin}&destination={Dest}&date={YYYY-MM-DD}`
* **Integration**: Scrapes public tracking configurations from `https://flightaware.com/live/flight/{ICAO}{Num}` to fetch terminal gates.
* **Route Resolution**: Parses route results from FlightAware's `findflight` endpoint, resolving ICAO symbols back to standard IATA.

---

## 💻 Local Development

### 1. Installation
Install dependencies:
```bash
npm install
```

### 2. Running Dev Server
Launch Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Build & Production Compile
Generate a static Next.js production build:
```bash
npm run build
npm run start
```
