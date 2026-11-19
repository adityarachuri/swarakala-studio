import {
  MELAKARTA_72,
  SULADI_JATIS,
  SULADI_TALAS,
  type MelakartaEntry,
  type SuladiJatiType,
} from '../data/musicLiterature';
import {getLocalizedTraditionSwara} from '../i18n/studioLocale';
import type {
  GamakaType,
  NoteEvent,
  QuantizeDivision,
  ScaleDefinition,
  StudioLocale,
  TalaDefinition,
  TraditionId,
} from '../types/studio';

export const WESTERN_NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const SWARA_LABELS_CARNATIC: Record<number, string> = {
  0: 'S',
  1: 'R₁',
  2: 'R₂',
  3: 'G₂',
  4: 'G₃',
  5: 'M₁',
  6: 'M₂',
  7: 'P',
  8: 'D₁',
  9: 'D₂',
  10: 'N₂',
  11: 'N₃',
};

export const SWARA_LABELS_HINDUSTANI: Record<number, string> = {
  0: 'S',
  1: 'r',
  2: 'R',
  3: 'g',
  4: 'G',
  5: 'm',
  6: 'M',
  7: 'P',
  8: 'd',
  9: 'D',
  10: 'n',
  11: 'N',
};

/**
 * 22-Shruti Just Intonation cents offsets relative to 12-TET equal temperament.
 * Grounded in Bharata's Natya Shastra / Venkatamakhin / acoustic harmonic ratios.
 */
export const INDIAN_JUST_SHRUTI_CENTS: Record<number, number> = {
  0: 0,
  1: -10,
  2: 4,
  3: -6,
  4: -14,
  5: -2,
  6: -10,
  7: 2,
  8: -10,
  9: 6,
  10: -4,
  11: -12,
};

