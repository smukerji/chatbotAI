'use client'
import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select } from 'antd';

import { useState, useContext, useEffect } from "react";
import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"
import { log } from "console";


const languageDictionary = [
  { code: "aa", name: "Afar" },
  { code: "ab", name: "Abkhazian" },
  { code: "ae", name: "Avestan" },
  { code: "af", name: "Afrikaans" },
  { code: "af-ZA", name: "Afrikaans (South Africa)" },
  { code: "ak", name: "Akan" },
  { code: "am", name: "Amharic" },
  { code: "am-ET", name: "Amharic (Ethiopia)" },
  { code: "an", name: "Aragonese" },
  { code: "ar", name: "Arabic" },
  { code: "ar-AE", name: "Arabic (United Arab Emirates)" },
  { code: "ar-BH", name: "Arabic (Bahrain)" },
  { code: "ar-DZ", name: "Arabic (Algeria)" },
  { code: "ar-EG", name: "Arabic (Egypt)" },
  { code: "ar-IL", name: "Arabic (Israel)" },
  { code: "ar-IQ", name: "Arabic (Iraq)" },
  { code: "ar-JO", name: "Arabic (Jordan)" },
  { code: "ar-KW", name: "Arabic (Kuwait)" },
  { code: "ar-LB", name: "Arabic (Lebanon)" },
  { code: "ar-LY", name: "Arabic (Libya)" },
  { code: "ar-MA", name: "Arabic (Morocco)" },
  { code: "ar-OM", name: "Arabic (Oman)" },
  { code: "ar-PS", name: "Arabic (Palestinian Territories)" },
  { code: "ar-QA", name: "Arabic (Qatar)" },
  { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
  { code: "ar-SY", name: "Arabic (Syria)" },
  { code: "ar-TN", name: "Arabic (Tunisia)" },
  { code: "ar-YE", name: "Arabic (Yemen)" },
  { code: "as", name: "Assamese" },
  { code: "av", name: "Avaric" },
  { code: "ay", name: "Aymara" },
  { code: "az", name: "Azerbaijani" },
  { code: "az-AZ", name: "Azerbaijani (Azerbaijan)" },
  { code: "ba", name: "Bashkir" },
  { code: "be", name: "Belarusian" },
  { code: "bg", name: "Bulgarian" },
  { code: "bg-BG", name: "Bulgarian (Bulgaria)" },
  { code: "bh", name: "Bihari" },
  { code: "bi", name: "Bislama" },
  { code: "bm", name: "Bambara" },
  { code: "bn", name: "Bengali" },
  { code: "bn-IN", name: "Bengali (India)" },
  { code: "bo", name: "Tibetan" },
  { code: "br", name: "Breton" },
  { code: "bs", name: "Bosnian" },
  { code: "bs-BA", name: "Bosnian (Bosnia and Herzegovina)" },
  { code: "ca", name: "Catalan" },
  { code: "ca-ES", name: "Catalan (Spain)" },
  { code: "ce", name: "Chechen" },
  { code: "ch", name: "Chamorro" },
  { code: "co", name: "Corsican" },
  { code: "cr", name: "Cree" },
  { code: "cs", name: "Czech" },
  { code: "cs-CZ", name: "Czech (Czech Republic)" },
  { code: "cu", name: "Church Slavic" },
  { code: "cv", name: "Chuvash" },
  { code: "cy", name: "Welsh" },
  { code: "cy-GB", name: "Welsh (United Kingdom)" },
  { code: "da", name: "Danish" },
  { code: "da-DK", name: "Danish (Denmark)" },
  { code: "de", name: "German" },
  { code: "de-AT", name: "German (Austria)" },
  { code: "de-CH", name: "German (Switzerland)" },
  { code: "de-DE", name: "German (Germany)" },
  { code: "dv", name: "Divehi" },
  { code: "dz", name: "Dzongkha" },
  { code: "ee", name: "Ewe" },
  { code: "el", name: "Greek" },
  { code: "el-GR", name: "Greek (Greece)" },
  { code: "en", name: "English" },
  { code: "en-AU", name: "English (Australia)" },
  { code: "en-CA", name: "English (Canada)" },
  { code: "en-GB", name: "English (United Kingdom)" },
  { code: "en-GH", name: "English (Ghana)" },
  { code: "en-HK", name: "English (Hong Kong)" },
  { code: "en-IE", name: "English (Ireland)" },
  { code: "en-IN", name: "English (India)" },
  { code: "en-KE", name: "English (Kenya)" },
  { code: "en-NG", name: "English (Nigeria)" },
  { code: "en-NZ", name: "English (New Zealand)" },
  { code: "en-PH", name: "English (Philippines)" },
  { code: "en-SG", name: "English (Singapore)" },
  { code: "en-TZ", name: "English (Tanzania)" },
  { code: "en-US", name: "English (United States)" },
  { code: "en-ZA", name: "English (South Africa)" },
  { code: "eo", name: "Esperanto" },
  { code: "es", name: "Spanish" },
  { code: "es-419", name: "Latin American Spanish" },
  { code: "es-AR", name: "Spanish (Argentina)" },
  { code: "es-BO", name: "Spanish (Bolivia)" },
  { code: "es-CL", name: "Spanish (Chile)" },
  { code: "es-CO", name: "Spanish (Colombia)" },
  { code: "es-CR", name: "Spanish (Costa Rica)" },
  { code: "es-CU", name: "Spanish (Cuba)" },
  { code: "es-DO", name: "Spanish (Dominican Republic)" },
  { code: "es-EC", name: "Spanish (Ecuador)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "es-GQ", name: "Spanish (Equatorial Guinea)" },
  { code: "es-GT", name: "Spanish (Guatemala)" },
  { code: "es-HN", name: "Spanish (Honduras)" },
  { code: "es-LATAM", name: "Latin American Spanish" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "es-NI", name: "Spanish (Nicaragua)" },
  { code: "es-PA", name: "Spanish (Panama)" },
  { code: "es-PE", name: "Spanish (Peru)" },
  { code: "es-PR", name: "Spanish (Puerto Rico)" },
  { code: "es-PY", name: "Spanish (Paraguay)" },
  { code: "es-SV", name: "Spanish (El Salvador)" },
  { code: "es-US", name: "Spanish (United States)" },
  { code: "es-UY", name: "Spanish (Uruguay)" },
  { code: "es-VE", name: "Spanish (Venezuela)" },
  { code: "et", name: "Estonian" },
  { code: "et-EE", name: "Estonian (Estonia)" },
  { code: "eu", name: "Basque" },
  { code: "eu-ES", name: "Basque (Spain)" },
  { code: "fa", name: "Persian" },
  { code: "fa-IR", name: "Persian (Iran)" },
  { code: "ff", name: "Fulah" },
  { code: "fi", name: "Finnish" },
  { code: "fi-FI", name: "Finnish (Finland)" },
  { code: "fj", name: "Fijian" },
  { code: "fo", name: "Faroese" },
  { code: "fr", name: "French" },
  { code: "fr-BE", name: "French (Belgium)" },
  { code: "fr-CA", name: "French (Canada)" },
  { code: "fr-CH", name: "French (Switzerland)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "fy", name: "Western Frisian" },
  { code: "ga", name: "Irish" }, // Added standalone for "ga"
  { code: "ga-IE", name: "Irish (Ireland)" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "gl", name: "Galician" },
  { code: "gl-ES", name: "Galician (Spain)" },
  { code: "gn", name: "Guarani" },
  { code: "gu", name: "Gujarati" },
  { code: "gu-IN", name: "Gujarati (India)" },
  { code: "gv", name: "Manx" },
  { code: "ha", name: "Hausa" },
  { code: "he", name: "Hebrew" },
  { code: "he-IL", name: "Hebrew (Israel)" },
  { code: "hi", name: "Hindi" },
  { code: "hi-IN", name: "Hindi (India)" },
  { code: "hi-Latn", name: "Hindi (Latin script)" },
  { code: "ho", name: "Hiri Motu" },
  { code: "hr", name: "Croatian" },
  { code: "hr-HR", name: "Croatian (Croatia)" },
  { code: "ht", name: "Haitian Creole" },
  { code: "hu", name: "Hungarian" },
  { code: "hu-HU", name: "Hungarian (Hungary)" },
  { code: "hy", name: "Armenian" },
  { code: "hy-AM", name: "Armenian (Armenia)" },
  { code: "hz", name: "Herero" },
  { code: "ia", name: "Interlingua" },
  { code: "id", name: "Indonesian" },
  { code: "id-ID", name: "Indonesian (Indonesia)" },
  { code: "ie", name: "Interlingue" },
  { code: "ig", name: "Igbo" },
  { code: "ii", name: "Sichuan Yi" },
  { code: "ik", name: "Inupiaq" },
  { code: "io", name: "Ido" },
  { code: "is", name: "Icelandic" },
  { code: "is-IS", name: "Icelandic (Iceland)" },
  { code: "it", name: "Italian" },
  { code: "it-CH", name: "Italian (Switzerland)" },
  { code: "it-IT", name: "Italian (Italy)" },
  { code: "iu", name: "Inuktitut" },
  { code: "ja", name: "Japanese" },
  { code: "ja-JP", name: "Japanese (Japan)" },
  { code: "jv", name: "Javanese" },
  { code: "jv-ID", name: "Javanese (Indonesia)" },
  { code: "ka", name: "Georgian" },
  { code: "ka-GE", name: "Georgian (Georgia)" },
  { code: "kg", name: "Kongo" },
  { code: "ki", name: "Kikuyu" },
  { code: "kj", name: "Kuanyama" },
  { code: "kk", name: "Kazakh" },
  { code: "kk-KZ", name: "Kazakh (Kazakhstan)" },
  { code: "kl", name: "Kalaallisut" },
  { code: "km", name: "Khmer" },
  { code: "km-KH", name: "Khmer (Cambodia)" },
  { code: "kn", name: "Kannada" },
  { code: "kn-IN", name: "Kannada (India)" },
  { code: "ko", name: "Korean" },
  { code: "ko-KR", name: "Korean (South Korea)" },
  { code: "kr", name: "Kanuri" },
  { code: "ks", name: "Kashmiri" },
  { code: "ku", name: "Kurdish" },
  { code: "kv", name: "Komi" },
  { code: "kw", name: "Cornish" },
  { code: "ky", name: "Kyrgyz" },
  { code: "la", name: "Latin" },
  { code: "lb", name: "Luxembourgish" },
  { code: "lg", name: "Ganda" },
  { code: "li", name: "Limburgish" },
  { code: "ln", name: "Lingala" },
  { code: "lo", name: "Lao" },
  { code: "lo-LA", name: "Lao (Laos)" },
  { code: "lt", name: "Lithuanian" },
  { code: "lt-LT", name: "Lithuanian (Lithuania)" },
  { code: "lu", name: "Luba-Katanga" },
  { code: "lv", name: "Latvian" },
  { code: "lv-LV", name: "Latvian (Latvia)" },
  { code: "mg", name: "Malagasy" },
  { code: "mh", name: "Marshallese" },
  { code: "mi", name: "Maori" },
  { code: "mk", name: "Macedonian" },
  { code: "mk-MK", name: "Macedonian (North Macedonia)" },
  { code: "ml", name: "Malayalam" },
  { code: "ml-IN", name: "Malayalam (India)" },
  { code: "mn", name: "Mongolian" },
  { code: "mn-MN", name: "Mongolian (Mongolia)" },
  { code: "mr", name: "Marathi" },
  { code: "mr-IN", name: "Marathi (India)" },
  { code: "ms", name: "Malay" },
  { code: "ms-MY", name: "Malay (Malaysia)" },
  { code: "mt", name: "Maltese" },
  { code: "mt-MT", name: "Maltese (Malta)" },
  { code: "my", name: "Burmese" },
  { code: "my-MM", name: "Burmese (Myanmar)" },
  { code: "mymr", name: "Burmese" },
  { code: "na", name: "Nauru" },
  { code: "nb", name: "Norwegian Bokmål" },
  { code: "nb-NO", name: "Norwegian Bokmål (Norway)" },
  { code: "nd", name: "Ndebele (North)" },
  { code: "ne", name: "Nepali" },
  { code: "ne-NP", name: "Nepali (Nepal)" },
  { code: "ng", name: "Ndonga" },
  { code: "nl", name: "Dutch" },
  { code: "nl-BE", name: "Dutch (Belgium)" },
  { code: "nl-NL", name: "Dutch (Netherlands)" },
  { code: "nn", name: "Norwegian Nynorsk" },
  { code: "no", name: "Norwegian" },
  { code: "nr", name: "Ndebele (South)" },
  { code: "nv", name: "Navajo" },
  { code: "ny", name: "Nyanja" },
  { code: "oc", name: "Occitan" },
  { code: "oj", name: "Ojibwa" },
  { code: "om", name: "Oromo" },
  { code: "or", name: "Odia" },
  { code: "os", name: "Ossetian" },
  { code: "pa", name: "Punjabi" },
  { code: "pa-IN", name: "Punjabi (India)" },
  { code: "pi", name: "Pali" },
  { code: "pl", name: "Polish" },
  { code: "pl-PL", name: "Polish (Poland)" },
  { code: "ps", name: "Pashto" },
  { code: "ps-AF", name: "Pashto (Afghanistan)" },
  { code: "pt", name: "Portuguese" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)" },
  { code: "qu", name: "Quechua" },
  { code: "rm", name: "Romansh" },
  { code: "rn", name: "Rundi" },
  { code: "ro", name: "Romanian" },
  { code: "ro-RO", name: "Romanian (Romania)" },
  { code: "ru", name: "Russian" },
  { code: "ru-RU", name: "Russian (Russia)" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "sa", name: "Sanskrit" },
  { code: "sc", name: "Sardinian" },
  { code: "sd", name: "Sindhi" },
  { code: "se", name: "Northern Sami" },
  { code: "sg", name: "Sango" },
  { code: "si", name: "Sinhala" },
  { code: "si-LK", name: "Sinhala (Sri Lanka)" },
  { code: "sk", name: "Slovak" },
  { code: "sk-SK", name: "Slovak (Slovakia)" },
  { code: "sl", name: "Slovenian" },
  { code: "sl-SI", name: "Slovenian (Slovenia)" },
  { code: "sm", name: "Samoan" },
  { code: "sn", name: "Shona" },
  { code: "so", name: "Somali" },
  { code: "so-SO", name: "Somali (Somalia)" },
  { code: "sq", name: "Albanian" },
  { code: "sq-AL", name: "Albanian (Albania)" },
  { code: "sr", name: "Serbian" },
  { code: "sr-RS", name: "Serbian (Serbia)" },
  { code: "ss", name: "Swati" },
  { code: "st", name: "Sotho (Southern)" },
  { code: "su", name: "Sundanese" },
  { code: "sv", name: "Swedish" },
  { code: "sv-SE", name: "Swedish (Sweden)" },
  { code: "sw", name: "Swahili" },
  { code: "sw-KE", name: "Swahili (Kenya)" },
  { code: "sw-TZ", name: "Swahili (Tanzania)" },
  { code: "ta", name: "Tamil" },
  { code: "ta-IN", name: "Tamil (India)" },
  { code: "taq", name: "Tamil (Latin script)" },
  { code: "te", name: "Telugu" },
  { code: "te-IN", name: "Telugu (India)" },
  { code: "tg", name: "Tajik" },
  { code: "th", name: "Thai" },
  { code: "ti", name: "Tigrinya" },
  { code: "th-TH", name: "Thai (Thailand)" },
  { code: "tk", name: "Turkmen" },
  { code: "tl", name: "Tagalog" },
  { code: "tn", name: "Tswana" },
  { code: "to", name: "Tongan" },
  { code: "tr", name: "Turkish" },
  { code: "tr-TR", name: "Turkish (Turkey)" },
  { code: "ts", name: "Tsonga" },
  { code: "tt", name: "Tatar" },
  { code: "tw", name: "Twi" },
  { code: "ty", name: "Tahitian" },
  { code: "ug", name: "Uyghur" },
  { code: "uk", name: "Ukrainian" },
  { code: "uk-UA", name: "Ukrainian (Ukraine)" },
  { code: "ur", name: "Urdu" },
  { code: "ur-IN", name: "Urdu (India)" },
  { code: "uz", name: "Uzbek" },
  { code: "uz-UZ", name: "Uzbek (Uzbekistan)" },
  { code: "ve", name: "Venda" },
  { code: "vi", name: "Vietnamese" },
  { code: "vi-VN", name: "Vietnamese (Vietnam)" },
  { code: "vo", name: "Volapük" },
  { code: "wa", name: "Walloon" },
  { code: "wo", name: "Wolof" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "za", name: "Zhuang" },
  { code: "zh", name: "Chinese" },
  { code: "zh-CN", name: "Simplified Chinese (China)" },
  { code: "zh-CN-shandong", name: "Simplified Chinese (Shandong, China)" },
  { code: "zh-CN-sichuan", name: "Simplified Chinese (Sichuan, China)" },
  { code: "zh-Hans", name: "Simplified Chinese" },
  { code: "zh-Hant", name: "Traditional Chinese" },
  { code: "zh-HK", name: "Traditional Chinese (Hong Kong)" },
  { code: "zh-TW", name: "Traditional Chinese (Taiwan)" },
  { code: "zu", name: "Zulu" }, // Added standalone
  { code: "zu-ZA", name: "Zulu (South Africa)" },
  { code: "wuu-CN", name: "Wu Chinese (China)" },
  { code: "yue", name: "Cantonese" },
  { code: "yue-CN", name: "Cantonese (China)" },
  { code: "multi", name: "Multilingual" }
];

const { TextArea } = Input;

function Transcriber() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;



  const [models, setModels] = useState<{ value: string; label: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<{ value: string; label: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [providerValidationMessage, setProviderValidationMessage] = useState<string>("");
  const [modelValidationMessage, setModelValidationMessage] = useState<string>("");
  const [languageValidationMessage, setLanguageValidationMessage] = useState<string>("");
  const [modelDisable, setModelDisable] = useState<boolean>(false);
  const providerList = [
    {
      value: "4",
      label: "azure",

    },
    {
      value: "1",
      label: "deepgram",
      language: [
        "bg", // Bulgarian
        "ca", // Catalan
        "cs", // Czech
        "da", // Danish
        "da-DK", // Danish (Denmark)
        "de", // German
        "de-CH", // Swiss German
        "el", // Greek
        "en", // English
        "en-AU", // Australian English
        "en-GB", // British English
        "en-IN", // Indian English
        "en-NZ", // New Zealand English
        "en-US", // American English
        "es", // Spanish
        "es-419", // Latin American Spanish
        "es-LATAM", // Latin American Spanish
        "et", // Estonian
        "fi", // Finnish
        "fr", // French
        "fr-CA", // Canadian French
        "hi", // Hindi
        "hi-Latn", // Hindi (Latin script)
        "hu", // Hungarian
        "id", // Indonesian
        "it", // Italian 
        "ja", // Japanese
        "ko", // Korean
        "ko-KR", // Korean (South Korea)
        "lt", // Lithuanian
        "lv", // Latvian
        "ms", // Malay
        "multi", // Multilingual
        "nl", // Dutch
        "nl-BE", // Dutch (Belgium) 
        "no", // Norwegian
        "pl", // Polish
        "pt", // Portuguese
        "pt-BR", // Brazilian Portuguese 
        "ro", // Romanian
        "ru", // Russian
        "sk", // Slovak
        "sv", // Swedish
        "sv-SE", // Swedish (Sweden)
        "ta", // Tamil
        "taq", // Tamil (Latin script)
        "th", // Thai
        "th-TH", // Thai (Thailand)
        "tr", // Turkish
        "uk", // Ukrainian 
        "vi", // Vietnamese
        "zh", // Chinese
        "zh-CN", // Simplified Chinese
        "zh-Hans", // Simplified Chinese (China)
        "zh-Hant", // Traditional Chinese
        "zh-TW"  // Traditional Chinese (Taiwan)
      ],
      model: [
        "nova-3",
        "nova-3-general",
        "nova-3-medical",
        "nova-2",
        "nova-2-general",
        "nova-2-meeting",
        "nova-2-phonecall",
        "nova-2-finance",
        "nova-2-conversationalai",
        "nova-2-voicemail",
        "nova-2-video",
        "nova-2-medical",
        "nova-2-drivethru",
        "nova-2-automotive",
        "nova",
        "nova-general",
        "nova-phonecall",
        "nova-medical",
        "enhanced",
        "enhanced-general",
        "enhanced-meeting",
        "enhanced-phonecall",
        "enhanced-finance",
        "base",
        "base-general",
        "base-meeting",
        "base-phonecall",
        "base-finance",
        "base-conversationalai",
        "base-voicemail",
        "base-video",
      ]
    },
    {
      value: "3",
      label: "gladia",
      language: [
        "af", // Afrikaans
        "sq", // Albanian
        "am", // Amharic
        "ar", // Arabic
        "hy", // Armenian
        "as", // Assamese
        "az", // Azerbaijani
        "ba", // Bashkir
        "eu", // Basque
        "be", // Belarusian
        "bn", // Bengali
        "bs", // Bosnian
        "br", // Breton
        "bg", // Bulgarian
        "ca", // Catalan
        "zh", // Chinese
        "hr", // Croatian
        "cs", // Czech
        "da", // Danish
        "nl", // Dutch
        "en", // English
        "et", // Estonian
        "fo", // Faroese
        "fi", // Finnish
        "fr", // French
        "gl", // Galician
        "ka", // Georgian
        "de", // German
        "el", // Greek
        "gu", // Gujarati
        "ht", // Haitian Creole
        "ha", // Hausa
        "haw", // Hawaiian
        "he", // Hebrew
        "hi", // Hindi
        "hu", // Hungarian
        "is", // Icelandic
        "id", // Indonesian
        "it", // Italian
        "ja", // Japanese
        "jp", // Japanese
        "jv", // Javanese
        "kn", // Kannada
        "kk", // Kazakh
        "km", // Khmer
        "ko", // Korean
        "lo", // Lao
        "la", // Latin
        "lv", // Latvian
        "ln", // Lingala
        "lt", // Lithuanian
        "lb", // Luxembourgish
        "mk", // Macedonian
        "mg", // Malagasy
        "ms", // Malay
        "ml", // Malayalam
        "mk", // Macedonian
        "mi", // Maori
        "mr", // Marathi
        "mn", // Mongolian
        "mymr", // Burmese
        "ne", // Nepali
        "no", // Norwegian
        "nn", // Norwegian Nynorsk 
        "oc", // Occitan
        "ps", // Pashto
        "fa", // Persian
        "pl", // Polish
        "pt", // Portuguese
        "pa", // Punjabi
        "ro", // Romanian
        "ru", // Russian
        "sa", // Sanskrit
        "sr", // Serbian
        "sn", // Shona
        "sd", // Sindhi
        "si", // Sinhala
        "sk", // Slovak
        "sl", // Slovenian
        "so", // Somali
        "es", // Spanish
        "su", // Sundanese
        "sw", // Swahili
        "sv", // Swedish
        "tl", // Tagalog
        "tg", // Tajik
        "ta", // Tamil
        "tt", // Tatar
        "te", // Telugu
        "th", // Thai
        "bo", // Tibetan
        "tr", // Turkish
        "tk", // Turkmen
        "uk", // Ukrainian
        "ur", // Urdu
        "uz", // Uzbek
        "vi", // Vietnamese
        "cy", // Welsh
        "yi", // Yiddish
        "yo" // Yoruba
      ],
      model: ["fast", "accurate", "solaria-1"]
    },
    {
      value: "6",
      label: "openai",
      language: [
        "af",
        "ar",
        "hy",
        "az",
        "be",
        "bs",
        "bg",
        "ca",
        "zh",
        "hr",
        "cs",
        "da",
        "nl",
        "en",
        "et",
        "fi",
        "fr",
        "gl",
        "de",
        "el",
        "he",
        "hi",
        "hu",
        "is",
        "id",
        "it",
        "ja",
        "kn",
        "kk",
        "ko",
        "lv",
        "lt",
        "mk",
        "ms",
        "mr",
        "mi",
        "ne",
        "no",
        "fa",
        "pl",
        "pt",
        "ro",
        "ru",
        "sr",
        "sk",
        "sl",
        "es",
        "sw",
        "sv",
        "tl",
        "ta",
        "th",
        'tr',
        "uk",
        "ur",
        "vi",
        "cy",
      ],
      model: ["gpt-4o-mini-transcribe", "gpt-4o-transcribe"]
    },
    {
      value: "7",
      label: "google",
      language: [
        "multi",
        "ar",
        "bn",
        "bg",
        "zh",
        "hr",
        "cs",
        "da",
        "nl",
        "en",
        "et",
        "fi",
        "fr",
        "de",
        "el",
        "he",
        "hi",
        "hu",
        "id",
        "it",
        "ja",
        "ko",
        "lv",
        "lt",
        "no",
        "pl",
        "pt",
        "ro",
        "ru",
        "sr",
        "sk",
        "sl",
        "es",
        "sw",
        "sv",
        "th",
        "tr",
        "uk",
        "vi"
      ],
      model: [
        "gemini-3-flash-preview",
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-thinking-exp",
        "gemini-2.0-pro-exp-02-05",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-exp",
        "gemini-2.0-flash-realtime-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-002",
        "gemini-1.5-pro",
        "gemini-1.5-pro-002",
        "gemini-1.0-pro"
      ]
    },

    {
      value: "2",
      label: "talkscriber",//label
      language: [
        "en", // English
        "zh", // Chinese
        "de", // German
        "es", // Spanish
        "ru", // Russian
        "ko", // Korean
        "fr", // French
        "pt", // Portuguese
        "tr", // Turkish
        "pl", // Polish
        "ja", // Japanese
        "ca", // Catalan
        "nl", // Dutch
        "sv", // Swedish
        "ar", // Arabic
        "it", // Italian
        "id", // Indonesian
        "hi", // Hindi
        "fi", // Finnish
        "vi", // Vietnamese
        "he",  // Hebrew
        "uk", // Ukrainian
        "el", // Greek
        "ms", // Malay
        "cs", // Czech
        "ro", // Romanian
        "da", // Danish
        "hu", // Hungarian
        "ta", // Tamil
        "no", // Norwegian
        "th", // Thai
        "ur", // Urdu
        "hr", // Croatian
        "bg", // Bulgarian
        "lt", // Lithuanian
        "la", // Latin
        "mi", // Maori
        "ml", // Malayalam
        "cy", // Welsh
        "sk", // Slovak
        "te", // Telugu
        "fa", // Persian
        "lv", // Latvian
        "bn", // Bengali
        "sr", // Serbian
        "az", // Azerbaijani
        "sl", // Slovenian
        "kn", // Kannada
        "et", // Estonian
        "mk", // Macedonian
        "br", // Breton
        "eu", // Basque
        "is", // Icelandic
        "hy", // Armenian
        "ne", // Nepali
        "mn", // Mongolian
        "bs", // Bosnian
        "kk", // Kazakh
        "sq", // Albanian
        "sw", // Swahili
        "gl", // Galician
        "mr", // Marathi
        "pa",  // Punjabi
        "si", // Sinhala
        "km", // Khmer
        "yo", // Yoruba
        "so", // Somali
        "af", // Afrikaans
        "oc", // Occitan
        "ka", // Georgian
        "be", // Belarusian
        "tg", // Tajik
        "sd", // Sindhi
        "gu", // Gujarati
        "am", // Amharic
        "yi", // Yiddish
        "lo", // Lao
        "uz", // Uzbek
        "fo", // Faroese
        "ht", // Haitian Creole
        "ps", // Pashto
        "tk", // Turkmen
        "nn", // Norwegian Nynorsk
        "mt", // Maltese
        "sa", // Sanskrit
        "lb", // Luxembourgish
        "my", // Burmese
        "bo", // Tibetan
        "tl", // Tagalog
        "mg", // Malagasy
        "as", // Assamese
        "tt", // Tatar
        "haw", // Hawaiian
        "ln", // Lingala
        "ha", // Hausa
        "ba", // Bashkir
        "jw", // Javanese
        "su", // Sundanese
        "yue" // Cantonese
      ],
      model: ["whisper"]
    },

    {
      value: "5",
      label: "11labs",
      language: [
        "aa",
        "ab",
        "ae",
        "af",
        "ak",
        "am",
        "an",
        "ar",
        "as",
        "av",
        "ay",
        "az",
        "ba",
        "be",
        "bg",
        "bh",
        "bi",
        "bm",
        "bn",
        "bo",
        "br",
        "bs",
        "ca",
        "ce",
        "ch",
        "co",
        "cr",
        "cs",
        "cu",
        "cv",
        "cy",
        "da",
        "de",
        "dv",
        "dz",
        "ee",
        "el",
        "en",
        "eo",
        "es",
        "et",
        "eu",
        "fa",
        "ff",
        "fi",
        "fj",
        "fo",
        "fr",
        "fy",
        "ga",
        "gd",
        "gl",
        "gn",
        "gu",
        "gv",
        "ha",
        "he",
        "hi",
        "ho",
        "hr",
        "ht",
        "hu",
        "hy",
        "hz",
        "ia",
        "id",
        "ie",
        "ig",
        "ii",
        "ik",
        "io",
        "is",
        "it",
        "iu",
        "ja",
        "jv",
        "ka",
        "kg",
        "ki",
        "kj",
        "kk",
        "kl",
        "km",
        "kn",
        "ko",
        "kr",
        "ks",
        "ku",
        "kv",
        "kw",
        "ky",
        "la",
        "lb",
        "lg",
        "li",
        "ln",
        "lo",
        "lt",
        "lu",
        "lv",
        "mg",
        "mh",
        "mi",
        "mk",
        "ml",
        "mn",
        "mr",
        "ms",
        "mt",
        "my",
        "na",
        "nb",
        "nd",
        "ne",
        "ng",
        "nl",
        "nn",
        "no",
        "nr",
        "nv",
        "ny",
        "oc",
        "oj",
        "om",
        "or",
        'os',
        "pa",
        "pi",
        "pl",
        "ps",
        "pt",
        "qu",
        "rm",
        "rn",
        "ro",
        "ru",
        "rw",
        "sa",
        "sc",
        "sd",
        "se",
        "sg",
        "si",
        "sk",
        "sl",
        "sm",
        "sn",
        "so",
        "sq",
        "sr",
        "ss",
        "st",
        "su",
        "sv",
        "sw",
        "ta",
        "te",
        "tg",
        "th",
        "ti",
        "tk",
        "tl",
        "tn",
        "to",
        "tr",
        "ts",
        "tt",
        "tw",
        "ty",
        "ug",
        "uk",
        "ur",
        "uz",
        "ve",
        "vi",
        "vo",
        "wa",
        "wo",
        "xh",
        "yi",
        "yue",
        "yo",
        "za",
        "zh",
        "zu",
      ],
      model: ["scribe_v1", "scribe_v2", "scribe_v2_realtime"]
    },

  ]


  useEffect(() => {

    // Set the initial value from the context
    setSelectedProvider(voicebotDetails["transcriber"]["provider"]);
    setSelectedModel(voicebotDetails["transcriber"]["model"]);
    // setSelectedLanguage(voicebotDetails["transcriber"]["language"]);
    //set the luanguage based on the selected provider
    let lang = languageDictionary.find((lang) => lang.code === voicebotDetails["transcriber"]["language"]);
    if (lang) {
      setSelectedLanguage(lang.name);
    }


  }, [
    voicebotDetails["transcriber"]["provider"],
    voicebotDetails["transcriber"]["model"],
    voicebotDetails["transcriber"]["language"]
  ]);

  useEffect(() => {
    let lang = languageDictionary.find((lang) => lang.code === voicebotDetails["transcriber"]["language"]);
    if (!lang) {
      setSelectedModel(undefined);
      setSelectedLanguage(undefined);
    }
    if (voicebotDetails["transcriber"]["provider"] === "azure") {
      setModelDisable(true);

      // const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      // if (selectedProviderList && selectedProviderList.language) {
      // setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
      setLanguage(azureProviderLanguage
        .map(language => ({ value: language[1], label: language[0] })));
      // }

    }
  }, []);

  useEffect(() => {
    if (language.length > 0) {
      setLanguage(prevLanguage =>
        [...prevLanguage].sort((a, b) => a.label.localeCompare(b.label))
      );
    }
  }, [language]);

  // useEffect(() => {

  //   if (models.length > 0) {
  //     setModels(prevModels =>
  //       [...prevModels].sort((a, b) => a.label.localeCompare(b.label))
  //     );
  //   }

  // }, [selectedProvider]);



  const providerChangeHandler = (value: any, options: any) => {
    debugger;
    setSelectedProvider(options.label);
    setProviderValidationMessage(""); // Clear validation message on valid selection
    voiceBotContextData.updateState("transcriber.provider", options.label);

    // Update models based on selected provider
    const selectedProvider = providerList.find(provider => provider.label === options.label);

    if (options.label === 'azure') {
      setModelDisable(true);
      setModelValidationMessage(""); // Clear validation message on valid selection
      setModels([]);
      setLanguage(azureProviderLanguage
        .map(language => ({ value: language[1], label: language[0] })));
    }
    else if (selectedProvider && selectedProvider.model) {
      setModelDisable(false)
      setModels(selectedProvider.model.map(model => ({ value: model, label: model })));
      setLanguage([]);
      // setLanguage(selectedProvider.language.map(language => ({ value: language+".", label: language })));
    } else {
      setModelDisable(false)
      setModels([]);
      setLanguage([]);
    }


    //reset the model value
    setSelectedModel(undefined);
    voiceBotContextData.updateState("transcriber.model", undefined);
    setSelectedLanguage(undefined);
    voiceBotContextData.updateState("transcriber.language", undefined);
  }

  const handleProviderBlur = () => {
    if (!selectedProvider) {
      setProviderValidationMessage("Please select a provider");
    }
  }

  const azureProviderLanguage = [
    "af-ZA",
    "am-ET",
    "ar-AE",
    "ar-BH",
    "ar-DZ",
    "ar-EG",
    "ar-IL",
    "ar-IQ",
    "ar-JO",
    "ar-KW",
    "ar-LB",
    "ar-LY",
    "ar-MA",
    "ar-OM",
    "ar-PS",
    "ar-QA",
    "ar-SA",
    "ar-SY",
    "ar-TN",
    "ar-YE",
    "az-AZ",
    "bg-BG",
    "bn-IN",
    "bs-BA",
    "ca-ES",
    "cs-CZ",
    "cy-GB",
    "da-DK",
    "de-AT",
    "de-CH",
    "de-DE",
    "el-GR",
    "en-AU",
    "en-CA",
    "en-GB",
    "en-GH",
    "en-HK",
    "en-IE",
    "en-IN",
    "en-KE",
    "en-NG",
    "en-NZ",
    "en-PH",
    "en-SG",
    "en-TZ",
    "en-US",
    "en-ZA",
    "es-AR",
    "es-BO",
    "es-CL",
    "es-CO",
    "es-CR",
    "es-CU",
    "es-DO",
    "es-EC",
    "es-ES",
    "es-GQ",
    "es-GT",
    "es-HN",
    "es-MX",
    "es-NI",
    "es-PA",
    "es-PE",
    "es-PR",
    "es-PY",
    "es-SV",
    "es-US",
    "es-UY",
    "es-VE",
    "et-EE",
    "eu-ES",
    "fa-IR",
    "fi-FI",
    "fil-PH",
    "fr-BE",
    "fr-CA",
    "fr-CH",
    "fr-FR",
    "ga-IE",
    "gl-ES",
    "gu-IN",
    "he-IL",
    "hi-IN",
    "hr-HR",
    "hu-HU",
    "hy-AM",
    "id-ID",
    "is-IS",
    "it-CH",
    "it-IT",
    "ja-JP",
    "jv-ID",
    "ka-GE",
    "kk-KZ",
    "km-KH",
    "kn-IN",
    "ko-KR",
    "lo-LA",
    "lt-LT",
    "lv-LV",
    "mk-MK",
    "ml-IN",
    "mn-MN",
    "mr-IN",
    "ms-MY",
    "mt-MT",
    "my-MM",
    "nb-NO",
    "ne-NP",
    "nl-BE",
    "nl-NL",
    "pa-IN",
    "pl-PL",
    "ps-AF",
    "pt-BR",
    "pt-PT",
    "ro-RO",
    "ru-RU",
    "si-LK",
    "sk-SK",
    "sl-SI",
    "so-SO",
    "sq-AL",
    "sr-RS",
    "sv-SE",
    "sw-KE",
    "sw-TZ",
    "ta-IN",
    "te-IN",
    "th-TH",
    "tr-TR",
    "uk-UA",
    "ur-IN",
    "uz-UZ",
    "vi-VN",
    "wuu-CN",
    "yue-CN",
    "zh-CN",
    "zh-CN-shandong",
    "zh-CN-sichuan",
    "zh-HK",
    "zh-TW",
    "zu-ZA"
  ].map(code => {
    const language = languageDictionary.find(lang => lang.code === code);
    return language ? [language.name, code] : [code, code];
  });

  const wisperModelLanguage = [
    "en",
    "zh",
    "de",
    "es",
    "ru",
    "ko",
    "fr",
    "ja",
    "pt",
    "tr",
    "pl",
    "ca",
    "nl",
    "ar",
    "sv",
    "it",
    "id",
    "hi",
    "fi",
    "vi",
    "he",
    "uk",
    "el",
    "ms",
    "cs",
    "ro",
    "da",
    "hu",
    "ta",
    "no",
    "th",
    "ur",
    "hr",
    "bg",
    "lt",
    "la",
    "mi",
    "ml",
    "cy",
    "sk",
    "te",
    "fa",
    "lv",
    "bn",
    "sr",
    "az",
    "sl",
    "kn",
    "et",
    "mk",
    "br",
    "eu",
    "is",
    "hy",
    "ne",
    "mn",
    "bs",
    "kk",
    "sq",
    "sw",
    "gl",
    "mr",
    "pa",
    "si",
    "km",
    "sn",
    "yo",
    "so",
    "af",
    "oc",
    "ka",
    "be",
    "tg",
    "sd",
    "gu",
    "am",
    "yi",
    "lo",
    "uz",
    "fo",
    "ht",
    "ps",
    "tk",
    "nn",
    "mt",
    "sa",
    "lb",
    "my",
    "bo",
    "tl",
    "mg",
    "as",
    "tt",
    "haw",
    "ln",
    "ha",
    "ba",
    "jw",
    "su",
    "yue",
  ].map(code => {
    const language = languageDictionary.find(lang => lang.code === code);
    return language ? [language.name, code] : [code, code];
  });

  const nova2Model = [
    "nova-2-meeting",
    "nova-2-phonecall",
    "nova-2-finance",
    "nova-2-conversationalai",
    "nova-2-voicemail",
    "nova-2-video",
    "nova-2-medical",
    "nova-2-drivethru",
    "nova-2-automotive",
  ];

  const nov2AndNova2GeneralModelLanguage = [
    "multi",
    "bg",
    "ca",
    "zh", "zh-CN", "zh-Hans",
    "zh-TW", "zh-Hant",
    "zh-HK",
    "cs",
    "da", "da-DK",
    "nl",
    "en", "en-US", "en-AU", "en-GB", "en-NZ", "en-IN",
    "et",
    "fi",
    "nl-BE",
    "fr", "fr-CA",
    "de",
    "de-CH",
    "el",
    "hi",
    "hu",
    "id",
    "it",
    "ja",
    "ko", "ko-KR",
    "lv",
    "lt",
    "ms",
    "no",
    "pl",
    "pt", "pt-BR", "pt-PT",
    "ro",
    "ru",
    'sk',
    "es", "es-419",
    "sv", "sv-SE",
    "th", "th-TH",
    "tr",
    "uk",
    "vi"].map(code => {
      const language = languageDictionary.find(lang => lang.code === code);
      return language ? [language.name, code] : [code, code];
    });


  const modelChangeHandler = (value: string, option: any) => {
    // ;
    console.log("Option selected", value, option)
    setLanguage([]);
    setSelectedLanguage(undefined);
    voiceBotContextData.updateState("transcriber.language", "");

    debugger
    //if user select nova2 model
    const exist = nova2Model.some((element) => element == option.label);
    if (exist) {
      // setNova2ModelLanguage(true);

      setLanguage([["English", "en"], ["American-English", "en-US"]].map(language => ({ value: language[1], label: language[0] })));
    }

    //if selected mode is nova-2 or nova-2-general
    else if (option.label === "nova-2" || option.label === "nova-2-general" || option.label === "nova-3" || option.label === "nova-3-general") {

      setLanguage(nov2AndNova2GeneralModelLanguage.map(language => ({ value: language[1], label: language[0] })));
    }

    else if (option.label === "nova" || option.label === "nova-general") {
      setLanguage(["en", "en-US", "en-AU", "en-GB", "en-NZ", "en-IN", "es", "es-419", "hi-Latn"].map(code => {
        const language = languageDictionary.find(lang => lang.code === code);
        return language ? [language.name, code] : [code, code];
      }).map(language => ({ value: language[1], label: language[0] })))
    }

    else if (option.label === "nova-phonecall" || option.label === "nova-medical" || option.label === "nova-3-medical") {
      setLanguage([["English", "en"], ["American-English", "en-US"]].map(language => ({ value: language[1], label: language[0] })));
    }

    else if (option.label === "enhanced-general" || option.label === "enhanced") {
      setLanguage(["da", "nl", "en", "en-US", "nl", "fr", "de", "hi", "it", "ja", "ko", "no", "pl", "pt", "pt-BR", "pt-PT", "es", "es-419", "es-LATAM", "sv", "taq", "ta"].map(code => {
        const language = languageDictionary.find(lang => lang.code === code);
        return language ? [language.name, code] : [code, code];
      }).map(language => ({ value: language[1], label: language[0] })));
    }

    else if (option.label === "enhanced-meeting" || option.label === "enhanced-phonecall" || option.label === "enhanced-finance") {
      setLanguage([["English", "en"], ["American-English", "en-US"]].map(language => ({ value: language[1], label: language[0] })));
    }

    else if (option.label === "base-general" || option.label === "base") {
      setLanguage(["zh", "zh-CN", "zh-TW", "da", "nl", "en", "en-US", "nl", "fr", "fr-CA", "de", "hi", "hi-Latn", "id", "it", "ja", "ko", "no", "pl", "pt", "pt-BR", "pt-PT", "ru", "es", "es-419", "es-LATAM", "sv", "taq", "tr", "uk"].map(code => {
        const language = languageDictionary.find(lang => lang.code === code);
        return language ? [language.name, code] : [code, code];
      }).map(language => ({ value: language[1], label: language[0] })));
    }

    else if (option.label === "base-video" || option.label === "base-voicemail" || option.label === "base-conversationalai" || option.label === "base-finance" || option.label === "base-phonecall" || option.label === "base-meeting") {
      setLanguage([["English", "en"], ["American-English", "en-US"]].map(language => ({ value: language[1], label: language[0] })));
    }

    //if 
    else if (option.label == "Whisper" || option.label == "whisper") {
      setLanguage(wisperModelLanguage.map(language => ({ value: language[1], label: language[0] })));
    }

    else if (option.label == "Accurate" || option.label == "Fast" || option.label == "fast" || option.label == "accurate" || option.label == "solaria-1") {
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList && selectedProviderList.language) {
        // setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
        setLanguage(selectedProviderList.language
          .map(code => {
            const language = languageDictionary.find(lang => lang.code === code);
            return language ? [language.name, code] : [code, code];
          })
          .map(language => ({ value: language[1], label: language[0] })));
      }
    }

    else if (option.label == "scribe_v1" || option.label == "scribe_v2" || option.label == "scribe_v2_realtime") {
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList && selectedProviderList.language) {
        // setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
        setLanguage(selectedProviderList.language
          .map(code => {
            const language = languageDictionary.find(lang => lang.code === code);
            return language ? [language.name, code] : [code, code];
          })
          .map(language => ({ value: language[1], label: language[0] })));
      }
    }
    else if (option.label.includes("gemini")) {
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList && selectedProviderList.language) {
        setLanguage(selectedProviderList.language
          .map(code => {
            const language = languageDictionary.find(lang => lang.code === code);
            return language ? [language.name, code] : [code, code];
          })
          .map(language => ({ value: language[1], label: language[0] })));
      }
    }
    else if (option.label == "gpt-4o-transcribe" || option.label == "gpt-4o-mini-transcribe") {
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList && selectedProviderList.language) {
        // setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
        setLanguage(selectedProviderList.language
          .map(code => {
            const language = languageDictionary.find(lang => lang.code === code);
            return language ? [language.name, code] : [code, code];
          })
          // .sort((a, b) => a[0].localeCompare(b[0])) 
          .map(language => ({ value: language[1], label: language[0] })));
      }
    }
    /**
     * 
     */


    //if user select 


    setSelectedModel(option.label);
    setModelValidationMessage("");// Clear validation message on valid selection
    voiceBotContextData.updateState("transcriber.model", option.label);
  }

  const modelChangeHandlerListUpdate = () => {
    console.log("Clicked");



    // 
    if (models.length === 0 && selectedProvider) {
      console.log("selected model providers ", selectedProvider)
      // ;
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList && selectedProviderList.model) {
        setModels(selectedProviderList.model.map(model => ({ value: model, label: model })));
        // setLanguage(selectedProviderList.language.map(language => ({ value: language+".", label: language })));
      }
    }
  }

  const handleModelBlur = () => {
    if (selectedProvider) {
      if (!selectedModel) {
        setModelValidationMessage("Please select a model");
      }
    }
  }

  const languageChangeHandlerListUpdate = () => {
    if (language.length === 0 && selectedProvider) {
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList && selectedProviderList.language) {
        // setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
        setLanguage(selectedProviderList.language
          .map(code => {
            const language = languageDictionary.find(lang => lang.code === code);
            return language ? [language.name, code] : [code, code];
          })
          .map(language => ({ value: language[1], label: language[0] })));
      }
    }
  }

  const languageChangeHandler = (value: string, option: any) => {
    // ;
    console.clear();
    console.log("Option selected", value, option.value)
    setSelectedLanguage(option.label);
    setLanguageValidationMessage("");// Clear validation message on valid selection

    voiceBotContextData.updateState("transcriber.language", option.value);
  }

  const handleLanguageBlur = () => {
    if (selectedProvider) {
      if (!selectedLanguage) {
        setLanguageValidationMessage("Please select a language");
      }
    }
  }


  console.log("your voicebot details ", voicebotDetails["transcriber"]);





  return (
    <div className="transcribe-container">
      <div className="left-column">
        <h4 className="provider">Provider <span style={{ fontWeight: 'bold', color: providerValidationMessage ? 'red' : 'black' }}>*</span></h4>
        <Select
          className={providerValidationMessage ? "select-field error-provider" : "select-field"}
          placeholder="Select the provider"
          onChange={providerChangeHandler}
          onBlur={handleProviderBlur}
          options={providerList}
          value={selectedProvider}
        />
        {providerValidationMessage && <p className="invalidation-message">{providerValidationMessage}</p>}

        <h4 className="provider model">Model <span style={{ fontWeight: 'bold', color: modelValidationMessage ? 'red' : 'black' }}>*</span></h4>
        <Select
          className={modelValidationMessage ? "select-field error-model" : "select-field"}
          placeholder="Select the model"
          options={models}
          onChange={modelChangeHandler}
          onClick={modelChangeHandlerListUpdate}
          onBlur={handleModelBlur}
          value={selectedModel}
          disabled={modelDisable}
        />
        {modelValidationMessage && <p className="invalidation-message">{modelValidationMessage}</p>}

        {/* <p className="model-info">GPT-4 is more accurate but slower and costlier than GPT-3.5 Turbo (1 min = 1 credit for GPT-3.5 Turbo, 20 credits for GPT-4).</p> */}

      </div>
      <div className="right-column">
        <h4 className="provider language">Language <span style={{ fontWeight: 'bold', color: languageValidationMessage ? 'red' : 'black' }}>*</span></h4>
        <Select
          className={languageValidationMessage ? "select-field error-language" : "select-field"}
          placeholder="Select the Language"
          options={language}
          onChange={languageChangeHandler}
          // onClick={languageChangeHandlerListUpdate}
          onBlur={handleLanguageBlur}
          value={selectedLanguage}

        />
        {languageValidationMessage && <p className="invalidation-message">{languageValidationMessage}</p>}
      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Transcriber), { ssr: false });