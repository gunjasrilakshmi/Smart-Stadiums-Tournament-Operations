# 🏆 FIFA World Cup 2026™ Stadium Operations & Fan Hub

An optimized, full-stack, Generative AI-powered platform designed to enhance stadium operations, crowds, accessibility, and fan navigation at MetLife Stadium (N.Y./N.J. Stadium) during the **FIFA World Cup 2026™**.

This solution leverages the latest `@google/genai` SDK and **Gemini 3.5 Flash** to streamline crowd-flow control, instantly dispatch emergency operations, automate multilingual public broadcasts, and provide real-time tactical advice to stadium commanders.

---

## 🌟 Key Features

1. **🎫 Fan Companion & Smart Navigation**
   * **Interactive Vector Blueprint**: Clickable stadium gates showing live queue wait times and crowd flow status.
   * **Multi-Language AI Assistant**: Answers queries in English, Spanish, French, Arabic, or German instantly regarding transit, sensory rooms, wheelchair assistance, and stadium food.
   * **Zero-Waste Sustainability Cup Rewards**: Earn discount rewards dynamically tracked via cup returns.

2. **🙋 Volunteer Portal & Incident Triage**
   * **AI-Powered Incident Dispatch**: Volunteers can report physical hazards (e.g. wet spills, broken gate scanners) in plain natural text.
   * **Automatic Categorization & Priority Routing**: Gemini instantly analyzes, prioritizes, categorizes, and assigns tasks to specialized crews.

3. **👔 Command Center (Operations & Tactical Support)**
   * **Dynamic Crowd Simulation**: Test stadium bottlenecks by switching between `NORMAL`, `PEAK`, and `CRITICAL` crowd levels.
   * **PA Broadcast Studio**: Draft an announcement in English and get instant translated broadcasts across standard World Cup languages.
   * **Gemini Tactical Decision Support**: Ask the commander's strategic advisor for real-time complex scenarios (e.g., train station delays, weather alerts).

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: React 18+ (Vite), TypeScript, Tailwind CSS, Lucide Icons, and responsive design.
* **Backend**: Node.js, Express, ESBuild compiler, TSX dev runtime.
* **AI Engine**: `@google/genai` with **Gemini 3.5 Flash** (highly optimized latency).
* **Security & Port Binding**: Complete server-side proxy implementation routing all API queries through `/api/*` to strictly shield the `GEMINI_API_KEY` from client browsers.

---

## 🚀 How to Run Locally

### 1. Configure the Environment
Copy `.env.example` to `.env` and add your Gemini API key:
```bash
GEMINI_API_KEY="your_api_key_here"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The app will run on `http://localhost:3000`.

---

## 🏆 Competition Effectiveness Check
* **Graceful Degradation**: If no API key is specified, the application automatically triggers fallback logic (predefined heuristics/local rules) to ensure a flawless experience.
* **Performance Focused**: No HMR flicker, single-file server builds via esbuild for fast cold-starts.
* **Pristine UI**: Balanced typography, high-contrast dark palette, tactile interactive feedback, and desktop-to-mobile fluid responsiveness.
