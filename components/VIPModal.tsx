import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Crown, Lock } from 'lucide-react';
import { VIPPackage, User } from '../types';
import { VIP_LEVELS } from '../constants';

interface VIPModalProps {
  user: User;
  onClose: () => void;
  onBuy: (vip: VIPPackage) => void;
}

const VIPModal: React.FC<VIPModalProps> = ({ user, onClose, onBuy }) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-gradient-to-br from-slate-900 via-[#1a1f35] to-slate-900 rounded-[2rem] border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="relative p-6 text-center border-b border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition">
             <X size={20} />
          </button>
          <div className="inline-block p-3 rounded-full bg-amber-500/10 mb-2 border border-amber-500/20">
             <Crown size={32} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
             عضوية VIP
          </h2>
          <p className="text-xs text-slate-400 mt-1">تميز بإطارات حصرية وألقاب ملكية</p>
          
          <div className="mt-4 bg-black/40 rounded-xl p-2 flex items-center justify-between px-4 border border-white/5">
             <span className="text-xs text-slate-400">رصيدك الحالي</span>
             <span className="font-bold text-yellow-400 flex items-center gap-1">
                {user.coins.toLocaleString()} <span className="text-[10px]">🪙</span>
             </span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
           {VIP_LEVELS.map((vip) => {
             const isLocked = vip.level > (user.vipLevel || 0) + 1; // Example logic: open next level
             const isOwned = (user.vipLevel || 0) >= vip.level;
             const canAfford = user.coins >= vip.cost;

             return (
               <div 
                 key={vip.level} 
                 className={`relative rounded-2xl p-3 border transition-all overflow-hidden group ${
                   isOwned 
                     ? 'bg-amber-900/10 border-amber-500/50' 
                     : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                 }`}
               >
                 {/* Background Glow */}
                 {isOwned && <div className="absolute inset-0 bg-amber-500/5"></div>}

                 <div className="flex items-center gap-4 relative z-10">
                    {/* Frame Preview */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                       <div className="absolute inset-0 rounded-full border border-white/10 bg-black">
                          <img src={user.avatar} className="w-full h-full rounded-full opacity-50 grayscale" alt="preview" />
                       </div>
                       <img src={vip.frameUrl} className="absolute -inset-[18%] w-[136%] h-[136%] object-contain pointer-events-none drop-shadow-lg" alt={vip.name} />
                       <div className="absolute -bottom-1 -right-1 bg-black/80 text-[10px] px-1.5 rounded-full border border-white/10 text-white font-bold">
                          {vip.level}
                       </div>
                    </div>

                    <div className="flex-1">
                       <h3 className={`font-bold text-lg ${vip.color}`}>{vip.name}</h3>
                       <p className="text-[10px] text-slate-400">إطار {vip.name} الحصري + شارة</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                       {isOwned ? (
                         <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg flex items-center gap-1 border border-green-500/20">
                            <Check size={12} /> مفعل
                         </div>
                       ) : (
                         <button 
                            disabled={!canAfford}
                            onClick={() => onBuy(vip)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center min-w-[80px] transition-all active:scale-95 ${
                               canAfford 
                                 ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-900/50 hover:brightness-110' 
                                 : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                         >
                            <span>شراء</span>
                            <span className="text-[9px] opacity-80">{vip.cost.toLocaleString()} 🪙</span>
                         </button>
                       )}
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
      </motion.div>
    </div>
  );
};

export default VIPModal;