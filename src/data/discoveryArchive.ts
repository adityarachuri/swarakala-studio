import {
  getLocalizedMelakartaName,
  MELAKARTA_72,
  SULADI_JATIS,
  SULADI_TALAS,
} from './musicLiterature';
import {
  createScaleFromMelakarta,
  createTalaFromSuladi,
  getScaleDisplayName,
  getTalaDisplayName,
  getTalaStructureDisplay,
  SCALES_AND_RAGAS,
  TALAS_AND_METERS,
} from '../engine/musicTheory';
import type {StudioLocale, TraditionId} from '../types/studio';

export type DiscoveryKind = 'raga' | 'tala';

export type RasaId =
  | 'shanta'
  | 'shringara'
  | 'karuna'
  | 'veera'
  | 'adbhuta'
  | 'gambhira';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'virtuoso';

export type HistoricalEraId = 'ancient' | 'medieval' | 'trinity' | 'modern';

export interface DiscoveryEntry {
  uid: string;
  kind: DiscoveryKind;
  targetId: string; // scaleId or talaId loadable directly into Studio
  tradition: TraditionId;
  name: string;
  nameTe: string;
  nameSa: string;
  subtitle: string;
  signatureLabel: string; // Arohana/Swara pattern OR Vibhag/Akshara formula
  timeOrMetricLabel: string;
  rasas: RasaId[];
  difficulty: DifficultyLevel;
  historicalEra: HistoricalEraId;
  eraDetail: string;
  treatiseCitation: string;
  description: string;
  previewSemitones: number[];
  previewInstrument: 'veena' | 'sitar' | 'piano' | 'mridangam' | 'tabla' | 'drums';
  previewBeats?: number;
  previewTaliBeats?: number[];
}

export const RASA_META: Array<{
  id: RasaId;
  en: string;
  te: string;
  sa: string;
}> = [
  {id: 'shanta', en: 'Shanta (Peace / Meditative)', te: 'శాంతం (ధ్యాన & ప్రశాంతం)', sa: 'शान्तः (ध्यानम्)'},
  {id: 'shringara', en: 'Shringara (Lyrical / Devotional)', te: 'శృంగారం / భక్తి', sa: 'शृङ्गारः / भक्तिः'},
  {id: 'karuna', en: 'Karuna (Pathos / Yearning)', te: 'కరుణ (ఆర్ద్రత / విషాదం)', sa: 'करुणः (आर्द्रता)'},
  {id: 'veera', en: 'Veera (Heroic / Majestic)', te: 'వీరం (గంభీర ఉత్సాహం)', sa: 'वीरः (तेजस्वी)'},
  {id: 'adbhuta', en: 'Adbhuta (Wondrous / Auspicious)', te: 'అద్భుతం (మంగళప్రదం)', sa: 'अद्भुतः (मङ्गलम्)'},
  {id: 'gambhira', en: 'Gambhira (Profound / Nocturne)', te: 'గంభీరం (నిశీధి గాంభీర్యం)', sa: 'गम्भीरः (निशीथः)'},
];

export const DIFFICULTY_META: Array<{
  id: DifficultyLevel;
  en: string;
  te: string;
  sa: string;
}> = [
  {id: 'beginner', en: 'Beginner (Abhyasa)', te: 'ప్రారంభ స్థాయి (అభ్యాసం)', sa: 'प्रारम्भिकः (अभ्यासः)'},
  {id: 'intermediate', en: 'Intermediate (Concert Prep)', te: 'మధ్యమ స్థాయి', sa: 'मध्यमः'},
  {id: 'advanced', en: 'Advanced (Rakti & Vakra)', te: 'ఉన్నత స్థాయి (రక్తి / వక్ర)', sa: 'उन्नतः'},
  {id: 'virtuoso', en: 'Virtuoso / Rare Archive', te: 'విద్వత్ / అరుదైన మేళాలు', sa: 'विद्वत्-स्तरः'},
];

