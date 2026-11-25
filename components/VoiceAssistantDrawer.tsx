import React, { useMemo, useState } from 'react';
import { Mic, MicOff, Send, Volume2, X, MessageSquare } from 'lucide-react';
import { useAgri } from '../context/AgriContext';
import { answerFarmerQuestion } from '../logic/voiceAssistant';

interface ChatMessage {
  id: string;
  sender: 'farmer' | 'assistant';
  text: string;
  facts?: string[];
}

const SAMPLE_QUESTIONS = [
  'என்னிடம் 300 கிலோ தக்காளி உள்ளது. எங்கு விற்கலாம்?',
  'இன்று என்னுடைய tomato crop-க்கு எந்த buyer offer அதிகம்?',
  'போக்குவரத்து செலவு கழித்தால் எனக்கு எவ்வளவு கிடைக்கும்?',
  'Group selling-ல் எப்படி சேர்வது?',
  'Where should I sell 500 kg Country Tomato for the best net return?',
];

export const VoiceAssistantDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { state } = useAgri();
  const isTa = state.language === 'ta';

  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: isTa
        ? 'வணக்கம்! உங்கள் பயிர் இருப்பு, கொள்முதலாளர் சலுகைகள், போக்குவரத்து செலவு மற்றும் கூட்டு விற்பனை குறித்து தமிழ் அல்லது ஆங்கிலத்தில் கேளுங்கள்.'
        : 'Hello! Ask me in Tamil or English about your crop listings, highest buyer offers, net return after transport, or how to join group selling. All answers use your actual app data.',
    },
  ]);

  const speechSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  const ttsSupported = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    []
  );

  if (!open) return null;

  const speakText = (text: string, lang: 'en' | 'ta') => {
    if (!ttsSupported) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 0.96;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore browser TTS restriction errors
    }
  };

  const handleSend = (questionText?: string) => {
    const q = (questionText ?? input).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'farmer',
      text: q,
    };
    const reply = answerFarmerQuestion(q, state);
    const botMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'assistant',
      text: reply.text,
      facts: reply.groundedFacts,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    if (!questionText) setInput('');
  };

  const handleToggleMic = () => {
    if (!speechSupported) {
      setSpeechNotice(
        isTa
          ? 'இந்த உலாவியில் குரல் அங்கீகாரம் ஆதரிக்கப்படவில்லை. கீழே தட்டச்சு செய்யவும்.'
          : 'Browser speech recognition is unavailable here. Please use the text box below.'
      );
      return;
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };

    const RecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!RecognitionCtor) return;

    try {
      setSpeechNotice(null);
      const recognition = new RecognitionCtor();
      recognition.lang = state.language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };
      recognition.onerror = () => {
        setListening(false);
        setSpeechNotice(
          isTa
            ? 'மைக்ரோஃபோன் அணுகல் கிடைக்கவில்லை. தட்டச்சு உள்ளீட்டைப் பயன்படுத்தவும்.'
            : 'Microphone unavailable or denied. Please type your question below.'
        );
      };
      recognition.onend = () => setListening(false);

      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col"
      role="dialog"
      aria-label="Tamil and English Farmer Assistant"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <h2 className="text-base font-semibold text-slate-900">
              {isTa ? 'விவசாயி குரல் & உரை உதவியாளர்' : 'Tamil & English Farmer Assistant'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTa
              ? 'உங்கள் நேரடி பதிவுகள் & மாதிரி விலைகள் அடிப்படையில்'
              : 'Grounded strictly in your current app listings, offers & calculator'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
          aria-label="Close assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sample quick questions */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-600 mb-2">
          {isTa ? 'மாதிரி கேள்விகள் (கிளிக் செய்யவும்):' : 'Try asking (click to test):'}
        </p>
        <div className="flex flex-col gap-1.5">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="text-left text-xs text-emerald-800 hover:text-emerald-950 bg-white border border-slate-200 hover:border-emerald-300 rounded-md px-2.5 py-1.5 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'farmer' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                m.sender === 'farmer'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-900 border border-slate-200'
              }`}
            >
              <p>{m.text}</p>
              {m.facts && m.facts.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-0.5 font-mono tabular-nums">
                  {m.facts.map((f) => (
                    <div key={f}>{f}</div>
                  ))}
                </div>
              )}
            </div>
            {m.sender === 'assistant' && ttsSupported && (
              <button
                onClick={() =>
                  speakText(m.text, /[\u0B80-\u0BFF]/.test(m.text) ? 'ta' : 'en')
                }
                className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isTa ? 'கேட்கவும்' : 'Read aloud'}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input & speech bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        {speechNotice && (
          <p className="text-xs text-amber-700 mb-2">{speechNotice}</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleToggleMic}
            title={speechSupported ? 'Voice input' : 'Speech recognition unavailable'}
            className={`p-2.5 rounded-lg border transition-colors shrink-0 ${
              listening
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="Toggle voice input"
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isTa
                ? 'தமிழ் அல்லது ஆங்கிலத்தில் கேள்வி தட்டச்சு செய்க...'
                : 'Type question in Tamil or English...'
            }
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition-colors shrink-0 inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTa ? 'அனுப்பு' : 'Ask'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
