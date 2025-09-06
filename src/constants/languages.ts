/**
 * Language constants and mappings for Indian languages
 */

import { SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  hi: 'Hindi',
  bn: 'Bengali',
  te: 'Telugu',
  mr: 'Marathi',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  or: 'Odia',
  pa: 'Punjabi',
  as: 'Assamese',
  ne: 'Nepali',
  ur: 'Urdu',
  sd: 'Sindhi',
  ks: 'Kashmiri',
  bo: 'Bodo',
  dv: 'Dogri',
  en: 'English',
  sa: 'Sanskrit',
  gom: 'Konkani',
  mni: 'Manipuri',
  lus: 'Mizo',
  kok: 'Konkani'
};

export const LANGUAGE_SCRIPTS: Record<SupportedLanguage, string> = {
  hi: 'Devanagari',
  bn: 'Bengali',
  te: 'Telugu',
  mr: 'Devanagari',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  or: 'Odia',
  pa: 'Gurmukhi',
  as: 'Assamese',
  ne: 'Devanagari',
  ur: 'Arabic',
  sd: 'Arabic',
  ks: 'Arabic',
  bo: 'Devanagari',
  dv: 'Devanagari',
  en: 'Latin',
  sa: 'Devanagari',
  gom: 'Devanagari',
  mni: 'Meitei',
  lus: 'Latin',
  kok: 'Devanagari'
};

export const REGIONAL_MAPPINGS: Record<SupportedLanguage, string[]> = {
  hi: ['Delhi', 'Uttar Pradesh', 'Haryana', 'Rajasthan', 'Madhya Pradesh'],
  bn: ['West Bengal', 'Tripura', 'Assam'],
  te: ['Andhra Pradesh', 'Telangana'],
  mr: ['Maharashtra', 'Goa'],
  ta: ['Tamil Nadu', 'Puducherry'],
  gu: ['Gujarat', 'Dadra and Nagar Haveli', 'Daman and Diu'],
  kn: ['Karnataka'],
  ml: ['Kerala', 'Lakshadweep'],
  or: ['Odisha'],
  pa: ['Punjab', 'Haryana', 'Delhi'],
  as: ['Assam'],
  ne: ['Sikkim', 'West Bengal'],
  ur: ['Jammu and Kashmir', 'Delhi', 'Uttar Pradesh'],
  sd: ['Sindh', 'Gujarat'],
  ks: ['Jammu and Kashmir'],
  bo: ['Assam'],
  dv: ['Jammu and Kashmir'],
  en: ['All States'],
  sa: ['All States'],
  gom: ['Goa', 'Karnataka', 'Kerala', 'Maharashtra'],
  mni: ['Manipur'],
  lus: ['Mizoram'],
  kok: ['Goa', 'Karnataka', 'Kerala', 'Maharashtra']
};