export const HISTORICAL_ERA_META: Array<{
  id: HistoricalEraId;
  en: string;
  te: string;
  sa: string;
  span: string;
}> = [
  {
    id: 'ancient',
    en: 'Ancient & Modal Origins',
    te: 'ప్రాచీన & భరత యుగం',
    sa: 'प्राचीन-भरतयुगम्',
    span: 'c. 200 BCE – 900 CE',
  },
  {
    id: 'medieval',
    en: 'Medieval & Vijayanagara Codification',
    te: 'మధ్యయుగ & విజయనగర కాలం',
    sa: 'मध्ययुगं विजयनगरञ्च',
    span: '10th – 17th c. CE',
  },
  {
    id: 'trinity',
    en: 'Golden Trinity & 72-Melakarta Era',
    te: 'వాగ్గేయకార త్రిమూర్తి & 72-మేళ యుగం',
    sa: 'त्रिमूर्ति-भातखण्डेयुगम्',
    span: '18th – Early 20th c.',
  },
  {
    id: 'modern',
    en: 'Modern Scoring & Global Fusion',
    te: 'ఆధునిక సినీ & ఫ్యూజన్ యుగం',
    sa: 'आधुनिक-वाद्यवृन्दयुगम्',
    span: '20th c. – Present',
  },
];

interface ScaleCuration {
  rasas: RasaId[];
  difficulty: DifficultyLevel;
  historicalEra: HistoricalEraId;
  eraDetail: string;
  treatiseCitation: string;
  description: string;
}

