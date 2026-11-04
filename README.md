# Handahana · හඳහන

A bilingual (Sinhala / English) Sri Lankan horoscope (Handahana / Kendaraya) web app.

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **Calculations:** Python FastAPI + pyswisseph (sidereal Lahiri, whole-sign houses)
- **Readings:** Google Gemini (when `GEMINI_API_KEY` or `GOOGLE_API_KEY` is set) or a built-in rule-based engine

## Running locally

### 1. Calculation service (Python 3.10+)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

`tzdata` is required on Windows, where Python's `zoneinfo` has no system time zone database.

Optional settings:
- `SE_EPHE_PATH`: a folder of Swiss Ephemeris `.se1` files. Without it, the built-in Moshier ephemeris is used, which is accurate to under an arcsecond for these planets.
- `CORS_ORIGINS`: allowed origins for direct browser calls (default `http://localhost:3000`).

### 2. Web app

```bash
cp .env.example .env.local   # then add GEMINI_API_KEY (or GOOGLE_API_KEY) for AI-written readings
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

1. The browser posts birth details to `/api/chart`. That route validates them and proxies them to FastAPI `POST /api/chart`.
2. FastAPI converts Sri Lankan clock time to UTC with `ZoneInfo("Asia/Colombo")`. This covers the +05:30 / +06:00 / +06:30 changes of 1996–2006 and earlier eras. It then computes:
   - Lagna and planets
   - the Rashi (D1) and Navamsha (D9) charts
   - the Nakshatra and pada
   - the Vimshottari Maha Dasha and Antar Dasha timeline
3. The browser posts that chart to `/api/predict` with the active language and gets back five sections plus remedies.
   - With an API key, Gemini writes the reading from a fact digest of the chart, as schema-checked JSON.
   - On a missing key, an error or a refusal, the rule engine in `lib/ruleEngine.ts` writes it instead.

Readings are cached per language, so switching languages keeps the form and chart and fetches each language's reading only once.

### Daily horoscope ("අද දවස ඔබට කොහොමද?")

1. FastAPI `GET /api/daily-transits[?day=YYYY-MM-DD]` returns, for Colombo:
   - sunrise and sunset, and Rahu Kalaya (the weekday's eighth of the daytime);
   - today's nakshatra and when it ends;
   - the Moon's sign and when it changes;
   - the sidereal positions of all nine grahas at sunrise.
2. `GET /api/daily-horoscope?lang=si|en` works out, for each of the 12 Lagnas:
   - the house of each planet;
   - the day rating, led by the Moon's house (Chandrashtama when it is the 8th);
   - the lucky number, colour (with its hex code) and direction, from the day's favourable graha.

   Gemini (`GEMINI_DAILY_MODEL`, default `gemini-flash-latest`) writes the 12 readings. Without a key, or if Gemini fails, short rule-based readings are used instead.
3. Results are cached per `{date}-{lang}` in memory and in `.cache/daily-horoscope/`, so Gemini runs at most once a day per language. Rule-based results are cached for 10 minutes only, so a newly added key takes effect quickly.

### More features

- **Saved profiles:** tick "save this profile" on the form to keep a person's birth details as a quick-select chip. They are stored only in that browser's `localStorage` (`lib/profiles.ts`).
- **Daily directions:** the daily banner shows මරු සූලම (Maru Soolama) by weekday (Sun/Fri West, Mon/Sat East, Tue/Wed North, Thu South) and the සුබ දිශාව opposite it. Both tables are in `backend/main.py` (`MARU_SOOLAMA`, `SUBA_DISHAWA`).
- **Porondam (`/porondam`):** FastAPI `POST /api/porondam` calculates the 12 porondam with well-established classical rules: Nakath, Gana, Mahendra, Stree Deergha, Yoni, Rashi, Rashyadhipathi, Vashya, Rajju, Vedha, Nadi and Varna. It also checks Kuja Dosha. The rule tables are plain data, so more porondam can be added from a trusted lithaya. Gemini writes the harmony summary, with a rule-based fallback.
- **Apala:** each chart includes the current Saturn transit (Erashtaka 12/1/2 from the Janma Rashi, Ashtama, Lagna) and difficult Rahu transits. When an apala is active, a server action (`app/actions/apala.ts`) asks Gemini for Sri Lankan remedies, falling back to traditional ones.
- **සුබ අකුරු and names:** `lib/nameSyllables.ts` maps each nakshatra pada to its starting syllable. A server action (`app/actions/babyNames.ts`) asks Gemini for 20 names starting with it.
- **Kendaraya PDF:** "PDF ලෙස ඩවුන්ලෝඩ් කරන්න" prints a single-page A4 Handahana with a Liyawela border (`components/PrintableHandahana.tsx`). "Print full reading" prints the full report. The two layouts are chosen through `lib/print.ts`.

### Gemini notes

- All calls go through `lib/gemini.ts`, which uses structured JSON output and low thinking.
- Each call is time-limited: 45 s by default, 60 s for the daily batch and 120 s for the full reading.
- Overload errors (429 and 5xx) get one retry.
- If a call times out or fails, the visitor gets the rule-based version instead of waiting.
- Models default to the `gemini-flash-latest` alias, because pinned versions get retired (for example, `gemini-2.5-flash` is no longer available to new keys).

### Troubleshooting

If a CSS change doesn't appear in `npm run dev`, stop the server, delete `.next/cache` and start it again. Production builds don't use the Turbopack filesystem cache (see `next.config.ts`).

## Layout

```
backend/main.py            FastAPI + pyswisseph calculation service
backend/requirements.txt
data/sriLankaTowns.json    54 towns with lat/lon, Sinhala & English names
lib/i18n.ts                Dictionaries, rashi/nakshatra/planet names, abbreviations
lib/sriLankaTowns.ts       Typed town list + bilingual search
lib/types.ts               zod schemas shared by routes and UI
lib/chartFacts.ts          Derived facts + the LLM chart digest
lib/astroData.ts           Bilingual interpretation tables and remedies
lib/ruleEngine.ts          Rule-based reading generator
context/LanguageContext.tsx Language state, cookie + localStorage, first-visit modal
components/                Navbar, LanguageModal, BirthForm, TownSelect,
                           SriLankanChart, ChartDetails, DashaTimeline,
                           PredictionView, HandahanaApp
app/api/chart/route.ts     Proxy to FastAPI
app/api/predict/route.ts   Gemini / rule-based reading
```

## Printing

**Download / Print Handahana PDF** opens the browser print dialog. The print stylesheet:

- uses a light page and expands all five reading sections;
- keeps the self-hosted Noto Sans Sinhala font;
- turns off letter-spacing, justification and synthetic bold, so Sinhala conjuncts such as ශ්‍රී or ක්‍ර don't break apart.

Choose "Save as PDF" in the dialog to download.
