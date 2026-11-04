/**
 * Traditional starting syllables for names ("සුබ අකුරු") by birth nakshatra and pada,
 * following the classical nakshatra-pada syllable table (Avakahada chakra),
 * written in Sinhala script with a romanised form.
 *
 * Index: [nakshatra 0-26][pada 0-3]. Shravana follows the common
 * "ජු ජෙ ජො ඛා" variant; some families use "ඛී ඛූ ඛෙ ඛො" instead.
 */
export interface Syllable {
  si: string;
  en: string;
}

const S = (si: string, en: string): Syllable => ({ si, en });

export const NAKSHATRA_SYLLABLES: readonly (readonly [Syllable, Syllable, Syllable, Syllable])[] = [
  [S("චු", "Chu"), S("චෙ", "Che"), S("චො", "Cho"), S("ලා", "La")], // Ashwini
  [S("ලී", "Li"), S("ලූ", "Lu"), S("ලෙ", "Le"), S("ලො", "Lo")], // Bharani
  [S("අ", "A"), S("ඊ", "I"), S("උ", "U"), S("එ", "E")], // Krittika
  [S("ඔ", "O"), S("වා", "Va"), S("වී", "Vi"), S("වූ", "Vu")], // Rohini
  [S("වෙ", "Ve"), S("වො", "Vo"), S("කා", "Ka"), S("කී", "Ki")], // Mrigashira
  [S("කු", "Ku"), S("ඝ", "Gha"), S("ඞ", "Nga"), S("ඡ", "Chha")], // Ardra
  [S("කෙ", "Ke"), S("කො", "Ko"), S("හා", "Ha"), S("හී", "Hi")], // Punarvasu
  [S("හු", "Hu"), S("හෙ", "He"), S("හො", "Ho"), S("ඩා", "Da")], // Pushya
  [S("ඩී", "Di"), S("ඩූ", "Du"), S("ඩෙ", "De"), S("ඩො", "Do")], // Ashlesha
  [S("මා", "Ma"), S("මී", "Mi"), S("මූ", "Mu"), S("මෙ", "Me")], // Magha
  [S("මො", "Mo"), S("ටා", "Ta"), S("ටී", "Ti"), S("ටූ", "Tu")], // Purva Phalguni
  [S("ටෙ", "Te"), S("ටො", "To"), S("පා", "Pa"), S("පී", "Pi")], // Uttara Phalguni
  [S("පූ", "Pu"), S("ෂ", "Sha"), S("ණ", "Na"), S("ඨ", "Tha")], // Hasta
  [S("පෙ", "Pe"), S("පො", "Po"), S("රා", "Ra"), S("රී", "Ri")], // Chitra
  [S("රූ", "Ru"), S("රෙ", "Re"), S("රො", "Ro"), S("තා", "Taa")], // Swati
  [S("තී", "Ti"), S("තූ", "Tu"), S("තෙ", "Te"), S("තො", "To")], // Vishakha
  [S("නා", "Na"), S("නී", "Ni"), S("නූ", "Nu"), S("නෙ", "Ne")], // Anuradha
  [S("නො", "No"), S("යා", "Ya"), S("යී", "Yi"), S("යූ", "Yu")], // Jyeshtha
  [S("යෙ", "Ye"), S("යො", "Yo"), S("භා", "Bha"), S("භී", "Bhi")], // Mula
  [S("භූ", "Bhu"), S("ධා", "Dha"), S("ඵා", "Pha"), S("ඪා", "Dhha")], // Purva Ashadha
  [S("භෙ", "Bhe"), S("භො", "Bho"), S("ජා", "Ja"), S("ජී", "Ji")], // Uttara Ashadha
  [S("ජු", "Ju"), S("ජෙ", "Je"), S("ජො", "Jo"), S("ඛා", "Kha")], // Shravana
  [S("ගා", "Ga"), S("ගී", "Gi"), S("ගූ", "Gu"), S("ගෙ", "Ge")], // Dhanishta
  [S("ගො", "Go"), S("සා", "Sa"), S("සී", "Si"), S("සූ", "Su")], // Shatabhisha
  [S("සෙ", "Se"), S("සො", "So"), S("දා", "Da"), S("දී", "Di")], // Purva Bhadrapada
  [S("දූ", "Du"), S("ථ", "Tha"), S("ඣ", "Jha"), S("ඤ", "Nya")], // Uttara Bhadrapada
  [S("දෙ", "De"), S("දො", "Do"), S("චා", "Cha"), S("චී", "Chi")], // Revati
];

export function syllableFor(nakshatraIndex: number, pada: number): Syllable {
  return NAKSHATRA_SYLLABLES[nakshatraIndex][pada - 1];
}