const SCALE_CURATION: Record<string, ScaleCuration> = {
  mayamalavagowla: {
    rasas: ['shanta', 'adbhuta'],
    difficulty: 'beginner',
    historicalEra: 'medieval',
    eraDetail: '15th–16th c. Vijayanagara Pedagogy',
    treatiseCitation: 'Purandara Dasa Sarali Tradition · Ramamatya Swaramelakalanidhi (1550)',
    description: 'Cornerstone symmetrical 7-note raga selected by Purandara Dasa for foundational Carnatic voice and Veena training.',
  },
  hamsadhwani: {
    rasas: ['adbhuta', 'veera'],
    difficulty: 'beginner',
    historicalEra: 'trinity',
    eraDetail: 'Late 18th c. Thanjavur Court',
    treatiseCitation: 'Ramaswami Dikshitar lineage · Sangita Sampradaya Pradarsini (1904)',
    description: 'Luminous Audava pentatonic raga invoking Ganesha and auspicious concert openings.',
  },
  kalyani: {
    rasas: ['veera', 'adbhuta', 'shringara'],
    difficulty: 'advanced',
    historicalEra: 'medieval',
    eraDetail: '17th c. Melakarta #65 (Lydian Symmetry)',
    treatiseCitation: 'Venkatamakhin Chaturdandi Prakasika (c. 1660) · Melakarta 65',
    description: 'Bright, regal evening raga anchored by Prati Madhyama (M₂) and shimmering gamakas.',
  },
  shankarabharanam: {
    rasas: ['veera', 'shanta'],
    difficulty: 'intermediate',
    historicalEra: 'ancient',
    eraDetail: 'Ancient Shadjagrama Echo · 17th c. Mela 29',
    treatiseCitation: 'Govindacharya Sangraha Choodamani · Melakarta 29',
    description: 'Noble foundational major heptatonic raga prized across classical kritis and symphonic scores.',
  },
  kharaharapriya: {
    rasas: ['karuna', 'shringara'],
    difficulty: 'advanced',
    historicalEra: 'ancient',
    eraDetail: 'Bharata Shadjagrama Cognate · 18th c. Mela 22',
    treatiseCitation: 'Natya Shastra Shadjagrama (Adhyaya 28) · Tyagaraja Kriti Canon',
    description: 'Closest modern Carnatic counterpart to ancient Shadjagrama and Dorian; richly lyrical across all octaves.',
  },
  mohanam: {
    rasas: ['shanta', 'shringara'],
    difficulty: 'beginner',
    historicalEra: 'ancient',
    eraDetail: 'Universal Ancient Pentatonic',
    treatiseCitation: 'Brihaddeshi Audava-Jati Heritage · Bhupali Cognate',
    description: 'Calm, universally resonant five-tone raga shared by Carnatic Mohanam, Hindustani Bhupali, and East Asian pentatonics.',
  },
  abheri: {
    rasas: ['karuna', 'shringara'],
    difficulty: 'intermediate',
    historicalEra: 'trinity',
    eraDetail: '18th–19th c. Trinity & Mysore Concert Repertoire',
    treatiseCitation: 'Sangita Sampradaya Pradarsini · Janya of Kharaharapriya (22)',
    description: 'Vakra-tinged poignant raga balancing delicate pentatonic ascent with soulful full descent.',
  },
  charukesi: {
    rasas: ['karuna', 'shringara'],
    difficulty: 'advanced',
    historicalEra: 'modern',
    eraDetail: '20th c. Concert & Film Scoring Ascent (Mela 26)',
    treatiseCitation: 'Sangraha Choodamani (Mela 26) · 20th c. Chamber & Cinema Canon',
    description: 'Contrasts a bright major lower tetrachord with a tragic minor upper tetrachord—beloved by film composers.',
  },
  todi_c: {
    rasas: ['karuna', 'gambhira', 'veera'],
    difficulty: 'virtuoso',
    historicalEra: 'trinity',
    eraDetail: '17th–19th c. Grand Concert Rakti Tradition (Mela 8)',
    treatiseCitation: 'Venkatamakhin Chaturdandi Prakasika · Syama Sastri & Tyagaraja Todi Canon',
    description: 'Emperor of Carnatic Rakti ragas; demands nuanced Kampita oscillations on R₁, G₂, D₁, and N₂.',
  },
  keeravani: {
    rasas: ['karuna', 'gambhira'],
    difficulty: 'advanced',
    historicalEra: 'modern',
    eraDetail: '19th–20th c. Concert & Symphonic Score Favorite (Mela 21)',
    treatiseCitation: 'Sangraha Choodamani (Mela 21) · Harmonic Minor Cross-Over',
    description: 'Dramatic harmonic-minor-parallel raga famed for orchestral strings and poignant melodic arcs.',
  },
  pantuvarali: {
    rasas: ['shanta', 'karuna', 'adbhuta'],
    difficulty: 'advanced',
    historicalEra: 'medieval',
    eraDetail: '16th–17th c. Pantuvarali / Ramakriya Heritage (Mela 51)',
    treatiseCitation: 'Ramamatya Swaramelakalanidhi & Venkatamakhin Mela 51 (Kamavardhani)',
    description: 'Deeply spiritual evening raga combining Komal R₁/D₁ pathos with shimmering Prati M₂ intensity.',
  },
  yaman: {
    rasas: ['shringara', 'shanta'],
    difficulty: 'intermediate',
    historicalEra: 'medieval',
    eraDetail: '14th–16th c. Indo-Persian & Bhakti Synthesis',
    treatiseCitation: 'Bhatkhande Kramik Pustak Malika · Kalyan Thaat',
    description: 'Premier evening Hindustani raga renowned for Mandra Ni openings and tranquil Meend into Gandhar.',
  },
  bhairav: {
    rasas: ['gambhira', 'shanta'],
    difficulty: 'intermediate',
    historicalEra: 'medieval',
    eraDetail: 'Early Medieval Shaivite / Brihaddeshi Lineage',
    treatiseCitation: 'Sarngadeva Sangita Ratnakara (13th c.) · Bhatkhande Bhairav Thaat',
    description: 'Majestic dawn Sandhiprakash raga anchored by deep Andolan oscillations on Komal Re and Komal Dha.',
  },
  bhimpalasi: {
    rasas: ['karuna', 'shringara'],
    difficulty: 'intermediate',
    historicalEra: 'trinity',
    eraDetail: '18th–19th c. Hindustani Court & Khayal Era',
    treatiseCitation: 'Kramik Pustak Malika · Kafi Thaat (Prakrit-Janya)',
    description: 'Romantic late-afternoon raga highlighting serene longing between Komal Ga and Shuddha Madhyam.',
  },
  darbari_kanada: {
    rasas: ['gambhira', 'veera'],
    difficulty: 'virtuoso',
    historicalEra: 'medieval',
    eraDetail: '16th c. Mughal Court (Attributed by tradition to Miyan Tansen)',
    treatiseCitation: 'Bhatkhande Sangit Paddhati · Asavari Thaat Vakra Canon',
    description: 'Weighty midnight raga characterized by slow ultra-low Ati-Komal Gandhar Andolan and majestic Nyasa on Rishabh.',
  },
  malkauns: {
    rasas: ['gambhira', 'shanta'],
    difficulty: 'beginner',
    historicalEra: 'ancient',
    eraDetail: 'Ancient Malavakausika Parentage (5th–12th c.)',
    treatiseCitation: 'Brihaddeshi / Sangita Ratnakara Malavakausika Heritage',
    description: 'Hypnotic late-night pentatonic omitting Re and Pa, fostering deep meditative resonance.',
  },
  bhairavi_h: {
    rasas: ['karuna', 'shringara', 'shanta'],
    difficulty: 'intermediate',
    historicalEra: 'ancient',
    eraDetail: 'Early Classical Grama Roots · Modern Concert Finale',
    treatiseCitation: 'Sangita Ratnakara & Muhammad Reza Naghmat-e-Asafi (1813)',
    description: 'The "Queen of Ragas" closing Hindustani mehfils; welcomes delicate chromatic Mishr embellishments.',
  },
  bageshri: {
    rasas: ['shringara', 'karuna'],
    difficulty: 'intermediate',
    historicalEra: 'trinity',
    eraDetail: '18th–19th c. Khayal & Thumri Flourish',
    treatiseCitation: 'Bhatkhande Kramik Pustak Malika · Kafi Thaat',
    description: 'Intimate midnight raga celebrating luminous Shuddha Dhaivata and soothing Madhyam resting phrases.',
  },
  marwa: {
    rasas: ['gambhira', 'karuna'],
    difficulty: 'virtuoso',
    historicalEra: 'trinity',
    eraDetail: '18th–19th c. Sunset Sandhiprakash Lineage',
    treatiseCitation: 'Bhatkhande Marwa Thaat Archive (Pa-Varjit Hexatonic)',
    description: 'Tense, ascetic twilight raga completely omitting Panchama (Pa) and dwelling on Komal Re and Tivra Ma.',
  },
  ionian: {
    rasas: ['adbhuta', 'veera'],
    difficulty: 'beginner',
    historicalEra: 'ancient',
    eraDetail: 'Ancient Modal System -> 16th c. Glarean Dodecachordon',
    treatiseCitation: 'Rameau Traité de l’Harmonie (1722) · Ionian Mode I',
    description: 'Bright diatonic major architecture forming the bedrock of Baroque, Classical, and uplifting cinema.',
  },
  dorian: {
    rasas: ['gambhira', 'shringara'],
    difficulty: 'intermediate',
    historicalEra: 'ancient',
    eraDetail: 'Medieval Church Mode -> Modern Jazz & Modal Nocturne',
    treatiseCitation: 'Fux Gradus ad Parnassum (1725) · Modal Jazz Era',
    description: 'Cool minor-third coloration lifted by a luminous natural 6th—shared identically with Kharaharapriya.',
  },
  lydian: {
    rasas: ['adbhuta', 'shanta'],
    difficulty: 'intermediate',
    historicalEra: 'modern',
    eraDetail: 'Ancient Modal Name -> 20th c. Film Scoring Staple',
    treatiseCitation: 'Berlioz/Rimsky-Korsakov & Modern Cinema Scoring (Kalyani Cognate)',
    description: 'Floating raised fourth (♯4) creates timeless wonder and aspirational orchestral warmth.',
  },
  mixolydian: {
    rasas: ['veera', 'adbhuta'],
    difficulty: 'beginner',
    historicalEra: 'ancient',
    eraDetail: 'Church Mode V · Folk & Orchestral Heroism',
    treatiseCitation: 'Modal Counterpoint Archives · Harikambhoji / Khamaj Cognate',
    description: 'Grounded, driving modal palette driven by its characteristic lowered ♭7th cadence.',
  },
  aeolian: {
    rasas: ['karuna', 'gambhira'],
    difficulty: 'beginner',
    historicalEra: 'medieval',
    eraDetail: 'Renaissance Aeolian Mode -> Natural Minor',
    treatiseCitation: 'Glarean Dodecachordon (1547) · Asavari Cognate',
    description: 'Universal natural minor scale suited for solemn chamber writing and sweeping symphonic pathos.',
  },
  harmonic_minor: {
    rasas: ['veera', 'karuna'],
    difficulty: 'intermediate',
    historicalEra: 'trinity',
    eraDetail: 'Baroque–Romantic Common Practice',
    treatiseCitation: 'Bach Well-Tempered Clavier Tradition · Keeravani Cognate',
    description: 'Augmented-second tension between ♭6 and raised leading-tone ♮7 drives poignant dramatic resolutions.',
  },
  phrygian_dominant: {
    rasas: ['veera', 'gambhira'],
    difficulty: 'advanced',
    historicalEra: 'modern',
    eraDetail: 'Cross-Cultural World Score Mode',
    treatiseCitation: '5th Mode of Harmonic Minor · Vakulabharanam / Ahir-Bhairav Bridge',
    description: 'Fiery ♭2-to-♮3 augmented interval bridging Mediterranean, Hindustani, and epic film percussion.',
  },
};

