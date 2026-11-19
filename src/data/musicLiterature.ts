import type {GamakaType, InstrumentId, StudioLocale, TraditionId} from '../types/studio';

export interface TreatiseSection {
  chapterTitle: string;
  chapterTitleTe?: string;
  chapterTitleSa?: string;
  summary: string;
  keyDoctrines: string[];
  originalTextOrMaxim?: {
    scriptText: string;
    transliteration: string;
    translation: string;
  };
  playableDemo?: {
    label: string;
    instrument: InstrumentId;
    semitones: number[];
    gamaka?: GamakaType;
  };
}

export interface LiteratureWork {
  id: string;
  title: string;
  titleTe: string;
  titleSa: string;
  author: string;
  era: string;
  provenance: string;
  tradition: TraditionId | 'archive';
  language: string;
  classification: string;
  abstract: string;
  archivalSignificance: string;
  chapters: TreatiseSection[];
}

export interface MelakartaEntry {
  number: number;
  name: string;
  nameTe: string;
  nameSa: string;
  chakraNum: number;
  chakraName: string;
  chakraNameTe: string;
  chakraNameSa: string;
  madhyama: 'Shuddha (M₁)' | 'Prati (M₂)';
  riSemitone: number;
  gaSemitone: number;
  dhaSemitone: number;
  niSemitone: number;
  semitones: number[];
  swaraCode: string;
  hindustaniThaatEquivalent?: string;
}

export interface SuladiTalaType {
  id: string;
  name: string;
  nameTe: string;
  nameSa: string;
  symbolPattern: Array<'L' | 'D' | 'U'>; // L=Laghu, D=Drutam(2), U=Anudrutam(1)
  notation: string;
}

export interface SuladiJatiType {
  id: 'tisra' | 'chatusra' | 'khanda' | 'misra' | 'sankeerna';
  name: string;
  nameTe: string;
  nameSa: string;
  laghuBeats: number;
}

export interface Shruti22Entry {
  index: number;
  sanskritName: string;
  teluguName: string;
  swaraFamily: string;
  centsFromSa: number;
  ratioLabel: string;
  semitoneNearest: number;
  deltaFrom12TetCents: number;
}

export const SHRUTI_22_COMPENDIUM: Shruti22Entry[] = [
  {index: 1, sanskritName: 'Tivra (Shadja)', teluguName: 'తీవ్రా', swaraFamily: 'S', centsFromSa: 0, ratioLabel: '1:1', semitoneNearest: 0, deltaFrom12TetCents: 0},
  {index: 2, sanskritName: 'Kumudvati', teluguName: 'కుముద్వతి', swaraFamily: 'R₁ (Eka)', centsFromSa: 90.2, ratioLabel: '256:243', semitoneNearest: 1, deltaFrom12TetCents: -9.8},
  {index: 3, sanskritName: 'Manda', teluguName: 'మందా', swaraFamily: 'R₁ (Dvi)', centsFromSa: 111.7, ratioLabel: '16:15', semitoneNearest: 1, deltaFrom12TetCents: 11.7},
  {index: 4, sanskritName: 'Chandovati', teluguName: 'ఛందోవతి', swaraFamily: 'R₂ (Tri)', centsFromSa: 182.4, ratioLabel: '10:9', semitoneNearest: 2, deltaFrom12TetCents: -17.6},
  {index: 5, sanskritName: 'Dayavati', teluguName: 'దయావతి', swaraFamily: 'R₂ (Chatus)', centsFromSa: 203.9, ratioLabel: '9:8', semitoneNearest: 2, deltaFrom12TetCents: 3.9},
  {index: 6, sanskritName: 'Ranjani', teluguName: 'రంజని', swaraFamily: 'G₂ (Ati)', centsFromSa: 294.1, ratioLabel: '32:27', semitoneNearest: 3, deltaFrom12TetCents: -5.9},
  {index: 7, sanskritName: 'Raktika', teluguName: 'రక్తికా', swaraFamily: 'G₂ (Sadh)', centsFromSa: 315.6, ratioLabel: '6:5', semitoneNearest: 3, deltaFrom12TetCents: 15.6},
  {index: 8, sanskritName: 'Raudri', teluguName: 'రౌద్రీ', swaraFamily: 'G₃ (Antara)', centsFromSa: 386.3, ratioLabel: '5:4', semitoneNearest: 4, deltaFrom12TetCents: -13.7},
  {index: 9, sanskritName: 'Krodha', teluguName: 'క్రోధా', swaraFamily: 'G₃ (Tivra)', centsFromSa: 407.8, ratioLabel: '81:64', semitoneNearest: 4, deltaFrom12TetCents: 7.8},
  {index: 10, sanskritName: 'Vajrika', teluguName: 'వజ్రికా', swaraFamily: 'M₁ (Shuddha)', centsFromSa: 498.0, ratioLabel: '4:3', semitoneNearest: 5, deltaFrom12TetCents: -2.0},
  {index: 11, sanskritName: 'Prasarini', teluguName: 'ప్రసారిణి', swaraFamily: 'M₁ (Tivra)', centsFromSa: 519.6, ratioLabel: '27:20', semitoneNearest: 5, deltaFrom12TetCents: 19.6},
  {index: 12, sanskritName: 'Priti', teluguName: 'ప్రీతి', swaraFamily: 'M₂ (Prati)', centsFromSa: 590.2, ratioLabel: '45:32', semitoneNearest: 6, deltaFrom12TetCents: -9.8},
  {index: 13, sanskritName: 'Marjani', teluguName: 'మార్జనీ', swaraFamily: 'M₂ (Tivratara)', centsFromSa: 611.7, ratioLabel: '64:45', semitoneNearest: 6, deltaFrom12TetCents: 11.7},
  {index: 14, sanskritName: 'Kshiti (Panchama)', teluguName: 'క్షితి (పంచమం)', swaraFamily: 'P', centsFromSa: 702.0, ratioLabel: '3:2', semitoneNearest: 7, deltaFrom12TetCents: 2.0},
  {index: 15, sanskritName: 'Rakta', teluguName: 'రక్తా', swaraFamily: 'D₁ (Eka)', centsFromSa: 792.2, ratioLabel: '128:81', semitoneNearest: 8, deltaFrom12TetCents: -7.8},
  {index: 16, sanskritName: 'Sandipani', teluguName: 'సందీపని', swaraFamily: 'D₁ (Komal)', centsFromSa: 813.7, ratioLabel: '8:5', semitoneNearest: 8, deltaFrom12TetCents: 13.7},
  {index: 17, sanskritName: 'Alapini', teluguName: 'ఆలాపిని', swaraFamily: 'D₂ (Tri)', centsFromSa: 884.4, ratioLabel: '5:3', semitoneNearest: 9, deltaFrom12TetCents: -15.6},
  {index: 18, sanskritName: 'Madanti', teluguName: 'మదంతీ', swaraFamily: 'D₂ (Chatus)', centsFromSa: 905.9, ratioLabel: '27:16', semitoneNearest: 9, deltaFrom12TetCents: 5.9},
  {index: 19, sanskritName: 'Rohini', teluguName: 'రోహిణి', swaraFamily: 'N₂ (Ati)', centsFromSa: 996.1, ratioLabel: '16:9', semitoneNearest: 10, deltaFrom12TetCents: -3.9},
  {index: 20, sanskritName: 'Ramya', teluguName: 'రమ్యా', swaraFamily: 'N₂ (Kaisiki)', centsFromSa: 1017.6, ratioLabel: '9:5', semitoneNearest: 10, deltaFrom12TetCents: 17.6},
  {index: 21, sanskritName: 'Ugra', teluguName: 'ఉగ్రా', swaraFamily: 'N₃ (Kakali)', centsFromSa: 1088.3, ratioLabel: '15:8', semitoneNearest: 11, deltaFrom12TetCents: -11.7},
  {index: 22, sanskritName: 'Kshobhini', teluguName: 'క్షోభిణి', swaraFamily: 'N₃ (Cyuta)', centsFromSa: 1109.8, ratioLabel: '243:128', semitoneNearest: 11, deltaFrom12TetCents: 9.8},
];

