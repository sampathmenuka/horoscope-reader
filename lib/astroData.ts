import type { Lang, PlanetKey } from "@/lib/i18n";

type Bi = Record<Lang, string>;

/** Lord of each sign, Mesha (0) … Meena (11). */
export const RASHI_LORDS: readonly PlanetKey[] = [
  "mars", "venus", "mercury", "moon", "sun", "mercury",
  "venus", "mars", "jupiter", "saturn", "saturn", "jupiter",
];

export const BENEFICS: readonly PlanetKey[] = ["jupiter", "venus", "mercury", "moon"];

/** Ascendant temperament, Mesha … Meena. */
export const LAGNA_TRAITS: readonly Bi[] = [
  {
    en: "Mesha Lagna gives a courageous, quick and pioneering nature. You like to lead, act decisively and dislike delay, though patience must be cultivated.",
    si: "මේෂ ලග්නය නිසා ඔබ නිර්භීත, ඉක්මන් සහ නව දේ ආරම්භ කිරීමට පෙළඹෙන අයෙකි. නායකත්වය දීමට සහ තීරණාත්මකව ක්‍රියා කිරීමට කැමති වුවද, ඉවසීම වර්ධනය කර ගැනීම වැදගත් වේ.",
  },
  {
    en: "Vrishabha Lagna gives a steady, patient and dependable nature with a love of beauty, comfort and security. Once committed, you rarely give up.",
    si: "වෘෂභ ලග්නය ස්ථාවර, ඉවසිලිවන්ත සහ විශ්වාසවන්ත ගතිගුණ ලබා දෙයි. සුන්දරත්වයට, සුවපහසුවට සහ ආරක්ෂාවට ඇල්මක් ඇති ඔබ, වරක් පටන් ගත් දෙයක් පහසුවෙන් අත් නොහරියි.",
  },
  {
    en: "Mithuna Lagna makes you curious, communicative and versatile. You learn quickly, enjoy ideas and conversation, and do well where intellect and adaptability are valued.",
    si: "මිථුන ලග්නය නිසා ඔබ කුතුහලයෙන් පිරි, කතාබහට දක්ෂ සහ බහුවිධ හැකියාවන් ඇති අයෙකි. ඉක්මනින් ඉගෙන ගන්නා ඔබට බුද්ධිය සහ අනුවර්තනය අගය කරන තැන්වල සාර්ථක විය හැක.",
  },
  {
    en: "Kataka Lagna gives a caring, sensitive and intuitive nature. Home, family and emotional security matter deeply, and you instinctively protect those you love.",
    si: "කටක ලග්නය සැලකිලිමත්, සංවේදී සහ අන්තර්ඥානයෙන් යුත් ගතිගුණ ලබා දෙයි. නිවස, පවුල සහ මානසික ආරක්ෂාව ඔබට ඉතා වැදගත් වන අතර ආදරය කරන අය ආරක්ෂා කිරීම ඔබේ ස්වභාවයයි.",
  },
  {
    en: "Simha Lagna gives dignity, generosity and natural authority. You carry yourself with confidence, seek recognition and are loyal and warm-hearted to your own.",
    si: "සිංහ ලග්නය ගෞරවය, ත්‍යාගශීලීභාවය සහ ස්වභාවික අධිකාරය ලබා දෙයි. ආත්ම විශ්වාසයෙන් හැසිරෙන ඔබ පිළිගැනීමට කැමති අතර, තමන්ගේ අයට පක්ෂපාතී සහ උණුසුම් හදවතක් ඇත.",
  },
  {
    en: "Kanya Lagna gives an analytical, careful and service-minded nature. You notice detail, value order and health, and are happiest when being genuinely useful.",
    si: "කන්‍යා ලග්නය විශ්ලේෂණාත්මක, පරිස්සම් සහ සේවා මනසක් ලබා දෙයි. සියුම් දේ නිරීක්ෂණය කරන ඔබ පිළිවෙළ සහ සෞඛ්‍යය අගය කරන අතර, අන් අයට සැබෑ ලෙස ප්‍රයෝජනවත් වන විට වඩාත් සතුටු වේ.",
  },
  {
    en: "Tula Lagna gives charm, fairness and a strong sense of balance. You value partnership and harmony and have a natural gift for diplomacy and aesthetics.",
    si: "තුලා ලග්නය ආකර්ෂණීය බව, සාධාරණත්වය සහ සමබරතාව පිළිබඳ දැඩි හැඟීමක් ලබා දෙයි. සහයෝගීතාවට සහ සමගියට ප්‍රිය කරන ඔබට රාජ්‍ය තාන්ත්‍රික කුසලතා සහ කලාත්මක රුචියක් ඇත.",
  },
  {
    en: "Vrischika Lagna gives depth, intensity and determination. You are perceptive and private, feel things strongly, and have great power to transform yourself.",
    si: "වෘශ්චික ලග්නය ගැඹුර, තීව්‍රතාව සහ අධිෂ්ඨානය ලබා දෙයි. තියුණු නිරීක්ෂණ ශක්තියක් ඇති, රහස්‍යභාවයට කැමති ඔබ දේවල් ගැඹුරින් දැනෙන අතර තමා පරිවර්තනය කර ගැනීමේ විශාල හැකියාවක් ඇත.",
  },
  {
    en: "Dhanu Lagna gives an optimistic, principled and freedom-loving nature. Learning, faith, travel and teaching attract you, and you are generous with advice.",
    si: "ධනු ලග්නය සුබවාදී, ප්‍රතිපත්තිගරුක සහ නිදහසට ප්‍රිය ගතිගුණ ලබා දෙයි. අධ්‍යාපනය, ආගමික ශ්‍රද්ධාව, සංචාර සහ ඉගැන්වීම ඔබව ආකර්ෂණය කරන අතර අනුන්ට උපදෙස් දීමට ත්‍යාගශීලී වේ.",
  },
  {
    en: "Makara Lagna gives discipline, responsibility and practical ambition. You build slowly but surely, and your status tends to rise steadily with age.",
    si: "මකර ලග්නය විනය, වගකීම සහ ප්‍රායෝගික අභිලාෂය ලබා දෙයි. සෙමින් නමුත් ස්ථිරව ගොඩනඟන ඔබේ තත්ත්වය වයස යත්ම ක්‍රමයෙන් ඉහළ යයි.",
  },
  {
    en: "Kumbha Lagna gives an independent, humanitarian and original mind. You think ahead of your time, value friendship and community, and work well for larger causes.",
    si: "කුම්භ ලග්නය ස්වාධීන, මානුෂීය සහ නව අදහස් සහිත මනසක් ලබා දෙයි. කාලයට ඉදිරියෙන් සිතන ඔබ මිත්‍රත්වය සහ සමාජය අගය කරන අතර පොදු අරමුණු සඳහා හොඳින් කැප වේ.",
  },
  {
    en: "Meena Lagna gives compassion, imagination and spiritual sensitivity. You are gentle and adaptable, drawn to art, devotion and helping those in need.",
    si: "මීන ලග්නය කරුණාව, පරිකල්පනය සහ ආධ්‍යාත්මික සංවේදීතාව ලබා දෙයි. මෘදු සහ අනුවර්තනය වන ඔබ කලාවට, භක්තියට සහ අසරණයන්ට උදව් කිරීමට නැඹුරු වේ.",
  },
];

