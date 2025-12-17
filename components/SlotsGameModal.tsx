import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Volume2, VolumeX, RefreshCw, Coins } from 'lucide-react';
import { SLOT_ITEMS } from '../constants';
import { SlotItem } from '../types';

interface SlotsGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  winRate: number;
}

const CHIPS = [100, 500, 1000, 5000];

const SlotsGameModal: React.FC<SlotsGameModalProps> = ({ isOpen, onClose, userCoins, onUpdateCoins, winRate }) => {
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState<SlotItem[]>([SLOT_ITEMS[0], SLOT_ITEMS[0], SLOT_ITEMS[0]]);
  const [winAmount, setWinAmount] = useState(0);

  const spin = () => {
    if (userCoins < bet || spinning) return;
    
    setSpinning(true);
    setWinAmount(0);
    onUpdateCoins(userCoins - bet); // Deduct bet immediately

    // Animation Duration
    setTimeout(() => {
        // Simple logic:
        // winRate% chance to win something.
        const isWin = Math.random() * 100 < winRate;
        let finalReels: SlotItem[] = [];

        if (isWin) {
            // Pick a random item to be the winner
            const item = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
            finalReels = [item, item, item];
            const payout = bet * item.multiplier;
            setWinAmount(payout);
            onUpdateCoins((userCoins - bet) + payout);
        } else {
            // Force lose
            const r1 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
            const r2 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
            let r3 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
            
            // Ensure they don't accidentally match all 3
            while(r1.id === r2.id && r2.id === r3.id) {
                 r3 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
            }
            finalReels = [r1, r2, r3];
        }

        setReels(finalReels);
        setSpinning(false);

    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-[400px] bg-gradient-to-b from-purple-900 to-[#1a0b2e] rounded-[30px] border-[4px] border-pink-500 shadow-[0_0_60px_rgba(236,72,153,0.5)] overflow-hidden flex flex-col p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <X size={24} />
        </button>

        <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-sm">
                SLOTS MACHINE
            </h2>
            <p className="text-xs text-pink-200/70">طابق 3 رموز للفوز!</p>
        </div>

        {/* Reels Container */}
        <div className="bg-black/40 p-4 rounded-2xl border-2 border-pink-500/30 flex justify-between gap-2 mb-6 shadow-inner relative overflow-hidden">
             {/* Payline */}
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/50 z-10 pointer-events-none"></div>

             {[0, 1, 2].map((i) => (
                 <div key={i} className="flex-1 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-5xl overflow-hidden relative">
                     {spinning ? (
                         <div className="animate-[spin_0.2s_linear_infinite] blur-sm opacity-50">
                             {reels[i].icon}
                         </div>
                     ) : (
                         <motion.div 
                            key={reels[i].id} 
                            initial={{ y: -50, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }}
                            className="drop-shadow-md"
                        >
                             {reels[i].icon}
                         </motion.div>
                     )}
                 </div>
             ))}
        </div>

        {/* Win Display */}
        <div className="h-12 mb-4 flex items-center justify-center">
            {winAmount > 0 ? (
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1.2 }}
                    className="text-yellow-400 font-black text-2xl flex items-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]"
                >
                    <Trophy className="text-yellow-500" /> فوز! +{winAmount}
                </motion.div>
            ) : (
                <div className="text-slate-500 text-sm">حظاً أوفر...</div>
            )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
             <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl">
                 <span className="text-slate-300 text-sm font-bold">مبلغ الرهان:</span>
                 <div className="flex gap-2">
                     {CHIPS.map(c => (
                         <button 
                            key={c}
                            onClick={() => setBet(c)}
                            disabled={spinning}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                bet === c 
                                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40' 
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                         >
                             {c}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="flex justify-between items-center px-2">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">رصيدك</span>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold">
                        {userCoins.toLocaleString()} <Coins size={14} />
                    </div>
                 </div>
                 
                 <button 
                    onClick={spin}
                    disabled={spinning || userCoins < bet}
                    className={`px-8 py-3 rounded-2xl font-black text-lg flex items-center gap-2 transition-all ${
                        spinning || userCoins < bet 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-b from-green-400 to-green-600 text-white shadow-lg shadow-green-900/50 hover:scale-105 active:scale-95'
                    }`}
                 >
                    {spinning ? <RefreshCw className="animate-spin" /> : 'SPIN'}
                 </button>
             </div>
        </div>

      </motion.div>
    </div>
  );
};

export default SlotsGameModal;