interface TalaCuration {
  rasas: RasaId[];
  difficulty: DifficultyLevel;
  historicalEra: HistoricalEraId;
  eraDetail: string;
  treatiseCitation: string;
  description: string;
}

const TALA_CURATION: Record<string, TalaCuration> = {
  adi_tala: {
    rasas: ['shanta', 'veera'],
    difficulty: 'beginner',
    historicalEra: 'medieval',
    eraDetail: 'Purandara Dasa Suladi Codification (16th c.)',
    treatiseCitation: 'Chatusra Jati Triputa · Suladi Sapta Tala System',
    description: 'Primary 8-akshara Carnatic concert cycle (Laghu 4 + Drutam 2 + Drutam 2).',
  },
  rupaka_tala: {
    rasas: ['shringara', 'adbhuta'],
    difficulty: 'beginner',
    historicalEra: 'trinity',
    eraDetail: '18th–19th c. Trinity Kriti & Javali Cycle',
    treatiseCitation: 'Chatusra Jati Rupaka (Drutam 2 + Laghu 4 = 6 Beats)',
    description: 'Lilting triple-feel 6-beat cycle favored in Kritis, Padams, and lyrical waltzes.',
  },
  misra_chapu: {
    rasas: ['karuna', 'adbhuta'],
    difficulty: 'advanced',
    historicalEra: 'trinity',
    eraDetail: 'Folk-to-Concert Synthesis (Shyama Sastri Tradition)',
    treatiseCitation: 'Sangita Sampradaya Pradarsini · 3 + 2 + 2 Folk-Classical Meter',
    description: 'Fluid 7-beat asymmetric pulse famously mastered by Syama Sastri and Kshetrayya.',
  },
  khanda_chapu: {
    rasas: ['veera', 'adbhuta'],
    difficulty: 'advanced',
    historicalEra: 'medieval',
    eraDetail: 'Traditional Temple & Ragamalika Pulse',
    treatiseCitation: '2 + 1 + 2 Khanda Chapu Oral Archive',
    description: 'Punchy 5-beat pulse accelerating with crisp syncopated Mridangam chapu accents.',
  },
  teental: {
    rasas: ['shanta', 'shringara', 'veera'],
    difficulty: 'intermediate',
    historicalEra: 'trinity',
    eraDetail: '18th–20th c. Khayal & Sitar Gat Standard',
    treatiseCitation: 'Bhatkhande Kramik Pustak Malika · 16-Matra Chatusra (4+4+4+4)',
    description: 'Symmetrical 16-beat king of Hindustani Tabla cycles with iconic Khali wave at beat 9.',
  },
  jhaptaal: {
    rasas: ['adbhuta', 'gambhira'],
    difficulty: 'advanced',
    historicalEra: 'trinity',
    eraDetail: 'Classical Madhyalaya Khayal Cycle',
    treatiseCitation: 'Hindustani Tala Prastara · 10-Matra (2 + 3 + 2 + 3)',
    description: 'Graceful 10-beat asymmetric cycle alternating 2-matra and 3-matra vibhags.',
  },
  dadra: {
    rasas: ['shringara', 'karuna'],
    difficulty: 'beginner',
    historicalEra: 'trinity',
    eraDetail: '19th c. Semi-Classical Thumri & Dadra Courts',
    treatiseCitation: 'Lucknow & Banaras Light-Classical Gharana Tradition',
    description: 'Sweeping 6-beat (3+3) sway ideal for Thumri, Dadra, and lyrical songs.',
  },
  rupak_h: {
    rasas: ['karuna', 'gambhira'],
    difficulty: 'advanced',
    historicalEra: 'trinity',
    eraDetail: '19th–20th c. Hindustani Instrumentalist Favorite',
    treatiseCitation: '7-Matra Unique Khali-on-Sam Meter (3 + 2 + 2)',
    description: 'Rare cycle whose Beat 1 (Sam) begins with an open Khali wave rather than a heavy clap.',
  },
  meter_4_4: {
    rasas: ['veera', 'shanta'],
    difficulty: 'beginner',
    historicalEra: 'ancient',
    eraDetail: 'Common Time · Baroque to Film Stage',
    treatiseCitation: 'Gradus ad Parnassum & Western Common Practice Notation',
    description: 'Versatile four-quarter grid for symphonic cues, chamber piano, and studio grooves.',
  },
  meter_3_4: {
    rasas: ['shringara', 'karuna'],
    difficulty: 'beginner',
    historicalEra: 'trinity',
    eraDetail: '18th–19th c. Viennese & Romantic Orchestral Meter',
    treatiseCitation: 'Romantic Chamber & Film Waltz Tradition',
    description: 'Flowing 3-beat triple meter yielding warm, swaying phrasing.',
  },
  meter_7_8: {
    rasas: ['adbhuta', 'veera'],
    difficulty: 'advanced',
    historicalEra: 'modern',
    eraDetail: '20th c. Bartok / Messiaen / Progressive Film Meter',
    treatiseCitation: 'Messiaen Technique de Mon Langage Musical (Inspired by Desi Talas)',
    description: '2 + 2 + 3 asymmetric eighth-note drive ideal for kinetic modern scoring.',
  },
};