/** Emotional nature from the Moon sign (Rashi), Mesha … Meena. */
export const MOON_TRAITS: readonly Bi[] = [
  { en: "Emotionally you are direct and enthusiastic, quick to react and quick to forgive.", si: "මානසිකව ඔබ සෘජු සහ උද්යෝගිමත් වන අතර ඉක්මනින් ප්‍රතිචාර දක්වා ඉක්මනින්ම සමාව දෙයි." },
  { en: "Emotionally you are calm and loyal, finding peace in stability, good food and familiar surroundings.", si: "මානසිකව ඔබ සන්සුන් සහ පක්ෂපාතී වන අතර ස්ථාවරත්වය, රසවත් ආහාර සහ හුරුපුරුදු පරිසරය තුළ සැනසීම සොයයි." },
  { en: "Emotionally you are lively and restless, needing variety, conversation and mental stimulation.", si: "මානසිකව ඔබ ප්‍රාණවත් සහ නොසන්සුන් වන අතර විවිධත්වය, කතාබහ සහ මානසික උත්තේජනය අවශ්‍ය වේ." },
  { en: "The Moon is in its own sign, giving deep feeling, strong memory and close attachment to mother and home.", si: "චන්ද්‍රයා ස්වක්ෂේත්‍රයේ සිටින බැවින් ගැඹුරු හැඟීම්, හොඳ මතක ශක්තිය සහ මව හා නිවස කෙරෙහි දැඩි බැඳීමක් ඇත." },
  { en: "Emotionally you are proud and warm-hearted, needing appreciation and respect from those around you.", si: "මානසිකව ඔබ ආත්මාභිමානී සහ උණුසුම් හදවතක් ඇති අයෙකු වන අතර අවට අයගෙන් අගය කිරීම සහ ගෞරවය අපේක්ෂා කරයි." },
  { en: "Emotionally you are thoughtful and somewhat anxious, finding calm through order, routine and useful work.", si: "මානසිකව ඔබ කල්පනාකාරී මෙන්ම තරමක් කනස්සල්ලට පත්වන අයෙකි; පිළිවෙළ, දින චර්යාව සහ ප්‍රයෝජනවත් වැඩ තුළින් සන්සුන් බව ලබයි." },
  { en: "Emotionally you seek harmony and companionship, and feel unsettled by conflict or ugliness.", si: "මානසිකව ඔබ සමගිය සහ සහවාසය සොයන අතර ගැටුම් හෝ අප්‍රසන්න දේ නිසා නොසන්සුන් වේ." },
  { en: "The Moon is debilitated here, so feelings run very deep and can be intense; meditation and trusted companionship bring balance.", si: "චන්ද්‍රයා මෙහි නීච බැවින් හැඟීම් ඉතා ගැඹුරු සහ තීව්‍ර විය හැක; භාවනාව සහ විශ්වාසවන්ත ඇසුර මගින් සමබරතාව ලැබේ." },
  { en: "Emotionally you are optimistic and idealistic, uplifted by faith, learning and open horizons.", si: "මානසිකව ඔබ සුබවාදී සහ පරමාදර්ශී වන අතර ශ්‍රද්ධාව, අධ්‍යාපනය සහ නව අත්දැකීම් මගින් සිත ප්‍රබෝධමත් වේ." },
  { en: "Emotionally you are reserved and practical, expressing care through responsibility rather than words.", si: "මානසිකව ඔබ සංයමයෙන් යුත් සහ ප්‍රායෝගික වන අතර වචනවලට වඩා වගකීම් ඉටු කිරීමෙන් සැලකිල්ල පෙන්වයි." },
  { en: "Emotionally you are detached yet kind, valuing friendship, fairness and personal freedom.", si: "මානසිකව ඔබ තරමක් දුරස්ථ වුවද කාරුණික වන අතර මිත්‍රත්වය, සාධාරණත්වය සහ පෞද්ගලික නිදහස අගය කරයි." },
  { en: "Emotionally you are tender and intuitive, easily moved by others' joys and sorrows.", si: "මානසිකව ඔබ මෘදු සහ අන්තර්ඥානයෙන් යුත් අයෙකු වන අතර අන් අයගේ සතුට හා දුක පහසුවෙන් දැනේ." },
];

