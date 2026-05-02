import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { Bell, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Alerts() {
  const { user, profile } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlertMsg, setNewAlertMsg] = useState('');

  const fetchAlerts = async () => {
    try {
      const q = query(
        collection(db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const fetchedAlerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(fetchedAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertMsg.trim() || !user) return;

    try {
      await addDoc(collection(db, 'alerts'), {
        message: newAlertMsg,
        createdBy: user.uid,
        timestamp: serverTimestamp()
      });
      setNewAlertMsg('');
      setIsCreating(false);
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      alert("Failed to create alert. You might not have permission.");
    }
  };

  const canCreateAlerts = profile?.role === 'admin' || profile?.role === 'health_worker';

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {canCreateAlerts && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200"
        >
          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.button 
                key="create-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreating(true)}
                className="w-full py-4 border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl text-emerald-700 font-bold tracking-tight flex items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50 transition-all active:scale-[0.98]"
              >
                <Plus size={20} />
                Broadcast New Alert
              </motion.button>
            ) : (
              <motion.form 
                key="create-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateAlert} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5 tracking-tight">New Alert Message</label>
                  <textarea
                    value={newAlertMsg}
                    onChange={(e) => setNewAlertMsg(e.target.value)}
                    placeholder="e.g. High malaria risk this week in Kano North. Ensure bed net usage."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[120px] resize-none text-slate-900 bg-slate-50/50"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsCreating(false)}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold tracking-tight transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold tracking-tight hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 active:scale-95"
                  >
                    <Bell size={16} />
                    Broadcast
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 px-1 tracking-tight">Recent Alerts</h3>
        
        {alerts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200 flex flex-col items-center shadow-sm"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Bell className="text-slate-400" size={28} />
            </div>
            <p className="font-medium">No active alerts at this time.</p>
          </motion.div>
        ) : (
          alerts.map((alert, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={alert.id} 
              className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="text-slate-900 font-medium leading-relaxed">{alert.message}</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">
                    {alert.timestamp?.toDate ? format(alert.timestamp.toDate(), 'MMM d, yyyy • h:mm a') : 'Recent'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
