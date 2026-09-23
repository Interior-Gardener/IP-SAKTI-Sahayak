import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

/* ------------------------------------------------------------------ *
 * The interface in more than one language.
 *
 * What is translated here is the chrome: navigation, header, menus, the
 * assistant's own buttons and prompts. Plant and material descriptions stay
 * in English — they are sourced prose, and a machine translation of them
 * would be a new, unchecked text. Legal answers are not translated here
 * either: the assistant writes them in the chosen language itself and cites
 * the original provision.
 *
 * Hindi and Tamil first: one Indo-Aryan and one Dravidian script, which is
 * what shakes out layout problems (line height, glyph width) for the rest.
 * ------------------------------------------------------------------ */

export const UI_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
] as const

export type UiLanguage = (typeof UI_LANGUAGES)[number]['code']

const STORAGE_KEY = 'vanaspati.uiLanguage'

const en = {
  nav: {
    garden: 'Garden',
    rasashala: 'Rasashala',
    registryMarg: 'Registry Marg',
    explore: 'Explore',
    atlas: 'Atlas',
    tours: 'Tours',
    quiz: 'Quiz',
    myGarden: 'My Garden',
  },
  brand: { subtitle: 'Virtual Herbal Garden', home: 'Vanaspati home' },
  header: {
    search: 'Search plants',
    ask: 'Ask Sahayak',
    help: 'How to use this site',
    toDay: 'Switch to daylight',
    toEvening: 'Switch to evening',
    language: 'Interface language',
  },
  help: {
    title: 'Show me around',
    walkthrough: 'Guided walkthrough',
    walkthroughHint: 'Nine stops across the whole site',
    present: 'Presentation mode',
    presentHint: 'Hands-free narrated reel',
    intro: 'Replay the opening',
    introHint: 'The cinematic garden intro',
    keys: 'search · present · exit',
  },
  palette: {
    placeholder: 'Search plants, materials, tours and pages…',
  },
  ask: {
    placeholder: 'Ask about patents, GI, biodiversity approval, licensing, labels…',
    question: 'Your question',
    send: 'Ask',
    askingAbout: 'Asking about',
    checking: 'Checking the question…',
    understanding: 'Working out which laws apply…',
    searching: 'Searching the statutes and treaties…',
    answering: 'Writing the answer…',
    human: 'Ask a human facilitator',
    nextSteps: 'Where to go next',
    walkMarg: 'Walk Registry Marg →',
    mic: 'Ask by voice',
    micStop: 'Stop recording',
    listen: 'Listen',
    stop: 'Stop',
  },
}

type Dict = typeof en

const hi: Dict = {
  nav: {
    garden: 'उद्यान',
    rasashala: 'रसशाला',
    registryMarg: 'रजिस्ट्री मार्ग',
    explore: 'खोजें',
    atlas: 'एटलस',
    tours: 'भ्रमण',
    quiz: 'प्रश्नोत्तरी',
    myGarden: 'मेरा उद्यान',
  },
  brand: { subtitle: 'आभासी औषधीय उद्यान', home: 'वनस्पति मुखपृष्ठ' },
  header: {
    search: 'पौधे खोजें',
    ask: 'सहायक से पूछें',
    help: 'इस साइट का उपयोग कैसे करें',
    toDay: 'दिन के प्रकाश में बदलें',
    toEvening: 'संध्या में बदलें',
    language: 'इंटरफ़ेस की भाषा',
  },
  help: {
    title: 'मुझे घुमाइए',
    walkthrough: 'निर्देशित भ्रमण',
    walkthroughHint: 'पूरी साइट पर नौ पड़ाव',
    present: 'प्रस्तुति मोड',
    presentHint: 'बिना हाथ लगाए, वर्णन सहित',
    intro: 'आरंभ फिर से देखें',
    introHint: 'उद्यान का सिनेमाई परिचय',
    keys: 'खोज · प्रस्तुति · बाहर',
  },
  palette: {
    placeholder: 'पौधे, सामग्री, भ्रमण और पृष्ठ खोजें…',
  },
  ask: {
    placeholder: 'पेटेंट, जीआई, जैव विविधता अनुमोदन, लाइसेंस, लेबल के बारे में पूछें…',
    question: 'आपका प्रश्न',
    send: 'पूछें',
    askingAbout: 'इसके बारे में पूछ रहे हैं',
    checking: 'प्रश्न की जाँच हो रही है…',
    understanding: 'कौन-से कानून लागू होते हैं, यह देखा जा रहा है…',
    searching: 'अधिनियमों और संधियों में खोज हो रही है…',
    answering: 'उत्तर लिखा जा रहा है…',
    human: 'किसी मानव सहायक से पूछें',
    nextSteps: 'आगे कहाँ जाएँ',
    walkMarg: 'रजिस्ट्री मार्ग पर चलें →',
    mic: 'बोलकर पूछें',
    micStop: 'रिकॉर्डिंग रोकें',
    listen: 'सुनें',
    stop: 'रोकें',
  },
}

