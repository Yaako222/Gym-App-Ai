import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ExerciseLog, ChatMessage } from '../types';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';

interface AIChatProps {
  logs: ExerciseLog[];
}

export default function AIChat({ logs }: AIChatProps) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { id: '1', role: 'model', text: t('aiCoachWelcome') }
    ]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = language === 'de' 
        ? `Du bist ein hilfreicher Gym-Coach. Hier sind die aktuellen Trainingsdaten des Nutzers im JSON-Format:
${JSON.stringify(logs, null, 2)}
Beantworte die Fragen des Nutzers basierend auf diesen Daten. Antworte auf Deutsch, sei motivierend und präzise. Wenn du eine Übung nicht findest, weise freundlich darauf hin.`
        : `You are a helpful gym coach. Here are the user's current training data in JSON format:
${JSON.stringify(logs, null, 2)}
Answer the user's questions based on this data. Answer in English, be motivating and precise. If you cannot find an exercise, point it out friendly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction
        }
      });

      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        role: 'model', 
        text: response.text || t('aiErrorNoResponse') 
      }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        role: 'model', 
        text: t('aiErrorConnection') 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm flex flex-col h-[600px] max-h-[70vh]">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="bg-[#1d7a82]/20 p-2 rounded-lg">
          <Bot className="w-5 h-5 text-[#1d7a82]" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{t('aiCoach')}</h2>
          <p className="text-xs text-slate-400">Powered by Gemini</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#FF0050]' : 'bg-[#1d7a82]'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              msg.role === 'user' 
                ? 'bg-[#FF0050]/10 border border-[#FF0050]/20 text-white rounded-tr-none' 
                : 'bg-black/20 border border-white/5 text-slate-200 rounded-tl-none'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.text}</p>
              ) : (
                <div className="text-sm prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/40 max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1d7a82] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#1d7a82] animate-spin" />
              <span className="text-sm text-slate-400">{t('aiAnalyzing')}</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/10">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiInputPlaceholder')}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1d7a82] focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#1d7a82] hover:bg-[#155e64] disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
