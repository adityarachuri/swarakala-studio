import type {GamakaType, StudioLocale, TraditionId} from '../types/studio';

export interface StudioStrings {
  brandName: string;
  nav: {
    console: string;
    stage3d: string;
    architect: string;
    pedagogy: string;
    library: string;
  };
  actions: {
    exportMaster: string;
    playLoop: string;
    playSong: string;
    stop: string;
    talaClick: string;
    tap: string;
    save: string;
    saved: string;
    printSheet: string;
  };
  traditions: {
    carnatic: string;
    hindustani: string;
    western: string;
  };
  labels: {
    ragaScale: string;
    talaMeter: string;
    shrutiPitch: string;
    justShruti: string;
    equalTemp: string;
    tanpura: string;
    droneOn: string;
    droneOff: string;
    sam: string;
    tali: string;
    khali: string;
    arohana: string;
    avarohana: string;
    vadi: string;
    samvadi: string;
    pakad: string;
    sahitya: string;
    solkattu: string;
    composerHint: string;
  };
  sequencer: {
    drawNote: string;
    cycleGamaka: string;
    inRagaLock: string;
    chromaticAll: string;
    autoPhrase: string;
    clear: string;
    quantizeGrid: string;
    liveSnapOn: string;
    liveSnapOff: string;
    quantizeRecorded: string;
    quantizeTrack: string;
    tihai: string;
    sangati: string;
    chordStamp: string;
    swaraInputPlaceholder: string;
    applyPhrase: string;
  };
  arranger: {
    title: string;
    loopSection: string;
    playArrangement: string;
    addSection: string;
    duplicateSection: string;
  };
  pedagogyTabs: {
    ledger: string;
    treatises: string;
    melakarta72: string;
    talaCalculator: string;
  };
  stage3d: {
    carnaticHall: string;
    hindustaniMehfil: string;
    westernScoring: string;
    universalStage: string;
    acousticAnatomy: string;
    clickInstrumentHint: string;
  };
  discovery: {
    heading: string;
    subheading: string;
    searchPlaceholder: string;
    allTypes: string;
    ragasOnly: string;
    talasOnly: string;
    allRasas: string;
    allDifficulties: string;
    allEras: string;
    loadIntoConsole: string;
    activeInConsole: string;
    audition: string;
    stopPreview: string;
    clearFilters: string;
  };
}

export const STUDIO_LOCALE_META: Record<
  StudioLocale,
  {code: StudioLocale; label: string; nativeLabel: string}
