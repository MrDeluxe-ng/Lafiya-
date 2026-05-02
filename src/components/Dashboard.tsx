import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { auth } from '../firebase';
import { LogOut, MessageSquare, History, Bell, Menu, X, Activity, Globe, Mic, MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TriageChat from './TriageChat';
import LiveTalkSession from './LiveTalkSession';
import CaseHistory from './CaseHistory';
import HealthNews from './HealthNews';
import Alerts from './Alerts';

export default function Dashboard() {
  const { profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<'home' | 'history' | 'alerts'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
  };

  const menuItems = [
    { id: 'home', label: t('nav.home'), icon: MessageSquare },
    { id: 'history', label: t('nav.history'), icon: History },
    { id: 'alerts', label: t('nav.alerts'), icon: Bell },
  ] as const;

  const NavContent = () => (
    <div className="flex flex-col gap-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeMenu === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveMenu(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              isActive 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-slate-400'} />
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-[100dvh] flex bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.02)] z-20">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Activity size={22} />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">{t('app.title')}</span>
        </div>
        
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="font-bold text-slate-900">{profile?.name}</div>
          <div className="text-slate-500 text-sm font-medium capitalize tracking-wide mt-1">{profile?.role?.replace('_', ' ')} • {profile?.location}</div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <NavContent />
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-4 text-slate-700">
            <Globe size={18} className="text-slate-400" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent border-none text-sm font-semibold outline-none cursor-pointer hover:text-slate-900 w-full"
            >
              <option value="English">English</option>
              <option value="Hausa">Hausa</option>
              <option value="Yoruba">Yoruba</option>
              <option value="Igbo">Igbo</option>
            </select>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-600 hover:bg-slate-100 hover:text-red-600 rounded-xl transition-all group"
          >
            <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
            <span className="font-medium">{t('nav.signout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
              <Activity size={18} />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">{t('app.title')}</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute inset-0 z-30 flex top-16">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" 
                onClick={() => setIsMobileMenuOpen(false)} 
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 w-72 bg-white shadow-2xl flex flex-col border-l border-slate-200"
              >
                <div className="p-5 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-lg">{profile?.name}</div>
                  <div className="text-slate-500 text-sm font-medium capitalize tracking-wide mt-1">{profile?.role?.replace('_', ' ')} • {profile?.location}</div>
                </div>
                <nav className="flex-1 p-4 overflow-y-auto">
                  <NavContent />
                </nav>
                <div className="p-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-4 text-slate-700">
                    <Globe size={18} className="text-slate-400" />
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="bg-transparent border-none text-sm font-semibold outline-none cursor-pointer hover:text-slate-900 w-full"
                    >
                      <option value="English">English</option>
                      <option value="Hausa">Hausa</option>
                      <option value="Yoruba">Yoruba</option>
                      <option value="Igbo">Igbo</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-slate-100 hover:text-red-600 rounded-xl transition-all group"
                  >
                    <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
                    <span className="font-medium">{t('nav.signout')}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {activeMenu === 'home' && (
                <div className="w-full min-h-full flex flex-col p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
                  {/* AI TALK SECTION */}
                  <div className="w-full bg-emerald-700 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-emerald-900/10 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                    {/* Background decoration */}
                    <div className="absolute inset-0 z-0">
                      <img src="https://images.unsplash.com/photo-1576091160550-2173ff9e5ee4?q=80&w=2000&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover mix-blend-overlay opacity-30" />
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-emerald-900/90 mix-blend-multiply"></div>
                    </div>
                    
                    <div className="flex-1 relative z-10 w-full">
                      <div className="inline-flex py-1 px-3 rounded-full bg-white/20 border border-white/20 text-emerald-50 text-xs font-bold uppercase tracking-widest backdrop-blur-md mb-4 shadow-sm">
                        AI Health Assistant
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight text-white drop-shadow-sm">
                        {t('home.hero.title')}
                      </h2>
                      <p className="text-emerald-50 text-base sm:text-lg mb-6 leading-relaxed">
                        {t('home.hero.desc')}
                      </p>
                      
                      {/* Fake input triggering chat modal (or directly starting it) */}
                      <button 
                        onClick={() => setIsChatOpen(true)}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all backdrop-blur-md text-white rounded-2xl p-4 flex items-center justify-between group shadow-lg"
                      >
                         <span className="text-emerald-50/80 text-lg group-hover:text-white transition-colors">{t('home.hero.placeholder')}</span>
                         <div className="flex gap-2">
                           <div className="w-10 h-10 bg-white/10 text-emerald-100 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-sm" onClick={(e) => { e.stopPropagation(); setIsLiveSessionOpen(true); }}>
                             <Mic size={18} />
                           </div>
                           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                             <MessageSquare size={18} />
                           </div>
                         </div>
                      </button>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {[t('home.hero.prompt1'), t('home.hero.prompt2'), t('home.hero.prompt3')].map((prompt, i) => (
                           <button key={i} onClick={() => setIsChatOpen(true)} className="px-4 py-2 bg-emerald-800/30 hover:bg-emerald-800/50 transition border border-emerald-400/20 rounded-xl text-sm font-medium text-emerald-50 whitespace-nowrap backdrop-blur-sm">
                             {prompt}
                           </button>
                        ))}
                      </div>
                    </div>
                    <div className="hidden md:block w-48 shrink-0 relative z-10">
                       <img src="https://images.unsplash.com/photo-1551076805-e18690c5e561?q=80&w=600&auto=format&fit=crop" alt="AI Interface" className="w-full aspect-square rounded-2xl object-cover shadow-xl border-4 border-white/10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* MAP SEARCH SECTION */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 flex flex-col">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{t('home.map.title')}</h3>
                      <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">{t('home.map.subtitle')}</p>
                      
                      <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Globe className="text-slate-400" size={20} />
                        </div>
                        <input 
                          type="text" 
                          placeholder={t('home.map.placeholder')}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        <button className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold shadow-sm">{t('home.map.filter.hospital')}</button>
                        <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">{t('home.map.filter.pharmacy')}</button>
                        <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors shadow-sm">{t('home.map.filter.emergency')}</button>
                      </div>

                      <div className="mt-auto h-48 sm:h-64 bg-emerald-50/50 rounded-2xl border-2 border-emerald-100/50 relative overflow-hidden group cursor-pointer" onClick={() => window.open('https://maps.google.com/maps?q=hospital&t=&z=13', '_blank')}>
                        {/* Friendly Map Illustration created with CSS & Icons */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative w-full h-full p-4 sm:p-8">
                             {/* Decorative Path */}
                             <svg className="absolute w-full h-full inset-0 text-emerald-200/50 -rotate-3" viewBox="0 0 100 100" preserveAspectRatio="none">
                               <path d="M 0,50 Q 25,20 50,50 T 100,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                               <path d="M 20,80 Q 50,30 80,80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                             </svg>
                             
                             <div className="absolute top-[30%] left-[20%] mt-[-1.5rem] ml-[-1.5rem]">
                               <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-emerald-50 transform hover:scale-110 transition-transform">
                                 <Activity className="text-emerald-500" size={20} />
                               </div>
                               <div className="w-16 h-2 bg-emerald-900/10 rounded-[100%] mx-auto mt-2 blur-[2px]"></div>
                             </div>

                             <div className="absolute top-[60%] left-[50%] mt-[-1.5rem] ml-[-1.5rem]">
                               <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-emerald-50 transform hover:scale-110 transition-transform">
                                 <MapPin className="text-emerald-500" size={20} />
                               </div>
                               <div className="w-16 h-2 bg-emerald-900/10 rounded-[100%] mx-auto mt-2 blur-[2px]"></div>
                             </div>

                             <div className="absolute top-[20%] right-[20%] mt-[-1.5rem] ml-[-1.5rem]">
                               <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-red-50 transform hover:scale-110 transition-transform">
                                 <AlertTriangle className="text-red-500" size={20} />
                               </div>
                               <div className="w-16 h-2 bg-red-900/10 rounded-[100%] mx-auto mt-2 blur-[2px]"></div>
                             </div>
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors"></div>
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                          <div className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-xl border border-white transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                             <MapPin size={18} className="text-emerald-600" />
                             {t('home.map.openMap')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TRIAGE SECTION */}
                    <div className="bg-emerald-50/50 rounded-3xl p-6 sm:p-8 border border-emerald-100 flex flex-col">
                      <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center mb-6">
                        <Activity size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{t('home.triage.title')}</h3>
                      <p className="text-slate-600 text-sm mb-8 leading-relaxed max-w-sm">
                        {t('home.triage.desc')}
                      </p>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                        {[t('body.head'), t('body.chest'), t('body.stomach'), t('body.limbs'), t('body.fever'), t('body.other')].map((area, idx) => (
                           <div key={idx} onClick={() => setIsChatOpen(true)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center text-sm font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/30 cursor-pointer transition-colors">
                             {area}
                           </div>
                        ))}
                      </div>

                      <button onClick={() => setIsChatOpen(true)} className="mt-auto w-full bg-emerald-600 text-white rounded-2xl py-4 font-bold tracking-wide hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                        {t('home.triage.btn')}
                      </button>
                    </div>
                  </div>
                  
                  {/* HEALTH NEWS & CLIMATE SECTION */}
                  <HealthNews />
                </div>
              )}
              {activeMenu === 'history' && (
                <div className="min-h-full bg-slate-50 p-4 sm:p-8">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">{t('nav.history')}</h2>
                    <CaseHistory />
                  </div>
                </div>
              )}
              {activeMenu === 'alerts' && (
                <div className="min-h-full bg-slate-50 p-4 sm:p-8">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">{t('nav.alerts')}</h2>
                    <Alerts />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full h-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-emerald-600" />
                  <span className="font-bold text-slate-900">{t('home.triage.title')}</span>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative bg-slate-50">
                <TriageChat />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Session Overlay */}
      <AnimatePresence>
        {isLiveSessionOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-2 sm:p-6 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full max-w-2xl aspect-square sm:aspect-video rounded-3xl overflow-hidden shadow-2xl"
            >
              <LiveTalkSession onClose={() => setIsLiveSessionOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