/** What each planet signifies, phrased to slot into sentences. */
export const PLANET_KEYWORDS: Record<PlanetKey, Bi> = {
  sun: { en: "authority, self-confidence, the father and government", si: "අධිකාරය, ආත්ම විශ්වාසය, පියා සහ රජය" },
  moon: { en: "the mind, emotions, the mother and public life", si: "මනස, හැඟීම්, මව සහ මහජන සම්බන්ධතා" },
  mars: { en: "energy, courage, land and competition", si: "ශක්තිය, ධෛර්යය, ඉඩකඩම් සහ තරඟකාරීත්වය" },
  mercury: { en: "intellect, speech, trade and learning", si: "බුද්ධිය, කථනය, වෙළඳාම සහ අධ්‍යාපනය" },
  jupiter: { en: "wisdom, fortune, children and dharma", si: "ප්‍රඥාව, භාග්‍යය, දරුවන් සහ ධර්මය" },
  venus: { en: "love, comfort, the arts and vehicles", si: "ප්‍රේමය, සුවපහසුව, කලාව සහ වාහන" },
  saturn: { en: "discipline, hard work, delay and endurance", si: "විනය, වෙහෙස මහන්සිය, ප්‍රමාදය සහ ඉවසීම" },
  rahu: { en: "ambition, foreign connections and sudden change", si: "අභිලාෂය, විදේශ සම්බන්ධතා සහ හදිසි වෙනස්කම්" },
  ketu: { en: "detachment, spirituality and hidden knowledge", si: "විරාගය, ආධ්‍යාත්මිකත්වය සහ ගුප්ත දැනුම" },
};

