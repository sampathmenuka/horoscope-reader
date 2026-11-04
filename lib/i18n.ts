export type Lang = "si" | "en";
export const LANGS: readonly Lang[] = ["si", "en"];
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "handahana.locale";

export function isLang(value: unknown): value is Lang {
  return value === "si" || value === "en";
}

export const PLANET_KEYS = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
  "rahu",
  "ketu",
] as const;
export type PlanetKey = (typeof PLANET_KEYS)[number];
export type ChartBodyKey = PlanetKey | "lagna";

/** Standard abbreviations written inside Kendaraya house boxes. */
export const PLANET_ABBR: Record<ChartBodyKey, Record<Lang, string>> = {
  lagna: { si: "ල", en: "Asc" },
  sun: { si: "ර", en: "Su" },
  moon: { si: "ච", en: "Mo" },
  mars: { si: "කු", en: "Ma" },
  mercury: { si: "බු", en: "Me" },
  jupiter: { si: "ගු", en: "Ju" },
  venus: { si: "ශු", en: "Ve" },
  saturn: { si: "ශ", en: "Sa" },
  rahu: { si: "රා", en: "Ra" },
  ketu: { si: "කේ", en: "Ke" },
};

export const PLANET_NAMES: Record<ChartBodyKey, Record<Lang, string>> = {
  lagna: { si: "ලග්නය", en: "Lagna (Ascendant)" },
  sun: { si: "රවි", en: "Sun (Ravi)" },
  moon: { si: "චන්ද්‍ර", en: "Moon (Chandra)" },
  mars: { si: "කුජ", en: "Mars (Kuja)" },
  mercury: { si: "බුධ", en: "Mercury (Budha)" },
  jupiter: { si: "ගුරු", en: "Jupiter (Guru)" },
  venus: { si: "ශුක්‍ර", en: "Venus (Shukra)" },
  saturn: { si: "ශනි", en: "Saturn (Shani)" },
  rahu: { si: "රාහු", en: "Rahu" },
  ketu: { si: "කේතු", en: "Ketu" },
};

export const RASHI_NAMES: Record<Lang, readonly string[]> = {
  si: ["මේෂ", "වෘෂභ", "මිථුන", "කටක", "සිංහ", "කන්‍යා", "තුලා", "වෘශ්චික", "ධනු", "මකර", "කුම්භ", "මීන"],
  en: [
    "Mesha (Aries)",
    "Vrishabha (Taurus)",
    "Mithuna (Gemini)",
    "Kataka (Cancer)",
    "Simha (Leo)",
    "Kanya (Virgo)",
    "Tula (Libra)",
    "Vrischika (Scorpio)",
    "Dhanu (Sagittarius)",
    "Makara (Capricorn)",
    "Kumbha (Aquarius)",
    "Meena (Pisces)",
  ],
};

export const NAKSHATRA_NAMES: Record<Lang, readonly string[]> = {
  si: [
    "අස්විද", "බෙරණ", "කැති", "රෙහෙණ", "මුවසිරස", "අද", "පුනාවස", "පුෂ", "අස්ලිස",
    "මා", "පුවපල්", "උත්‍රපල්", "හත", "සිත", "සා", "විසා", "අනුර", "දෙට",
    "මුල", "පුවසල", "උත්‍රසල", "සුවණ", "දෙනට", "සියාවස", "පුවපුටුප", "උත්‍රපුටුප", "රේවතී",
  ],
  en: [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
    "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
  ],
};

