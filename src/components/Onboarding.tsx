import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, UserRole } from '../context/AuthContext';
import { motion } from 'motion/react';
import { NIGERIAN_STATES, getLgasForState, getWardsForLga } from '../lib/nigeriaLocations';

export default function Onboarding() {
  const { user, setProfile } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [role, setRole] = useState<UserRole>('health_worker');
  
  // Location States
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedLga('');
    setSelectedWard('');
  };

  const handleLgaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLga(e.target.value);
    setSelectedWard('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !selectedState || !selectedLga || !selectedWard) {
      setError('Please fill in all details, including your full location.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const fullLocation = `${selectedWard}, ${selectedLga}, ${selectedState}`;
      
      const newProfile = {
        uid: user.uid,
        name,
        role,
        location: fullLocation,
        state: selectedState,
        lga: selectedLga,
        ward: selectedWard,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), newProfile);
      
      // Update local context
      setProfile({
        ...newProfile,
        createdAt: new Date() // Mock timestamp for immediate UI update
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 relative overflow-hidden py-12">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative z-10 my-auto"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Complete Setup</h2>
        <p className="text-slate-500 mb-8 text-sm">Please provide your details to continue to Lafiya.</p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 focus:bg-white appearance-none"
              >
                <option value="health_worker">Health Worker</option>
                <option value="parent">Parent / Caregiver</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Location Details</h3>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">State</label>
              <select
                value={selectedState}
                onChange={handleStateChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white appearance-none text-sm"
              >
                <option value="" disabled>Select State</option>
                {NIGERIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Local Government Area (LGA)</label>
              <select
                value={selectedLga}
                onChange={handleLgaChange}
                disabled={!selectedState}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white appearance-none text-sm disabled:opacity-50 disabled:bg-slate-100"
              >
                <option value="" disabled>Select LGA</option>
                {getLgasForState(selectedState).map(lga => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                disabled={!selectedLga}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white appearance-none text-sm disabled:opacity-50 disabled:bg-slate-100"
              >
                <option value="" disabled>Select Ward</option>
                {getWardsForLga(selectedState, selectedLga).map(ward => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 mt-6 shadow-sm active:scale-[0.98]"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
