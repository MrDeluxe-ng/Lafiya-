import React, { useState, useEffect, useRef } from 'react';
import { LiveServerMessage, Modality } from "@google/genai";
import { ai } from '../services/geminiService';
import { Mic, MicOff, Activity, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export default function LiveTalkSession({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Buffer for playing received audio
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      mediaStreamRef.current = stream;

      // 2. Setup AudioContext for input and output
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextCtor({ sampleRate: 24000 }); 
      inputContextRef.current = new AudioContextCtor({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);

            if (!inputContextRef.current || !stream) return;

            // Set up input audio processor (16kHz needed)
            const inputCtx = inputContextRef.current;
            const source = inputCtx.createMediaStreamSource(stream);
            audioInputRef.current = source;
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const channelData = e.inputBuffer.getChannelData(0);
              // convert Float32 to Int16
              const pcm16 = new Int16Array(channelData.length);
              for (let i = 0; i < channelData.length; i++) {
                pcm16[i] = channelData[i] * 32767;
              }
              // encode to base64
              const buffer = new Uint8Array(pcm16.buffer);
              let binary = '';
              for (let i = 0; i < buffer.byteLength; i++) {
                binary += String.fromCharCode(buffer[i]);
              }
              const base64Data = btoa(binary);

              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && audioContextRef.current) {
                const binary = atob(base64Audio);
                const bytes = new Uint8Array(binary.length);
                for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
                
                const int16Buffer = new Int16Array(bytes.buffer);
                const float32Buffer = new Float32Array(int16Buffer.length);
                for (let i = 0; i < int16Buffer.length; i++) {
                  float32Buffer[i] = int16Buffer[i] / 32768.0;
                }

                const audioBuffer = audioContextRef.current.createBuffer(1, float32Buffer.length, 24000);
                audioBuffer.getChannelData(0).set(float32Buffer);

                audioQueueRef.current.push(audioBuffer);
                playNext();
             }

             if (message.serverContent?.interrupted) {
                audioQueueRef.current = [];
             }
          },
          onclose: () => {
             setIsConnected(false);
          },
          onerror: (err) => {
             console.error("Live session error:", err);
             setError("Connection lost or error occurred.");
             cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
             voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: `You are a helpful and kind medical AI assistant. Listen to the user and converse in ${language}. Provide brief and empathetic responses. Do not give direct medical diagnosis, but give useful advice based on general knowledge. Keep sentences short and conversational.`,
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError("Could not start live session. Check microphone permissions.");
      setIsConnecting(false);
    }
  };

  const playNext = () => {
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
        playNext();
     };
     source.start();
  };

  const cleanup = () => {
     if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
     if (audioInputRef.current) audioInputRef.current.disconnect();
     if (inputContextRef.current) inputContextRef.current.close().catch(() => {});
     if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
     if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
     if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close()).catch(console.error);
     }
     setIsConnected(false);
     setIsConnecting(false);
  };

  useEffect(() => {
     return () => {
        cleanup();
     };
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 text-white relative overflow-hidden flex flex-col items-center justify-center">
       {/* Ambient background */}
       <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover mix-blend-overlay opacity-20" />
       </div>

       <button 
           onClick={onClose}
           className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20 backdrop-blur-md"
        >
           <X size={24} />
        </button>

       <h2 className="text-3xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 z-10 tracking-tight">
           Live Health Assistant
       </h2>
       
       <div className="relative w-48 h-48 flex items-center justify-center mb-10 z-10">
          {isConnecting && (
              <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="absolute inset-0 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
              />
          )}
          
          {isConnected && (
             <>
               <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl"
               />
               <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.2 }}
                  className="absolute inset-0 bg-emerald-400/20 rounded-full"
               />
             </>
          )}

          <div className={`w-36 h-36 rounded-full flex items-center justify-center z-10 transition-colors shadow-2xl relative ${
             isConnected ? 'bg-gradient-to-br from-emerald-500 to-cyan-600' : 'bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700'
          }`}>
             {isConnected ? <Activity size={56} className="text-white animate-pulse" /> : <MicOff size={56} className="text-slate-400" />}
             
             {/* Small status dot */}
             {isConnected && (
                <div className="absolute top-2 right-6 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
             )}
          </div>
       </div>

       {error && <p className="text-red-400 mb-6 font-medium bg-red-400/10 border border-red-400/20 px-6 py-3 rounded-2xl text-center max-w-sm z-10 backdrop-blur-md">{error}</p>}
       
       <div className="z-10 flex flex-col items-center">
         {!isConnected && !isConnecting && (
           <button 
             onClick={startSession}
             className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/50 transition-all text-lg flex items-center gap-3 active:scale-[0.98]"
           >
             <Mic size={24} />
             Start Live Session
           </button>
         )}

         {isConnecting && (
           <p className="text-emerald-400 font-semibold animate-pulse tracking-wide">Connecting to Assistant...</p>
         )}

         {isConnected && (
           <button 
             onClick={cleanup}
             className="px-8 py-4 bg-red-500/20 hover:bg-red-500/30 text-white border-2 border-red-500/50 font-bold rounded-2xl transition-all flex items-center gap-3 mt-4 backdrop-blur-md active:scale-[0.98]"
           >
             <X size={24} className="text-red-400" />
             End Session
           </button>
         )}
         
         <p className="text-slate-400 text-sm mt-8 max-w-xs text-center leading-relaxed">
           Talk naturally. The AI will listen and respond in real-time.
         </p>
       </div>
    </div>
  );
}