/** Life areas governed by each house (1-12). */
export const HOUSE_THEMES: readonly Bi[] = [
  { en: "the self, body and personality", si: "ආත්මය, ශරීරය සහ පෞරුෂය" },
  { en: "family, speech and accumulated wealth", si: "පවුල, කථනය සහ රැස් කළ ධනය" },
  { en: "courage, siblings and short journeys", si: "ධෛර්යය, සහෝදර සහෝදරියන් සහ කෙටි ගමන්" },
  { en: "mother, home, property and early education", si: "මව, නිවස, දේපළ සහ මූලික අධ්‍යාපනය" },
  { en: "intelligence, children and higher learning", si: "බුද්ධිය, දරුවන් සහ උසස් අධ්‍යාපනය" },
  { en: "health, debts, service and competition", si: "සෞඛ්‍යය, ණය, සේවය සහ තරඟකරුවන්" },
  { en: "marriage and partnerships", si: "විවාහය සහ හවුල්කාරිත්වය" },
  { en: "longevity, inheritance and sudden events", si: "ආයුෂ, උරුමය සහ හදිසි සිදුවීම්" },
  { en: "fortune, religion, the father and long journeys", si: "භාග්‍යය, ආගම, පියා සහ දිගු ගමන්" },
  { en: "career, status and public reputation", si: "රැකියාව, තත්ත්වය සහ සමාජ කීර්තිය" },
  { en: "income, gains and fulfilment of wishes", si: "ආදායම, ලාභ සහ අභිලාෂ ඉටුවීම" },
  { en: "expenses, foreign lands and spiritual liberation", si: "වියදම්, විදේශ රටවල් සහ මෝක්ෂය" },
];