export const SULADI_TALAS: SuladiTalaType[] = [
  {id: 'dhruva', name: 'Dhruva Tala', nameTe: 'ధ్రువ తాళం', nameSa: 'ध्रुवतालः', symbolPattern: ['L', 'D', 'L', 'L'], notation: '|4 O |4 |4'},
  {id: 'matya', name: 'Matya Tala', nameTe: 'మఠ్య తాళం', nameSa: 'मठ्यतालः', symbolPattern: ['L', 'D', 'L'], notation: '|4 O |4'},
  {id: 'rupaka', name: 'Rupaka Tala', nameTe: 'రూపక తాళం', nameSa: 'रूपकतालः', symbolPattern: ['D', 'L'], notation: 'O |4'},
  {id: 'jhampa', name: 'Jhampa Tala', nameTe: 'ఝంప తాళం', nameSa: 'झम्पतालः', symbolPattern: ['L', 'U', 'D'], notation: '|7 U O'},
  {id: 'triputa', name: 'Triputa Tala', nameTe: 'త్రిపుట తాళం', nameSa: 'त्रिपुटतालः', symbolPattern: ['L', 'D', 'D'], notation: '|4 O O'},
  {id: 'ata', name: 'Ata Tala', nameTe: 'అట తాళం', nameSa: 'अटतालः', symbolPattern: ['L', 'L', 'D', 'D'], notation: '|5 |5 O O'},
  {id: 'eka', name: 'Eka Tala', nameTe: 'ఏక తాళం', nameSa: 'एकतालः', symbolPattern: ['L'], notation: '|4'},
];

export const SULADI_JATIS: SuladiJatiType[] = [
  {id: 'tisra', name: 'Tisra (3)', nameTe: 'తిశ్ర (3)', nameSa: 'तिस्रः (3)', laghuBeats: 3},
  {id: 'chatusra', name: 'Chatusra (4)', nameTe: 'చతురశ్ర (4)', nameSa: 'चतुरस्रः (4)', laghuBeats: 4},
  {id: 'khanda', name: 'Khanda (5)', nameTe: 'ఖండ (5)', nameSa: 'खण्डः (5)', laghuBeats: 5},
  {id: 'misra', name: 'Misra (7)', nameTe: 'మిశ్ర (7)', nameSa: 'मिश्रः (7)', laghuBeats: 7},
  {id: 'sankeerna', name: 'Sankeerna (9)', nameTe: 'సంకీర్ణ (9)', nameSa: 'सङ्कीर्णः (9)', laghuBeats: 9},
];

// Complete 72 Melakarta System programmatically derived from Venkatamakhin–Govindacharya's exact symmetrical matrix
const CHAKRA_NAMES: Array<{en: string; te: string; sa: string}> = [
  {en: '1. Indu', te: '1. ఇందు చక్రం', sa: '१. इन्दुचक्रम्'},
  {en: '2. Netra', te: '2. నేత్ర చక్రం', sa: '२. नेत्रचक्रम्'},
  {en: '3. Agni', te: '3. అగ్ని చక్రం', sa: '३. अग्निचक्रम्'},
  {en: '4. Veda', te: '4. వేద చక్రం', sa: '४. वेदचक्रम्'},
  {en: '5. Bana', te: '5. బాణ చక్రం', sa: '५. बाणचक्रम्'},
  {en: '6. Rutu', te: '6. ఋతు చక్రం', sa: '६. ऋतुचक्रम्'},
  {en: '7. Rishi', te: '7. ఋషి చక్రం', sa: '७. ऋषिचक्रम्'},
  {en: '8. Vasu', te: '8. వసు చక్రం', sa: '८. वसुचक्रम्'},
  {en: '9. Brahma', te: '9. బ్రహ్మ చక్రం', sa: '९. ब्रह्मचक्रम्'},
  {en: '10. Disi', te: '10. దిశి చక్రం', sa: '१०. दिशिचक्रम्'},
  {en: '11. Rudra', te: '11. రుద్ర చక్రం', sa: '११. रुद्रचक्रम्'},
  {en: '12. Aditya', te: '12. ఆదిత్య చక్రం', sa: '१२. आदित्यचक्रम्'},
];

const MELAKARTA_NAMES_EN = [
  'Kanakangi', 'Ratnangi', 'Ganamurti', 'Vanaspati', 'Manavati', 'Tanarupi',
  'Senavati', 'Hanumatodi', 'Dhenuka', 'Natakapriya', 'Kokilapriya', 'Rupavati',
  'Gayakapriya', 'Vakulabharanam', 'Mayamalavagowla', 'Chakravakam', 'Suryakantam', 'Hatakambari',
  'Jhankaradhwani', 'Natabhairavi', 'Keeravani', 'Kharaharapriya', 'Gourimanohari', 'Varunapriya',
  'Mararanjani', 'Charukesi', 'Sarasangi', 'Harikambhoji', 'Dheerasankarabharanam', 'Naganandini',
  'Yagapriya', 'Ragavardhani', 'Gangeyabhushani', 'Vagadheeswari', 'Shulini', 'Chalanata',
  'Salagam', 'Jalarnavam', 'Jhalavarali', 'Navaneetam', 'Pavani', 'Raghupriya',
  'Gavambhodi', 'Bhavapriya', 'Shubhapantuvarali', 'Shadvidhamargini', 'Suvarnangi', 'Divyamani',
  'Dhavalambari', 'Namanarayani', 'Kamavardhani (Pantuvarali)', 'Ramapriya', 'Gamanashrama', 'Vishwambari',
  'Shamalangi', 'Shanmukhapriya', 'Simhendramadhyamam', 'Hemavati', 'Dharmavati', 'Neetimati',
  'Kantamani', 'Rishabhapriya', 'Latangi', 'Vachaspati', 'Mechakalyani', 'Chitrambari',
  'Sucharitra', 'Jyotiswarupini', 'Dhatuvardhani', 'Nasikabhushani', 'Kosalam', 'Rasikapriya',
];

