import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'English' | 'Hausa' | 'Yoruba' | 'Igbo';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  English: {
    'nav.home': 'Triage & Chat',
    'nav.history': 'Case History',
    'nav.alerts': 'Alerts',
    'nav.signout': 'Sign Out',
    'app.title': 'Lafiya',
    'home.hero.title': 'Talk to AI Health Assistant',
    'home.hero.desc': 'Describe symptoms for real-time triage guidance.',
    'home.hero.placeholder': 'Describe your symptoms...',
    'home.hero.prompt1': 'Headache & Fever',
    'home.hero.prompt2': 'Stomach pain',
    'home.hero.prompt3': 'Persistent cough',
    'home.map.title': 'Find Nearby Health Services',
    'home.map.placeholder': 'Search hospitals, clinics, pharmacies...',
    'home.map.subtitle': 'Locate trusted hospitals and pharmacies in your area.',
    'home.map.openMap': 'Open Interactive Map',
    'home.map.filter.hospital': 'Hospital',
    'home.map.filter.pharmacy': 'Pharmacy',
    'home.map.filter.emergency': 'Emergency',
    'home.triage.title': 'Quick Health Triage',
    'home.triage.desc': 'Guided step-by-step symptom checker for structured evaluation.',
    'home.triage.btn': 'Start Triage',
    'body.head': 'Head',
    'body.chest': 'Chest',
    'body.stomach': 'Stomach',
    'body.limbs': 'Limbs',
    'body.fever': 'Fever',
    'body.other': 'Other',
    'chat.q_symptoms': 'Hello. What are the main symptoms the child is experiencing?',
    'chat.q_age': 'How old is the child? (e.g., "24 months" or "3 years")',
    'chat.q_duration': 'How long have these symptoms been present? (e.g., "2 days")',
    'chat.q_location': 'To find nearby clinics for this high-risk case, please enter your current location (or type "skip" to use your saved location: {loc}).',
    'chat.triage_complete': 'Triage complete.',
    'chat.new_triage': 'To start a new triage, please describe the next child\'s symptoms.',
    'chat.error': 'An error occurred. Please try again.',
    'chat.input_placeholder': 'Type your answer here...',
    'chat.risk': 'Risk',
    'chat.likely': 'Likely',
    'chat.guidance': 'Actionable Guidance',
    'chat.nearby_clinics': 'Nearby Clinics',
    'chat.confirm_details': 'Please confirm the details:',
    'chat.btn_confirm': 'Confirm & Triage',
    'chat.btn_edit': 'Edit Details',
    'chat.lbl_symptoms': 'Symptoms',
    'chat.lbl_age': 'Age',
    'chat.lbl_duration': 'Duration',
    'chat.btn_open_maps': 'Open Maps for Directions',
  },
  Hausa: {
    'nav.home': 'Tantancewa & Hira',
    'nav.history': 'Tarihin Cututtuka',
    'nav.alerts': 'Sanarwa',
    'nav.signout': 'Fita',
    'app.title': 'Lafiya',
    'home.hero.title': 'Tattauna da Mataimakin Lafiya na AI',
    'home.hero.desc': 'Bayyana cututtuka don samun jagoran tantancewa a take.',
    'home.hero.placeholder': 'Bayyana cututtukanka...',
    'home.hero.prompt1': 'Ciwon kai da Zazzabi',
    'home.hero.prompt2': 'Ciwon ciki',
    'home.hero.prompt3': 'Tari mai tsanani',
    'home.map.title': 'Nemo Asibitoci Mafi Kusa',
    'home.map.placeholder': 'Nemo asibitoci, kanti...',
    'home.map.subtitle': 'Gano amintattun asibitoci a yankinka.',
    'home.map.openMap': 'Bude taswira',
    'home.map.filter.hospital': 'Asibiti',
    'home.map.filter.pharmacy': 'Kanti',
    'home.map.filter.emergency': 'Gaggawa',
    'home.triage.title': 'Tantancewa Mai Sauri',
    'home.triage.desc': 'Jagorar mataki-mataki don binciken cututtuka.',
    'home.triage.btn': 'Fara Tantancewa',
    'body.head': 'Kai',
    'body.chest': 'Kirji',
    'body.stomach': 'Ciki',
    'body.limbs': 'Gafa',
    'body.fever': 'Zazzabi',
    'body.other': 'Sauran',
    'chat.q_symptoms': 'Sannu. Wadanne manyan cututtuka yaron ke fuskanta?',
    'chat.q_age': 'Shekarun yaron nawa ne? (misali, "wata 24" ko "shekara 3")',
    'chat.q_duration': 'Tsawon wane lokaci wadannan cututtukan suka kasance? (misali, "kwanaki 2")',
    'chat.q_location': 'Domin gano asibitocin kusa da ku, da fatan za a shigar da wurin da kuke a yanzu (ko a rubuta "skip" don amfani da: {loc}).',
    'chat.triage_complete': 'An kammala tantancewa.',
    'chat.new_triage': 'Don fara sabon tantancewa, da fatan za a bayyana cututtukan yaro na gaba.',
    'chat.error': 'An sami matsala. Da fatan za a sake gwadawa.',
    'chat.input_placeholder': 'Rubuta amsarka anan...',
    'chat.risk': 'Hatsari',
    'chat.likely': 'Mai Yiwuwa',
    'chat.guidance': 'Jagoran Matakai',
    'chat.nearby_clinics': 'Asibitoci Mafi Kusa',
    'chat.confirm_details': 'Da fatan za a tabbatar da bayanan:',
    'chat.btn_confirm': 'Tabbatar & Tantancewa',
    'chat.btn_edit': 'Canza Bayani',
    'chat.lbl_symptoms': 'Cututtuka',
    'chat.lbl_age': 'Shekaru',
    'chat.lbl_duration': 'Tsawon Lokaci',
    'chat.btn_open_maps': 'Bude Taswira don Samun Hanya',
  },
  Yoruba: {
    'nav.home': 'Ayẹwo & Wiregbe',
    'nav.history': 'Itan Ẹjọ',
    'nav.alerts': 'Awọn itaniji',
    'nav.signout': 'Jade',
    'app.title': 'Lafiya',
    'home.hero.title': 'Soro pẹlu Oluranlọwọ AI',
    'home.hero.desc': 'Ṣe apejuwe awọn aami aisan fun itọsọna lẹsẹkẹsẹ.',
    'home.hero.placeholder': 'Ṣe apejuwe awọn aami aisan rẹ...',
    'home.hero.prompt1': 'Orififo & Iba',
    'home.hero.prompt2': 'Inu rirun',
    'home.hero.prompt3': 'Ikọ isẹku',
    'home.map.title': 'Wa Awọn Ile-iwosan nitosi',
    'home.map.placeholder': 'Wa awọn ile-iwosan, oniwosan...',
    'home.map.subtitle': 'Wa ile-iwosan ti a gbẹkẹle ni agbegbe rẹ.',
    'home.map.openMap': 'Ṣii Maapu',
    'home.map.filter.hospital': 'Ile-iwosan',
    'home.map.filter.pharmacy': 'Ile elegbogi',
    'home.map.filter.emergency': 'Pajawiri',
    'home.triage.title': 'Ayẹwo Ilera ni iyara',
    'home.triage.desc': 'Oluṣayẹwo aami aisan ti a tọsọna ni igbese-nipasẹ-igbese.',
    'home.triage.btn': 'Bẹrẹ Ayẹwo',
    'body.head': 'Ori',
    'body.chest': 'Aya',
    'body.stomach': 'Inu',
    'body.limbs': 'Ẹsẹ',
    'body.fever': 'Iba',
    'body.other': 'Omiiran',
    'chat.q_symptoms': 'Pẹlẹ o. Kini awọn aami aisan akọkọ ti ọmọ naa n ni?',
    'chat.q_age': 'Ọmọ ọdun melo ni ọmọ naa? (apẹẹrẹ, "Oṣu 24" tabi "ọdun 3")',
    'chat.q_duration': 'Igba wo ni awọn aami aisan wọnyi ti wa? (apẹẹrẹ, "ọjọ 2")',
    'chat.q_location': 'Lati wa awọn ile-iwosan to wa nitosi rẹ, jọwọ tẹ agbegbe rẹ sii (tabi tẹ "skip" lati lo: {loc}).',
    'chat.triage_complete': 'A ti pari ayẹwo.',
    'chat.new_triage': 'Lati bẹrẹ ayẹwo tuntun, jọwọ ṣe apejuwe awọn aami aisan ọmọ ti o tẹle.',
    'chat.error': 'Aṣiṣe kan waye. Jọwọ gbiyanju lẹẹkansi.',
    'chat.input_placeholder': 'Tẹ idahun rẹ sibi...',
    'chat.risk': 'Ewu',
    'chat.likely': 'O ṣee ṣe',
    'chat.guidance': 'Itọsọna Igbesẹ',
    'chat.nearby_clinics': 'Awọn Ile-iwosan Itosi',
    'chat.confirm_details': 'Jọwọ jẹrisi awọn alaye wọnyi:',
    'chat.btn_confirm': 'Jẹrisi & Ayẹwo',
    'chat.btn_edit': 'Ṣatunkọ',
    'chat.lbl_symptoms': 'Aami aisan',
    'chat.lbl_age': 'Ọjọ-ori',
    'chat.lbl_duration': 'Aago',
    'chat.btn_open_maps': 'Ṣi Maapu fun Itọsọna',
  },
  Igbo: {
    'nav.home': 'Nyocha & Mkparịta ụka',
    'nav.history': 'Akụkọ Ọrịa',
    'nav.alerts': 'Amụma',
    'nav.signout': 'Wepụ',
    'app.title': 'Lafiya',
    'home.hero.title': 'Gwa Onye Enyemaka AI',
    'home.hero.desc': 'Mepụta mgbaàmà maka ntuziaka ịntanetị ozugbo.',
    'home.hero.placeholder': 'Kọwaa mgbaàmà gị...',
    'home.hero.prompt1': 'Isi Ọwụwa & Ịba',
    'home.hero.prompt2': 'Afo owuwa',
    'home.hero.prompt3': 'Ụkwara na eku',
    'home.map.title': 'Chọta Ụlọ Ọgwụ Ndị Dị Nso',
    'home.map.placeholder': 'Chọta ụlọ ọgwụ, ụlọ ahịa ọgwụ...',
    'home.map.subtitle': 'Chọta ụlọ ọgwụ ndị a tụkwasịrị obi na mpaghara gị.',
    'home.map.openMap': 'Mepee Maapụ',
    'home.map.filter.hospital': 'Ụlọ ọgwụ',
    'home.map.filter.pharmacy': 'Ụlọ ahịa ọgwụ',
    'home.map.filter.emergency': 'Mberede',
    'home.triage.title': 'Nyocha Ahụike Ọsọ Ahụ',
    'home.triage.desc': 'Onye nyocha nke ọma na-ahụ maka ya na nyocha.',
    'home.triage.btn': 'Malite Nyocha',
    'body.head': 'Isi',
    'body.chest': 'Obi',
    'body.stomach': 'Afo',
    'body.limbs': 'Aka/Ụkwụ',
    'body.fever': 'Ịba',
    'body.other': 'Ọzọ',
    'chat.q_symptoms': 'Nnọọ. Kedu isi ihe mgbaàmà nwa ahụ na-enwe?',
    'chat.q_age': 'Afọ ole ka nwa ahụ dị? (dịka, "ọnwa 24" ma ọ bụ "afọ 3")',
    'chat.q_duration': 'Ogologo oge ole ka mgbaàmà ndị a dị? (dịka, "ụbọchị 2")',
    'chat.q_location': 'Iji chọta ụlọ ọgwụ dị nso, biko tinye ebe ị nọ ugbu a (ma ọ bụ pịnye "skip" iji jiri: {loc}).',
    'chat.triage_complete': 'Emechara nyocha.',
    'chat.new_triage': 'Iji malite nyocha ọhụrụ, biko kọwaa mgbaàmà nwa ọzọ.',
    'chat.error': 'Njehie mere. Biko nwaa ọzọ.',
    'chat.input_placeholder': 'Pịnye azịza gị ebe a...',
    'chat.risk': 'Ihe egwu',
    'chat.likely': 'O yikarịrị',
    'chat.guidance': 'Ntuziaka Emere',
    'chat.nearby_clinics': 'Ụlọ ọgwụ dị nso',
    'chat.confirm_details': 'Biko kwado nkọwa ndị a:',
    'chat.btn_confirm': 'Kwado & Nyocha',
    'chat.btn_edit': 'Dezie',
    'chat.lbl_symptoms': 'Mgbaàmà',
    'chat.lbl_age': 'Afọ',
    'chat.lbl_duration': 'Ogologo oge',
    'chat.btn_open_maps': 'Mepee Maapụ maka Ntụziaka',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('lafiya_lang');
    return (saved as SupportedLanguage) || 'English';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('lafiya_lang', lang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