function inferMelakartaMetadata(num: number, name: string): ScaleCuration {
  const isPrati = num > 36;
  const chakraIdx = Math.floor((num - 1) / 6);
  const isVivadi = [0, 5, 6, 11].includes(chakraIdx);

  let rasas: RasaId[] = ['shanta', 'adbhuta'];
  if (isPrati && !isVivadi) rasas = ['veera', 'gambhira'];
  if (num <= 18 && !isVivadi) rasas = ['karuna', 'shanta'];
  if (isVivadi) rasas = ['adbhuta', 'gambhira'];

  const difficulty: DifficultyLevel = isVivadi
    ? 'virtuoso'
    : isPrati
      ? 'advanced'
      : 'intermediate';

  return {
    rasas,
    difficulty,
    historicalEra: 'trinity',
    eraDetail: 'Govindacharya 72-Melakarta System (c. 1800) · Katapayadi Codification',
    treatiseCitation: `Venkatamakhin Chaturdandi Prakasika & Sangraha Choodamani · Mela #${num}`,
    description: `${name} is Sampoorna Melakarta #${num} (${
      isPrati ? 'Prati Madhyama M₂' : 'Shuddha Madhyama M₁'
    })${isVivadi ? ', featuring Vivadi chromatic interval coloring.' : '.'}`,
  };
}