> = {
  en: {code: 'en', label: 'English', nativeLabel: 'English'},
  te: {code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు'},
  sa: {code: 'sa', label: 'Sanskrit', nativeLabel: 'संस्कृतम्'},
};

export const STUDIO_STRINGS: Record<StudioLocale, StudioStrings> = {
  en: {
    brandName: 'SwaraKala',
    nav: {
      console: 'Console',
      stage3d: 'Stage 3D',
      architect: 'AI Architect',
      pedagogy: 'Literature',
      library: 'Library',
    },
    actions: {
      exportMaster: 'Export Master',
      playLoop: 'Play Loop',
      playSong: 'Play Song',
      stop: 'Stop',
      talaClick: 'Tala Click',
      tap: 'Tap',
      save: 'Save',
      saved: 'Saved',
      printSheet: 'Print Study Sheet',
    },
    traditions: {
      carnatic: 'Carnatic',
      hindustani: 'Hindustani',
      western: 'Western',
    },
    labels: {
      ragaScale: 'Raga / Scale',
      talaMeter: 'Tala / Meter',
      shrutiPitch: 'Katta / Tonic Sa',
      justShruti: '22-Shruti',
      equalTemp: '12-TET',
      tanpura: 'Shruti Tanpura',
      droneOn: 'Drone On',
      droneOff: 'Drone Off',
      sam: 'Sam',
      tali: 'Tali',
      khali: 'Khali',
      arohana: 'Arohana (Ascent)',
      avarohana: 'Avarohana (Descent)',
      vadi: 'Vadi / Anchor Swara',
      samvadi: 'Samvadi / Consonant Foil',
      pakad: 'Pakad / Prayoga Signature',
      sahitya: 'Sahitya / Lyrics',
      solkattu: 'Solkattu / Tabla Bol',
      composerHint: 'Spacebar: Play/Stop · Click pitch label to audition · Type Swaras below',
    },
    sequencer: {
      drawNote: 'Draw Note',
      cycleGamaka: 'Cycle Gamaka',
      inRagaLock: 'In-Raga Lock',
      chromaticAll: 'Chromatic All',
      autoPhrase: 'Auto-Phrase',
      clear: 'Clear',
      quantizeGrid: 'Quantize Grid:',
      liveSnapOn: 'Live Snap: On',
      liveSnapOff: 'Live Snap: Off',
      quantizeRecorded: 'Quantize Recorded',
      quantizeTrack: 'Quantize Track',
      tihai: 'Tihai Cadence',
      sangati: 'Sangati Variation',
      chordStamp: 'Stamp Harmony',
      swaraInputPlaceholder: 'Type swaras (e.g. S R2 G3 M1 P D2 N3 S.)',
      applyPhrase: 'Insert Phrase',
    },
    arranger: {
      title: 'Composition Form',
      loopSection: 'Loop Section',
      playArrangement: 'Play Full Song',
      addSection: 'New Section',
      duplicateSection: 'Clone',
    },
    pedagogyTabs: {
      ledger: 'Raga & 22-Shruti Ledger',
      treatises: 'Classical & Western Treatises',
      melakarta72: '72 Melakarta & Thaats',
      talaCalculator: '35 Talas & Layakari',
    },
    stage3d: {
      carnaticHall: 'Carnatic Sabha',
      hindustaniMehfil: 'Hindustani Mehfil',
      westernScoring: 'Scoring Stage',
      universalStage: 'Philharmonic Studio',
      acousticAnatomy: 'Exploded Luthiery',
      clickInstrumentHint: 'Click any 3D instrument to audition & inspect',
    },
    discovery: {
      heading: 'Local Archive Raga & Tala Discovery Engine',
      subheading: 'Search 100+ Ragas, 72 Melakartas, Modes & Talas filtered by Rasa (mood), skill difficulty, and historical era.',
      searchPlaceholder: 'Search by raga, swara, thaat, tala, Telugu/Sanskrit name, or treatise...',
      allTypes: 'All Archives',
      ragasOnly: 'Ragas & Scales',
      talasOnly: 'Talas & Meters',
      allRasas: 'All Rasas / Moods',
      allDifficulties: 'All Difficulties',
      allEras: 'All Historical Eras',
      loadIntoConsole: 'Load in Studio',
      activeInConsole: 'Active in Studio',
      audition: 'Audition',
      stopPreview: 'Stop',
      clearFilters: 'Reset Filters',
    },
  },
  te: {
    brandName: 'స్వరకళ',
    nav: {
      console: 'స్వరమండపం',
      stage3d: 'త్రీడీ రంగస్థలం',
      architect: 'స్వర బ్రహ్మ',
      pedagogy: 'సంగీత శాస్త్రం',
      library: 'సంగ్రహాలయం',
    },
    actions: {
      exportMaster: 'మాస్టర్ ఎగుమతి',
      playLoop: 'ఆవర్తనం వాయించు',
      playSong: 'పూర్తి గీతం',
      stop: 'ఆపు',
      talaClick: 'తాళ నాదం',
      tap: 'లయ',
      save: 'భద్రపరచు',
      saved: 'భద్రమైనది',
      printSheet: 'పాఠ్య పత్రం ముద్రించు',
    },
    traditions: {
      carnatic: 'కర్ణాటక సంగీతం',
      hindustani: 'హిందుస్తానీ సంగీతం',
      western: 'పాశ్చాత్య సంగీతం',
    },
    labels: {
      ragaScale: 'రాగం / మేళం',
      talaMeter: 'తాళం / లయ',
      shrutiPitch: 'శ్రుతి (ఆధార షడ్జమం)',
      justShruti: '22-శ్రుతి',
      equalTemp: '12-సమస్వరం',
      tanpura: 'శ్రుతి తంబురా',
      droneOn: 'శ్రుతి సిద్ధం',
      droneOff: 'శ్రుతి విరామం',
      sam: 'సమం',
      tali: 'తాళి',
      khali: 'ఖాళీ',
      arohana: 'ఆరోహణ క్రమం',
      avarohana: 'అవరోహణ క్రమం',
      vadi: 'వాది (జీవస్వరం)',
      samvadi: 'సంవాది స్వరం',
      pakad: 'రక్తి ప్రయోగం (పకడ్)',
      sahitya: 'సాహిత్యం / కృతి పాఠం',
      solkattu: 'జతి / సొల్కట్టు / బోల్',
      composerHint: 'Spacebar: ప్లే/ఆపు · స్వర నామం నొక్కి శ్రుతి వినండి · తెలుగు స్వరలిపి సిద్ధం',
    },
    sequencer: {
      drawNote: 'స్వర రచన',
      cycleGamaka: 'గమక మార్పు',
      inRagaLock: 'రాగ నియమం',
      chromaticAll: 'ద్వాదశ స్వరాలు',
      autoPhrase: 'స్వర సంచారం',
      clear: 'తుడుచు',
      quantizeGrid: 'లయబద్ధం:',
      liveSnapOn: 'లైవ్ సమం: ఆన్',
      liveSnapOff: 'లైవ్ సమం: ఆఫ్',
      quantizeRecorded: 'రికార్డ్ లయబద్ధం',
      quantizeTrack: 'ట్రాక్ లయబద్ధం',
      tihai: 'ముక్తాయింపు / తిహాయి',
      sangati: 'సంగతి వరుస',
      chordStamp: 'స్వర సంఘాతం',
      swaraInputPlaceholder: 'స్వరాలు టైప్ చేయండి (ఉదా: S R2 G3 M1 P)',
      applyPhrase: 'చేర్చు',
    },
    arranger: {
      title: 'రచనా క్రమం',
      loopSection: 'భాగ ఆవర్తనం',
      playArrangement: 'సంపూర్ణ రచన',
      addSection: 'కొత్త భాగం',
      duplicateSection: 'నకలు',
    },
    pedagogyTabs: {
      ledger: 'రాగ & ద్వావింశతి శ్రుతి పట్టిక',
      treatises: 'ప్రాచీన లక్షణ గ్రంథాలు',
      melakarta72: '72 మేళకర్త చక్రం',
      talaCalculator: 'సూళాది సప్త తాళాలు (35)',
    },
    stage3d: {
      carnaticHall: 'కర్ణాటక సభా మంటపం',
      hindustaniMehfil: 'హిందుస్తానీ మెహ్‌ఫిల్',
      westernScoring: 'సినిమా స్కోరింగ్ స్టేజ్',
      universalStage: 'సంగీత మహామండపం',
      acousticAnatomy: 'వాద్య నిర్మాణం',
      clickInstrumentHint: 'వాద్యాన్ని నొక్కి దాని నాదం మరియు లక్షణం చూడండి',
    },
    discovery: {
      heading: 'రాగ & తాళ అన్వేషణ కోశం (స్థానిక గ్రంథాలయం)',
      subheading: 'రసం (భావం), సాధనా స్థాయి మరియు చారిత్రక యుగం ఆధారంగా 100+ రాగాలు, 72 మేళకర్తలు మరియు తాళాలను వెతకండి.',
      searchPlaceholder: 'రాగం, తాళం, గ్రంథం లేదా తెలుగు నామంతో వెతకండి...',
      allTypes: 'అన్నీ',
      ragasOnly: 'రాగాలు & మేళాలు',
      talasOnly: 'తాళాలు & లయలు',
      allRasas: 'అన్ని రసాలు (భావాలు)',
      allDifficulties: 'అన్ని స్థాయిలు',
      allEras: 'అన్ని చారిత్రక యుగాలు',
      loadIntoConsole: 'స్టూడియోలోకి చేర్చు',
      activeInConsole: 'ప్రస్తుతం సక్రియం',
      audition: 'శ్రుతి విను',
      stopPreview: 'ఆపు',
      clearFilters: 'ఫిల్టర్లు తొలగించు',
    },
  },
  sa: {
    brandName: 'स्वरकला',
    nav: {
      console: 'सङ्गीतमण्डपम्',
      stage3d: 'त्रिविमरङ्गः',
      architect: 'स्वरशिल्पी',
      pedagogy: 'शास्त्रकोशः',
      library: 'सङ्ग्रहालयः',
    },
    actions: {
      exportMaster: 'निर्यातनम्',
      playLoop: 'आवर्तयतु',
      playSong: 'सम्पूर्णगीतम्',
      stop: 'विरामः',
      talaClick: 'तालनादः',
      tap: 'लयमापः',
      save: 'संरक्षतु',
      saved: 'संरक्षितम्',
      printSheet: 'अध्ययनपत्रम्',
    },
    traditions: {
      carnatic: 'कर्णाटकपद्धतिः',
      hindustani: 'हिन्दुस्तानीपद्धतिः',
      western: 'पाश्चात्यपद्धतिः',
    },
    labels: {
      ragaScale: 'रागः / मेलः',
      talaMeter: 'तालः / छन्दः',
      shrutiPitch: 'आधारषड्जः',
      justShruti: 'द्वाविंशतिश्रुतिः',
      equalTemp: 'द्वादशसमस्वरः',
      tanpura: 'श्रुतितम्बूरा',
      droneOn: 'नादः सक्रियः',
      droneOff: 'नादः निवृत्तः',
      sam: 'समः',
      tali: 'ताली',
      khali: 'खाली',
      arohana: 'आरोहक्रमः',
      avarohana: 'अवरोहक्रमः',
      vadi: 'वादी (अंशस्वरः)',
      samvadi: 'संवादी स्वरः',
      pakad: 'पकड् / विशिष्टप्रयोगः',
      sahitya: 'साहित्यम् / पदम्',
      solkattu: 'पाटः / बोलः',
      composerHint: 'Spacebar: वादनम्/विरामः · श्रुतिपरीक्षणाय स्वरं स्पृशतु',
    },
    sequencer: {
      drawNote: 'स्वरलेखनम्',
      cycleGamaka: 'गमकपरिवर्तनम्',
      inRagaLock: 'रागनिष्ठा',
      chromaticAll: 'सर्वस्वराः',
      autoPhrase: 'तानरचना',
      clear: 'मार्जनम्',
      quantizeGrid: 'तालबद्धीकरणम्:',
      liveSnapOn: 'स्वतः तालबद्धम्',
      liveSnapOff: 'मुक्ततालः',
      quantizeRecorded: 'ध्वन्यङ्कितशोधनम्',
      quantizeTrack: 'पङ्क्तिशोधनम्',
      tihai: 'तिहाई / मुक्तायि',
      sangati: 'सङ्गतिविस्तारः',
      chordStamp: 'संवादन्यासः',
      swaraInputPlaceholder: 'स्वराः लिखन्तु (यथा S R2 G3 M1 P)',
      applyPhrase: 'योजयतु',
    },
    arranger: {
      title: 'प्रबन्धविभागः',
      loopSection: 'खण्डावर्तनम्',
      playArrangement: 'सम्पूर्णप्रबन्धः',
      addSection: 'नूतनखण्डः',
      duplicateSection: 'प्रतिरूपम्',
    },
    pedagogyTabs: {
      ledger: 'राग-श्रुति कोष्ठकम्',
      treatises: 'सङ्गीतलक्षणग्रन्थाः',
      melakarta72: 'द्विसप्ततिमेलचक्रम्',
      talaCalculator: 'पञ्चत्रिंशत्-तालप्रस्तारः',
    },
    stage3d: {
      carnaticHall: 'कर्णाटकसभामण्डपम्',
      hindustaniMehfil: 'सङ्गीतमहफिल्',
      westernScoring: 'वाद्यवृन्दमञ्चः',
      universalStage: 'विश्वसङ्गीतरङ्गः',
      acousticAnatomy: 'वाद्यविश्लेषणम्',
      clickInstrumentHint: 'वाद्यं स्पृष्ट्वा तस्य नादं लक्षणं च पश्यतु',
    },
    discovery: {
      heading: 'राग-ताल अन्वेषणकोशः (स्थानीयसङ्ग्रहः)',
      subheading: 'रस-कठिन्यस्तर-ऐतिहासिकयुगानुसारेण १००+ रागान् तालांश्च अन्विषन्तु।',
      searchPlaceholder: 'रागेन, तालेन, ग्रन्थेन वा स्वरेण अन्विषतु...',
      allTypes: 'सर्वाणि',
      ragasOnly: 'रागाः मेलाश्च',
      talasOnly: 'तालाः छन्दांसि च',
      allRasas: 'सर्वे रसाः',
      allDifficulties: 'सर्वे स्तराः',
      allEras: 'सर्वाणि युगानि',
      loadIntoConsole: 'मण्डपे योजयतु',
      activeInConsole: 'सक्रियम्',
      audition: 'शृणोतु',
      stopPreview: 'विरामः',
      clearFilters: 'शुद्धयतु',
    },
  },
};

export const SWARA_TELUGU_CARNATIC: Record<number, string> = {
  0: 'స',
  1: 'రి₁',
  2: 'రి₂',
  3: 'గ₂',
  4: 'గ₃',
  5: 'మ₁',
  6: 'మ₂',
  7: 'ప',
  8: 'ద₁',
  9: 'ద₂',
  10: 'ని₂',
  11: 'ని₃',
};

export const SWARA_TELUGU_HINDUSTANI: Record<number, string> = {
  0: 'స',
  1: 'రి̱',
  2: 'రి',
  3: 'గ̱',
  4: 'గ',
  5: 'మ',
  6: 'మ̍',
  7: 'ప',
  8: 'ద̱',
  9: 'ద',
  10: 'ని̱',
  11: 'ని',
};

export const SWARA_SANSKRIT_CARNATIC: Record<number, string> = {
  0: 'स',
  1: 'रि₁',
  2: 'रि₂',
  3: 'ग₂',
  4: 'ग₃',
  5: 'म₁',
  6: 'म₂',
  7: 'प',
  8: 'ध₁',
  9: 'ध₂',
  10: 'नि₂',
  11: 'नि₃',
};

export const SWARA_SANSKRIT_HINDUSTANI: Record<number, string> = {
  0: 'स',
  1: 'रे॒',
  2: 'रे',
  3: 'ग॒',
  4: 'ग',
  5: 'म',
  6: 'म॑',
  7: 'प',
  8: 'ध॒',
  9: 'ध',
  10: 'नि॒',
  11: 'नि',
};

export function getLocalizedGamakaName(gamaka: GamakaType, locale: StudioLocale): string {
  const table: Record<GamakaType, Record<StudioLocale, string>> = {
    none: {en: 'Plain', te: 'శుద్ధ', sa: 'शुद्धः'},
    kampita: {en: 'Kampita', te: 'కంపితం', sa: 'कम्पितम्'},
    meend: {en: 'Meend / Jaru', te: 'జారు / మీండ్', sa: 'मींड् / उल्लासितम्'},
    nokku: {en: 'Nokku', te: 'నొక్కు', sa: 'नोकु / आहतम्'},
    andolan: {en: 'Andolan', te: 'ఆందోళన్', sa: 'आन्दोलितम्'},
    sphurita: {en: 'Sphurita', te: 'స్ఫురితం', sa: 'स्फुरितम्'},
    staccato: {en: 'Staccato', te: 'ఖండిత', sa: 'त्रुटितम्'},
  };
  return table[gamaka]?.[locale] ?? table.none.en;
}

export function getLocalizedTraditionSwara(
  semitoneOffset: number,
  tradition: TraditionId,
  locale: StudioLocale
): {base: string; octaveMark: string} {
  const normalized = ((semitoneOffset % 12) + 12) % 12;
  const octaveShift = Math.floor(semitoneOffset / 12);
  let base = 'S';
  if (locale === 'te') {
    const dict = tradition === 'hindustani' ? SWARA_TELUGU_HINDUSTANI : SWARA_TELUGU_CARNATIC;
    base = dict[normalized] ?? 'స';
  } else if (locale === 'sa') {
    const dict = tradition === 'hindustani' ? SWARA_SANSKRIT_HINDUSTANI : SWARA_SANSKRIT_CARNATIC;
    base = dict[normalized] ?? 'स';
  } else {
    const enCarnatic: Record<number, string> = {
      0: 'S', 1: 'R₁', 2: 'R₂', 3: 'G₂', 4: 'G₃', 5: 'M₁',
      6: 'M₂', 7: 'P', 8: 'D₁', 9: 'D₂', 10: 'N₂', 11: 'N₃',
    };
    const enHind: Record<number, string> = {
      0: 'S', 1: 'r', 2: 'R', 3: 'g', 4: 'G', 5: 'm',
      6: 'M', 7: 'P', 8: 'd', 9: 'D', 10: 'n', 11: 'N',
    };
    base = (tradition === 'hindustani' ? enHind : enCarnatic)[normalized] ?? 'S';
  }
  const octaveMark = octaveShift > 0 ? '̇' : octaveShift < 0 ? '̣' : '';
  return {base, octaveMark};
}
