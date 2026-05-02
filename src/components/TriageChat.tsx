import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, CheckCircle2, Info, MapPin, Activity, Globe, Mic, MicOff } from 'lucide-react';
import { performTriage, findLocalClinics, TriageResult, generateSpeech } from '../services/geminiService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

type Message = {
  id: string;
  sender: 'user' | 'system';
  text: string;
  isTriageResult?: boolean;
  isConfirmation?: boolean;
  isClinics?: boolean;
  locationSearched?: string;
  triageData?: TriageResult;
  clinics?: string;
  timestamp: Date;
};

type FlowState = 'ASK_SYMPTOMS' | 'ASK_AGE' | 'ASK_DURATION' | 'CONFIRM_DETAILS' | 'ASK_LOCATION' | 'READY';

export default function TriageChat() {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'system',
      text: t('chat.q_symptoms'),
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>('ASK_SYMPTOMS');
  
  // Collected data
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [duration, setDuration] = useState('');
  const [currentTriage, setCurrentTriage] = useState<TriageResult | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const playedMsgIdsRef = useRef<Set<string>>(new Set());

  const playNextAudio = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      playNextAudio();
    };
    source.start();
    audioSourceRef.current = source;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    const processNewMessages = async () => {
      const newSystemMsgs = messages.filter(m => m.sender === 'system' && !playedMsgIdsRef.current.has(m.id));
      
      for (const msg of newSystemMsgs) {
        playedMsgIdsRef.current.add(msg.id);
        
        let textToSpeak = msg.text;
        
        // Convert rich objects to speech text
        if (msg.isTriageResult && msg.triageData) {
          textToSpeak = `${t('chat.triage_complete')} Risk level: ${msg.triageData.riskLevel}. Likely illness: ${msg.triageData.likelyIllness}. ${msg.triageData.guidance}`;
        } else if (msg.isClinics && msg.clinics) {
          // Remove Markdown links or formatting as it sounds bad in TTS
          let cleanClinics = msg.clinics.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
          cleanClinics = cleanClinics.replace(/\*|_|#/g, '');
          textToSpeak = `Here is some information on nearby clinics. ${cleanClinics}`.substring(0, 300); // Truncate so it's not exhaustively long
        }

        if (!textToSpeak) continue;

        try {
          const audioBase64 = await generateSpeech(textToSpeak);
          if (audioBase64) {
            const binaryString = atob(audioBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioCtx = audioContextRef.current;
            
            const int16Buffer = new Int16Array(bytes.buffer);
            const float32Buffer = new Float32Array(int16Buffer.length);
            for (let i = 0; i < int16Buffer.length; i++) {
              float32Buffer[i] = int16Buffer[i] / 32768.0;
            }

            const audioBuffer = audioCtx.createBuffer(1, float32Buffer.length, 24000);
            audioBuffer.getChannelData(0).set(float32Buffer);
            
            audioQueueRef.current.push(audioBuffer);
            playNextAudio();
          }
        } catch (e) {
             console.error("AI TTS error:", e);
        }
      }
    };

    processNewMessages();
  }, [messages, language, t]);

  const startListening = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      switch(language) {
        case 'Hausa': recognition.lang = 'ha-NG'; break;
        case 'Yoruba': recognition.lang = 'yo-NG'; break;
        case 'Igbo': recognition.lang = 'ig-NG'; break;
        default: recognition.lang = 'en-US';
      }

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? prev + ' ' + transcript : transcript);
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  // When language changes and we are at the very start, replace the first message
  useEffect(() => {
    if (messages.length === 1 && flowState === 'ASK_SYMPTOMS' && !symptoms) {
      setMessages([{
        id: Date.now().toString(),
        sender: 'system',
        text: t('chat.q_symptoms'),
        timestamp: new Date()
      }]);
    }
  }, [language, t, flowState, symptoms, messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    if (flowState === 'ASK_SYMPTOMS') {
      setSymptoms(userText);
      setFlowState('ASK_AGE');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'system',
          text: t('chat.q_age'),
          timestamp: new Date()
        }]);
      }, 600);
      return;
    }

    if (flowState === 'ASK_AGE') {
      setAge(userText);
      setFlowState('ASK_DURATION');
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'system',
          text: t('chat.q_duration'),
          timestamp: new Date()
        }]);
      }, 600);
      return;
    }

    if (flowState === 'ASK_DURATION') {
      const finalDuration = userText;
      setDuration(finalDuration);
      setFlowState('CONFIRM_DETAILS');
      return;
    }

    if (flowState === 'CONFIRM_DETAILS') {
      // Just ignore text input during confirmation, user should click the buttons.
      return;
    }

    if (flowState === 'ASK_LOCATION') {
      const locationInput = userText.toLowerCase() === 'skip' ? (profile?.location || '') : userText;
      setFlowState('READY');
      setLoading(true);

      try {
        let clinicsInfo = '';
        if (locationInput) {
          clinicsInfo = await findLocalClinics(locationInput);
        } else {
          clinicsInfo = 'No valid location provided. Unable to determine nearby clinics.';
        }

        // Output clinics message
        const clinicsMsg: Message = {
           id: Date.now().toString(),
           sender: 'system',
           text: '',
           isClinics: true,
           clinics: clinicsInfo,
           locationSearched: locationInput,
           timestamp: new Date()
        };

        // Log case to Firestore with the used location
        if (user && currentTriage) {
          await addDoc(collection(db, 'cases'), {
            userId: user.uid,
            patientAgeMonths: parseInt(age) || 24, // simplified
            symptoms: `Symptoms: ${symptoms}. Duration: ${duration}. Location checked: ${locationInput}`,
            riskLevel: currentTriage.riskLevel,
            likelyIllness: currentTriage.likelyIllness,
            guidance: currentTriage.guidance,
            timestamp: serverTimestamp()
          });
        }

        setMessages(prev => [
          ...prev, 
          clinicsMsg,
          {
            id: (Date.now() + 1).toString(),
            sender: 'system',
            text: t('chat.triage_complete'),
            timestamp: new Date()
          },
          {
            id: (Date.now() + 2).toString(),
            sender: 'system',
            text: t('chat.new_triage'),
            timestamp: new Date()
          }
        ]);

        // Reset flow for next case
        setFlowState('ASK_SYMPTOMS');
        setSymptoms('');
        setAge('');
        setDuration('');
        setCurrentTriage(null);

      } catch (error: any) {
         setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'system',
          text: error.message || t('chat.error'),
          timestamp: new Date()
        }]);
        setFlowState('ASK_LOCATION'); // retry location
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
        const fullContext = `Symptoms: ${symptoms}. Duration: ${duration}.`;
        
        // Extract age simply for MVP (default to 24 if not found)
        const ageMatch = age.match(/(\d+)\s*(month|yr|year|wata|shekar|ọdun|oṣu|afọ|ọnwa)/i);
        let ageMonths = 24;
        if (ageMatch) {
          ageMonths = parseInt(ageMatch[1]);
          if (ageMatch[2].toLowerCase().startsWith('y') || ageMatch[2].toLowerCase().startsWith('s') || ageMatch[2].toLowerCase().startsWith('ọ') || ageMatch[2].toLowerCase().startsWith('a')) {
             ageMonths *= 12;
          }
        } else if (!isNaN(parseInt(age))) {
          ageMonths = parseInt(age); // Assume months if just a number
        }

        // Perform triage with selected language and user's location
        const triage = await performTriage(fullContext, ageMonths, language, profile?.location || '');
        setCurrentTriage(triage);
        
        // Add triage result response
        const sysMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'system',
          text: '',
          isTriageResult: true,
          triageData: triage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, sysMsg]);

        if (triage.riskLevel === 'High') {
          // Ask for location
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            sender: 'system',
            text: t('chat.q_location').replace('{loc}', profile?.location || 'Unknown'),
            timestamp: new Date()
          }]);
          setFlowState('ASK_LOCATION');
        } else {
           // Skip clinics for Low/Medium risk, finish triage logs
           if (user) {
            await addDoc(collection(db, 'cases'), {
              userId: user.uid,
              patientAgeMonths: ageMonths,
              symptoms: fullContext,
              riskLevel: triage.riskLevel,
              likelyIllness: triage.likelyIllness,
              guidance: triage.guidance,
              timestamp: serverTimestamp()
            });
          }

          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 3).toString(),
              sender: 'system',
              text: t('chat.triage_complete'),
              timestamp: new Date()
            },
            {
              id: (Date.now() + 4).toString(),
              sender: 'system',
              text: t('chat.new_triage'),
              timestamp: new Date()
            }
          ]);
          
          setFlowState('ASK_SYMPTOMS');
          setSymptoms('');
          setAge('');
          setDuration('');
          setCurrentTriage(null);
        }

      } catch (error: any) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'system',
          text: error.message || t('chat.error'),
          timestamp: new Date()
        }]);
        // Reset to allow retry
        setFlowState('CONFIRM_DETAILS');
      } finally {
        setLoading(false);
      }
  };

  const handleEdit = () => {
    setFlowState('ASK_SYMPTOMS');
    setSymptoms('');
    setAge('');
    setDuration('');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'system',
      text: t('chat.q_symptoms'),
      timestamp: new Date()
    }]);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-50 border-red-200 text-red-900';
      case 'Medium': return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'Low': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      default: return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertTriangle className="text-red-600" size={24} />;
      case 'Medium': return <AlertTriangle className="text-amber-600" size={24} />;
      case 'Low': return <CheckCircle2 className="text-emerald-600" size={24} />;
      default: return <Info className="text-slate-600" size={24} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      {flowState === 'CONFIRM_DETAILS' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="bg-emerald-600 px-6 py-4">
              <h3 className="text-white font-bold text-lg">{t('chat.confirm_details')}</h3>
              <p className="text-emerald-100 text-sm opacity-90 mt-1">Please verify the information before we continue.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-[15px]">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">{t('chat.lbl_symptoms')}</span>
                  <span className="text-slate-900 font-medium">{symptoms}</span>
                </div>
                <div className="w-full h-px bg-slate-200/60"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">{t('chat.lbl_age')}</span>
                  <span className="text-slate-900 font-medium">{age}</span>
                </div>
                <div className="w-full h-px bg-slate-200/60"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">{t('chat.lbl_duration')}</span>
                  <span className="text-slate-900 font-medium">{duration}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handleEdit} 
                disabled={loading} 
                className="flex-1 bg-white border-2 border-slate-200 text-slate-700 rounded-xl py-2.5 font-bold hover:bg-slate-100 hover:border-slate-300 transition active:scale-[0.98] disabled:opacity-50"
              >
                {t('chat.btn_edit')}
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={loading} 
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-bold hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-emerald-600/20"
              >
                {t('chat.btn_confirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'system' && !msg.isTriageResult && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mr-2 mt-auto mb-1">
                  <Activity size={16} />
                </div>
              )}
              
              <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm' 
                  : (msg.isTriageResult || msg.isClinics)
                    ? 'w-full bg-transparent p-0 shadow-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm'
              }`}>
                {msg.isTriageResult && msg.triageData ? (
                  <div className="space-y-4 w-full">
                    <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 shadow-sm ${getRiskColor(msg.triageData.riskLevel)}`}>
                      <div className="shrink-0 mt-1 bg-white p-2 rounded-full shadow-sm">
                        {getRiskIcon(msg.triageData.riskLevel)}
                      </div>
                      <div>
                        <div className="font-bold text-lg mb-1 tracking-tight">{t('chat.risk')}: {msg.triageData.riskLevel}</div>
                        <div className="font-medium opacity-90">{t('chat.likely')}: {msg.triageData.likelyIllness}</div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        {t('chat.guidance')}
                      </div>
                      <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown>{msg.triageData.guidance}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : msg.isClinics && msg.clinics ? (
                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-900 text-sm shadow-sm w-full space-y-4">
                    <div>
                      <div className="flex items-center gap-2 font-bold mb-3 text-[15px]">
                        <MapPin size={20} className="text-emerald-600" /> 
                        {t('chat.nearby_clinics')}
                      </div>
                      <div className="prose prose-sm prose-blue max-w-none">
                        <ReactMarkdown>{msg.clinics}</ReactMarkdown>
                      </div>
                    </div>
                    {msg.locationSearched && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('hospitals clinics emergency near ' + msg.locationSearched)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm active:scale-[0.98]"
                      >
                        <MapPin size={18} />
                        {t('chat.btn_open_maps')}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                )}
                
                {!msg.isTriageResult && (
                  <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mr-2 mt-auto mb-1">
              <Activity size={16} />
            </div>
            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-sm px-4 py-4 flex items-center gap-1.5 shadow-sm">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-slate-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="flex gap-3 items-end max-w-3xl mx-auto">
          <div className="flex-1 bg-slate-100 rounded-3xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 transition-all overflow-hidden flex items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.input_placeholder')}
              className="w-full max-h-32 min-h-[44px] px-4 py-3 bg-transparent focus:outline-none resize-none text-[15px]"
              disabled={loading || flowState === 'CONFIRM_DETAILS'}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              type="button"
              onClick={startListening}
              disabled={loading || flowState === 'CONFIRM_DETAILS'}
              className={`p-3 mr-1 mb-0.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'} disabled:opacity-50`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading || flowState === 'CONFIRM_DETAILS'}
            className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shrink-0 shadow-sm active:scale-95 mb-0.5"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