export function buildDiscoveryArchive(locale: StudioLocale): DiscoveryEntry[] {
  const entries: DiscoveryEntry[] = [];
  const featuredMelaNumbers = new Set<number>();

  // 1. All 26 Featured Ragas & Western Modes
  for (const s of SCALES_AND_RAGAS) {
    if (s.melakartaNumber) featuredMelaNumbers.add(s.melakartaNumber);
    const cur = SCALE_CURATION[s.id] ?? {
      rasas: ['shanta'] as RasaId[],
      difficulty: 'intermediate' as DifficultyLevel,
      historicalEra: 'medieval' as HistoricalEraId,
      eraDetail: 'Classical Archive',
      treatiseCitation: s.classification,
      description: s.mood,
    };

    entries.push({
      uid: `raga-${s.id}`,
      kind: 'raga',
      targetId: s.id,
      tradition: s.tradition,
      name: getScaleDisplayName(s, locale),
      nameTe: s.nameTe ?? s.name,
      nameSa: s.nameSa ?? s.name,
      subtitle: `${s.classification} · ${s.name}`,
      signatureLabel: `${s.arohanaLabel}`,
      timeOrMetricLabel: `${s.timeOfDay} · ${s.mood}`,
      rasas: cur.rasas,
      difficulty: cur.difficulty,
      historicalEra: cur.historicalEra,
      eraDetail: cur.eraDetail,
      treatiseCitation: cur.treatiseCitation,
      description: cur.description,
      previewSemitones: [...s.semitones, 12],
      previewInstrument:
        s.tradition === 'carnatic'
          ? 'veena'
          : s.tradition === 'hindustani'
            ? 'sitar'
            : 'piano',
    });
  }

  // 2. Remaining Melakarta scales (from complete 72-Melakarta Archive) so users can search/filter ALL 72!
  for (const m of MELAKARTA_72) {
    if (featuredMelaNumbers.has(m.number)) continue;
    const derived = createScaleFromMelakarta(m);
    const meta = inferMelakartaMetadata(m.number, m.name);

    entries.push({
      uid: `raga-mela-${m.number}`,
      kind: 'raga',
      targetId: derived.id,
      tradition: 'carnatic',
      name: getLocalizedMelakartaName(m, locale) + ` (#${m.number})`,
      nameTe: m.nameTe,
      nameSa: m.nameSa,
      subtitle: `Melakarta #${m.number} · ${m.chakraName} Chakra · ${m.name}`,
      signatureLabel: `${m.swaraCode} Ṡ`,
      timeOrMetricLabel: m.hindustaniThaatEquivalent
        ? `${m.madhyama} · Thaat: ${m.hindustaniThaatEquivalent}`
        : `${m.madhyama} · 72-Melakarta Janaka`,
      rasas: meta.rasas,
      difficulty: meta.difficulty,
      historicalEra: meta.historicalEra,
      eraDetail: meta.eraDetail,
      treatiseCitation: meta.treatiseCitation,
      description: meta.description,
      previewSemitones: [...m.semitones, 12],
      previewInstrument: 'veena',
    });
  }

  // 3. All Core Talas & Meters
  for (const t of TALAS_AND_METERS) {
    const cur = TALA_CURATION[t.id] ?? {
      rasas: ['shanta'] as RasaId[],
      difficulty: 'intermediate' as DifficultyLevel,
      historicalEra: 'medieval' as HistoricalEraId,
      eraDetail: 'Classical Tala System',
      treatiseCitation: t.structureLabel,
      description: t.structureLabel,
    };

    entries.push({
      uid: `tala-${t.id}`,
      kind: 'tala',
      targetId: t.id,
      tradition: t.tradition,
      name: getTalaDisplayName(t, locale),
      nameTe: t.nameTe ?? t.name,
      nameSa: t.nameSa ?? t.name,
      subtitle: `${t.beats} Beats · ${t.timeSignatureNum}/${t.timeSignatureDen} · ${t.name}`,
      signatureLabel: getTalaStructureDisplay(t, locale),
      timeOrMetricLabel: `${t.totalSteps} Sequencer Steps (${t.stepsPerBeat}/beat)`,
      rasas: cur.rasas,
      difficulty: cur.difficulty,
      historicalEra: cur.historicalEra,
      eraDetail: cur.eraDetail,
      treatiseCitation: cur.treatiseCitation,
      description: cur.description,
      previewSemitones: [],
      previewInstrument:
        t.tradition === 'carnatic'
          ? 'mridangam'
          : t.tradition === 'hindustani'
            ? 'tabla'
            : 'drums',
      previewBeats: t.beats,
      previewTaliBeats: t.taliBeats,
    });
  }

  // 4. Canonical Representative Suladi Sapta Talas (beyond Adi & Rupaka)
  const canonicalSuladiCombos: Array<{
    talaId: string;
    jatiId: (typeof SULADI_JATIS)[number]['id'];
    rasas: RasaId[];
    difficulty: DifficultyLevel;
    desc: string;
  }> = [
    {
      talaId: 'ata',
      jatiId: 'khanda',
      rasas: ['veera', 'adbhuta'],
      difficulty: 'virtuoso',
      desc: 'Classic 14-beat Ata Tala Varnam meter (5 + 5 + 2 + 2) prized by concert virtuosos.',
    },
    {
      talaId: 'jhampa',
      jatiId: 'misra',
      rasas: ['gambhira', 'karuna'],
      difficulty: 'advanced',
      desc: 'Standard 10-beat Jhampa Tala (Laghu 7 + Anudrutam 1 + Drutam 2) in classic kritis.',
    },
    {
      talaId: 'dhruva',
      jatiId: 'chatusra',
      rasas: ['veera', 'gambhira'],
      difficulty: 'advanced',
      desc: 'Grand 14-beat Dhruva Tala (4 + 2 + 4 + 4) opening the Alankara Sutradi exercises.',
    },
    {
      talaId: 'matya',
      jatiId: 'chatusra',
      rasas: ['shanta', 'shringara'],
      difficulty: 'intermediate',
      desc: 'Symmetrical 10-beat Matya Tala (4 + 2 + 4) from Purandara Dasa Alankaras.',
    },
    {
      talaId: 'eka',
      jatiId: 'tisra',
      rasas: ['shringara', 'adbhuta'],
      difficulty: 'beginner',
      desc: 'Lively 3-akshara Tisra Eka Tala foundational to folk-inspired Nottuswara Sahityas.',
    },
  ];

  for (const combo of canonicalSuladiCombos) {
    const talaMeta = SULADI_TALAS.find((s) => s.id === combo.talaId);
    const calc = createTalaFromSuladi(combo.talaId, combo.jatiId);
    entries.push({
      uid: `tala-${calc.id}`,
      kind: 'tala',
      targetId: calc.id,
      tradition: 'carnatic',
      name: getTalaDisplayName(calc, locale),
      nameTe: calc.nameTe ?? calc.name,
      nameSa: calc.nameSa ?? calc.name,
      subtitle: `Suladi Sapta Tala · ${talaMeta?.notation ?? ''} · ${calc.name}`,
      signatureLabel: getTalaStructureDisplay(calc, locale),
      timeOrMetricLabel: `${calc.totalSteps} Sequencer Steps (${calc.beats} Aksharas)`,
      rasas: combo.rasas,
      difficulty: combo.difficulty,
      historicalEra: 'medieval',
      eraDetail: 'Purandara Dasa Suladi Sapta Tala System (15th–16th c.)',
      treatiseCitation: 'Suladi Sapta Tala & Pancha Jati Alankara Archive',
      description: combo.desc,
      previewSemitones: [],
      previewInstrument: 'mridangam',
      previewBeats: calc.beats,
      previewTaliBeats: calc.taliBeats,
    });
  }

  return entries;
}