/** Fields of work associated with each planet. */
export const CAREER_FIELDS: Record<PlanetKey, Bi> = {
  sun: { en: "government service, administration, politics or medicine", si: "රාජ්‍ය සේවය, පරිපාලනය, දේශපාලනය හෝ වෛද්‍ය ක්ෂේත්‍රය" },
  moon: { en: "nursing, hospitality, agriculture, public relations or trade in liquids and food", si: "හෙද සේවය, ආගන්තුක සත්කාර, කෘෂිකර්මය, මහජන සම්බන්ධතා හෝ ආහාර වෙළඳාම" },
  mars: { en: "engineering, the armed forces or police, surgery, land and construction", si: "ඉංජිනේරු විද්‍යාව, ත්‍රිවිධ හමුදා හෝ පොලිසිය, ශල්‍ය වෛද්‍ය, ඉඩම් සහ ඉදිකිරීම්" },
  mercury: { en: "accounting, commerce, writing, teaching, IT or communications", si: "ගිණුම්කරණය, වාණිජ්‍යය, ලේඛනය, ඉගැන්වීම, තොරතුරු තාක්ෂණය හෝ සන්නිවේදනය" },
  jupiter: { en: "teaching, law, banking, advisory work or religious service", si: "ඉගැන්වීම, නීතිය, බැංකු, උපදේශන සේවා හෝ ආගමික සේවය" },
  venus: { en: "the arts, fashion, beauty, hospitality, entertainment or luxury trade", si: "කලාව, විලාසිතා, රූපලාවණ්‍ය, ආගන්තුක සත්කාර, විනෝදාස්වාදය හෝ සුඛෝපභෝගී වෙළඳාම" },
  saturn: { en: "industry, labour management, mining, agriculture, law or long-term public works", si: "කර්මාන්ත, කම්කරු කළමනාකරණය, පතල්, කෘෂිකර්මය, නීතිය හෝ දිගුකාලීන පොදු ව්‍යාපෘති" },
  rahu: { en: "foreign employment, technology, aviation, research or large organisations", si: "විදේශ රැකියා, තාක්ෂණය, ගුවන් සේවා, පර්යේෂණ හෝ විශාල ආයතන" },
  ketu: { en: "research, medicine, spirituality, astrology or specialised technical work", si: "පර්යේෂණ, වෛද්‍ය විද්‍යාව, ආධ්‍යාත්මික ක්ෂේත්‍ර, ජ්‍යොතිෂය හෝ විශේෂිත තාක්ෂණික වැඩ" },
};

/** General results of each Maha Dasha. */
export const DASHA_EFFECTS: Record<PlanetKey, Bi> = {
  sun: {
    en: "The Sun period emphasises status, authority and self-assertion. Dealings with government, superiors and the father become prominent; recognition is possible when you act with integrity.",
    si: "රවි දශාව තත්ත්වය, අධිකාරය සහ ආත්ම ප්‍රකාශනය ඉස්මතු කරයි. රජය, ඉහළ නිලධාරීන් සහ පියා සම්බන්ධ කටයුතු වැදගත් වන අතර අවංකව ක්‍රියා කළහොත් පිළිගැනීම් ලැබිය හැක.",
  },
  moon: {
    en: "The Moon period brings focus on home, mother, emotions and public contact. Travel, changes of residence and growth through care for others are typical.",
    si: "චන්ද්‍ර දශාව නිවස, මව, හැඟීම් සහ මහජන සම්බන්ධතා කෙරෙහි අවධානය යොමු කරයි. ගමන් බිමන්, පදිංචිය වෙනස් වීම සහ අනුන්ට සැලකීම තුළින් දියුණුව සාමාන්‍යයෙන් දක්නට ලැබේ.",
  },
  mars: {
    en: "The Mars period brings energy, initiative and competition. It favours property, technical work and bold action, but calls for care with anger, accidents and disputes.",
    si: "කුජ දශාව ශක්තිය, මුලපිරීම සහ තරඟකාරීත්වය ගෙන එයි. ඉඩකඩම්, තාක්ෂණික කටයුතු සහ නිර්භීත ක්‍රියාවන්ට හිතකර වුවද කෝපය, අනතුරු සහ ආරවුල් පිළිබඳ පරිස්සම් විය යුතුය.",
  },
  mercury: {
    en: "The Mercury period favours study, business, communication and skill-building. New contacts, writing and trade can bring steady progress.",
    si: "බුධ දශාව අධ්‍යාපනය, ව්‍යාපාර, සන්නිවේදනය සහ කුසලතා වර්ධනයට හිතකර වේ. නව සබඳතා, ලේඛන කටයුතු සහ වෙළඳාම මගින් ස්ථාවර දියුණුවක් ලැබිය හැක.",
  },
  jupiter: {
    en: "The Jupiter period is traditionally one of growth, wisdom and blessings — education, children, religious merit and the guidance of elders come forward.",
    si: "ගුරු දශාව සම්ප්‍රදායිකව දියුණුව, ප්‍රඥාව සහ ආශීර්වාද ලැබෙන කාලයකි — අධ්‍යාපනය, දරුවන්, පින්කම් සහ වැඩිහිටියන්ගේ මඟපෙන්වීම ඉදිරියට පැමිණේ.",
  },
  venus: {
    en: "The Venus period brings comfort, relationships, the arts and material enjoyment. Marriage, vehicles, a better home and creative success are commonly indicated.",
    si: "ශුක්‍ර දශාව සුවපහසුව, සබඳතා, කලාව සහ භෞතික සැප සම්පත් ගෙන එයි. විවාහය, වාහන, වඩා හොඳ නිවසක් සහ නිර්මාණාත්මක සාර්ථකත්වය සාමාන්‍යයෙන් පෙන්නුම් කෙරේ.",
  },
  saturn: {
    en: "The Saturn period rewards patience, discipline and honest hard work. Progress may feel slow and responsibilities heavy, but what is built now tends to last.",
    si: "ශනි දශාව ඉවසීම, විනය සහ අවංක වෙහෙස මහන්සියට ප්‍රතිඵල දෙයි. දියුණුව සෙමින් සිදුවන බවත් වගකීම් බර බවත් දැනිය හැකි නමුත් මේ කාලයේ ගොඩනඟන දේ දිගු කල් පවතී.",
  },
  rahu: {
    en: "The Rahu period brings ambition, unusual opportunities and sudden changes, often involving foreign places or technology. Clear ethics and caution with shortcuts are essential.",
    si: "රාහු දශාව අභිලාෂය, අසාමාන්‍ය අවස්ථා සහ හදිසි වෙනස්කම් ගෙන එයි; බොහෝ විට විදේශ හෝ තාක්ෂණය සම්බන්ධ වේ. පැහැදිලි සදාචාරය සහ කෙටි මාර්ග පිළිබඳ පරිස්සම අත්‍යවශ්‍ය වේ.",
  },
  ketu: {
    en: "The Ketu period turns attention inward, towards spirituality, research and letting go. Material plans may be unsettled, but insight and inner growth are strong.",
    si: "කේතු දශාව අවධානය අභ්‍යන්තරයට — ආධ්‍යාත්මිකත්වය, පර්යේෂණ සහ අත්හැරීම කරා — යොමු කරයි. භෞතික සැලසුම් තරමක් අස්ථාවර විය හැකි නමුත් අවබෝධය සහ අභ්‍යන්තර වර්ධනය ප්‍රබල වේ.",
  },
};

