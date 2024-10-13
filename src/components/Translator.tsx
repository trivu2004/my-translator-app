"use client";

import { useState, useEffect, useRef } from "react";
import languageCodesData from "@/data/language-codes.json";
import countryCodesData from "@/data/country-codes.json";

type LanguageCodes = Record<string, string>;
type CountryCodes = Record<string, string>;

const languageCodes: LanguageCodes = languageCodesData;
const countryCodes: CountryCodes = countryCodesData;

const Translator = () => {
  const recognitionRef = useRef<SpeechRecognition>();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [translation, setTranslation] = useState<string>("");
  const [voices, setVoices] = useState<Array<SpeechSynthesisVoice>>([]);
  const [language, setLanguage] = useState<string>("vi-VN"); // Thay đổi ngôn ngữ mặc định sang tiếng Việt

  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    if (Array.isArray(voices) && voices.length > 0) {
      setVoices(voices);
      return;
    }
    if ("onvoiceschanged" in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        setVoices(voices);
      };
    }
  }, []);

  const availableLanguages = Array.from(
    new Set(voices?.map(({ lang }) => lang))
  )
    .map((lang) => {
      const split = lang.split("-");
      const languageCode: string = split[0];
      const countryCode: string = split[1];
      return {
        lang,
        label: languageCodes[languageCode] || lang,
        dialect: countryCodes[countryCode],
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleOnRecord = () => {
    if (isActive) {
      recognitionRef.current?.stop();
      setIsActive(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.lang = "vi-VN"; // Ngôn ngữ ghi âm là tiếng Việt

    recognitionRef.current.onstart = () => {
      setIsActive(true);
    };

    recognitionRef.current.onend = () => {
      setIsActive(false);
    };

    recognitionRef.current.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);

      const results = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({
          text: transcript,
          language: language, // Sử dụng ngôn ngữ đã chọn
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((r) => r.json());

      setTranslation(results.text);
      speak(results.text);
    };

    recognitionRef.current.start();
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const activeVoice =
      voices.find(({ lang }) => lang === language) || voices[0];

    if (activeVoice) {
      utterance.voice = activeVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mt-12 px-4">
      <div className="max-w-lg rounded-xl overflow-hidden mx-auto">
        <div className="bg-zinc-200 p-4 border-b-4 border-zinc-300">
          <div className="bg-blue-200 rounded-lg p-2 border-2 border-blue-300">
            <ul className="font-mono font-bold text-blue-900 uppercase px-4 py-2 border border-blue-800 rounded">
              <li>
                &gt; Translation Mode:{" "}
                {languageCodes[language.split("-")[0]] || language}
              </li>
              <li>&gt; Dialect: {countryCodes[language.split("-")[1]]}</li>
            </ul>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 border-b-4 border-zinc-950">
          <p className="flex items-center gap-3">
            <span
              className={`block rounded-full w-5 h-5 flex-shrink-0 flex-grow-0 ${
                isActive ? "bg-red-500" : "bg-red-900"
              }`}
            >
              <span className="sr-only">
                {isActive ? "Actively recording" : "Not actively recording"}
              </span>
            </span>
          </p>
        </div>

        <div className="bg-zinc-800 p-4">
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg bg-zinc-200 rounded-lg p-5 mx-auto">
            <form>
              <div>
                <label className="block text-zinc-500 text-[.6rem] uppercase font-bold mb-1">
                  Language
                </label>
                <select
                  className="w-full text-[.7rem] rounded-sm border-zinc-300 px-2 py-1 pr-7"
                  name="language"
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.currentTarget.value);
                  }}
                >
                  {availableLanguages.map(({ lang, label }) => (
                    <option key={lang} value={lang}>
                      {label} ({lang})
                    </option>
                  ))}
                </select>
              </div>
            </form>
            <p>
              <button
                className={`w-full h-full uppercase font-semibold text-sm ${
                  isActive
                    ? "text-white bg-red-500"
                    : "text-zinc-400 bg-zinc-900"
                } color-white py-3 rounded-sm`}
                onClick={handleOnRecord}
              >
                {isActive ? "Stop" : "Record"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto mt-12">
        <p className="mb-4">Spoken Text: {text}</p>
        <p>Translation: {translation}</p>
      </div>
    </div>
  );
};

export default Translator;
