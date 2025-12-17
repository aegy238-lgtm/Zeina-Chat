
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WinStripProps {
  amount: number;
}

const WinStrip: React.FC<WinStripProps> = ({ amount }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Effect for Initialization and Cleanup (Unmount)
  useEffect(() => {
    // Create Audio object once
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    audio.volume = 0.5;
    audio.loop = true; // Loop sound continuously
    audioRef.current = audio;

    // Cleanup: Stop audio only when the COMPONENT unmounts (strip disappears)
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Effect for triggering Play based on amount updates
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && amount >= 5000) {
      // If valid amount and not playing, start playing.
      // If already playing (from previous combo hit), this does nothing, 
      // ensuring the sound continues smoothly without resetting.
      if (audio.paused) {
         audio.play().catch(err => console.error("Audio play failed", err));
      }
    }
  }, [amount]);

  return (
    <motion.div 
      initial={{ y: -100, x: "-50%", opacity: 0, scale: 0.5 }}
      animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
      exit={{ y: -50, x: "-50%", opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute top-24 left-1/2 z-[100] flex items-center justify-center pointer-events-none"
    >
      <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-8 py-2 rounded-full border-2 border-white/60 shadow-[0_4px_20px_rgba(251,191,36,0.6)] flex items-center gap-3 min-w-max">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay rounded-full"></div>
         
         <motion.span 
           animate={{ rotate: [0, 10, -10, 0] }} 
           transition={{ repeat: Infinity, duration: 0.5 }}
           className="text-2xl"
         >
           ✨
         </motion.span>
         
         <div className="flex flex-col items-center leading-none z-10">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-0.5">Big Win</span>
            <span className="font-black text-2xl text-red-600 drop-shadow-sm font-mono tracking-tighter">
               +{amount.toLocaleString()} 🪙
            </span>
         </div>

         <motion.span 
           animate={{ rotate: [0, -10, 10, 0] }} 
           transition={{ repeat: Infinity, duration: 0.5 }}
           className="text-2xl"
         >
           ✨
         </motion.span>
      </div>
      
      {/* Glow Effect Behind */}
      <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-40 -z-10 rounded-full animate-pulse"></div>
    </motion.div>
  );
};

export default WinStrip;