export const MONTH_NAMES: Record<Lang, readonly string[]> = {
  si: ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export const WEEKDAY_NAMES: Record<Lang, readonly string[]> = {
  si: ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export type Gender = "male" | "female" | "other";
export type Dignity = "exalted" | "debilitated" | "own" | "neutral";
export type SectionKey = "summary" | "personality" | "career" | "marriage" | "future";
export const SECTION_KEYS: readonly SectionKey[] = ["summary", "personality", "career", "marriage", "future"];

export type ErrorCode =
  | "backend_unreachable"
  | "invalid_input"
  | "calc_failed"
  | "predict_failed"
  | "network";

const en = {
  appName: "Handahana",
  appTagline: "Sri Lankan horoscope & life reading",
  welcomeTitle: "Welcome to Handahana",
  welcomeSubtitle: "Choose the language for your horoscope and reading. You can change it at any time from the top bar.",
  chooseSinhala: "සිංහල (Sinhala)",
  chooseEnglish: "English",
  languageToggleLabel: "Language",

  heroTitle: "Explore your birth chart and planetary positions accurately",
  heroSubtitle: "Easily get your Lagna, horoscope chart, Navamsha, Maha Dasha and more of your astrological details.",

  formTitle: "Birth details",
  fullName: "Full name",
  fullNamePlaceholder: "e.g. Nimal Perera",
  fullNamePlaceholderFemale: "e.g. Kumari Perera",
  gender: "Gender",
  dateOfBirth: "Date of birth",
  year: "Year",
  month: "Month",
  day: "Day",
  timeOfBirth: "Exact time of birth",
  hour: "Hour",
  minute: "Minute",
  am: "AM",
  pm: "PM",
  placeOfBirth: "Place of birth",
  placeSearchPlaceholder: "e.g. Colombo, Kandy, Galle",
  placeHint: "Enter the town you were born in.",
  noTownsFound: "No matching town — choose the nearest one.",
  timeHint: "Enter the clock time as recorded in Sri Lanka at birth. Historical time zone changes (1942–2006) are applied automatically.",
  submit: "Cast my Handahana",
  calculating: "Calculating chart…",
  reset: "Clear form",

  genders: { male: "Male", female: "Female", other: "Other" } as Record<Gender, string>,

  errNameRequired: "Please enter the full name.",
  errGenderRequired: "Please select a gender.",
  errDateRequired: "Please select year, month and day of birth.",
  errDateInvalid: "That date does not exist in the calendar.",
  errDateFuture: "The date of birth cannot be in the future.",
  errTimeRequired: "Please enter the hour and minute of birth.",
  errPlaceRequired: "Please choose your town of birth from the list.",
  errors: {
    backend_unreachable: "The calculation service is not reachable. Please make sure the Python backend is running and try again.",
    invalid_input: "Some birth details are invalid. Please check the form.",
    calc_failed: "The chart could not be calculated for these details.",
    predict_failed: "The reading could not be generated. Please try again.",
    network: "Network error. Please check your connection.",
  } as Record<ErrorCode, string>,

  resultsTitle: "Horoscope",
  lagnaChart: "Lagna Chart (Rashi)",
  navamshaChart: "Navamsha Chart",
  chartCenterRashi: "Rashi",
  chartCenterNavamsha: "Navamsha",
  birthDetails: "Birth details",
  localTime: "Local time",
  utcTime: "UTC",
  utcOffset: "Time zone",
  coordinates: "Coordinates",
  ayanamsha: "Ayanamsha (Lahiri)",
  lagna: "Lagna",
  navamshaLagna: "Navamsha Lagna",
  nakshatra: "Birth star (Nakshatra)",
  pada: "Pada",
  moonSign: "Moon sign (Rashi)",
  rashiLord: "Rashi lord",
  lagnaLord: "Lagna lord",

  planetTable: "Planetary positions",
  colPlanet: "Planet",
  colRashi: "Rashi",
  colDegree: "Degree",
  colHouse: "House",
  colNakshatra: "Nakshatra",
  colNavamsha: "Navamsha",
  colStatus: "Status",
  retrograde: "Retrograde",
  dignities: { exalted: "Exalted", debilitated: "Debilitated", own: "Own sign", neutral: "—" } as Record<Dignity, string>,

  dashaTitle: "Vimshottari Maha Dasha",
  dashaBalance: "Dasha balance at birth",
  dashaCurrent: "Current",
  dashaFrom: "From",
  dashaTo: "To",
  antarDashas: "Antar Dashas (sub-periods)",
  antarShort: "Antar",
  currentMahaDasha: "Maha Dasha",
  showAntar: "Show sub-periods",
  hideAntar: "Hide sub-periods",
  years: "years",
  months: "months",
  days: "days",
  balanceFormat: (lord: string, y: number, m: number, d: number) => `${lord}: ${y} years ${m} months ${d} days`,

  predictionTitle: "Astrological reading",
  sections: {
    summary: "Birth Summary",
    personality: "Personality & Character",
    career: "Education, Career & Wealth",
    marriage: "Marriage & Relationships",
    future: "Future & Maha Dasha Analysis",
  } as Record<SectionKey, string>,
  remedies: "Recommended remedies (Shanthikarma)",
  generating: "Writing your reading…",
  regenerate: "Generate again",
  sourceLlm: "Reading written by Google Gemini from your calculated chart",
  sourceRules: "Reading generated from traditional rules",
  printPdf: "Download / Print Handahana PDF",
  printPdfShort: "Download PDF",
  printHeader: "Handahana — Horoscope Report",
  printedOn: "Prepared on",
  disclaimer:
    "This reading follows traditional Sri Lankan Jyotisha for cultural and reflective purposes. It is not a substitute for medical, legal, or financial advice.",
  footer: "Calculations: Swiss Ephemeris · Lahiri ayanamsha · Whole-sign houses",
  modeChart: "View Your Horoscope",
  modeDaily: "How is Today for You?",
  dailyTitle: "How is Today for You?",
  dailySubtitle: "Today's predictions - choose your Lagna below to see the details",
  dailyDate: "Today",
  todayNakshatra: "Today's Nakshatra",
  until: (time: string) => `until ${time}`,
  moonTransit: "Moon transiting",
  moonEnters: (rashi: string, time: string) => `enters ${rashi} at ${time}`,
  rahuKalaya: "Rahu Kalaya",
  sunriseSunset: "Sunrise · Sunset",
  timesForColombo: "Times for Colombo",
  dayRating: "Today's rating",
  jayaAnkaya: "Lucky Number",
  jayaPata: "Lucky Colour",
  subaDishawa: "Lucky Direction",
  chandrashtama: "Chandrashtama",
  chandrashtamaNote: "The Moon is in your 8th house today — postpone important decisions.",
  moonInHouse: (house: number) => `Today the Moon transits your ${houseOrdinal(house, "en")} house`,
  tomorrowAt: (time: string) => `${time} tomorrow`,
  rahuBothPeriods: (period: "AM" | "PM") => `(both times ${period})`,
  lagnaHelp: "Not sure of your Lagna? Find it from your birth time →",
  shareWhatsApp: "Share on WhatsApp",
  shareHeading: "How is Today for You?",
  shareLagna: (name: string) => `${name} Lagna`,
  yourLagna: "Your Lagna",
  checkFullChart: "Check My Full Birth Chart",
  close: "Close",
  dailyLoading: "Preparing today's readings…",
  dailySourceLlm: "Daily readings written by Google Gemini from today's planetary transits",
  dailySourceRules: "Daily readings from traditional Gochara rules",
  tryAgain: "Try again",
  // Daily directions
  maruSoolama: "Maru Soolama",
  maruSoolamaHint: "Avoid setting out on journeys in this direction today",
  subaDishawaHint: "Favourable direction for journeys today",

  // Saved profiles
  savedProfiles: "Saved profiles",
  profileHint: "available in this browser",
  saveProfile: "Save my details for future use",
  saveProfileHint: "Your details are stored on our server so you can use them again when you come back.",
  newChart: "New chart",
  removeProfile: (name: string) => `Remove ${name}`,

  // Porondam
  navPorondam: "Porondam",
  navPorondamLong: "Check Marriage Porondam",
  navDaily: "Today",
  navChart: "Birth Chart",
  sectionsLabel: "Sections",
  porondamTitle: "Marriage Porondam Check",
  porondamSubtitle: "Enter the birth details of the bride and groom to check the traditional porondam from their birth stars.",
  bride: "Bride",
  groom: "Groom",
  checkPorondam: "Check Porondam 💍",
  checkingPorondam: "Checking porondam…",
  porondamResults: "Porondam results",
  porondamScore: (passed: number, total: number) => `${passed} of ${total} porondam match`,
  verdicts: { excellent: "Excellent", good: "Favourable", average: "Average", poor: "Not favourable" } as Record<"excellent" | "good" | "average" | "poor", string>,
  porondamVerifiedNote:
    "Calculated from the 12 porondam with well-established classical rules (Nakath, Gana, Mahendra, Stree Deergha, Yoni, Rashi, Rashyadhipathi, Vashya, Rajju, Vedha, Nadi, Varna). Always confirm with a qualified astrologer before any decision.",
  majorPorondam: "Major",
  kujaDosha: "Kuja Dosha",
  kujaPresentFor: (who: string) => `Kuja Dosha in the ${who.toLowerCase()}'s chart`,
  kujaNone: "No Kuja Dosha in either chart",
  harmonySummary: "Relationship harmony",
  summaryByGemini: "Summary written by Google Gemini from the porondam results",
  summaryByRules: "Summary from the porondam results",
  moonStarLine: (nak: string, pada: number, rashi: string) => `${nak} (pada ${pada}) · Moon in ${rashi}`,
  newCheck: "Check another couple",

  // Baby names
  babyNamesTitle: "Auspicious Letters & Baby Names",
  babyNamesIntro: (nak: string, pada: number) => `Born in ${nak}, pada ${pada}. Traditionally the name begins with:`,
  padaLetters: "Letters for the four padas of this nakshatra",
  namesFor: "Names for",
  boy: "Boy",
  girl: "Girl",
  suggestNames: "Suggest 20 names",
  suggestingNames: "Finding names…",
  namesNeedKey: "Name suggestions need the Gemini API key to be configured on the server.",
  namesFailed: "Couldn't suggest names right now. Please try again.",
  namesNote: "AI-suggested names — check each meaning with family elders before choosing.",
  syllableNote: "Letters follow the traditional nakshatra-pada syllables; some families follow a local variant.",

  // Apala
  apalaTitle: "Current Apala & Remedies",
  apalaNone: "No Saturn Erashtaka or difficult Rahu transit is active now.",
  apalaAsOf: (date: string) => `Transits as of ${date}`,
  transitLine: (planet: string, rashi: string, fromMoon: number, fromLagna: number) =>
    `${planet} in ${rashi} — ${houseOrdinal(fromMoon, "en")} from the Moon, ${houseOrdinal(fromLagna, "en")} from the Lagna`,
  severity: { high: "Significant", medium: "Moderate" } as Record<"high" | "medium", string>,
  preparingRemedies: "Preparing remedies…",
  remediesByGemini: "Remedies suggested by Google Gemini",
  remediesTraditional: "Traditional remedies",

  // Printable Kendaraya
  downloadPdf: "Download PDF",
  printFullReading: "Print full reading",
  printShort: "Print",
  kendarayaHeading: "Handahana",
  basicDetails: "Birth details",
};

export type Dictionary = typeof en;

const si: Dictionary = {
  appName: "හඳහන",
  appTagline: "ශ්‍රී ලාංකේය කේන්දර සහ පලාපල",
  welcomeTitle: "හඳහන වෙත සාදරයෙන් පිළිගනිමු",
  welcomeSubtitle: "ඔබේ කේන්දරය සහ පලාපල සඳහා භාෂාව තෝරන්න. ඉහළ තීරුවෙන් ඕනෑම වේලාවක එය වෙනස් කළ හැක.",
  chooseSinhala: "සිංහල (Sinhala)",
  chooseEnglish: "English",
  languageToggleLabel: "භාෂාව",

  heroTitle: "ඔබේ ජන්ම පත්‍රය සහ ග්‍රහ පිහිටීම් නිවැරදිව විමසා බලන්න",
  heroSubtitle: "ඔබේ ලග්නය, කේන්දරය, නවාංශකය සහ මහ දශා ඇතුළු ජ්‍යොතිෂ්‍ය තොරතුරු පහසුවෙන් ලබාගන්න.",

  formTitle: "ඔබේ උපන් තොරතුරු ඇතුළත් කරන්න",
  fullName: "සම්පූර්ණ නම",
  fullNamePlaceholder: "උදා: නිමල් පෙරේරා",
  fullNamePlaceholderFemale: "උදා: කුමාරි පෙරේරා",
  gender: "ස්ත්‍රී/පුරුෂ භාවය",
  dateOfBirth: "උපන් දිනය",
  year: "වර්ෂය",
  month: "මාසය",
  day: "දිනය",
  timeOfBirth: "නිවැරදි උපන් වේලාව",
  hour: "පැය",
  minute: "මිනිත්තු",
  am: "පෙ.ව.",
  pm: "ප.ව.",
  placeOfBirth: "උපන් ස්ථානය",
  placeSearchPlaceholder: "උදා: කොළඹ, මහනුවර, ගාල්ල",
  placeHint: "ඔබ උපන් නගරය ඇතුළත් කරන්න.",
  noTownsFound: "ගැළපෙන නගරයක් හමු නොවීය — ළඟම ඇති නගරය තෝරන්න.",
  timeHint: "උප්පැන්න සහතිකයේ හෝ වේලාසටහනේ සඳහන් නිවැරදි උපන් වේලාව ඇතුළත් කරන්න. (1942–2006 කාලයේ සිදුවූ වේලා වෙනස්කම් ස්වයංක්‍රීයව නිවැරදි කෙරේ).",
  submit: "මගේ කේන්දරය සහ පලාපල බලන්න ✨",
  calculating: "කේන්දරය ගණනය කරමින්…",
  reset: "මුල සිට ඇතුළත් කරන්න",

  genders: { male: "පුරුෂ", female: "ස්ත්‍රී", other: "වෙනත්" },

  errNameRequired: "කරුණාකර සම්පූර්ණ නම ඇතුළත් කරන්න.",
  errGenderRequired: "කරුණාකර ස්ත්‍රී/පුරුෂ භාවය තෝරන්න.",
  errDateRequired: "කරුණාකර උපන් වර්ෂය, මාසය සහ දිනය තෝරන්න.",
  errDateInvalid: "එම දිනය දින දර්ශනයේ නොපවතී.",
  errDateFuture: "උපන් දිනය අනාගත දිනයක් විය නොහැක.",
  errTimeRequired: "කරුණාකර උපන් පැය සහ මිනිත්තු ඇතුළත් කරන්න.",
  errPlaceRequired: "කරුණාකර ලැයිස්තුවෙන් ඔබ උපන් නගරය තෝරන්න.",
  errors: {
    backend_unreachable: "ගණනය කිරීමේ සේවාවට සම්බන්ධ විය නොහැක. Python සේවාව ක්‍රියාත්මක දැයි පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
    invalid_input: "උපන් විස්තර කිහිපයක් වලංගු නැත. කරුණාකර පෝරමය පරීක්ෂා කරන්න.",
    calc_failed: "මෙම විස්තර සඳහා කේන්දරය ගණනය කළ නොහැකි විය.",
    predict_failed: "පලාපල සකස් කළ නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.",
    network: "ජාල දෝෂයකි. කරුණාකර ඔබේ සම්බන්ධතාව පරීක්ෂා කරන්න.",
  },

  resultsTitle: "කේන්දරය",
  lagnaChart: "ලග්න කේන්දරය",
  navamshaChart: "නවාංශක කේන්දරය",
  chartCenterRashi: "ලග්න",
  chartCenterNavamsha: "නවාංශක",
  birthDetails: "උපන් විස්තර",
  localTime: "දේශීය වේලාව",
  utcTime: "UTC වේලාව",
  utcOffset: "වේලා කලාපය",
  coordinates: "ඛණ්ඩාංක",
  ayanamsha: "අයනාංශය (ලාහිරි)",
  lagna: "ලග්නය",
  navamshaLagna: "නවාංශක ලග්නය",
  nakshatra: "උපන් නැකත",
  pada: "පාදය",
  moonSign: "චන්ද්‍ර රාශිය",
  rashiLord: "රාශි අධිපති",
  lagnaLord: "ලග්නාධිපති",

  planetTable: "ග්‍රහ පිහිටීම්",
  colPlanet: "ග්‍රහයා",
  colRashi: "රාශිය",
  colDegree: "අංශක",
  colHouse: "භාවය",
  colNakshatra: "නැකත",
  colNavamsha: "නවාංශකය",
  colStatus: "බලය",
  retrograde: "වක්‍ර",
  dignities: { exalted: "උච්ච", debilitated: "නීච", own: "ස්වක්ෂේත්‍ර", neutral: "—" },

  dashaTitle: "විංශෝත්තරී මහ දශා",
  dashaBalance: "උපතේදී ඉතිරි දශාව",
  dashaCurrent: "වර්තමාන",
  dashaFrom: "සිට",
  dashaTo: "දක්වා",
  antarDashas: "අන්තර් දශා",
  antarShort: "අන්තර්",
  currentMahaDasha: "මහ දශාව",
  showAntar: "අන්තර් දශා පෙන්වන්න",
  hideAntar: "අන්තර් දශා සඟවන්න",
  years: "අවුරුදු",
  months: "මාස",
  days: "දින",
  balanceFormat: (lord: string, y: number, m: number, d: number) => `${lord} මහ දශාව: අවුරුදු ${y} මාස ${m} දින ${d}`,

  predictionTitle: "ජ්‍යොතිෂ පලාපල",
  sections: {
    summary: "මූලික විස්තර",
    personality: "චරිත ලක්ෂණ",
    career: "අධ්‍යාපනය සහ රැකියාව",
    marriage: "විවාහය සහ පවුල් ජීවිතය",
    future: "ඉදිරි කාලය සහ මහ දශා පලාපල",
  },
  remedies: "නිර්දේශිත ශාන්තිකර්ම",
  generating: "ඔබේ පලාපල ලියමින්…",
  regenerate: "නැවත සකසන්න",
  sourceLlm: "ගණනය කළ කේන්දරය මත Google Gemini විසින් ලියූ පලාපල",
  sourceRules: "සම්ප්‍රදායික නීති අනුව සකස් කළ පලාපල",
  printPdf: "හඳහන PDF ලෙස බාගන්න / මුද්‍රණය කරන්න",
  printPdfShort: "PDF බාගන්න",
  printHeader: "හඳහන — කේන්දර වාර්තාව",
  printedOn: "සකස් කළ දිනය",
  disclaimer:
    "මෙම පලාපල ශ්‍රී ලාංකේය සම්ප්‍රදායික ජ්‍යොතිෂය අනුව සංස්කෘතික හා ආවර්ජනීය අරමුණු සඳහා පමණි. වෛද්‍ය, නීති හෝ මූල්‍ය උපදෙස් සඳහා ආදේශකයක් නොවේ.",
  footer: "ගණනය: Swiss Ephemeris · ලාහිරි අයනාංශය · සම්පූර්ණ රාශි භාව ක්‍රමය",
  modeChart: "ඔබේ හඳහන බලන්න",
  modeDaily: "අද දවස ඔබට කොහොමද?",
  dailyTitle: "අද දවස ඔබට කොහොමද?",
  dailySubtitle: "අද දවසේ පලාපල - විස්තර දැනගැනීමට පහතින් ලග්නය තෝරන්න",
  dailyDate: "අද",
  todayNakshatra: "අද නැකත",
  until: (time: string) => `${time} දක්වා`,
  moonTransit: "චන්ද්‍රයා ගමන් කරන රාශිය",
  moonEnters: (rashi: string, time: string) => `${time} සිට ${rashi}`,
  rahuKalaya: "රාහු කාලය",
  sunriseSunset: "හිරු උදාව · බැසීම",
  timesForColombo: "කොළඹට අනුව වේලාවන්",
  dayRating: "අද දවසේ තත්ත්වය",
  jayaAnkaya: "ජය අංකය",
  jayaPata: "ජය පාට",
  subaDishawa: "සුබ දිශාව",
  chandrashtama: "චන්ද්‍රාෂ්ටමය",
  chandrashtamaNote: "අද චන්ද්‍රයා ඔබේ අටවන භාවයේ — වැදගත් තීරණ කල් දමන්න.",
  moonInHouse: (house: number) => `අද සඳු ගමන් කරන්නේ ඔබේ ${house} වැන්නේය`,
  tomorrowAt: (time: string) => `හෙට ${time}`,
  rahuBothPeriods: () => "(දිවා සහ රාත්‍රී දෙකටම අදාළ වේ)",
  lagnaHelp: "ඔබේ ලග්නය හරියටම දන්නේ නැද්ද? උපන් වේලාවෙන් ලග්නය බලාගන්න →",
  shareWhatsApp: "WhatsApp හරහා බෙදාගන්න",
  shareHeading: "අද දවස ඔබට කොහොමද?",
  shareLagna: (name: string) => `${name} ලග්නය`,
  yourLagna: "ඔබේ ලග්නය",
  checkFullChart: "මගේ සම්පූර්ණ හඳහන බලන්න",
  close: "වසන්න",
  dailyLoading: "අද පලාපල සකසමින්…",
  dailySourceLlm: "අද ග්‍රහ ගෝචරය මත Google Gemini විසින් ලියූ දෛනික පලාපල",
  dailySourceRules: "සම්ප්‍රදායික ගෝචර නීති අනුව සකස් කළ දෛනික පලාපල",
  tryAgain: "නැවත උත්සාහ කරන්න",
  // Daily directions
  maruSoolama: "මරු සූලම",
  maruSoolamaHint: "අද මෙම දිශාවට ගමන් ආරම්භ කිරීමෙන් වළකින්න",
  subaDishawaHint: "අද ගමන් බිමන් සඳහා සුබ දිශාව",

  // Saved profiles
  savedProfiles: "සුරැකි පැතිකඩ",
  profileHint: "මෙම බ්‍රව්සරයේ භාවිත කළ හැකිය",
  saveProfile: "මගේ තොරතුරු ඉදිරි භාවිතය සඳහා සුරකින්න",
  saveProfileHint: "නැවත පැමිණෙන විට භාවිත කිරීමට ඔබේ තොරතුරු අපගේ සේවාදායකයේ සුරැකේ.",
  newChart: "නව කේන්දරයක්",
  removeProfile: (name: string) => `${name} ඉවත් කරන්න`,

  // Porondam
  navPorondam: "පොරොන්දම්",
  navPorondamLong: "විවාහ පොරොන්දම් බලන්න",
  navDaily: "අද දවස",
  navChart: "හඳහන",
  sectionsLabel: "අංශ",
  porondamTitle: "විවාහ පොරොන්දම් පරීක්ෂාව",
  porondamSubtitle: "මනාලියගේ සහ මනාලයාගේ උපන් තොරතුරු ඇතුළත් කර, උපන් නැකැත් අනුව සම්ප්‍රදායික පොරොන්දම් පරීක්ෂා කරන්න.",
  bride: "මනාලිය",
  groom: "මනාලයා",
  checkPorondam: "පොරොන්දම් බලන්න 💍",
  checkingPorondam: "පොරොන්දම් පරීක්ෂා කරමින්…",
  porondamResults: "පොරොන්දම් ප්‍රතිඵල",
  porondamScore: (passed: number, total: number) => `පොරොන්දම් ${total}න් ${passed}ක් ගැළපේ`,
  verdicts: { excellent: "ඉතා සුබයි", good: "සුබයි", average: "මධ්‍යමයි", poor: "අසුබයි" },
  porondamVerifiedNote:
    "සම්භාව්‍ය නීති හොඳින් තහවුරු වී ඇති පොරොන්දම් 12 අනුව ගණනය කර ඇත (නැකැත්, ගණ, මහේන්ද්‍ර, ස්ත්‍රී දීර්ඝ, යෝනි, රාශි, රාශ්‍යාධිපති, වශ්‍ය, රජ්ජු, වේධ, නාඩි, වර්ණ). කිසියම් තීරණයකට පෙර සුදුසුකම් ලත් ජ්‍යොතිෂවේදියෙකුගෙන් අනිවාර්යයෙන් විමසන්න.",
  majorPorondam: "ප්‍රධාන",
  kujaDosha: "කුජ දෝෂය",
  kujaPresentFor: (who: string) => `${who}ගේ කේන්දරයේ කුජ දෝෂය ඇත`,
  kujaNone: "කේන්දර දෙකේම කුජ දෝෂය නැත",
  harmonySummary: "සබඳතාවයේ සමගිය",
  summaryByGemini: "පොරොන්දම් ප්‍රතිඵල මත Google Gemini විසින් ලියූ සාරාංශය",
  summaryByRules: "පොරොන්දම් ප්‍රතිඵල අනුව සාරාංශය",
  moonStarLine: (nak: string, pada: number, rashi: string) => `${nak} (${pada} පාදය) · චන්ද්‍රයා ${rashi} රාශියේ`,
  newCheck: "තවත් යුවළක් පරීක්ෂා කරන්න",

  // Baby names
  babyNamesTitle: "සුබ අකුරු සහ නම්",
  babyNamesIntro: (nak: string, pada: number) => `${nak} නැකතේ ${pada} වන පාදයේ උපත ලැබූ බැවින් නම ආරම්භ කිරීමට සුබ අකුර:`,
  padaLetters: "මෙම නැකතේ පාද හතරේ අකුරු",
  namesFor: "නම් සොයන්නේ",
  boy: "පුතෙකුට",
  girl: "දියණියකට",
  suggestNames: "නම් 20ක් යෝජනා කරන්න",
  suggestingNames: "නම් සොයමින්…",
  namesNeedKey: "නම් යෝජනා සඳහා සේවාදායකයේ Gemini API යතුර සකසා තිබිය යුතුය.",
  namesFailed: "මේ මොහොතේ නම් යෝජනා කළ නොහැකි විය. නැවත උත්සාහ කරන්න.",
  namesNote: "AI මගින් යෝජිත නම් — තෝරා ගැනීමට පෙර එක් එක් නමේ අර්ථය පවුලේ වැඩිහිටියන් සමඟ සලකා බලන්න.",
  syllableNote: "අකුරු සම්ප්‍රදායික නැකැත් පාද අක්ෂර අනුව දක්වා ඇත; සමහර පවුල් ප්‍රාදේශීය වෙනස් ක්‍රමයක් අනුගමනය කරයි.",

  // Apala
  apalaTitle: "අපල සහ ශාන්තිකර්ම",
  apalaNone: "දැනට සෙනසුරු ඒරාෂ්ටකයක් හෝ අපහසු රාහු ගෝචරයක් ක්‍රියාත්මක නොවේ.",
  apalaAsOf: (date: string) => `${date} දිනට ග්‍රහ ගෝචරය`,
  transitLine: (planet: string, rashi: string, fromMoon: number, fromLagna: number) =>
    `${planet} ${rashi} රාශියේ — ජන්ම රාශියෙන් ${fromMoon} වැන්නේ, ලග්නයෙන් ${fromLagna} වැන්නේ`,
  severity: { high: "බලවත්", medium: "මධ්‍යම" },
  preparingRemedies: "ශාන්තිකර්ම සකසමින්…",
  remediesByGemini: "Google Gemini විසින් යෝජිත ශාන්තිකර්ම",
  remediesTraditional: "සම්ප්‍රදායික ශාන්තිකර්ම",

  // Printable Kendaraya
  downloadPdf: "PDF ලෙස ඩවුන්ලෝඩ් කරන්න",
  printFullReading: "සම්පූර්ණ පලාපල මුද්‍රණය කරන්න",
  printShort: "මුද්‍රණය",
  kendarayaHeading: "හඳහන",
  basicDetails: "උපන් තොරතුරු",
};

export const DICTIONARIES: Record<Lang, Dictionary> = { si, en };

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

/** 23.5 -> 23°30' */
export function formatDegree(value: number): string {
  const deg = Math.floor(value);
  const min = Math.floor((value - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}'`;
}

/**
 * "03:46" or an ISO datetime -> 12-hour clock that can't be misread:
 * si "පෙ.ව. 03:46" / "ප.ව. 05:50", en "3:46 AM" / "5:50 PM".
 */
export function formatSriLankanTime(time24: string, lang: Lang): string {
  const hhmm = time24.length > 5 ? time24.slice(11, 16) : time24;
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return lang === "si"
    ? `${period === "AM" ? "පෙ.ව." : "ප.ව."} ${String(h12).padStart(2, "0")}:${mm}`
    : `${h12}:${mm} ${period}`;
}

/**
 * A time range with the AM/PM marker shown once when both ends share it
 * ("පෙ.ව. 07:26 – 08:55"), and on each end when the range crosses noon.
 */
export function formatSriLankanTimeRange(
  start: string,
  end: string,
  lang: Lang,
): { text: string; sharedPeriod: "AM" | "PM" | null } {
  const hour = (t: string) => Number((t.length > 5 ? t.slice(11, 16) : t).slice(0, 2));
  const pStart = hour(start) < 12 ? "AM" : "PM";
  const pEnd = hour(end) < 12 ? "AM" : "PM";
  const startText = formatSriLankanTime(start, lang);
  const endText = formatSriLankanTime(end, lang);
  if (pStart !== pEnd) return { text: `${startText} – ${endText}`, sharedPeriod: null };
  // Drop the repeated marker from the end time.
  const bareEnd = lang === "si" ? endText.replace(/^\S+ /, "") : endText.replace(/ (AM|PM)$/, "");
  const text = lang === "si" ? `${startText} – ${bareEnd}` : `${startText.replace(/ (AM|PM)$/, "")} – ${bareEnd} ${pEnd}`;
  return { text, sharedPeriod: pStart };
}

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return lang === "si" ? `${y} ${MONTH_NAMES.si[m - 1]} ${d}` : `${d} ${MONTH_NAMES.en[m - 1].slice(0, 3)} ${y}`;
}

export function houseOrdinal(n: number, lang: Lang): string {
  if (lang === "si") return `${n} වන`;
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}