/** Traditional Sri Lankan Shanthikarma for each graha. */
export const REMEDIES: Record<PlanetKey, Bi[]> = {
  sun: [
    { en: "Offer water to the rising Sun on Sundays and observe sil when possible.", si: "ඉරිදා දිනවල උදෑසන හිරු දෙවියන්ට ජලය පූජා කර, හැකි පමණ සිල් සමාදන් වන්න." },
    { en: "Perform a Surya (Ravi) graha shanthi or Bodhi Pooja on a Sunday with red flowers.", si: "ඉරිදා දිනක රතු මල් සහිතව රවි ග්‍රහ ශාන්තියක් හෝ බෝධි පූජාවක් පවත්වන්න." },
  ],
  moon: [
    { en: "Offer kiribath (milk rice) and white flowers at a Bodhi Pooja on Mondays.", si: "සඳුදා දිනවල කිරිබත් සහ සුදු මල් පූජා කර බෝධි පූජාවක් පවත්වන්න." },
    { en: "Show respect and care to your mother and offer milk or rice dana to those in need.", si: "මවට ගරු සරු කර, අසරණයන්ට කිරි හෝ සහල් දානයක් පිරිනමන්න." },
  ],
  mars: [
    { en: "Make offerings at the Kataragama devalaya or to God Skanda on Tuesdays.", si: "අඟහරුවාදා දිනවල කතරගම දේවාලයට හෝ ස්කන්ද කුමාර දෙවියන්ට පූජා පවත්වන්න." },
    { en: "Perform a Kuja graha shanthi with red flowers and lamps, and avoid quarrels on Tuesdays.", si: "රතු මල් සහ පහන් සහිතව කුජ ග්‍රහ ශාන්තියක් කර, අඟහරුවාදා දිනවල ආරවුල්වලින් වළකින්න." },
  ],
  mercury: [
    { en: "Make offerings to God Vishnu (Upulvan) on Wednesdays and support students or learning.", si: "බදාදා දිනවල උපුල්වන් (විෂ්ණු) දෙවියන්ට පූජා පවත්වා, ශිෂ්‍යයින්ට හෝ අධ්‍යාපන කටයුතුවලට උදව් කරන්න." },
    { en: "Offer green-coloured fruits or mung beans at a Bodhi Pooja on Wednesdays.", si: "බදාදා දිනවල කොළ පැහැති පලතුරු හෝ මුං ඇට පූජා කර බෝධි පූජාවක් පවත්වන්න." },
  ],
  jupiter: [
    { en: "Offer a Sanghika dana to the Maha Sangha and honour your teachers on Thursdays.", si: "බ්‍රහස්පතින්දා දිනවල මහා සංඝරත්නයට සාංඝික දානයක් පිරිනමා, ගුරුවරුන්ට ගෞරව කරන්න." },
    { en: "Perform a Guru graha shanthi or Bodhi Pooja with yellow flowers on Thursdays.", si: "බ්‍රහස්පතින්දා දිනවල කහ පැහැති මල් සහිතව ගුරු ග්‍රහ ශාන්තියක් හෝ බෝධි පූජාවක් පවත්වන්න." },
  ],
  venus: [
    { en: "Make offerings at a Pattini devalaya on Fridays with white flowers and fragrance.", si: "සිකුරාදා දිනවල සුදු මල් සහ සුවඳ දුම් සහිතව පත්තිනි දේවාලයේ පූජා පවත්වන්න." },
    { en: "Perform a Shukra graha shanthi and give white sweets or clothing as dana.", si: "ශුක්‍ර ග්‍රහ ශාන්තියක් කර, සුදු පැහැති රසකැවිලි හෝ වස්ත්‍ර දන් දෙන්න." },
  ],
  saturn: [
    { en: "Hold a Senasuru (Saturday) Bodhi Pooja and light sesame-oil lamps.", si: "සෙනසුරාදා දිනවල බෝධි පූජාවක් පවත්වා තල තෙල් පහන් දල්වන්න." },
    { en: "Care for elders and labourers, and offer dana to those in hardship.", si: "වැඩිහිටියන්ට සහ කම්කරුවන්ට සලකා, දුෂ්කරතාවයට පත් අයට දන් දෙන්න." },
  ],
  rahu: [
    { en: "Avoid starting important work during Rahu Kalaya and recite Pirith regularly.", si: "රාහු කාලය තුළ වැදගත් කටයුතු ආරම්භ නොකර, නිතිපතා පිරිත් සජ්ඣායනා කරන්න." },
    { en: "Perform a Rahu graha shanthi with blue flowers and a Bodhi Pooja on Saturdays.", si: "නිල් මල් සහිතව රාහු ග්‍රහ ශාන්තියක් කර සෙනසුරාදා දිනක බෝධි පූජාවක් පවත්වන්න." },
  ],
  ketu: [
    { en: "Make offerings to God Ganesha (Gana Deviyo) before new undertakings.", si: "නව කටයුතු ආරම්භ කිරීමට පෙර ගණ දෙවියන්ට පූජා පවත්වන්න." },
    { en: "Practise meditation and perform a Ketu graha shanthi with multi-coloured flowers.", si: "භාවනාවේ යෙදී, විවිධ වර්ණ මල් සහිතව කේතු ග්‍රහ ශාන්තියක් පවත්වන්න." },
  ],
};

export const GENERAL_REMEDY: Bi = {
  en: "Regular Bodhi Pooja, Pirith chanting, observing sil on Poya days and generous dana strengthen all benefic influences.",
  si: "නිතිපතා බෝධි පූජා, පිරිත් සජ්ඣායනා, පොහොය දිනවල සිල් සමාදන් වීම සහ ත්‍යාගශීලී දානමාන මගින් සියලු ශුභ බලපෑම් ශක්තිමත් වේ.",
};