const MELAKARTA_NAMES_TE = [
  'కనకాంగి', 'రత్నాంగి', 'గానమూర్తి', 'వనస్పతి', 'మానవతి', 'తానరూపి',
  'సేనావతి', 'హనుమతోడి', 'ధేనుక', 'నాటకప్రియ', 'కోకిలప్రియ', 'రూపవతి',
  'గాయకప్రియ', 'వకుళాభరణం', 'మాయామాళవగౌళ', 'చక్రవాకం', 'సూర్యకాంతం', 'హాటకాంబరి',
  'ఝంకారధ్వని', 'నటభైరవి', 'కీరవాణి', 'ఖరహరప్రియ', 'గౌరీమనోహరి', 'వరుణప్రియ',
  'మారరంజని', 'చారుకేశి', 'సరసాంగి', 'హరికాంభోజి', 'ధీరశంకరాభరణం', 'నాగానందిని',
  'యాగప్రియ', 'రాగవర్ధని', 'గాంగేయభూషణి', 'వాగధీశ్వరి', 'శూలిని', 'చలనాట',
  'సాలగం', 'జలార్ణవం', 'ఝాలవరాళి', 'నవనీతం', 'పావని', 'రఘుప్రియ',
  'గవాంభోది', 'భవప్రియ', 'శుభపంతువరాళి', 'షడ్విధమార్గిణి', 'సువర్ణాంగి', 'దివ్యమణి',
  'ధవళాంబరి', 'నామనారాయణి', 'కామవర్ధని (పంతువరాళి)', 'రామప్రియ', 'గమనశ్రమ', 'విశ్వంబరి',
  'శ్యామలాంగి', 'షణ్ముఖప్రియ', 'సింహేంద్రమధ్యమం', 'హేమవతి', 'ధర్మవతి', 'నీతిమతి',
  'కాంతామణి', 'ఋషభప్రియ', 'లతాంగి', 'వాచస్పతి', 'మేచకళ్యాణి', 'చిత్రాంబరి',
  'సుచరిత్ర', 'జ్యోతిస్వరూపిణి', 'ధాతువర్ధని', 'నాసికాభూషణి', 'కోసలం', 'రసికప్రియ',
];

const MELAKARTA_NAMES_SA = [
  'कनकाङ्गी', 'रत्नाङ्गी', 'गानमूर्तिः', 'वनस्पतिः', 'मानवती', 'तानरूपी',
  'सेनावती', 'हनुमत्तोडी', 'धेनुका', 'नाटकप्रिया', 'कोकिलप्रिया', 'रूपवती',
  'गायकप्रिया', 'वकुलाभरणम्', 'मायामालवगौलः', 'चक्रवाकम्', 'सूर्यकान्तम्', 'हाटकाम्बरी',
  'झङ्कारध्वनिः', 'नटभैरवी', 'कीरवाणी', 'खरहरप्रिया', 'गौरीमनोहरी', 'वरुणप्रिया',
  'माररञ्जनी', 'चारुकेशी', 'सरसाङ्गी', 'हरिकाम्भोजिः', 'धीरशङ्कराभरणम्', 'नागानन्दिनी',
  'यागप्रिया', 'रागवर्धनी', 'गाङ्गेयभूषणी', 'वागधीश्वरी', 'शूलिनी', 'चलनाटा',
  'सालगम्', 'जलार्णवम्', 'झालवराली', 'नवनीतम्', 'पावनी', 'रघुप्रिया',
  'गवाम्भोधिः', 'भवप्रिया', 'शुभपन्तुवराली', 'षड्विधमार्गिणी', 'सुवर्णाङ्गी', 'दिव्यमणिः',
  'धवलाम्बरी', 'नामनारायणी', 'कामवर्धनी', 'रामप्रिया', 'गमनश्रमः', 'विश्वम्बरी',
  'श्यामलाङ्गी', 'षण्मुखप्रिया', 'सिंहेन्द्रमध्यमम्', 'हेमवती', 'धर्मवती', 'नीतिमती',
  'कान्तामणिः', 'ऋषभप्रिया', 'लताङ्गी', 'वाचस्पतिः', 'मेचकल्याणी', 'चित्राम्बरी',
  'सुचरित्रा', 'ज्योतिस्वरूपिणी', 'धातुवर्धनी', 'नासिकाभूषणी', 'कोसलम्', 'रसिकप्रिया',
];

// Poorvanga (Ri, Ga pairs within each Chakra)
const POORVANGA_PAIRS: Array<[number, number, string]> = [
  [1, 2, 'R₁ G₁'], // R1 (1), R2/G1 (2)
  [1, 3, 'R₁ G₂'],
  [1, 4, 'R₁ G₃'],
  [2, 3, 'R₂ G₂'],
  [2, 4, 'R₂ G₃'],
  [3, 4, 'R₃ G₃'], // R3 (3), G3 (4)
];

// Uttaranga (Dha, Ni pairs inside the 6 melas of a chakra)
const UTTARANGA_PAIRS: Array<[number, number, string]> = [
  [8, 9, 'D₁ N₁'],
  [8, 10, 'D₁ N₂'],
  [8, 11, 'D₁ N₃'],
  [9, 10, 'D₂ N₂'],
  [9, 11, 'D₂ N₃'],
  [10, 11, 'D₃ N₃'],
];

const HINDUSTANI_THAAT_MAP: Record<number, string> = {
  8: 'Bhairavi Thaat',
  15: 'Bhairav Thaat',
  20: 'Asavari Thaat',
  22: 'Kafi Thaat',
  28: 'Khamaj Thaat',
  29: 'Bilawal Thaat',
  45: 'Todi Thaat',
  51: 'Purvi Thaat',
  53: 'Marwa Thaat',
  65: 'Kalyan Thaat',
};

export const MELAKARTA_72: MelakartaEntry[] = Array.from({length: 72}, (_, idx) => {
  const num = idx + 1;
  const chakraIdx = Math.floor(idx / 6);
  const posInChakra = idx % 6;
  const isPrati = num > 36;
  const poorvangaIdx = chakraIdx % 6;
  const [ri, ga, pgLabel] = POORVANGA_PAIRS[poorvangaIdx];
  const [dha, ni, ugLabel] = UTTARANGA_PAIRS[posInChakra];
  const ma = isPrati ? 6 : 5;
  const chakraMeta = CHAKRA_NAMES[chakraIdx];

  return {
    number: num,
    name: MELAKARTA_NAMES_EN[idx],
    nameTe: MELAKARTA_NAMES_TE[idx],
    nameSa: MELAKARTA_NAMES_SA[idx],
    chakraNum: chakraIdx + 1,
    chakraName: chakraMeta.en,
    chakraNameTe: chakraMeta.te,
    chakraNameSa: chakraMeta.sa,
    madhyama: isPrati ? 'Prati (M₂)' : 'Shuddha (M₁)',
    riSemitone: ri,
    gaSemitone: ga,
    dhaSemitone: dha,
    niSemitone: ni,
    semitones: [0, ri, ga, ma, 7, dha, ni],
    swaraCode: `S ${pgLabel} ${isPrati ? 'M₂' : 'M₁'} P ${ugLabel}`,
    hindustaniThaatEquivalent: HINDUSTANI_THAAT_MAP[num],
  };
});

