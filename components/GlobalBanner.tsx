
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Crown } from 'lucide-react';
import { GlobalAnnouncement } from '../types';

interface GlobalBannerProps {
  announcement: GlobalAnnouncement;
}

const GlobalBanner: React.FC<GlobalBannerProps> = ({ announcement }) => {
  const renderIcon = (icon: string) => {
    if (!icon) return null;
    const isImage = icon.startsWith('http') || icon.startsWith('data:');
    return isImage ? <img src={icon} className="w-10 h-10 object-contain drop-shadow-md animate-bounce" alt="" /> : <span className="text-3xl animate-bounce">{icon}</span>;
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: '-120%', opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 8, ease: "linear" }}
      className="fixed top-20 right-0 z-[1000] pointer-events-none whitespace-nowrap"
    >
      <div className="relative flex items-center gap-4 bg-gradient-to-r from-amber-500/90 via-yellow-400/95 to-amber-500/90 backdrop-blur-md px-6 py-2 rounded-full border-y-2 border-white/40 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
        {/* Animated Glow Elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay rounded-full"></div>
        
        <div className="flex items-center gap-2">
            <div className="bg-black/20 p-1.5 rounded-full">
                <Crown size={18} className="text-white fill-white" />
            </div>
            <span className="text-black font-black text-sm tracking-tight">إعلان ملكي:</span>
        </div>

        <div className="flex items-center gap-1.5">
            <span className="text-red-700 font-black text-base drop-shadow-sm">{announcement.senderName}</span>
            <span className="text-black/80 font-bold text-xs italic">أهدى</span>
            <div className="bg-white/20 p-1 rounded-lg">
                {renderIcon(announcement.giftIcon)}
            </div>
            <span className="text-purple-800 font-black text-base drop-shadow-sm">{announcement.giftName}</span>
            <span className="text-black/80 font-bold text-xs italic">إلى</span>
            <span className="text-blue-800 font-black text-base drop-shadow-sm">{announcement.recipientName}</span>
        </div>

        <div className="h-4 w-[1px] bg-black/10 mx-2"></div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/10 px-3 py-1 rounded-full border border-black/5">
                <Flame size={14} className="text-orange-600 fill-orange-600" />
                <span className="text-black font-black text-xs">{announcement.roomTitle}</span>
            </div>
            <Sparkles size={16} className="text-white animate-pulse" />
        </div>

        {/* Trail Effect */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-20 h-px bg-gradient-to-l from-transparent to-amber-400/50"></div>
      </div>
    </motion.div>
  );
};

export default GlobalBanner;
