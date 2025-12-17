
import React from 'react';
import { User, UserLevel } from '../types';
import { motion } from 'framer-motion';
import { X, Crown, Heart, UserPlus, UserCheck, Gift, MessageCircle, MoreHorizontal, Shield, Gem, Copy, MicOff, Mic, Sparkles } from 'lucide-react';

interface UserProfileSheetProps {
  user: User;
  onClose: () => void;
  isCurrentUser: boolean;
  onAction: (action: string, payload?: any) => void;
}

const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ user, onClose, isCurrentUser, onAction }) => {
  
  const handleCopyId = () => {
    // Copy the customID if available, else fall back to auth ID
    navigator.clipboard.writeText(user.customId ? user.customId.toString() : user.id); 
    onAction('copyId');
  };

  // Helper to calculate Level based on XP
  // Formula: Level = sqrt(XP / 500)
  const calculateLevelInfo = (xp: number) => {
      const xpPerLevel = 2500; // XP needed for level 1
      // Simple linear-ish progression for demo
      // Level 0: 0-2500
      // Level 1: 2500-5000 etc.
      // Better curve: Level = 1 + floor(xp / 2500)
      const level = 1 + Math.floor(xp / xpPerLevel);
      const currentLevelStart = (level - 1) * xpPerLevel;
      const nextLevelStart = level * xpPerLevel;
      const progress = ((xp - currentLevelStart) / xpPerLevel) * 100;
      return { level, progress, nextLevelStart, current: xp };
  };

  const wealthInfo = calculateLevelInfo(user.wealth || 0);
  const charmInfo = calculateLevelInfo(user.charm || 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      {/* Sheet */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#10141f] rounded-t-[30px] overflow-hidden pointer-events-auto border-t border-white/10 shadow-2xl"
      >
        {/* Cover Image */}
        <div className="h-32 bg-slate-900 relative overflow-hidden">
          {user.cover ? (
             <img src={user.cover} className="w-full h-full object-cover" alt="Cover" />
          ) : (
             <div className="w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600"></div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur rounded-full text-white hover:bg-black/50 transition z-10">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-8 relative">
          {/* Avatar Area */}
          <div className="flex justify-between items-end -mt-10 mb-4">
             <div className="relative">
                <div className={`w-16 h-16 rounded-full bg-[#10141f] relative flex items-center justify-center ${!user.frame ? 'p-1 border-[4px] border-[#10141f] bg-gradient-to-br from-amber-300 to-yellow-600' : ''}`}>
                   <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                   
                   {/* VIP Frame - Exact Fit */}
                   {user.frame && (
                      <img 
                        src={user.frame} 
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xl z-20 scale-[1.3]" 
                        alt="frame" 
                      />
                   )}
                </div>
                {user.isVip && !user.frame && (
                   <div className="absolute bottom-0 right-0 bg-amber-500 text-black p-1 rounded-full border-2 border-[#10141f]">
                      <Crown size={14} fill="black" />
                   </div>
                )}
             </div>
             
             {/* Main Actions (Top Right) */}
             <div className="flex gap-2 mb-2">
                {!isCurrentUser ? (
                  <>
                    <button 
                       onClick={() => onAction('message')}
                       className="p-2.5 bg-slate-800 rounded-full text-slate-300 border border-slate-700 hover:bg-slate-700 active:scale-95 transition"
                    >
                       <MessageCircle size={20} />
                    </button>
                    <button 
                       onClick={() => onAction('toggleFollow')}
                       className={`px-6 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95 ${
                         user.isFollowing 
                           ? 'bg-slate-700 text-slate-300 border border-slate-600'
                           : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-900/30'
                       }`}
                    >
                       {user.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                       {user.isFollowing ? 'تتابع' : 'متابعة'}
                    </button>
                  </>
                ) : (
                   <button 
                      onClick={() => onAction('editProfile')}
                      className="px-6 py-2 bg-slate-800 border border-slate-600 rounded-full text-white font-bold text-sm hover:bg-slate-700 active:scale-95 transition"
                   >
                      تعديل
                   </button>
                )}
             </div>
          </div>

          {/* User Info */}
          <div className="mb-6">
             <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className={`text-2xl ${user.nameStyle ? user.nameStyle : 'font-bold text-white'}`}>{user.name}</h2>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                   user.level === UserLevel.VIP ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black' : 
                   user.level === UserLevel.DIAMOND ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white' :
                   'bg-slate-700 text-slate-300'
                }`}>
                   {user.level}
                </div>
                {user.isAdmin && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">ADMIN</span>}
             </div>
             <div className="flex items-center gap-4 text-slate-400 text-sm mb-3">
                <button onClick={handleCopyId} className="flex items-center gap-1 hover:text-white transition group">
                   ID: 
                   <span className={`font-mono ${user.isSpecialId ? "font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 drop-shadow-sm italic tracking-wider" : "text-slate-200"}`}>
                     {user.customId || user.id}
                   </span>
                   {user.isSpecialId && <Sparkles size={12} className="text-amber-400 animate-pulse" />}
                   <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </button>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>{user.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className="flex items-center gap-1">
                   🇸🇦 السعودية
                </span>
             </div>
             <p className="text-slate-300 text-sm leading-relaxed">
                {user.bio || 'لا يوجد وصف..'}
             </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6 border-b border-slate-800 pb-6">
             {[
               { label: 'متابعين', val: user.stats?.followers || 0 },
               { label: 'يتابع', val: user.stats?.following || 0 },
               { label: 'زوار', val: user.stats?.visitors || 0 },
               { label: 'إعجابات', val: user.stats?.likes || 0 },
             ].map((stat, i) => (
               <div key={i} className="text-center">
                  <div className="text-lg font-bold text-white">{stat.val}</div>
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
               </div>
             ))}
          </div>

          {/* Progress Bars (Wealth/Charm) */}
          <div className="space-y-4 mb-6">
             {/* Wealth (Sending) */}
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-orange-900/30">
                   Lv.{wealthInfo.level}
                </div>
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-amber-400 font-bold flex items-center gap-1"><Gem size={10}/> ثراء (Wealth)</span>
                      <span>{wealthInfo.current.toLocaleString()} / {wealthInfo.nextLevelStart.toLocaleString()}</span>
                   </div>
                   <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" style={{ width: `${wealthInfo.progress}%` }}></div>
                   </div>
                </div>
             </div>

             {/* Charm (Receiving) */}
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-pink-900/30">
                   Lv.{charmInfo.level}
                </div>
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-pink-400 font-bold flex items-center gap-1"><Heart size={10}/> جاذبية (Charm)</span>
                      <span>{charmInfo.current.toLocaleString()} / {charmInfo.nextLevelStart.toLocaleString()}</span>
                   </div>
                   <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${charmInfo.progress}%` }}></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Room Actions Grid */}
          {!isCurrentUser && (
             <div className="grid grid-cols-4 gap-3">
                <button onClick={() => onAction('gift')} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition border border-slate-700 active:scale-95">
                      <Gift className="text-pink-500" size={24} />
                   </div>
                   <span className="text-[10px] text-slate-400">إهداء</span>
                </button>
                <button onClick={() => onAction('toggleMute')} className="flex flex-col items-center gap-2 group">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition border border-slate-700 active:scale-95 ${
                      user.isMuted ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-800 group-hover:bg-slate-700'
                   }`}>
                      {user.isMuted ? <MicOff className="text-red-500" size={24} /> : <Shield className="text-blue-500" size={24} />}
                   </div>
                   <span className={`text-[10px] ${user.isMuted ? 'text-red-400' : 'text-slate-400'}`}>
                      {user.isMuted ? 'إلغاء الكتم' : 'إشراف'}
                   </span>
                </button>
                <button onClick={() => onAction('support')} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition border border-slate-700 active:scale-95">
                      <Gem className="text-purple-500" size={24} />
                   </div>
                   <span className="text-[10px] text-slate-400">دعم</span>
                </button>
                <button onClick={() => onAction('more')} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition border border-slate-700 active:scale-95">
                      <MoreHorizontal className="text-slate-400" size={24} />
                   </div>
                   <span className="text-[10px] text-slate-400">المزيد</span>
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfileSheet;
