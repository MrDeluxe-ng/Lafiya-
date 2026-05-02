import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Info, History } from 'lucide-react';
import { motion } from 'motion/react';

export default function CaseHistory() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'cases'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const fetchedCases = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCases(fetchedCases);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user]);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'High': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wider border border-red-100"><AlertTriangle size={12} /> High Risk</span>;
      case 'Medium': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider border border-amber-100"><AlertTriangle size={12} /> Med Risk</span>;
      case 'Low': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider border border-emerald-100"><CheckCircle2 size={12} /> Low Risk</span>;
      default: 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider border border-slate-200"><Info size={12} /> Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mt-4"
      >
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <History className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">No cases yet</h3>
        <p className="text-slate-500 text-sm max-w-[250px]">Your completed triage assessments will appear here for future reference.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-lg font-bold text-slate-900 px-1 tracking-tight">Recent Consultations</h2>
      {cases.map((c, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          key={c.id} 
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-900 text-base leading-tight">{c.likelyIllness}</span>
              <span className="text-xs font-medium text-slate-500">
                {c.timestamp?.toDate ? format(c.timestamp.toDate(), 'MMM d, yyyy • h:mm a') : 'Recent'}
              </span>
            </div>
            {getRiskBadge(c.riskLevel)}
          </div>
          
          <div className="text-sm text-slate-700 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-900 block mb-1.5 text-[11px] uppercase tracking-wider">Reported Symptoms</span> 
            <span className="opacity-90 leading-relaxed">{c.symptoms}</span>
          </div>
          
          <div className="text-sm text-slate-800 line-clamp-2 bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100/50">
            <span className="font-bold text-slate-900 block mb-1.5 text-[11px] uppercase tracking-wider">Guidance Given</span> 
            <span className="opacity-90 leading-relaxed">{c.guidance}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