export const CANONICAL_LITERATURE: LiteratureWork[] = [
  {
    id: 'natya-shastra',
    title: 'Natya Shastra (Chapters 28–33: Gana & Atodyavidhi)',
    titleTe: 'నాట్య శాస్త్రము (28–33 అధ్యాయాలు: గాన-ఆతోద్య విధి)',
    titleSa: 'नाट्यशास्त्रम् (अध्यायाः २८–३३: गान-आतोद्यविधिः)',
    author: 'Bharata Muni',
    era: 'c. 200 BCE – 200 CE',
    provenance: 'Pan-Indian Sanskrit Dramaturgy & Musicology · Kavyamala & Gaekwad Oriental Series',
    tradition: 'carnatic',
    language: 'Sanskrit',
    classification: 'Primary Canonical Treatises',
    abstract:
      'The oldest surviving encyclopedic Indian treatise codifying dramaturgy, acoustics, the 22-Shruti Sarana Chatushtayi tuning experiment on two Veenas (Chala & Achala), the 18 Jatis across Shadjagrama and Madhyamagrama, and four-fold instrument organology (Tata, Avanaddha, Ghana, Sushira).',
    archivalSignificance:
      'Root source for both Carnatic and Hindustani music systems, Sanskrit prosody, and Rasa-Swara emotional aesthetics (Shringara, Hasya, Karuna, Raudra, Veera, Bhayanaka, Bibhatsa, Adbhuta, Shanta).',
    chapters: [
      {
        chapterTitle: 'Adhyaya 28: Sarana Chatushtayi & 22 Shrutis',
        chapterTitleTe: 'అధ్యాయము 28: సారణా చతుష్టయి & 22 శ్రుతులు',
        chapterTitleSa: 'अध्यायः २८: सारणाचतुष्टयी द्वाविंशतिश्रुतयश्च',
        summary:
          'Bharata demonstrates microtonal geometry experimentally using two identical 9-stringed harps: the fixed Achala Veena and the lowered Chala Veena, shifting four descending pramana steps (4, 3, 2, 4, 4, 3, 2) to prove all 22 shrutis form a closed octave.',
        keyDoctrines: [
          'Shadjagrama Interval Distribution: S(4), R(3), G(2), M(4), P(4), D(3), N(2) = 22 Shrutis',
          'Madhyamagrama Interval Distribution: Panchama drops 1 Shruti (Prakrita -> Cyuta P): 4-3-4-2-4-3-2',
          'Ten Jati Lakshanas: Graha, Amsa, Tara, Mandra, Nyasa, Apanyasa, Alpatva, Bahutva, Shadava, Audava',
        ],
        originalTextOrMaxim: {
          scriptText: 'चतुश्चतुश्चतुश्चैव षड्जमध्यमपञ्चमाः । द्वे द्वे निषादगान्धारौ त्रीस्त्री ऋषभधैवतौ ॥',
          transliteration: 'Chatus-chatus-chatus-chaiva shadja-madhyama-panchamah | Dve dve nishada-gandharau tristri rishabha-dhaivatau ||',
          translation:
            'Shadja, Madhyama, and Panchama each span 4 shrutis; Nishada and Gandhara 2 shrutis each; Rishabha and Dhaivata 3 shrutis each.',
        },
        playableDemo: {
          label: 'Hear Shadjagrama (C4-based Kharaharapriya-like ancient parent scale)',
          instrument: 'veena',
          semitones: [0, 2, 3, 5, 7, 9, 10, 12],
          gamaka: 'none',
        },
      },
      {
        chapterTitle: 'Adhyaya 31–33: Tala, Avanaddha & Flute Organology',
        chapterTitleTe: 'అధ్యాయము 31–33: తాళం, వేణువు, మృదంగ వాద్య విధానం',
        chapterTitleSa: 'अध्यायः ३१–३३: ताल-सुषिर-अवनद्धवाद्यविधिः',
        summary:
          'Classifies the entire instrumental orchestra into four families—still authoritative in modern organology—alongside early Pushkara (triple-barrel drum) strokes and bamboo Bansuri finger-aperture acoustics.',
        keyDoctrines: [
          'Tata (Chordophones / Plucked strings), Sushira (Aerophones / Winds), Avanaddha (Membranophones), Ghana (Idiophones / Bells & cymbals)',
          'Laya classifications: Druta (fast), Madhya (medium), Vilambita (slow)',
          'Yati proportions governing rhythmic phrasing across dramatic entrances',
        ],
      },
    ],
  },
  {
    id: 'brihaddeshi',
    title: 'Brihaddeshi of Matanga Muni',
    titleTe: 'మతంగ ముని విరచిత బృహద్దేశీ',
    titleSa: 'मतङ्गमुनिप्रणीता बृहद्देशी',
    author: 'Matanga Muni',
    era: 'c. 6th–8th Century CE',
    provenance: 'Trivandrum Sanskrit Series · Rare Palm-Leaf Reconstruction',
    tradition: 'hindustani',
    language: 'Sanskrit',
    classification: 'Rare Early Medieval MS',
    abstract:
      'Landmark treatise bridging Vedic/Marga Jati theory and living regional (Desi) concert art. Brihaddeshi is the earliest extant text to coin and systematically define the word "Raga" as a melodic entity capable of coloring the human mind.',
    archivalSignificance:
      'Formulates the sargam syllabic notation Sa–Ri–Ga–Ma–Pa–Dha–Ni and details Grama-Ragas, Bhashas, Vibhashas, and early Desi Prabandhas.',
    chapters: [
      {
        chapterTitle: 'Raga Lakshana & Aesthetics of Emotional Coloration',
        chapterTitleTe: 'రాగ లక్షణము మరియు రంజకత్వ సిద్ధాంతం',
        chapterTitleSa: 'रागलक्षणं रञ्जकत्वसिद्धान्तश्च',
        summary:
          'Defines Raga not merely as a scalar collection of intervals, but as a living melodic organism adorned by Svara and Varna (movements: Sthayi, Arohi, Avarohi, Sanchari) that moves the listener.',
        keyDoctrines: [
          'Four Varnas: Sthayi (steady), Arohi (ascending), Avarohi (descending), Sanchari (weaving)',
          'Sargam shorthand syllables first documented in theoretical prose',
          'Classification of Ragas into Shuddha, Chhayalaga (hybrid), and Sankirna',
        ],
        originalTextOrMaxim: {
          scriptText: 'योऽसौ ध्वनिविशेषस्तु स्वरवर्णविभूषितः । रञ्जको जनचित्तानां स रागः कथितो बुधैः ॥',
          transliteration: 'Yo-sau dhvani-visheshastu svara-varna-vibhushitah | Ranjako jana-chittanam sa ragah kathito budhaih ||',
          translation:
            'That distinguished configuration of tone adorned by swaras and melodic contours (varna), which delights and colors the hearts of listeners, is called Raga by the wise.',
        },
        playableDemo: {
          label: 'Audition Bharata–Matanga Raga Contour (Yaman / Kalyan Meend)',
          instrument: 'sitar',
          semitones: [-1, 0, 2, 4, 6, 7, 11, 12],
          gamaka: 'meend',
        },
      },
    ],
  },
  {
    id: 'sangita-ratnakara',
    title: 'Sangita Ratnakara ("Saptadhyayi" — Ocean of Music)',
    titleTe: 'శార్ఙ్గదేవ సంగీత రత్నాకరం (సప్తాధ్యాయి)',
    titleSa: 'शार्ङ्गदेवकृतः सङ्गीतरत्नाकरः (सप्ताध्यायी)',
    author: 'Nissanka Sarngadeva',
    era: '1210–1247 CE (Yadava Court, Devagiri)',
    provenance: 'Adyar Library & Anandashrama Sanskrit Manuscripts · Commentaries by Kallinatha & Simhabhupala',
    tradition: 'archive',
    language: 'Sanskrit',
    classification: 'Monumental Pan-Indian Masterwork',
    abstract:
      'Called the Saptadhyayi (Seven Chapters), Sangita Ratnakara is the monumental synthesis cited by BOTH South Indian Carnatic and North Indian Hindustani scholars—and notably studied centuries later by Olivier Messiaen for its 120 Desi Talas!',
    archivalSignificance:
      'Catalogs 264 Ragas, 15 Gamakas (Panchadasha Gamaka), 108–120 Desi Talas, Nada-brahman philosophy, and exhaustive Prabandha compositional forms.',
    chapters: [
      {
        chapterTitle: 'Adhyaya 3 (Prakirnaka): Vaggeyakara & 15 Classical Gamakas',
        chapterTitleTe: 'అధ్యాయము 3: వాగ్గేయకార లక్షణము & పంచదశ గమకాలు (15)',
        chapterTitleSa: 'अध्यायः ३ (प्रकीर्णकम्): वाग्गेयकारलक्षणं पञ्चदशगमकाश्च',
        summary:
          'Defines the ideal complete composer (Vaggeyakara — master of both Vak/Lyrics and Geya/Melody) and codifies the 15 foundational Gamakas: Tiripa, Sphurita, Kampita, Lina, Andolita, Vali, Tribhinna, Kurula, Ahata, Ullasita, Plavita, Humpita, Mudrita, Namita, and Mishrita.',
        keyDoctrines: [
          'Uttama Vaggeyakara: Fluent in Grammar, Prosody (Chhandas), Lexicon (Kosha), Rasa, Swara, and Tala',
          'Kampita: Deliberate expressive oscillation across microtonal boundaries',
          'Ullasita (Glissando / Jaru / Meend) & Andolita (measured slow swing on komal notes)',
        ],
        originalTextOrMaxim: {
          scriptText: 'गीतं वाद्यं तथा नृत्यं त्रयं सङ्गीतमुच्यते ॥',
          transliteration: 'Gitam vadyam tatha nrityam trayam sangitam uchyate ||',
          translation:
            'Vocal song, instrumental music, and dance—this luminous triad is together termed Sangita.',
        },
        playableDemo: {
          label: 'Hear Kampita & Andolan Gamaka Articulation (Kharaharapriya / Darbari)',
          instrument: 'veena',
          semitones: [3, 5, 2, 0, 8, 7, 5, 3],
          gamaka: 'andolan',
        },
      },
      {
        chapterTitle: 'Adhyaya 5 (Tala-Adhyaya): Marga, 120 Desi Talas & Tala Prastara',
        chapterTitleTe: 'అధ్యాయము 5: తాళాధ్యాయము (120 దేశీ తాళాలు & ప్రస్తారం)',
        chapterTitleSa: 'अध्यायः ५ (तालाध्यायः): मार्गतलाः विंशत्युत्तरशतदेशीतालाश्च',
        summary:
          'Lays out combinatorial mathematics (Prastara) of time durations: Druta (0.5), Laghu (1), Guru (2), Pluta (3), and Kakapada (4)—exact durations adapted in 20th-century Western modernism.',
        keyDoctrines: [
          'Combinatorial Tala Prastara (Nashta & Uddishta mathematical permutations)',
          'Chachchatputa, Chachaputa, Shatpitaputraka Marga Talas',
          '120 Desi Talas including Simhavikridita, Sarangadeva, and Rangapradipa',
        ],
      },
    ],
  },
  {
    id: 'swaramelakalanidhi',
    title: 'Swaramelakalanidhi of Ramamatya',
    titleTe: 'రామామాత్య విరచిత స్వరమేళకళానిధి (1550 CE)',
    titleSa: 'रामामात्यकृतः स्वरमेलकलानिधिः',
    author: 'Todaramalla Ramamatya (Minister under Vijayanagara Empire)',
    era: '1550 CE (Hampi / Vijayanagara)',
    provenance: 'Annamalai University & Madras Music Academy Critical Editions',
    tradition: 'carnatic',
    language: 'Sanskrit',
    classification: 'Vijayanagara Renaissance Treatise',
    abstract:
      'Composed by the scholar-statesman Ramamatya at Vijayanagara (Andhra-Karnataka cultural heartland), this work retired archaic Grama theories and birthed the Mela (parent-scale) classification system still governing Carnatic music.',
    archivalSignificance:
      'First historical documentation of 20 Janaka Melas, Veena fret metallurgy (Suddha Mela Veena, Madhya Mela Veena, Achyutendra Mela Veena), and Mukhari as the Shuddha Mela benchmark.',
    chapters: [
      {
        chapterTitle: 'Svara Prakarana & Mela Prakarana',
        chapterTitleTe: 'స్వర ప్రకరణం & మేళ ప్రకరణం',
        chapterTitleSa: 'स्वरप्रकरणं मेलप्रकरणं च',
        summary:
          'Demonstrates how a single tuned Saraswati/Ruddha Veena with fixed frets can mechanically generate every Vikrita Swara and organize existing ragas into 20 parent Melas.',
        keyDoctrines: [
          'Classification of Ragas into Uttama (best for Prabandha/Gita), Madhyama, and Adhama',
          'Acoustic proof of Panchama, Shadja, and Madhyama consonances (Swayambhu Swaras)',
          'Fret geometry of open-tuned bass (Anumandra/Mandra) and melody strings',
        ],
        playableDemo: {
          label: 'Play Mayamalavagowla (Vijayanagara & Purandara Dasa Foundation)',
          instrument: 'veena',
          semitones: [0, 1, 4, 5, 7, 8, 11, 12],
          gamaka: 'kampita',
        },
      },
    ],
  },
  {
    id: 'chaturdandi-prakasika',
    title: 'Chaturdandi Prakasika & Sangraha Choodamani (72 Melakarta System)',
    titleTe: 'చతుర్దండి ప్రకాశిక & సంగ్రహ చూడామణి (72 మేళకర్తల సిద్ధాంతం)',
    titleSa: 'चतुर्दण्डीप्रकाशिका सङ्ग्रहचूडामणिश्च (द्विसप्ततिमेलकर्ताः)',
    author: 'Venkatamakhin (c. 1660 CE) & Govindacharya (c. 1800 CE)',
    era: '17th–19th Century CE (Thanjavur Nayak & Maratha Courts)',
    provenance: 'Madras Music Academy · Complete Sanskrit Text & Katapayadi Codex',
    tradition: 'carnatic',
    language: 'Sanskrit',
    classification: 'Architectural Bedrock of Carnatic Music',
    abstract:
      'Venkatamakhin mathematically proved that combining 6 Poorvanga permutations × 6 Uttaranga permutations across Shuddha Madhyama (1–36) and Prati Madhyama (37–72) yields a closed, exhaustive universe of exactly 72 Melakarta scales.',
    archivalSignificance:
      'Govindacharya’s Sangraha Choodamani refined the Sampoorna naming convention with the Katapayadi Sankhya mnemonic cipher—allowing any scholar to decode the Melakarta index number directly from the first two syllables of the Raga name.',
    chapters: [
      {
        chapterTitle: 'The 4 Pillars of Performance (Chatur-Dandi) & Katapayadi Cipher',
        chapterTitleTe: 'చతుర్దండి (గీత-ప్రబంధ-ఠాయ-ఆలాప) & కటపయాది సంఖ్యా సూత్రం',
        chapterTitleSa: 'चतुर्दण्डी (गीत-प्रबन्ध-ठाय-आलाप) कटपयादिसङ्ख्यासूत्रम्',
        summary:
          'How Katapayadi works: e.g., "Dheera-Sankara-bharanam" -> "Dhee"(9), "Ra"(2) -> invert "92" -> 29th Melakarta! "Mecha-Kalyani" -> "Me"(5), "Cha"(6) -> invert "56" -> 65th Melakarta! Explore all 72 interactively in the 72-Melakarta tab.',
        keyDoctrines: [
          'Vivadi Mela rule (Chakras 1, 6, 7, 12) where R₁=G₁ or D₁=N₁ chromatic adjacency requires subtle Gamaka',
          'Prati Madhyama symmetry: Add +36 to any Mela (1–36) to transform Shuddha M₁ into Prati M₂ (e.g., 29 Shankarabharanam + 36 = 65 Kalyani)',
          'Chaturdandi four concert limbs: Alapa (improvisation), Thaya (phrases), Gita, Prabandha',
        ],
        playableDemo: {
          label: 'Compare Shuddha M₁ (Shankarabharanam #29) -> Prati M₂ (Kalyani #65)',
          instrument: 'veena',
          semitones: [0, 2, 4, 5, 7, 0, 2, 4, 6, 7, 11, 12],
          gamaka: 'kampita',
        },
      },
    ],
  },
  {
    id: 'sangita-sampradaya-pradarsini',
    title: 'Sangita Sampradaya Pradarsini (Rare 1904 Telugu & Sanskrit Magnum Opus)',
    titleTe: 'సంగీత సంప్రదాయ ప్రదర్శిని (సుబ్బరామ దీక్షితుల మహాగ్రంథం · 1904)',
    titleSa: 'सङ्गीतसम्प्रदायप्रदर्शिनी (सुब्बरामदीक्षितविरिचिता · १९०४)',
    author: 'Brahmasri Subbarama Dikshitar (Grandson/Adoptive heir of Baluswami Dikshitar)',
    era: '1904 CE (Ettayapuram Samsthanam · Vidya Vilasini Press)',
    provenance: 'Original 1,700-page Telugu Script Edition · Digitally Preserved Classic Archive',
    tradition: 'carnatic',
    language: 'Telugu & Sanskrit',
    classification: 'Rare Print & Vaggeyakara Archive',
    abstract:
      'One of the rarest and most revered musicological monuments in Indian history—written in Telugu! Contains over 200+ Kritis of Muthuswami Dikshitar, Tyagaraja, Syama Sastri, and Kshetrayya in precise Gamaka-annotated Telugu Swaralipi, plus the Sangita Prachina Charitra (historical biographies).',
    archivalSignificance:
      'Introduces standardized graphic symbols for Dashavidha (10) Gamakas in Telugu Swaralipi notation and preserves Raganga Raga Varnams dating back to Venkatamakhin’s lineage.',
    chapters: [
      {
        chapterTitle: 'Telugu Vaggeyakara Heritage & Dashavidha Gamaka Notation',
        chapterTitleTe: 'తెలుగు వాగ్గేయకార సంప్రదాయం & దశవిధ గమక లిపి సంకేతాలు',
        chapterTitleSa: 'तैलङ्गी-वाग्गेयकारपरम्परा दशविधगमकलिपिसङ्केताश्च',
        summary:
          'Documents the monumental Telugu–Sanskrit bridge of Tallapaka Annamacharya (Padakavita Pitamaha), Purandara Dasa, Kshetrayya (Muvvagopala Padams in Triputa/Adi), Bhadrachala Ramadasu, and the Thanjavur Trinity (Saint Tyagaraja, Muthuswami Dikshitar, Syama Sastri).',
        keyDoctrines: [
          'Dashavidha Gamakas: Arohana, Avarohana, Dhalu (leap glide), Sphurita, Kampita, Ahata, Pratyahata, Tripuchcha, Andolana, Murchana',
          'Telugu Yati & Prasa prosody: Second-syllable Dwitiyakshara Prasa aligning with Samam/Edumpu',
          'Raga Lakshanam codifying Jiva Swaras (life-giving tones), Nyasa (resting tones), and Anya Swara Bhashanga rules',
        ],
        originalTextOrMaxim: {
          scriptText: 'నాదతనుమనిశం శంకరం నమామి మే మనసా శిరసా ॥',
          transliteration: 'Nada-tanum anisham Sankaram namami me manasa sirasa || (Cittaranjani, Deshadi — Tyagaraja)',
          translation:
            'Incarnate Form of Sacred Sound (Nada), Lord Sankara — to Him I bow eternally with mind and crown.',
        },
        playableDemo: {
          label: 'Play Hamsadhwani Concert Motif (Kalyana / Dikshitar-Tyagaraja Style)',
          instrument: 'veena',
          semitones: [0, 2, 4, 7, 11, 12, 11, 7, 4, 2, 0],
          gamaka: 'kampita',
        },
      },
    ],
  },
  {
    id: 'bhatkhande-kramik',
    title: 'Hindustani Sangit Paddhati & Kramik Pustak Malika (Vols. I–VI)',
    titleTe: 'భాత్ఖండే హిందుస్తానీ సంగీత పద్ధతి & క్రమిక పుస్తక మాలిక',
    titleSa: 'विष्णुनारायणभातखण्डे-कृतं हिन्दुस्तानीसङ्गीतपद्धतिः क्रमिकपुस्तकमालिका च',
    author: 'Pandit Vishnu Narayan Bhatkhande',
    era: '1909–1932 CE (Bombay / Baroda / Lucknow Marris College)',
    provenance: 'Marathi/Hindi/Sanskrit Treatises (Abhinava Raga Manjari & Lakshya Sangitam)',
    tradition: 'hindustani',
    language: 'Sanskrit & Hindi',
    classification: 'Modern Hindustani Codification',
    abstract:
      'Pandit Bhatkhande traveled across royal courts (Gwalior, Rampur, Baroda, Jaipur) annotating over 1,800 hereditary Khayal and Dhrupad Bandishes into open access—establishing the 10-Thaat system and modern Bhatkhande Swaralipi notation.',
    archivalSignificance:
      'Systematized the 8-Prahar Time Theory (Sandhiprakash, Purvanga-Pradhan, Uttaranga-Pradhan Ragas) linking komal/tivra intervals to circadian light cycles.',
    chapters: [
      {
        chapterTitle: 'Das Thaat System & Time-Theory (Samaya Chakra)',
        chapterTitleTe: 'దశ థాట్ విధానం & రాగ సమయ చక్రం (అష్ట ప్రహరాలు)',
        chapterTitleSa: 'दशथाटपद्धतिः रागसमयचक्रं च',
        summary:
          'Groups all Hindustani Ragas under 10 Thaats (Bilawal, Kalyan, Khamaj, Bhairav, Purvi, Marwa, Kafi, Asavari, Bhairavi, Todi) and explains why Sandhiprakash Ragas (Dawn & Dusk) feature Komal Rishabh (r) + Shuddha Gandhar (G).',
        keyDoctrines: [
          'Komal Re + Shuddha Ga = Sandhiprakash Dawn/Dusk indicator (Bhairav morning with m; Purvi/Marwa dusk with Tivra M♯)',
          'Vadi in Purvanga (S–P) dictates afternoon–midnight performance; Vadi in Uttaranga (M–Ṡ) dictates midnight–noon',
          'Bhatkhande Notation: Underset dot (mandrasaptak), overset dot (tarasaptak), horizontal underline (komal r g d n), vertical tick (tivra M♯)',
        ],
        originalTextOrMaxim: {
          scriptText: 'दशथाटसमुत्पन्नाः रागाः कल्याणपूर्वकाः । वादी संवादी भूषिताः समयनियमपालकाः ॥',
          transliteration: 'Dasha-thaata-samutpannah ragah kalyana-purvakah | Vadi samvadi bhushitah samaya-niyama-palakah ||',
          translation:
            'Born from the Ten Thaats beginning with Kalyan and Bilawal, adorned by Vadi and Samvadi anchors, each Raga obeys its sacred hour of time.',
        },
        playableDemo: {
          label: 'Audition Sandhiprakash Dawn Bhairav (S r G m P d N Ṡ)',
          instrument: 'sitar',
          semitones: [0, 1, 4, 5, 7, 8, 11, 12],
          gamaka: 'andolan',
        },
      },
      {
        chapterTitle: 'Dhrupad–Dhamar & Khayal–Taan Performance Architecture',
        chapterTitleTe: 'ధ్రుపద్–ధమార్ & ఖయాల్–తాన్ సంప్రదాయాలు',
        chapterTitleSa: 'ध्रुपद-धमार-ख्याल-तान-पद्धतिः',
        summary:
          'Contrasts four-part Dhrupad (Sthayi, Antara, Sanchari, Abhog) set in Chautaal/Dhamar with two-part Vilambit & Drut Khayal, Nom-Tom Alap syllables, and Layakari ratios (Dugun 2x, Tigun 3x, Chaugun 4x, Aadi 3/2x, Kuadi 5/4x).',
        keyDoctrines: [
          'Nom–Tom Alap preceding Pakhawaj entry in Jod and Jhala',
          '8 Gharana Styles: Gwalior, Agra, Kirana, Jaipur-Atrauli, Patiala, Rampur-Sahaswan, Maihar, Bhindibazar',
          'Tihai Architecture: Phrase repeated identically 3 times landing on Sam (X)',
        ],
      },
    ],
  },
  {
    id: 'hindustani-rare-archives',
    title: 'Rare Medieval Archives: Raga Tarangini, Sangita Parijata & Naghmat-e-Asafi',
    titleTe: 'అరుదైన ప్రాచీన గ్రంథాలు: రాగ తరంగిణి, సంగీత పారిజాతం & నగ్మాత్-ఎ-ఆసఫీ',
    titleSa: 'दुर्लभप्राचीनग्रन्थाः — रागतरङ्गिणी, सङ्गीतपारिजातः, नग्माते-आसफी च',
    author: 'Lochana Kavi (c. 15th c.), Pandit Ahobala (1665 CE) & Muhammad Reza (1813 CE)',
    era: '15th – 19th Century CE',
    provenance: 'Mithila, Agra & Lucknow Court Archives',
    tradition: 'archive',
    language: 'Sanskrit & Indo-Persian',
    classification: 'Rare Historical Manuscripts',
    abstract:
      'Preserves the lost transitional manuscripts uniting Sanskritic Venkatamakhin-era Mela thought with Indo-Persian Gharana evolution—especially Ahobala’s miraculous mathematical string-length proof of all Swaras on a 36-inch Veena wire!',
    archivalSignificance:
      'Lochana introduced the 12-Samsthana (Mela) classification; Ahobala first quantified swara positions by exact geometrical wire ratios (1/2 = Tara Sa, 2/3 = Panchama, 3/4 = Madhyama); Muhammad Reza first proposed Bilawal as the Hindustani Shuddha scale replacing ancient Kafi!',
    chapters: [
      {
        chapterTitle: 'Ahobala’s Geometrical String Law (Sangita Parijata)',
        chapterTitleTe: 'అహోబలుని వీణా తంత్రీ గణిత సూత్రం (సంగీత పారిజాతం)',
        chapterTitleSa: 'अहोबलस्य वीणातन्त्रीगणितसूत्रम् (सङ्गीतपारिजातः)',
        summary:
          'In 1665 CE, Pandit Ahobala bridged ancient Shruti philosophy and empirical physics by dividing a vibrating string mathematically—independently paralleling Mersenne and Rameau in Europe.',
        keyDoctrines: [
          'Wire Length L/2 = Tara Shadja (Octave 2:1)',
          'Wire Length 2L/3 = Panchama (Fifth 3:2); 3L/4 = Madhyama (Fourth 4:3)',
          'Dividing the Ma-to-Tara Sa segment locates Dhaivata and Nishada with physical precision',
        ],
        playableDemo: {
          label: 'Hear Pure Acoustic Harmonic Series (S – Ṡ – Ṗ – Ṁ – G₃ overtones)',
          instrument: 'santoor',
          semitones: [0, 12, 19, 24, 28],
          gamaka: 'none',
        },
      },
    ],
  },
  {
    id: 'western-fux-gradus',
    title: 'Gradus ad Parnassum (The Five Species of Counterpoint)',
    titleTe: 'గ్రాడస్ అడ్ పర్నాసమ్ — ఐదు రకాల పాశ్చాత్య కౌంటర్‌పాయింట్ శాస్త్రం',
    titleSa: 'पाश्चात्यस्वरसंवादशास्त्रम् (पञ्चविध-प्रतिस्वररचना)',
    author: 'Johann Joseph Fux',
    era: '1725 CE (Vienna Imperial Court)',
    provenance: 'Latin Folio · Studied directly by J.S. Bach, Haydn, Mozart, Beethoven & Brahms',
    tradition: 'western',
    language: 'Latin & English',
    classification: 'Western Counterpoint Bible',
    abstract:
      'The dialogic masterwork between teacher Aloysius (Palestrina) and student Josephus, codifying species counterpoint from a single Cantus Firmus line through five systematic contrapuntal disciplines.',
    archivalSignificance:
      'Remains the universal foundation of polyphonic film scoring, string quartet writing, and fugal architecture.',
    chapters: [
      {
        chapterTitle: 'Contrary Motion, Perfect Consonance & Suspensions',
        chapterTitleTe: 'విరుద్ధ గతి & పంచవిధ కౌంటర్‌పాయింట్ నియమాలు',
        chapterTitleSa: 'विरुद्धगतिः पञ्चविधप्रतिस्वरनियमाश्च',
        summary:
          'First Species (1:1 note-against-note), Second (2:1), Third (4:1), Fourth (Syncopated Suspensions 7–6, 4–3, 9–8), and Fifth (Florid counterpoint combining all rhythmic shapes).',
        keyDoctrines: [
          'Cardinal Laws: Approach perfect consonances (5th, 8ve) exclusively by contrary or oblique motion',
          'Forbid parallel 5ths and parallel octaves to preserve independent voice personalities',
          'Prepare dissonance on weak beat, suspend across barline, resolve downward by step',
        ],
        originalTextOrMaxim: {
          scriptText: 'Motus contrarius est anima contrapuncti.',
          transliteration: 'Gradus ad Parnassum, Dialogus Secundus (Vienna, 1725)',
          translation: 'Contrary motion between voices is the living soul of counterpoint.',
        },
        playableDemo: {
          label: 'Play Palestrina–Bach Cantus & Suspension Resolution (Dorian 4–3)',
          instrument: 'stringsEnsemble',
          semitones: [0, 7, 5, 4, 2, 0],
          gamaka: 'none',
        },
      },
    ],
  },
  {
    id: 'western-rameau-bach',
    title: 'Traité de l’Harmonie & The Well-Tempered Clavier Tradition',
    titleTe: 'రామో హార్మనీ గ్రంథం & బాఖ్ వెల్-టెంపర్డ్ క్లావియర్',
    titleSa: 'पाश्चात्यरागसंवादशास्त्रम् (टोनिक-डोमिनण्ट् सिद्धान्तः)',
    author: 'Jean-Philippe Rameau (1722) & Johann Sebastian Bach (1722–1742)',
    era: '1722–1742 CE (Paris & Köthen / Leipzig)',
    provenance: 'Rare 18th-Century Theoretical & Keyboard Archive',
    tradition: 'western',
    language: 'French / German / English',
    classification: 'Functional Harmony Foundation',
    abstract:
      'Rameau deduced the "Fundamental Bass" (Basse Fondamentale) directly from acoustic overtone partials (corps sonore)—uniting chords under Tonic (I), Subdominant (IV), and Dominant (V) gravity.',
    archivalSignificance:
      'Together with Bach’s 48 Preludes & Fugues across all 24 Major and Minor keys, this ushered in modern modulation, seventh chords, and circle-of-fifths storytelling.',
    chapters: [
      {
        chapterTitle: 'Harmonic Gravity: Tonic, Subdominant & Dominant Cadences',
        chapterTitleTe: 'టానిక్ (I) – సబ్‌డామినెంట్ (IV) – డామినెంట్ (V7) సంగీత గురుత్వాకర్షణ',
        chapterTitleSa: 'स्वरसङ्घाताकर्षणम् (I–IV–V७ न्यासक्रमः)',
        summary:
          'Demonstrates how a Dominant Seventh (V⁷) contains a tritone (M3 + m7) whose natural voice-leading compulsion pulls irresistibly back to the Tonic triad (I).',
        keyDoctrines: [
          'Chord Inversions share the same Fundamental Bass root identity',
          'Authentic Cadence (V⁷ → I), Plagal Cadence (IV → I), Deceptive Cadence (V⁷ → vi)',
          'Neapolitan ♭II⁶ and Augmented Sixth expressive chromatic pivots',
        ],
        playableDemo: {
          label: 'Audition Functional Cadence Arpeggio (I – IV – V7 – I)',
          instrument: 'piano',
          semitones: [0, 4, 7, 12, 5, 9, 12, 7, 11, 14, 17, 12],
          gamaka: 'none',
        },
      },
    ],
  },
  {
    id: 'western-orchestration-film',
    title: 'Principles of Orchestration, 20th-Century Modes & Cinema Scoring Craft',
    titleTe: 'ఆర్కెస్ట్రేషన్ & ఆస్కార్ స్థాయి సినీ సంగీత రచనా శాస్త్రం',
    titleSa: 'बृहद्वाद्यवृन्दरचनाचलच्चित्रसङ्गीतशास्त्रम्',
    author: 'Berlioz (1843), Rimsky-Korsakov (1913), Messiaen (1944) & Film Scoring Masters',
    era: '1843 – Present (Paris, St. Petersburg, Los Angeles, Chennai & Mumbai)',
    provenance: 'Conservatory Orchestration Manuals & Cross-Cultural Scoring Stage Practice',
    tradition: 'western',
    language: 'Multilingual',
    classification: 'Oscar & Conservatory Orchestration',
    abstract:
      'Synthesizes classic symphonic orchestration balance (string divisi, woodwind interlock, brass chorale swell) with Messiaen’s modal scales (partially inspired by Sarngadeva’s 120 Desi Talas!) and modern Indian–Western hybrid cinema scoring.',
    archivalSignificance:
      'Directly bridges Carnatic/Hindustani Raga & Gamaka lyricism (Solo Bansuri, Veena, Violin) over lush Lydian/Dorian symphonic string & French Horn pedals—the hallmark of Academy Award–winning world cinema scores.',
    chapters: [
      {
        chapterTitle: 'Hybrid Modal Orchestration & Thematic Leitmotif Architecture',
        chapterTitleTe: 'రాగ–ఆర్కెస్ట్రా మిళిత సంగీత దర్శకత్వం',
        chapterTitleSa: 'राग-वाद्यवृन्दसंयोजनं कथानादशिल्पम्',
        summary:
          'How master film composers voice Indian ragas (such as Charukesi, Kalyani/Lydian, Keeravani/Harmonic Minor, or Bhairav/Phrygian Dominant) across orchestral cello ostinati, French horn counter-lines, and intimate solo reed/plucked leads.',
        keyDoctrines: [
          'Never crowd the 250–500 Hz warmth band: separate Harp/Veena transient peaks from sustained Cello/Bass beds',
          'Doubling across families: Flute + Violin at unison/octave creates luminous cinema shimmer',
          'Non-retrogradable & Asymmetric Meters: Applying Misra Chapu (7/8) and Khanda Chapu (5/8) as dramatic film chase pulses',
        ],
        playableDemo: {
          label: 'Play Oscar Scoring Ensemble Cue (Lydian / Kalyani Horn–String Rise)',
          instrument: 'frenchHorn',
          semitones: [0, 4, 6, 7, 11, 12, 14, 12],
          gamaka: 'none',
        },
      },
    ],
  },
];

export function getLocalizedChakraName(entry: MelakartaEntry, locale: StudioLocale): string {
  if (locale === 'te') return entry.chakraNameTe;
  if (locale === 'sa') return entry.chakraNameSa;
  return entry.chakraName;
}

export function getLocalizedMelakartaName(entry: MelakartaEntry, locale: StudioLocale): string {
  if (locale === 'te') return entry.nameTe;
  if (locale === 'sa') return entry.nameSa;
  return entry.name;
}