export const SCALES_AND_RAGAS: ScaleDefinition[] = [
  // CARNATIC
  {
    id: 'mayamalavagowla',
    name: 'Mayamalavagowla',
    nameTe: 'మాయామాళవగౌళ',
    nameSa: 'मायामालवगौळः',
    tradition: 'carnatic',
    classification: 'Melakarta 15 · Foundational',
    melakartaNumber: 15,
    semitones: [0, 1, 4, 5, 7, 8, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₁ G₃ M₁ P D₁ N₃ Ṡ',
    avarohanaLabel: 'Ṡ N₃ D₁ P M₁ G₃ R₁ S',
    vadi: 'G₃ / D₁',
    samvadi: 'N₃ / R₁',
    pakad: 'S R₁ G₃ M₁ — P D₁ N₃ Ṡ — M₁ G₃ R₁ S',
    timeOfDay: 'Dawn / Morning Practice',
    mood: 'Meditative, Symmetrical, Foundational',
  },
  {
    id: 'hamsadhwani',
    name: 'Hamsadhwani',
    nameTe: 'హంసధ్వని',
    nameSa: 'हंसध्वनिः',
    tradition: 'carnatic',
    classification: 'Janya of Sankarabharanam (29)',
    semitones: [0, 2, 4, 7, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₂ G₃ P N₃ Ṡ',
    avarohanaLabel: 'Ṡ N₃ P G₃ R₂ S',
    vadi: 'G₃',
    samvadi: 'N₃',
    pakad: 'G₃ P N₃ Ṡ — R₂ S N₃ P G₃ R₂ S',
    timeOfDay: 'Evening Concert Opening',
    mood: 'Auspicious, Bright, Celebratory',
  },
  {
    id: 'kalyani',
    name: 'Kalyani (Mechakalyani)',
    nameTe: 'కళ్యాణి (మేచకళ్యాణి)',
    nameSa: 'कल्याणी (मेचकल्याणी)',
    tradition: 'carnatic',
    classification: 'Melakarta 65 · Prati Madhyama',
    melakartaNumber: 65,
    semitones: [0, 2, 4, 6, 7, 9, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS, 6: -10},
    arohanaLabel: 'S R₂ G₃ M₂ P D₂ N₃ Ṡ',
    avarohanaLabel: 'Ṡ N₃ D₂ P M₂ G₃ R₂ S',
    vadi: 'G₃',
    samvadi: 'N₃',
    pakad: 'N₃ R₂ G₃ M₂ P — G₃ M₂ D₂ N₃ Ṡ',
    timeOfDay: 'Evening / Night Concert',
    mood: 'Majestic, Expansive, Luminous',
  },
  {
    id: 'shankarabharanam',
    name: 'Shankarabharanam',
    nameTe: 'శంకరాభరణం',
    nameSa: 'शङ्कराभरणम्',
    tradition: 'carnatic',
    classification: 'Melakarta 29 · Sampoorna',
    melakartaNumber: 29,
    semitones: [0, 2, 4, 5, 7, 9, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₂ G₃ M₁ P D₂ N₃ Ṡ',
    avarohanaLabel: 'Ṡ N₃ D₂ P M₁ G₃ R₂ S',
    vadi: 'G₃',
    samvadi: 'N₃',
    pakad: 'G₃ M₁ P D₂ N₃ Ṡ — R₂ S N₃ D₂ P',
    timeOfDay: 'All Times / Evening',
    mood: 'Noble, Balanced, Radiant',
  },
  {
    id: 'kharaharapriya',
    name: 'Kharaharapriya',
    nameTe: 'ఖరహరప్రియ',
    nameSa: 'खरहरप्रिया',
    tradition: 'carnatic',
    classification: 'Melakarta 22',
    melakartaNumber: 22,
    semitones: [0, 2, 3, 5, 7, 9, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₂ G₂ M₁ P D₂ N₂ Ṡ',
    avarohanaLabel: 'Ṡ N₂ D₂ P M₁ G₂ R₂ S',
    vadi: 'R₂ / P',
    samvadi: 'D₂ / S',
    pakad: 'R₂ G₂ M₁ P — D₂ N₂ D₂ P M₁ G₂ R₂',
    timeOfDay: 'Afternoon / Evening',
    mood: 'Lyrical, Compassionate, Deep',
  },
  {
    id: 'mohanam',
    name: 'Mohanam',
    nameTe: 'మోహనం',
    nameSa: 'मोहनम्',
    tradition: 'carnatic',
    classification: 'Janya of Harikambhoji (28)',
    semitones: [0, 2, 4, 7, 9],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₂ G₃ P D₂ Ṡ',
    avarohanaLabel: 'Ṡ D₂ P G₃ R₂ S',
    vadi: 'G₃',
    samvadi: 'D₂',
    pakad: 'G₃ R₂ S D₂ P — G₃ P D₂ Ṡ',
    timeOfDay: 'Evening',
    mood: 'Serene, Joyful, Universal Pentatonic',
  },
  {
    id: 'abheri',
    name: 'Abheri',
    nameTe: 'ఆభేరి',
    nameSa: 'आभेरी',
    tradition: 'carnatic',
    classification: 'Janya of Kharaharapriya (22)',
    semitones: [0, 3, 5, 7, 10],
    avarohanaSemitones: [0, 2, 3, 5, 7, 9, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S G₂ M₁ P N₂ Ṡ',
    avarohanaLabel: 'Ṡ N₂ D₂ P M₁ G₂ R₂ S',
    vadi: 'M₁',
    samvadi: 'S',
    pakad: 'N₂ S G₂ M₁ P — D₂ P M₁ G₂ R₂ S',
    timeOfDay: 'Late Afternoon / Evening',
    mood: 'Pathos, Devotional, Expressive',
  },
  {
    id: 'charukesi',
    name: 'Charukesi',
    nameTe: 'చారుకేశి',
    nameSa: 'चारुकेशी',
    tradition: 'carnatic',
    classification: 'Melakarta 26',
    melakartaNumber: 26,
    semitones: [0, 2, 4, 5, 7, 8, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₂ G₃ M₁ P D₁ N₂ Ṡ',
    avarohanaLabel: 'Ṡ N₂ D₁ P M₁ G₃ R₂ S',
    vadi: 'G₃ / P',
    samvadi: 'N₂ / S',
    pakad: 'G₃ M₁ P D₁ N₂ Ṡ — D₁ P M₁ G₃ R₂ S',
    timeOfDay: 'Evening',
    mood: 'Bittersweet, Yearning, Dramatic',
  },
  {
    id: 'todi_c',
    name: 'Hanumatodi (Todi)',
    nameTe: 'హనుమతోడి',
    nameSa: 'हनुमत्तोडी',
    tradition: 'carnatic',
    classification: 'Melakarta 8 · Rakti Mela',
    melakartaNumber: 8,
    semitones: [0, 1, 3, 5, 7, 8, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS, 3: -8, 8: -12},
    arohanaLabel: 'S R₁ G₂ M₁ P D₁ N₂ Ṡ',
    avarohanaLabel: 'Ṡ N₂ D₁ P M₁ G₂ R₁ S',
    vadi: 'G₂ / D₁',
    samvadi: 'N₂ / R₁',
    pakad: 'S R₁ G₂ M₁ P — D₁ N₂ D₁ P M₁ G₂ R₁ S',
    timeOfDay: 'Evening / Major Concert Rakti',
    mood: 'Sovereign Pathos, Noble, Intricately Ornamented',
  },
  {
    id: 'keeravani',
    name: 'Keeravani',
    nameTe: 'కీరవాణి',
    nameSa: 'कीरवाणी',
    tradition: 'carnatic',
    classification: 'Melakarta 21 · Concert & Film Favorite',
    melakartaNumber: 21,
    semitones: [0, 2, 3, 5, 7, 8, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₂ G₂ M₁ P D₁ N₃ Ṡ',
    avarohanaLabel: 'Ṡ N₃ D₁ P M₁ G₂ R₂ S',
    vadi: 'P / G₂',
    samvadi: 'S / N₃',
    pakad: 'S R₂ G₂ M₁ P D₁ N₃ Ṡ — N₃ D₁ P M₁ G₂ R₂ S',
    timeOfDay: 'Evening / Midnight',
    mood: 'Plaintive, Dramatic, Symphonic Minor',
  },
  {
    id: 'pantuvarali',
    name: 'Pantuvarali (Kamavardhani)',
    nameTe: 'పంతువరాళి (కామవర్ధని)',
    nameSa: 'पन्तुवराली (कामवर्धनी)',
    tradition: 'carnatic',
    classification: 'Melakarta 51 · Prati Madhyama',
    melakartaNumber: 51,
    semitones: [0, 1, 4, 6, 7, 8, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S R₁ G₃ M₂ P D₁ N₃ Ṡ',
    avarohanaLabel: 'Ṡ N₃ D₁ P M₂ G₃ R₁ S',
    vadi: 'G₃ / N₃',
    samvadi: 'P / S',
    pakad: 'S R₁ G₃ M₂ P D₁ N₃ Ṡ — M₂ G₃ R₁ S',
    timeOfDay: 'Evening / Late Afternoon',
    mood: 'Mystical, Compassionate, Luminous',
  },

  // HINDUSTANI
  {
    id: 'yaman',
    name: 'Yaman',
    nameTe: 'యమన్ (కళ్యాణ్ థాట్)',
    nameSa: 'यमनः (कल्याणथाटः)',
    tradition: 'hindustani',
    classification: 'Kalyan Thaat · Audav-Sampoorna',
    thaat: 'Kalyan',
    semitones: [0, 2, 4, 6, 7, 9, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS, 6: 10},
    arohanaLabel: 'Ṇ R G M♯ D N Ṡ',
    avarohanaLabel: 'Ṡ N D P M♯ G R S',
    vadi: 'G (Gandhar)',
    samvadi: 'N (Nishad)',
    pakad: 'Ṇ R G R S — P M♯ G R S',
    timeOfDay: 'First Quarter of Night (6–9 PM)',
    mood: 'Peaceful, Romantic, Devotional',
  },
  {
    id: 'bhairav',
    name: 'Bhairav',
    nameTe: 'భైరవ్',
    nameSa: 'भैरवः',
    tradition: 'hindustani',
    classification: 'Bhairav Thaat · Sampoorna',
    thaat: 'Bhairav',
    semitones: [0, 1, 4, 5, 7, 8, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS, 1: -12, 8: -12},
    arohanaLabel: 'S r G m P d N Ṡ',
    avarohanaLabel: 'Ṡ N d P m G r S',
    vadi: 'd (Komal Dhaivat)',
    samvadi: 'r (Komal Rishabh)',
    pakad: 'G m d P — G m r S',
    timeOfDay: 'Early Morning (Sandhiprakash)',
    mood: 'Solemn, Awe-Inspiring, Grave',
  },
  {
    id: 'bhimpalasi',
    name: 'Bhimpalasi',
    nameTe: 'భీమ్‌పలాసీ',
    nameSa: 'भीमपलासी',
    tradition: 'hindustani',
    classification: 'Kafi Thaat · Audav-Sampoorna',
    thaat: 'Kafi',
    semitones: [0, 3, 5, 7, 10],
    avarohanaSemitones: [0, 2, 3, 5, 7, 9, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'ṇ S g m P n Ṡ',
    avarohanaLabel: 'Ṡ n D P m g R S',
    vadi: 'm (Shuddha Madhyam)',
    samvadi: 'S (Shadja)',
    pakad: 'ṇ S m — m g P m g R S',
    timeOfDay: 'Late Afternoon (3–6 PM)',
    mood: 'Tender, Longing, Contemplative',
  },
  {
    id: 'darbari_kanada',
    name: 'Darbari Kanada',
    nameTe: 'దర్బారీ కానడా',
    nameSa: 'दरबारीकानडा',
    tradition: 'hindustani',
    classification: 'Asavari Thaat · Vakra',
    thaat: 'Asavari',
    semitones: [0, 2, 3, 5, 7, 8, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS, 3: -16, 8: -16},
    arohanaLabel: 'S R g m P d n Ṡ',
    avarohanaLabel: 'Ṡ d n P m P g m R S',
    vadi: 'R (Rishabh)',
    samvadi: 'P (Pancham)',
    pakad: 'g~ m R S — d~ n P m P g~ m R S',
    timeOfDay: 'Deep Midnight (12–3 AM)',
    mood: 'Regal, Profound, Slow Andolan',
  },
  {
    id: 'malkauns',
    name: 'Malkauns',
    nameTe: 'మాల్‌కౌన్స్',
    nameSa: 'मालकौंसः',
    tradition: 'hindustani',
    classification: 'Bhairavi Thaat · Audav-Audav',
    thaat: 'Bhairavi',
    semitones: [0, 3, 5, 8, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S g m d n Ṡ',
    avarohanaLabel: 'Ṡ n d m g S',
    vadi: 'm (Madhyam)',
    samvadi: 'S (Shadja)',
    pakad: 'm g m d n d m — g S',
    timeOfDay: 'Late Night (12–3 AM)',
    mood: 'Hypnotic, Heroic, Introspective',
  },
  {
    id: 'bhairavi_h',
    name: 'Bhairavi',
    nameTe: 'భైరవి (హిందుస్తానీ)',
    nameSa: 'भैरवी',
    tradition: 'hindustani',
    classification: 'Bhairavi Thaat · Sampoorna',
    thaat: 'Bhairavi',
    semitones: [0, 1, 3, 5, 7, 8, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'S r g m P d n Ṡ',
    avarohanaLabel: 'Ṡ n d P m g r S',
    vadi: 'm (Madhyam)',
    samvadi: 'S (Shadja)',
    pakad: 'm g r S — d n S',
    timeOfDay: 'Morning / Concert Finale',
    mood: 'Devotional, Pathos, All-Embracing',
  },
  {
    id: 'bageshri',
    name: 'Bageshri',
    nameTe: 'బాగేశ్రీ',
    nameSa: 'बागेश्री',
    tradition: 'hindustani',
    classification: 'Kafi Thaat · Audav-Shadav',
    thaat: 'Kafi',
    semitones: [0, 3, 5, 9, 10],
    avarohanaSemitones: [0, 2, 3, 5, 7, 9, 10],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: 'ṇ S g m D n Ṡ',
    avarohanaLabel: 'Ṡ n D m P D g m R S',
    vadi: 'm (Madhyam)',
    samvadi: 'S (Shadja)',
    pakad: 'D n S m — m g m R S',
    timeOfDay: 'Midnight (2nd Quarter)',
    mood: 'Romantic, Intimate, Serenely Yearning',
  },
  {
    id: 'marwa',
    name: 'Marwa',
    nameTe: 'మార్వా',
    nameSa: 'मारवा',
    tradition: 'hindustani',
    classification: 'Marwa Thaat · Shadav-Shadav (Pa Vargit)',
    thaat: 'Marwa',
    semitones: [0, 1, 4, 6, 9, 11],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS, 1: -10, 6: 8},
    arohanaLabel: 'Ṇ r G M♯ D N Ṡ',
    avarohanaLabel: 'Ṡ N D M♯ G r S',
    vadi: 'r / D',
    samvadi: 'D / r',
    pakad: 'D M♯ G r — G M♯ D — r S',
    timeOfDay: 'Dusk (Sunset Sandhiprakash)',
    mood: 'Suspenseful, Contemplative, Renunciant',
  },

  // WESTERN & CONTEMPORARY
  {
    id: 'ionian',
    name: 'Ionian (Major)',
    nameTe: 'అయోనియన్ (మేజర్)',
    nameSa: 'अयोनीयन् (शुद्धसप्तकम्)',
    tradition: 'western',
    classification: 'Diatonic Mode I · I – IV – V',
    semitones: [0, 2, 4, 5, 7, 9, 11],
    shrutiCents: {},
    arohanaLabel: '1  2  3  4  5  6  7  8',
    avarohanaLabel: '8  7  6  5  4  3  2  1',
    vadi: 'Tonic (I)',
    samvadi: 'Dominant (V)',
    pakad: 'ii⁷ → V⁷ → Imaj⁷',
    timeOfDay: 'Concert & Film Scoring',
    mood: 'Resolute, Uplifting, Clear',
  },
  {
    id: 'dorian',
    name: 'Dorian Mode',
    nameTe: 'డోరియన్ మోడ్',
    nameSa: 'डोरियन्-रागः',
    tradition: 'western',
    classification: 'Diatonic Mode II · Minor + ♮6',
    semitones: [0, 2, 3, 5, 7, 9, 10],
    shrutiCents: {},
    arohanaLabel: '1  2  ♭3  4  5  6  ♭7  8',
    avarohanaLabel: '8  ♭7  6  5  4  ♭3  2  1',
    vadi: 'Minor Tonic (i)',
    samvadi: 'Subdominant Major (IV)',
    pakad: 'i⁷ → IV⁷ → i⁷',
    timeOfDay: 'Jazz / Modal Nocturne',
    mood: 'Reflective, Cool, Cinematic',
  },
  {
    id: 'lydian',
    name: 'Lydian Mode',
    nameTe: 'లిడియన్ మోడ్',
    nameSa: 'लिडियन् (कल्याणीसमः)',
    tradition: 'western',
    classification: 'Diatonic Mode IV · Major + ♯4',
    semitones: [0, 2, 4, 6, 7, 9, 11],
    shrutiCents: {},
    arohanaLabel: '1  2  3  ♯4  5  6  7  8',
    avarohanaLabel: '8  7  6  5  ♯4  3  2  1',
    vadi: 'Imaj7♯11',
    samvadi: 'II (Major Supertonic)',
    pakad: 'I → II/I → Imaj7♯11',
    timeOfDay: 'Film & Symphonic Score',
    mood: 'Wondrous, Floating, Aspirational',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian Mode',
    nameTe: 'మిక్సోలిడియన్ మోడ్',
    nameSa: 'मिक्सोलिडियन् (खमाजसमः)',
    tradition: 'western',
    classification: 'Diatonic Mode V · Dominant ♭7',
    semitones: [0, 2, 4, 5, 7, 9, 10],
    shrutiCents: {},
    arohanaLabel: '1  2  3  4  5  6  ♭7  8',
    avarohanaLabel: '8  ♭7  6  5  4  3  2  1',
    vadi: 'I7',
    samvadi: '♭VII',
    pakad: 'I → ♭VII → IV → I',
    timeOfDay: 'Heroic / Folk-Orchestral',
    mood: 'Heroic, Driving, Earthy',
  },
  {
    id: 'aeolian',
    name: 'Aeolian (Natural Minor)',
    nameTe: 'ఏయోలియన్ (మైనర్)',
    nameSa: 'एयोलियन् (आसावरीसमः)',
    tradition: 'western',
    classification: 'Diatonic Mode VI',
    semitones: [0, 2, 3, 5, 7, 8, 10],
    shrutiCents: {},
    arohanaLabel: '1  2  ♭3  4  5  ♭6  ♭7  8',
    avarohanaLabel: '8  ♭7  ♭6  5  4  ♭3  2  1',
    vadi: 'i',
    samvadi: '♭VI / v',
    pakad: 'i → ♭VI → ♭VII → i',
    timeOfDay: 'Orchestral & Ambient',
    mood: 'Melancholic, Dramatic, Spacious',
  },
  {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    nameTe: 'హార్మోనిక్ మైనర్',
    nameSa: 'संवादी-लघुसप्तकम्',
    tradition: 'western',
    classification: 'Classical Minor · Raised 7th',
    semitones: [0, 2, 3, 5, 7, 8, 11],
    shrutiCents: {},
    arohanaLabel: '1  2  ♭3  4  5  ♭6  ♮7  8',
    avarohanaLabel: '8  ♮7  ♭6  5  4  ♭3  2  1',
    vadi: 'i',
    samvadi: 'V7♭9',
    pakad: 'i → iv → V7 → i',
    timeOfDay: 'Classical & Neo-Baroque',
    mood: 'Tense, Virtuosic, Urgent',
  },
  {
    id: 'phrygian_dominant',
    name: 'Phrygian Dominant',
    nameTe: 'ఫ్రిజియన్ డామినెంట్',
    nameSa: 'फ्रिजियन् (भैरव-नि२समः)',
    tradition: 'western',
    classification: '5th Mode of Harmonic Minor',
    semitones: [0, 1, 4, 5, 7, 8, 10],
    shrutiCents: {},
    arohanaLabel: '1  ♭2  3  4  5  ♭6  ♭7  8',
    avarohanaLabel: '8  ♭7  ♭6  5  4  3  ♭2  1',
    vadi: 'I7',
    samvadi: '♭II',
    pakad: 'I → ♭II → ♭vii → I',
    timeOfDay: 'World Fusion & Epic Score',
    mood: 'Passionate, Fiery, Cross-Cultural',
  },
];

export const TALAS_AND_METERS: TalaDefinition[] = [
  {
    id: 'adi_tala',
    name: 'Adi Tala (Chatusra Jati Triputa)',
    nameTe: 'ఆది తాళం (చతురశ్ర జాతి త్రిపుట)',
    nameSa: 'आदितालः (चतुरस्रजाति-त्रिपुटः)',
    tradition: 'carnatic',
    beats: 8,
    stepsPerBeat: 2,
    totalSteps: 16,
    structureLabel: 'Laghu (4) + Drutam (2) + Drutam (2)',
    structureTe: 'లఘువు (4) + ద్రుతం (2) + ద్రుతం (2)',
    structureSa: 'लघुः (४) + द्रुतम् (२) + द्रुतम् (२)',
    vibhags: [4, 2, 2],
    samBeat: 0,
    taliBeats: [0, 4, 6],
    khaliBeats: [],
    timeSignatureNum: 4,
    timeSignatureDen: 4,
  },
  {
    id: 'rupaka_tala',
    name: 'Rupaka Tala',
    nameTe: 'రూపక తాళం',
    nameSa: 'रूपकतालः',
    tradition: 'carnatic',
    beats: 6,
    stepsPerBeat: 2,
    totalSteps: 12,
    structureLabel: 'Drutam (2) + Laghu (4)',
    structureTe: 'ద్రుతం (2) + లఘువు (4)',
    structureSa: 'द्रुतम् (२) + लघुः (४)',
    vibhags: [2, 4],
    samBeat: 0,
    taliBeats: [0, 2],
    khaliBeats: [],
    timeSignatureNum: 3,
    timeSignatureDen: 4,
  },
  {
    id: 'misra_chapu',
    name: 'Misra Chapu',
    nameTe: 'మిశ్ర చాపు తాళం',
    nameSa: 'मिश्रचापुतालः',
    tradition: 'carnatic',
    beats: 7,
    stepsPerBeat: 2,
    totalSteps: 14,
    structureLabel: '3 + 2 + 2 Asymmetric',
    structureTe: '3 + 2 + 2 అక్షర గతి',
    structureSa: '३ + २ + २ विषमगतिः',
    vibhags: [3, 2, 2],
    samBeat: 0,
    taliBeats: [0, 3, 5],
    khaliBeats: [],
    timeSignatureNum: 7,
    timeSignatureDen: 8,
  },
  {
    id: 'khanda_chapu',
    name: 'Khanda Chapu',
    nameTe: 'ఖండ చాపు తాళం',
    nameSa: 'खण्डचापुतालः',
    tradition: 'carnatic',
    beats: 5,
    stepsPerBeat: 2,
    totalSteps: 10,
    structureLabel: '2 + 1 + 2 Asymmetric',
    structureTe: '2 + 1 + 2 అక్షర గతి',
    structureSa: '२ + १ + २ विषमगतिः',
    vibhags: [2, 1, 2],
    samBeat: 0,
    taliBeats: [0, 2, 3],
    khaliBeats: [],
    timeSignatureNum: 5,
    timeSignatureDen: 8,
  },
  {
    id: 'teental',
    name: 'Teental (Tritaal)',
    nameTe: 'తీన్‌తాళ్ (త్రితాళ్)',
    nameSa: 'तीनतालः (त्रितालः)',
    tradition: 'hindustani',
    beats: 16,
    stepsPerBeat: 1,
    totalSteps: 16,
    structureLabel: '4 + 4 + 4 + 4 (X · 2 · 0 · 3)',
    structureTe: '4 + 4 + 4 + 4 (సమం · 2 · ఖాళీ · 3)',
    structureSa: '४ + ४ + ४ + ४ (समः · २ · खाली · ३)',
    vibhags: [4, 4, 4, 4],
    samBeat: 0,
    taliBeats: [0, 4, 12],
    khaliBeats: [8],
    timeSignatureNum: 4,
    timeSignatureDen: 4,
  },
  {
    id: 'jhaptaal',
    name: 'Jhaptaal',
    nameTe: 'ఝప్‌తాళ్',
    nameSa: 'झपतालः',
    tradition: 'hindustani',
    beats: 10,
    stepsPerBeat: 2,
    totalSteps: 20,
    structureLabel: '2 + 3 + 2 + 3 (X · 2 · 0 · 3)',
    structureTe: '2 + 3 + 2 + 3 (సమం · 2 · ఖాళీ · 3)',
    structureSa: '२ + ३ + २ + ३ (समः · २ · खाली · ३)',
    vibhags: [2, 3, 2, 3],
    samBeat: 0,
    taliBeats: [0, 2, 7],
    khaliBeats: [5],
    timeSignatureNum: 5,
    timeSignatureDen: 4,
  },
  {
    id: 'dadra',
    name: 'Dadra Taal',
    nameTe: 'దాద్రా తాళ్',
    nameSa: 'दादरातालः',
    tradition: 'hindustani',
    beats: 6,
    stepsPerBeat: 2,
    totalSteps: 12,
    structureLabel: '3 + 3 (X · 0)',
    structureTe: '3 + 3 (సమం · ఖాళీ)',
    structureSa: '३ + ३ (समः · खाली)',
    vibhags: [3, 3],
    samBeat: 0,
    taliBeats: [0],
    khaliBeats: [3],
    timeSignatureNum: 6,
    timeSignatureDen: 8,
  },
  {
    id: 'rupak_h',
    name: 'Rupak Taal',
    nameTe: 'రూపక్ తాళ్ (హిందుస్తానీ)',
    nameSa: 'रूपकतालः (हिन्दुस्तानी)',
    tradition: 'hindustani',
    beats: 7,
    stepsPerBeat: 2,
    totalSteps: 14,
    structureLabel: '3 + 2 + 2 (0/X · 2 · 3)',
    structureTe: '3 + 2 + 2 (ఖాళీ-సమం · 2 · 3)',
    structureSa: '३ + २ + २ (खाली-समः · २ · ३)',
    vibhags: [3, 2, 2],
    samBeat: 0,
    taliBeats: [3, 5],
    khaliBeats: [0],
    timeSignatureNum: 7,
    timeSignatureDen: 8,
  },
  {
    id: 'meter_4_4',
    name: '4/4 Common Time',
    nameTe: '4/4 సామాన్య కాలమానం',
    nameSa: '४/४ चतुर्मात्रिकः',
    tradition: 'western',
    beats: 4,
    stepsPerBeat: 4,
    totalSteps: 16,
    structureLabel: '4 Quarter Beats · 16th Grid',
    structureTe: '4 క్వాటర్ బీట్లు · 16 స్టెప్స్',
    structureSa: 'चतस्रः मात्राः · १६ अंशाः',
    vibhags: [4],
    samBeat: 0,
    taliBeats: [0, 2],
    khaliBeats: [],
    timeSignatureNum: 4,
    timeSignatureDen: 4,
  },
  {
    id: 'meter_3_4',
    name: '3/4 Waltz / Triple',
    nameTe: '3/4 వాల్ట్జ్ / త్రిమాత్ర',
    nameSa: '३/४ त्रिमात्रिकः',
    tradition: 'western',
    beats: 3,
    stepsPerBeat: 4,
    totalSteps: 12,
    structureLabel: '3 Quarter Beats · 12 Steps',
    structureTe: '3 క్వాటర్ బీట్లు · 12 స్టెప్స్',
    structureSa: 'तिस्रः मात्राः · १२ अंशाः',
    vibhags: [3],
    samBeat: 0,
    taliBeats: [0],
    khaliBeats: [],
    timeSignatureNum: 3,
    timeSignatureDen: 4,
  },
  {
    id: 'meter_7_8',
    name: '7/8 Concert Asymmetric',
    nameTe: '7/8 అసమమితీయ గతి',
    nameSa: '७/८ विषमच्छन्दः',
    tradition: 'western',
    beats: 7,
    stepsPerBeat: 2,
    totalSteps: 14,
    structureLabel: '2 + 2 + 3 Eighth Pulse',
    structureTe: '2 + 2 + 3 ఎనిమిదో మాత్రా గతి',
    structureSa: '२ + २ + ३ विषमगतिः',
    vibhags: [2, 2, 3],
    samBeat: 0,
    taliBeats: [0, 2, 4],
    khaliBeats: [],
    timeSignatureNum: 7,
    timeSignatureDen: 8,
  },
];

export const ROOT_PITCH_OPTIONS = [
  {midi: 45, label: 'A2 (Katta 6 Low)'},
  {midi: 46, label: 'Bb2 (Katta 6.5 Low)'},
  {midi: 47, label: 'B2 (Katta 7 Low)'},
  {midi: 48, label: 'C3 (Katta 1 / White 1)'},
  {midi: 49, label: 'C#3 (Katta 1.5 / Black 1)'},
  {midi: 50, label: 'D3 (Katta 2 / White 2)'},
  {midi: 51, label: 'Eb3 (Katta 2.5 / Black 2)'},
  {midi: 52, label: 'E3 (Katta 3 / White 3)'},
  {midi: 53, label: 'F3 (Katta 4 / White 4)'},
  {midi: 54, label: 'F#3 (Katta 4.5 / Black 3)'},
  {midi: 55, label: 'G3 (Katta 5 / White 5)'},
  {midi: 56, label: 'Ab3 (Katta 5.5 / Black 4)'},
  {midi: 57, label: 'A3 (Concert 220)'},
];

export function createScaleFromMelakarta(entry: MelakartaEntry): ScaleDefinition {
  return {
    id: `melakarta_${entry.number}`,
    name: `${entry.name} (Mela ${entry.number})`,
    nameTe: `${entry.nameTe} (మేళం ${entry.number})`,
    nameSa: `${entry.nameSa} (मेलः ${entry.number})`,
    tradition: 'carnatic',
    classification: `Melakarta ${entry.number} · ${entry.chakraName} Chakra · ${entry.madhyama}`,
    melakartaNumber: entry.number,
    thaat: entry.hindustaniThaatEquivalent,
    semitones: [...entry.semitones],
    shrutiCents: {...INDIAN_JUST_SHRUTI_CENTS},
    arohanaLabel: `${entry.swaraCode} Ṡ`,
    avarohanaLabel: `Ṡ ${entry.swaraCode.split(' ').reverse().join(' ')}`,
    vadi: 'G / P',
    samvadi: 'S / N',
    pakad: `${entry.swaraCode} Ṡ — ${entry.chakraName} Symmetry`,
    timeOfDay: entry.madhyama.includes('Prati') ? 'Evening / Contemplative' : 'Morning / All-Hour Concert',
    mood: entry.hindustaniThaatEquivalent
      ? `Modal Symmetry · ${entry.hindustaniThaatEquivalent}`
      : 'Sampoorna Melakarta Janaka Scale',
  };
}

export function createTalaFromSuladi(
  talaId: string,
  jatiId: SuladiJatiType['id']
): TalaDefinition {
  const talaMeta = SULADI_TALAS.find((t) => t.id === talaId) ?? SULADI_TALAS[4];
  const jatiMeta = SULADI_JATIS.find((j) => j.id === jatiId) ?? SULADI_JATIS[1];

  const vibhags = talaMeta.symbolPattern.map((sym) => {
    if (sym === 'L') return jatiMeta.laghuBeats;
    if (sym === 'D') return 2;
    return 1;
  });

  const beats = vibhags.reduce((a, b) => a + b, 0);
  const stepsPerBeat = beats > 10 ? 1 : 2;
  const totalSteps = beats * stepsPerBeat;

  const taliBeats: number[] = [];
  let cursor = 0;
  for (const v of vibhags) {
    taliBeats.push(cursor);
    cursor += v;
  }

  return {
    id: `suladi_${talaMeta.id}_${jatiMeta.id}`,
    name: `${jatiMeta.name.split(' ')[0]} ${talaMeta.name} (${beats})`,
    nameTe: `${jatiMeta.nameTe.split(' ')[0]} ${talaMeta.nameTe} (${beats})`,
    nameSa: `${jatiMeta.nameSa.split(' ')[0]} ${talaMeta.nameSa} (${beats})`,
    tradition: 'carnatic',
    beats,
    stepsPerBeat,
    totalSteps,
    structureLabel: vibhags.join(' + ') + ` = ${beats} Aksharas`,
    structureTe: vibhags.join(' + ') + ` = ${beats} అక్షరాలు`,
    structureSa: vibhags.join(' + ') + ` = ${beats} अक्षराणि`,
    vibhags,
    samBeat: 0,
    taliBeats,
    khaliBeats: [],
    timeSignatureNum: beats,
    timeSignatureDen: 4,
  };
}

export function getScaleById(id: string): ScaleDefinition {
  const found = SCALES_AND_RAGAS.find((s) => s.id === id);
  if (found) return found;
  if (id.startsWith('melakarta_')) {
    const num = Number(id.replace('melakarta_', ''));
    const entry = MELAKARTA_72.find((m) => m.number === num);
    if (entry) return createScaleFromMelakarta(entry);
  }
  return SCALES_AND_RAGAS[0];
}

export function getTalaById(id: string): TalaDefinition {
  const found = TALAS_AND_METERS.find((t) => t.id === id);
  if (found) return found;
  if (id.startsWith('suladi_')) {
    const parts = id.replace('suladi_', '').split('_');
    const talaId = parts[0] ?? 'triputa';
    const jatiId = (parts[1] ?? 'chatusra') as SuladiJatiType['id'];
    return createTalaFromSuladi(talaId, jatiId);
  }
  return TALAS_AND_METERS[0];
}

export function getScaleDisplayName(scale: ScaleDefinition, locale: StudioLocale): string {
  if (locale === 'te' && scale.nameTe) return scale.nameTe;
  if (locale === 'sa' && scale.nameSa) return scale.nameSa;
  return scale.name;
}

export function getTalaDisplayName(tala: TalaDefinition, locale: StudioLocale): string {
  if (locale === 'te' && tala.nameTe) return tala.nameTe;
  if (locale === 'sa' && tala.nameSa) return tala.nameSa;
  return tala.name;
}

export function getTalaStructureDisplay(tala: TalaDefinition, locale: StudioLocale): string {
  if (locale === 'te' && tala.structureTe) return tala.structureTe;
  if (locale === 'sa' && tala.structureSa) return tala.structureSa;
  return tala.structureLabel;
}

export function getMidiNoteName(midi: number): string {
  const note = WESTERN_NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export function getSwaraName(
  semitoneOffset: number,
  tradition: TraditionId,
  locale: StudioLocale = 'en'
): {base: string; octaveMark: string} {
  return getLocalizedTraditionSwara(semitoneOffset, tradition, locale);
}

export function formatPitchLabel(
  semitoneOffset: number,
  rootMidi: number,
  tradition: TraditionId,
  mode: 'swara' | 'western' | 'both',
  locale: StudioLocale = 'en'
): string {
  const western = getMidiNoteName(rootMidi + semitoneOffset);
  if (mode === 'western') return western;
  const {base, octaveMark} = getSwaraName(semitoneOffset, tradition, locale);
  const swara = `${base}${octaveMark}`;
  if (mode === 'swara') return swara;
  return `${swara} · ${western}`;
}

export function getShrutiCentsOffset(
  semitoneOffset: number,
  scale: ScaleDefinition,
  microtonal: boolean
): number {
  if (!microtonal) return 0;
  const pc = ((semitoneOffset % 12) + 12) % 12;
  return scale.shrutiCents[pc] ?? 0;
}

export function getFrequencyHz(
  semitoneOffset: number,
  rootMidi: number,
  a4Hz: number,
  microtonal: boolean,
  scale: ScaleDefinition,
  extraCents = 0
): number {
  const midi = rootMidi + semitoneOffset;
  const cents = getShrutiCentsOffset(semitoneOffset, scale, microtonal) + extraCents;
  return a4Hz * Math.pow(2, (midi - 69 + cents / 100) / 12);
}

export function isSemitoneInScale(semitoneOffset: number, scale: ScaleDefinition): boolean {
  const pc = ((semitoneOffset % 12) + 12) % 12;
  if (scale.semitones.includes(pc)) return true;
  if (scale.avarohanaSemitones?.includes(pc)) return true;
  return false;
}

export const PERCUSSION_LANES = [
  {semitoneOffset: 0, label: 'Tha / Dha / Kick', short: 'TH/KD'},
  {semitoneOffset: 2, label: 'Dhi / Na / Snare', short: 'DH/SN'},
  {semitoneOffset: 4, label: 'Thom / Ge / Hat', short: 'TM/HH'},
  {semitoneOffset: 5, label: 'Nam / Tin / Open', short: 'NM/OH'},
  {semitoneOffset: 7, label: 'Chapu / Ke / Rim', short: 'CP/RM'},
];

export function getQuantizeIntervalSteps(
  division: QuantizeDivision,
  tala: TalaDefinition
): number {
  const stepsPerWhole = Math.max(
    4,
    Math.round((tala.totalSteps * tala.timeSignatureDen) / Math.max(1, tala.timeSignatureNum))
  );
  const divisor = division === '1/2' ? 2 : division === '1/4' ? 4 : 8;
  return Math.max(1, Math.min(tala.totalSteps, Math.round(stepsPerWhole / divisor)));
}

export function snapStepToQuantizeGrid(
  rawStep: number,
  interval: number,
  totalSteps: number
): number {
  if (totalSteps <= 0) return 0;
  if (interval <= 1) {
    return ((Math.round(rawStep) % totalSteps) + totalSteps) % totalSteps;
  }
  const normalized = ((rawStep % totalSteps) + totalSteps) % totalSteps;
  let bestStep = 0;
  let bestDist = Infinity;

  for (let g = 0; g < totalSteps; g += interval) {
    const directDist = Math.abs(normalized - g);
    const wrapDist = totalSteps - directDist;
    const dist = Math.min(directDist, wrapDist);
    if (dist < bestDist) {
      bestDist = dist;
      bestStep = g;
    }
  }
  return bestStep;
}

export function quantizeTrackNotes(
  notes: NoteEvent[],
  division: QuantizeDivision,
  tala: TalaDefinition,
  onlyRecordedIfPresent = true
): {notes: NoteEvent[]; quantizedCount: number; scope: 'recorded' | 'all'} {
  const interval = getQuantizeIntervalSteps(division, tala);
  const hasRecorded = notes.some((n) => n.recorded);
  const limitToRecorded = onlyRecordedIfPresent && hasRecorded;
  let quantizedCount = 0;

  const snappedList = notes.map((note) => {
    if (limitToRecorded && !note.recorded) {
      return note;
    }
    const sourceStep = note.rawStep ?? note.step;
    const nextStep = snapStepToQuantizeGrid(sourceStep, interval, tala.totalSteps);
    const maxDur = Math.max(1, tala.totalSteps - nextStep);
    const nextDuration = Math.min(note.durationSteps, maxDur);
    if (nextStep !== note.step || nextDuration !== note.durationSteps) {
      quantizedCount++;
    }
    return {
      ...note,
      rawStep: sourceStep,
      step: nextStep,
      durationSteps: nextDuration,
    };
  });

  const dedupedMap = new Map<string, NoteEvent>();
  for (const n of snappedList) {
    const key = `${n.step}:${n.semitoneOffset}`;
    const existing = dedupedMap.get(key);
    if (!existing || n.velocity >= existing.velocity) {
      dedupedMap.set(key, n);
    }
  }

  const deduped = Array.from(dedupedMap.values()).sort((a, b) => a.step - b.step);
  return {
    notes: deduped,
    quantizedCount,
    scope: limitToRecorded ? 'recorded' : 'all',
  };
}

/**
 * Parses SwaraScript / Sargam notation into NoteEvents aligned to the active Raga & Tala.
 * Supports:
 *   S, R1, R2, R3, r, R, G1, G2, G3, g, G, M1, M2, m, M, M#, P, D1, D2, d, D, N1, N2, N3, n, N
 *   Octave markers: `S.` or `S'` (+12), `N,` or `N_` (-12)
 *   Rests: `-` or `,` or `.` standalone extend/pause
 */
export function parseSwaraPhraseToNotes(
  input: string,
  scale: ScaleDefinition,
  totalSteps: number,
  stepIncrement = 1
): NoteEvent[] {
  const tokens = input
    .trim()
    .split(/[\s|]+/)
    .filter(Boolean);
  if (tokens.length === 0) return [];

  const notes: NoteEvent[] = [];
  let cursor = 0;

  const scaleHasSemi = (options: number[], fallback: number): number => {
    for (const opt of options) {
      if (scale.semitones.includes(opt)) return opt;
    }
    return fallback;
  };

  for (const rawTok of tokens) {
    if (cursor >= totalSteps) break;
    if (rawTok === '-' || rawTok === '~' || rawTok === '_') {
      if (notes.length > 0) {
        notes[notes.length - 1].durationSteps += stepIncrement;
      }
      cursor += stepIncrement;
      continue;
    }

    let tok = rawTok;
    let octaveOffset = 0;
    if (tok.endsWith("'") || tok.endsWith('.') || tok.endsWith('*') || tok.endsWith('̇')) {
      octaveOffset = 12;
      tok = tok.slice(0, -1);
    } else if (tok.endsWith(',') || tok.endsWith('̣')) {
      octaveOffset = -12;
      tok = tok.slice(0, -1);
    }

    let pc: number | null = null;
    const upper = tok.toUpperCase();

    if (upper === 'S' || upper === 'SA' || tok === 'స' || tok === 'स') pc = 0;
    else if (tok === 'r' || upper === 'R1' || upper === 'RI1') pc = 1;
    else if (upper === 'R2' || upper === 'RI2') pc = 2;
    else if (upper === 'R3' || upper === 'G1') pc = 3;
    else if (upper === 'R' || upper === 'RI' || upper === 'RE') pc = scaleHasSemi([1, 2, 3], 2);
    else if (tok === 'g' || upper === 'G2' || upper === 'GA2') pc = 3;
    else if (upper === 'G3' || upper === 'GA3') pc = 4;
    else if (upper === 'G' || upper === 'GA') pc = scaleHasSemi([3, 4], 4);
    else if (tok === 'm' || upper === 'M1' || upper === 'MA1') pc = 5;
    else if (tok === 'M' || upper === 'M2' || upper === 'MA2' || upper === 'M#' || upper === 'MA#') pc = 6;
    else if (upper === 'MA') pc = scaleHasSemi([5, 6], 5);
    else if (upper === 'P' || upper === 'PA' || tok === 'ప' || tok === 'प') pc = 7;
    else if (tok === 'd' || upper === 'D1' || upper === 'DA1' || upper === 'DHA1') pc = 8;
    else if (upper === 'D2' || upper === 'DA2' || upper === 'DHA2') pc = 9;
    else if (upper === 'D3' || upper === 'N1') pc = 10;
    else if (upper === 'D' || upper === 'DA' || upper === 'DHA') pc = scaleHasSemi([8, 9, 10], 9);
    else if (tok === 'n' || upper === 'N2' || upper === 'NI2') pc = 10;
    else if (upper === 'N3' || upper === 'NI3') pc = 11;
    else if (upper === 'N' || upper === 'NI') pc = scaleHasSemi([10, 11], 11);

    if (pc !== null) {
      const semi = pc + octaveOffset;
      const gamaka: GamakaType =
        pc === 1 || pc === 3 || pc === 8 || pc === 10
          ? 'kampita'
          : pc === 6
          ? 'meend'
          : 'none';
      notes.push({
        id: `sw-${cursor}-${semi}-${Math.random().toString(36).slice(2, 6)}`,
        step: cursor,
        durationSteps: Math.min(stepIncrement, totalSteps - cursor),
        semitoneOffset: semi,
        velocity: cursor === 0 ? 0.94 : 0.84,
        gamaka,
        syllable: rawTok,
      });
    }
    cursor += stepIncrement;
  }

  return notes;
}

/**
 * Generates an authentic 3-fold Tihai / Korvai cadence across the cycle landing cleanly on Sam.
 */
export function generateTihaiCadence(
  scale: ScaleDefinition,
  tala: TalaDefinition,
  isPercussion: boolean
): NoteEvent[] {
  const total = Math.max(8, tala.totalSteps);
  const scaleNotes = scale.semitones.length >= 4 ? scale.semitones : [0, 2, 4, 7, 11];
  const motif = isPercussion
    ? [0, 2, 4, 7]
    : [
        scaleNotes[Math.min(4, scaleNotes.length - 1)] ?? 7,
        scaleNotes[Math.min(2, scaleNotes.length - 1)] ?? 4,
        scaleNotes[Math.min(1, scaleNotes.length - 1)] ?? 2,
        0,
      ];

  const motifLen = motif.length; // 4 steps each x 3 = 12 steps
  const gap = total >= 16 ? 1 : 0;
  const needed = motifLen * 3 + gap * 2;
  const startStep = Math.max(0, total - needed);

  const out: NoteEvent[] = [];
  for (let rep = 0; rep < 3; rep++) {
    const repStart = startStep + rep * (motifLen + gap);
    for (let i = 0; i < motif.length; i++) {
      const step = (repStart + i) % total;
      const semi = motif[i];
      out.push({
        id: `tihai-${rep}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        step,
        durationSteps: 1,
        semitoneOffset: semi,
        velocity: i === motif.length - 1 ? 0.96 : 0.8 + rep * 0.04,
        gamaka: isPercussion ? 'none' : i === 0 ? 'nokku' : i === motif.length - 1 ? 'meend' : 'none',
        syllable: isPercussion ? ['Tha', 'Dhi', 'Thom', 'Dha'][i % 4] : undefined,
      });
    }
  }
  return out;
}

/**
 * Creates a Sangati (Carnatic/Hindustani ornamental variation) from an existing melodic line.
 */
export function applySangatiVariation(
  notes: NoteEvent[],
  scale: ScaleDefinition,
  tala: TalaDefinition
): NoteEvent[] {
  const ordered = [...notes].sort((a, b) => a.step - b.step);
  const scaleSet = scale.semitones;
  const total = tala.totalSteps;
  const out: NoteEvent[] = [];

  for (const n of ordered) {
    const baseSemi = ((n.semitoneOffset % 12) + 12) % 12;
    const octave = Math.floor(n.semitoneOffset / 12) * 12;
    const idxInScale = scaleSet.indexOf(baseSemi);
    const upperSemi =
      idxInScale >= 0
        ? scaleSet[(idxInScale + 1) % scaleSet.length] +
          (idxInScale + 1 >= scaleSet.length ? 12 : 0) +
          octave
        : n.semitoneOffset + 2;

    if (n.durationSteps >= 2 && n.step + 1 < total) {
      // Split long sustained swara into ornamental twin-swara janta/sphurita Sangati
      out.push({
        ...n,
        durationSteps: 1,
        gamaka: 'kampita',
      });
      out.push({
        id: `sang-${n.step + 1}-${Math.random().toString(36).slice(2, 6)}`,
        step: n.step + 1,
        durationSteps: Math.max(1, n.durationSteps - 1),
        semitoneOffset: upperSemi,
        velocity: Math.min(1, n.velocity * 0.92),
        gamaka: 'sphurita',
      });
    } else {
      out.push({
        ...n,
        gamaka: n.gamaka === 'none' ? 'kampita' : n.gamaka === 'kampita' ? 'sphurita' : n.gamaka,
      });
    }
  }

  return out;
}

/**
 * Stamps diatonic/modal harmony voicings (Triad / Maj7 / Sus2 / Modal Drone) on harmony/bass tracks.
 */
export function generateChordStampNotes(
  voicingType: 'triad_root' | 'maj7_lydian' | 'sus2_modal' | 'fifth_drone',
  scale: ScaleDefinition,
  startStep: number,
  durationSteps: number
): NoteEvent[] {
  const s = scale.semitones.length >= 5 ? scale.semitones : [0, 2, 4, 7, 11];
  let offsets: number[] = [0, 7];

  if (voicingType === 'triad_root') {
    offsets = [s[0] ?? 0, s[2] ?? 4, s[4] ?? 7];
  } else if (voicingType === 'maj7_lydian') {
    offsets = [s[0] ?? 0, s[2] ?? 4, s[4] ?? 7, s[s.length - 1] ?? 11];
  } else if (voicingType === 'sus2_modal') {
    offsets = [s[0] ?? 0, s[1] ?? 2, s[4] ?? 7, (s[0] ?? 0) + 12];
  } else {
    offsets = [s[0] ?? 0, s[4] ?? 7];
  }

  return offsets.map((semi, idx) => ({
    id: `chd-${startStep}-${semi}-${Math.random().toString(36).slice(2, 6)}`,
    step: startStep,
    durationSteps,
    semitoneOffset: semi,
    velocity: Math.max(0.55, 0.78 - idx * 0.05),
    gamaka: 'none',
  }));
}