export const COMMON_MISINFORMATION_PATTERNS: Record<SupportedLanguage, string[]> = {
  hi: [
    'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
    'वायरल हो रहा है', 'तुरंत शेयर करें', 'सच्चाई सामने आई'
  ],
  bn: [
    'গুজব', 'ভুল তথ্য', 'মিথ্যা খবর', 'ভ্রান্তিমূলক তথ্য',
    'ভাইরাল হচ্ছে', 'তৎক্ষণাৎ শেয়ার করুন', 'সত্য প্রকাশিত'
  ],
  te: [
    'పుకారు', 'తప్పు సమాచారం', 'అబద్ధ వార్త', 'భ్రమకర సమాచారం',
    'వైరల్ అవుతోంది', 'వెంటనే షేర్ చేయండి', 'నిజం బయటపడింది'
  ],
  mr: [
    'अफवा', 'चुकीची माहिती', 'खोटी बातमी', 'भ्रामक माहिती',
    'व्हायरल होत आहे', 'लगेच शेअर करा', 'सत्य बाहेर आले'
  ],
  ta: [
    'வதந்தி', 'தவறான தகவல்', 'பொய் செய்தி', 'தவறான தகவல்',
    'வைரல் ஆகிறது', 'உடனடியாக பகிரவும்', 'உண்மை வெளியானது'
  ],
  gu: [
    'અફવા', 'ખોટી માહિતી', 'ખોટા સમાચાર', 'ભ્રમક માહિતી',
    'વાયરલ થઈ રહ્યું છે', 'તરત જ શેર કરો', 'સત્ય બહાર આવ્યું'
  ],
  kn: [
    'ಪುಕಾರು', 'ತಪ್ಪು ಮಾಹಿತಿ', 'ಸುಳ್ಳು ಸುದ್ದಿ', 'ಭ್ರಮಕರ ಮಾಹಿತಿ',
    'ವೈರಲ್ ಆಗುತ್ತಿದೆ', 'ತಕ್ಷಣ ಶೇರ್ ಮಾಡಿ', 'ಸತ್ಯ ಹೊರಬಂದಿದೆ'
  ],
  ml: [
    'വാദം', 'തെറ്റായ വിവരം', 'കള്ള വാർത്ത', 'ഭ്രമകര വിവരം',
    'വൈറൽ ആകുന്നു', 'ഉടനെ ഷെയർ ചെയ്യുക', 'സത്യം പുറത്തുവന്നു'
  ],
  or: [
    'ଅଫବା', 'ଭୁଲ ତଥ୍ୟ', 'ମିଛ ଖବର', 'ଭ୍ରମକର ତଥ୍ୟ',
    'ଭାଇରାଲ୍ ହେଉଛି', 'ତୁରନ୍ତ ଶେୟାର୍ କରନ୍ତୁ', 'ସତ୍ୟ ବାହାରିଲା'
  ],
  pa: [
    'ਅਫਵਾਹ', 'ਗਲਤ ਜਾਣਕਾਰੀ', 'ਝੂਠੀ ਖਬਰ', 'ਭਰਮਕ ਜਾਣਕਾਰੀ',
    'ਵਾਇਰਲ ਹੋ ਰਿਹਾ ਹੈ', 'ਤੁਰੰਤ ਸ਼ੇਅਰ ਕਰੋ', 'ਸੱਚ ਸਾਹਮਣੇ ਆਇਆ'
  ],
  as: [
    'অপবাদ', 'ভুল তথ্য', 'মিছা বাতৰি', 'ভ্ৰান্তিমূলক তথ্য',
    'ভাইৰেল হৈছে', 'তৎক্ষণাত শ্বেয়াৰ কৰক', 'সত্য প্ৰকাশিত'
  ],
  ne: [
    'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
    'भाइरल भइरहेको छ', 'तुरुन्तै साझा गर्नुहोस्', 'सत्य सामने आयो'
  ],
  ur: [
    'افواہ', 'غلط معلومات', 'جھوٹی خبر', 'بھرمک معلومات',
    'وائرل ہو رہا ہے', 'فوری شیئر کریں', 'سچ سامنے آیا'
  ],
  sd: [
    'افواہ', 'غلط معلومات', 'جھوٹی خبر', 'بھرمک معلومات',
    'وائرل ٿي رهيو آهي', 'فوري شيئر ڪريو', 'سچ سامنے آيو'
  ],
  ks: [
    'افواہ', 'غلط معلومات', 'جھوٹی خبر', 'بھرمک معلومات',
    'وائرل ہو رہا ہے', 'فوری شیئر کریں', 'سچ سامنے آیا'
  ],
  bo: [
    'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
    'भाइरल भइरहेको छ', 'तुरुन्तै साझा गर्नुहोस्', 'सत्य सामने आयो'
  ],
  dv: [
    'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
    'भाइरल भइरहेको छ', 'तुरुन्तै साझा गर्नुहोस्', 'सत्य सामने आयो'
  ],
  en: [
    'rumor', 'fake news', 'misinformation', 'false information',
    'going viral', 'share immediately', 'truth revealed'
  ],
  sa: [
    'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
    'भाइरल भइरहेको छ', 'तुरुन्तै साझा गर्नुहोस्', 'सत्य सामने आयो'
  ],
  gom: [
    'अफवा', 'चुकीची माहिती', 'खोटी बातमी', 'भ्रामक माहिती',
    'व्हायरल होत आहे', 'लगेच शेअर करा', 'सत्य बाहेर आले'
  ],
  mni: [
    'अफवाह', 'गलत जानकारी', 'झूठी खबर', 'भ्रामक सूचना',
    'भाइरल भइरहेको छ', 'तुरुन्तै साझा गर्नुहोस्', 'सत्य सामने आयो'
  ],
  lus: [
    'rumor', 'fake news', 'misinformation', 'false information',
    'going viral', 'share immediately', 'truth revealed'
  ],
  kok: [
    'अफवा', 'चुकीची माहिती', 'खोटी बातमी', 'भ्रामक माहिती',
    'व्हायरल होत आहे', 'लगेच शेअर करा', 'सत्य बाहेर आले'
  ]
};