const ta: Dict = {
  nav: {
    garden: 'தோட்டம்',
    rasashala: 'ரசசாலை',
    registryMarg: 'பதிவகப் பாதை',
    explore: 'ஆராயுங்கள்',
    atlas: 'அட்லஸ்',
    tours: 'சுற்றுலாக்கள்',
    quiz: 'வினாடி வினா',
    myGarden: 'என் தோட்டம்',
  },
  brand: { subtitle: 'மெய்நிகர் மூலிகைத் தோட்டம்', home: 'வனஸ்பதி முகப்பு' },
  header: {
    search: 'தாவரங்களைத் தேடுங்கள்',
    ask: 'சகாயக்கிடம் கேளுங்கள்',
    help: 'இந்தத் தளத்தைப் பயன்படுத்துவது எப்படி',
    toDay: 'பகல் வெளிச்சத்திற்கு மாற்றவும்',
    toEvening: 'மாலைக்கு மாற்றவும்',
    language: 'இடைமுக மொழி',
  },
  help: {
    title: 'சுற்றிக் காட்டுங்கள்',
    walkthrough: 'வழிகாட்டப்பட்ட சுற்றுலா',
    walkthroughHint: 'தளம் முழுவதும் ஒன்பது நிறுத்தங்கள்',
    present: 'விளக்கக்காட்சி முறை',
    presentHint: 'கைகளின்றி, விவரிப்புடன்',
    intro: 'தொடக்கத்தை மீண்டும் காண்க',
    introHint: 'தோட்டத்தின் திரைப்பட அறிமுகம்',
    keys: 'தேடல் · விளக்கம் · வெளியேறு',
  },
  palette: {
    placeholder: 'தாவரங்கள், பொருட்கள், சுற்றுலாக்கள், பக்கங்களைத் தேடுங்கள்…',
  },
  ask: {
    placeholder: 'காப்புரிமை, புவிசார் குறியீடு, பல்லுயிர் ஒப்புதல், உரிமம், லேபிள் பற்றிக் கேளுங்கள்…',
    question: 'உங்கள் கேள்வி',
    send: 'கேள்',
    askingAbout: 'இதைப் பற்றிக் கேட்கிறீர்கள்',
    checking: 'கேள்வி சரிபார்க்கப்படுகிறது…',
    understanding: 'எந்தச் சட்டங்கள் பொருந்தும் எனப் பார்க்கப்படுகிறது…',
    searching: 'சட்டங்களிலும் ஒப்பந்தங்களிலும் தேடப்படுகிறது…',
    answering: 'பதில் எழுதப்படுகிறது…',
    human: 'மனித உதவியாளரிடம் கேளுங்கள்',
    nextSteps: 'அடுத்து எங்கே செல்வது',
    walkMarg: 'பதிவகப் பாதையில் நடக்கவும் →',
    mic: 'குரலில் கேளுங்கள்',
    micStop: 'பதிவை நிறுத்து',
    listen: 'கேளுங்கள்',
    stop: 'நிறுத்து',
  },
}

function stored(): UiLanguage {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value && UI_LANGUAGES.some((l) => l.code === value)) return value as UiLanguage
  } catch {
    // Private windows can refuse storage; English is the fallback either way.
  }
  return 'en'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, ta: { translation: ta } },
  lng: stored(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

if (typeof document !== 'undefined') document.documentElement.lang = i18n.language

/** Switch the interface, remember it, and tell the page what language it is in. */
export function setUiLanguage(code: UiLanguage) {
  void i18n.changeLanguage(code)
  document.documentElement.lang = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Not remembered, but still switched for this visit.
  }
}

export default i18n
