import React from 'react';
import { User, UserLevel } from '../types';
import { motion } from 'framer-motion';
import { X, Crown, Heart, UserPlus, UserCheck, Gift, MessageCircle, MoreHorizontal, Shield, Gem, Copy, MicOff, Mic } from 'lucide-react';

interface UserProfileSheetProps {
  user: User;
  onClose: () => void;
  isCurrentUser: boolean;
  onAction: (action: string, payload?: any) => void;
}

const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ user, onClose, isCurrentUser, onAction }) => {
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id === 'me' ? '829102' : user.id); // Mock ID logic
    onAction('copyId');
  };

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
                <div className={`w-20 h-20 rounded-full bg-[#10141f] relative ${!user.frame ? 'p-1 border-[4px] border-[#10141f] bg-gradient-to-br from-amber-300 to-yellow-600' : ''}`}>
                   <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                   
                   {/* VIP Frame */}
                   {user.frame && (
                      <img 
                        src={user.frame} 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[135%] h-[135%] object-contain pointer-events-none drop-shadow-xl z-20" 
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
             <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                   user.level === UserLevel.VIP ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black' : 
                   user.level === UserLevel.DIAMOND ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white' :
                   'bg-slate-700 text-slate-300'
                }`}>
                   {user.level}
                </div>
             </div>
             <div className="flex items-center gap-4 text-slate-400 text-sm mb-3">
                <button onClick={handleCopyId} className="flex items-center gap-1 hover:text-white transition group">
                   ID: <span className="font-mono text-slate-200">{user.id === 'me' ? '829102' : '102934'}</span>
                   <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="space-y-3 mb-6">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                   Lv.12
                </div>
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-amber-400 font-bold">ثراء</span>
                      <span>12.5k / 50k</span>
                   </div>
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[25%] bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                   </div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                   Lv.8
                </div>
                <div className="flex-1">
                   <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="text-pink-400 font-bold">جاذبية</span>
                      <span>4.2k / 10k</span>
                   </div>
                   <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[42%] bg-gradient-to-r from-purple-400 to-pink-500"></div>
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