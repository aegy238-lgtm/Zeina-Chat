import React, { useState, useEffect, useRef } from 'react';
import { Room, User, ChatMessage, Gift, UserLevel } from '../types';
import { CURRENT_USER } from '../constants';
import { Mic, MicOff, Gift as GiftIcon, X, Send, Heart, Crown, Shield, Lock, Check } from 'lucide-react';
import { generateSimulatedChat, generateSystemAnnouncement } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileSheet from './UserProfileSheet';
import Toast, { ToastMessage } from './Toast';

interface VoiceRoomProps {
  room: Room;
  onLeave: () => void;
  currentUser: User;
  gifts: Gift[];
  onEditProfile: () => void;
}

const VoiceRoom: React.FC<VoiceRoomProps> = ({ room, onLeave, currentUser, gifts, onEditProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  // Initialize 8 fixed seats. Fill starting ones with room.speakers
  const [seats, setSeats] = useState<(User | null)[]>(() => {
    const initialSeats = new Array(8).fill(null);
    room.speakers.forEach((speaker, idx) => {
      if (idx < 8) initialSeats[idx] = speaker;
    });
    return initialSeats;
  });
  
  const [isMuted, setIsMuted] = useState(true);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [activeGiftEffect, setActiveGiftEffect] = useState<Gift | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string | null>(null); // null means 'All'
  
  const [entranceBanner, setEntranceBanner] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // For Profile Sheet
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync seat user data with current user updates (like VIP purchase)
  useEffect(() => {
     setSeats(prev => prev.map(s => s?.id === currentUser.id ? currentUser : s));
  }, [currentUser]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Entrance Effect
  useEffect(() => {
    const announceEntrance = async () => {
       const text = await generateSystemAnnouncement('دخل الغرفة', currentUser.name);
       setEntranceBanner(text);
       setTimeout(() => setEntranceBanner(null), 4000);
       
       setMessages(prev => [...prev, {
         id: Date.now().toString(),
         userId: 'sys',
         userName: 'النظام',
         userLevel: UserLevel.NEW,
         content: text,
         type: 'system'
       }]);
    };
    announceEntrance();
  }, []);

  // Simulating live chat
  useEffect(() => {
    const interval = setInterval(async () => {
      const simulatedText = await generateSimulatedChat(room.title, messages.slice(-5).map(m => m.content));
      // Pick a random speaker from seats
      const activeSpeakers = seats.filter(s => s !== null) as User[];
      if (activeSpeakers.length === 0) return;

      const randomSpeaker = activeSpeakers[Math.floor(Math.random() * activeSpeakers.length)];
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: randomSpeaker.id,
        userName: randomSpeaker.name,
        userLevel: randomSpeaker.level,
        content: simulatedText,
        type: 'text'
      }]);
    }, 8000); 

    return () => clearInterval(interval);
  }, [messages, seats, room.title]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
     }, 3000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setMessages([...messages, {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      content: inputValue,
      type: 'text',
      bubbleUrl: currentUser.activeBubble // Attach current user bubble
    }]);
    setInputValue('');
  };

  const handleSendGift = (gift: Gift) => {
    setShowGiftModal(false);
    
    // Determine recipient name
    let recipientName = 'الجميع';
    if (giftRecipientId) {
       const targetUser = seats.find(s => s?.id === giftRecipientId);
       if (targetUser) recipientName = targetUser.name;
    }

    // Trigger visual effect
    setActiveGiftEffect(gift);
    setTimeout(() => setActiveGiftEffect(null), 3000);

    setMessages([...messages, {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      content: `أرسل ${gift.name} إلى ${recipientName}`,
      type: 'gift',
      giftData: gift
    }]);
    addToast(`تم إرسال ${gift.name} إلى ${recipientName}`, 'success');
  };

  const handleSeatClick = (index: number) => {
    const userAtSeat = seats[index];
    const myCurrentSeatIndex = seats.findIndex(s => s?.id === currentUser.id);

    if (userAtSeat) {
      // Open Profile
      setSelectedUser(userAtSeat);
    } else {
      // Empty Seat Logic
      const newSeats = [...seats];
      
      if (myCurrentSeatIndex !== -1) {
        // Move seat
        newSeats[myCurrentSeatIndex] = null;
        newSeats[index] = currentUser;
        addToast("تم تغيير المقعد", 'success');
      } else {
        // Take seat
        newSeats[index] = currentUser;
        addToast("لقد صعدت إلى المايك", 'success');
        setIsMuted(true);
      }
      setSeats(newSeats);
    }
  };

  const handleProfileAction = (action: string, payload?: any) => {
    if (!selectedUser) return;

    if (action === 'gift') {
       setGiftRecipientId(selectedUser.id);
       setShowGiftModal(true);
       setSelectedUser(null);
    } else if (action === 'toggleFollow') {
       // Toggle follow state in seats
       setSeats(prev => prev.map(u => {
          if (u?.id === selectedUser.id) {
             const newState = !u.isFollowing;
             // Update selected user local state as well to reflect in open modal
             setSelectedUser({...u, isFollowing: newState});
             addToast(newState ? `تمت متابعة ${u.name}` : `تم إلغاء متابعة ${u.name}`, 'success');
             return { ...u, isFollowing: newState };
          }
          return u;
       }));
    } else if (action === 'toggleMute') {
       setSeats(prev => prev.map(u => {
          if (u?.id === selectedUser.id) {
             const newState = !u.isMuted;
             setSelectedUser({...u, isMuted: newState});
             addToast(newState ? `تم كتم ${u.name}` : `تم إلغاء كتم ${u.name}`, newState ? 'error' : 'success');
             return { ...u, isMuted: newState };
          }
          return u;
       }));
    } else if (action === 'copyId') {
       addToast("تم نسخ المعرف بنجاح", 'success');
    } else if (action === 'message') {
       addToast(`تم فتح المحادثة الخاصة مع ${selectedUser.name}`, 'info');
       setSelectedUser(null);
    } else if (action === 'editProfile') {
       setSelectedUser(null); // Close profile sheet first
       onEditProfile(); // Trigger parent handler
    } else if (action === 'support') {
       addToast("تم إرسال الدعم", 'success');
    } else if (action === 'more') {
       addToast("لا توجد خيارات إضافية حالياً", 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col" style={{ background: room.background }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent">
         <div className="flex items-center gap-2">
            <button onClick={onLeave} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md">
               <X className="text-white" size={20} />
            </button>
            <div className="text-white">
               <h2 className="font-bold text-sm drop-shadow-md">{room.title}</h2>
               <p className="text-[10px] text-white/80">ID: {room.id} | <span className="text-green-400">مفتوحة</span></p>
            </div>
         </div>
         <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
            <div className="flex -space-x-2 space-x-reverse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-slate-500 border border-slate-900"></div>
              ))}
            </div>
            <span className="text-xs font-bold text-white">{room.listeners + 1}</span>
         </div>
      </div>

      {/* Entrance Banner */}
      <AnimatePresence>
        {entranceBanner && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute top-24 left-0 right-0 z-20 pointer-events-none"
          >
            <div className="mx-4 bg-gradient-to-r from-amber-500/90 to-purple-600/90 backdrop-blur-md p-2 rounded-xl shadow-xl text-center text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/20">
               <Crown size={16} className="text-yellow-200" />
               {entranceBanner}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Effect Overlay (Shows for ALL gifts now) */}
      <AnimatePresence>
        {activeGiftEffect && (
           <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 1.5, opacity: 0 }}
             className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
           >
              <div className="relative flex flex-col items-center justify-center">
                 {/* Background Effect for Full Screen */}
                 {activeGiftEffect.animationType === 'full-screen' && (
                    <div className="absolute inset-[-500px] bg-gradient-to-r from-purple-500/20 to-amber-500/20 blur-3xl rounded-full animate-pulse"></div>
                 )}
                 
                 {/* Icon - Removed animate-bounce and increased sizes */}
                 {activeGiftEffect.icon.startsWith('http') || activeGiftEffect.icon.startsWith('data:') ? (
                    <img 
                       src={activeGiftEffect.icon} 
                       alt={activeGiftEffect.name} 
                       className={`${activeGiftEffect.animationType === 'full-screen' ? 'w-80 h-80' : 'w-64 h-64'} object-contain drop-shadow-[0_0_25px_rgba(255,255,0,0.5)]`} 
                    />
                 ) : (
                    <div className={`${activeGiftEffect.animationType === 'full-screen' ? 'text-9xl' : 'text-[10rem]'}`}>{activeGiftEffect.icon}</div>
                 )}
                 
                 <h1 className="mt-8 text-5xl font-bold text-amber-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] stroke-black">
                    {activeGiftEffect.name}
                 </h1>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Speakers Grid - 8 Seats */}
      <div className="flex-1 px-4 overflow-y-auto mt-2">
         <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {seats.map((speaker, index) => (
               <div key={index} className="flex flex-col items-center gap-1 relative">
                  <button 
                    onClick={() => handleSeatClick(index)}
                    className={`relative w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all active:scale-95
                      ${speaker ? '' : 'bg-black/20 border border-white/10 hover:bg-white/10'}`}
                  >
                     {speaker ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                           {/* Avatar Container */}
                           <div className={`w-full h-full rounded-full overflow-hidden ${
                             !speaker.frame ? (speaker.id === 'u1' ? 'p-[2px] bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-amber-500/50 shadow-lg' : 'p-[2px] bg-gradient-to-tr from-blue-400 to-cyan-200') : ''
                           }`}>
                             <img 
                                src={speaker.avatar} 
                                alt={speaker.name} 
                                className={`w-full h-full rounded-full object-cover ${!speaker.frame ? 'border-2 border-slate-900' : ''} ${speaker.isMuted ? 'grayscale' : ''}`}
                             />
                           </div>

                           {/* VIP Frame Overlay - Adjusted scale and position */}
                           {speaker.frame && (
                              <img 
                                src={speaker.frame} 
                                alt="Frame" 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[135%] h-[135%] object-contain pointer-events-none z-10 drop-shadow-lg"
                              />
                           )}

                           {/* VIP Badge Small (if no frame, or additional) */}
                           {speaker.isVip && !speaker.frame && (
                              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-slate-900 z-10">
                                 <Crown size={10} className="text-white" fill="white" />
                              </div>
                           )}

                           {/* Mute Indicator */}
                           {speaker.isMuted && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                                 <MicOff size={16} className="text-white" />
                              </div>
                           )}
                           
                           {/* Talking Indicator (Only if not muted) */}
                           {!speaker.isMuted && (
                              <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping opacity-0"></div>
                           )}
                           
                           {/* Name Tag */}
                           <div className="absolute -bottom-5 w-full flex justify-center z-30">
                             <span className="text-[9px] text-white bg-black/40 backdrop-blur-sm px-2 rounded-full truncate max-w-[120%] border border-white/5">
                               {speaker.name}
                             </span>
                           </div>
                        </div>
                     ) : (
                        <Mic size={18} className="text-white/30" />
                     )}
                     
                     {/* Seat Number (Optional visual aid) */}
                     {!speaker && (
                       <span className="absolute top-1 right-2 text-[8px] text-white/20 font-mono">{index + 1}</span>
                     )}
                  </button>
               </div>
            ))}
         </div>
      </div>

      {/* Chat Area */}
      <div className="h-[35%] bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent px-4 pb-4 pt-10 flex flex-col justify-end relative">
         {/* Top Fade for chat */}
         <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-slate-900/10 pointer-events-none"></div>

         <div className="overflow-y-auto mb-4 space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg) => (
               <div key={msg.id} className={`flex flex-col items-start ${msg.type === 'system' ? 'items-center w-full my-2' : ''}`}>
                  {msg.type === 'system' ? (
                     <div className="bg-white/10 backdrop-blur-md border border-white/10 text-xs px-3 py-1 rounded-full text-amber-200 shadow-lg">
                        {msg.content}
                     </div>
                  ) : msg.type === 'gift' ? (
                     <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 border border-purple-500/30 rounded-full p-1 pr-3 pl-1 flex items-center gap-2 self-start animate-pulse">
                        <span className="text-xs font-bold text-amber-400">{msg.userName}:</span>
                        <span className="text-xs text-white opacity-90">{msg.content.replace(`${msg.userName}:`, '')}</span>
                        <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm overflow-hidden">
                           {msg.giftData?.icon.startsWith('http') || msg.giftData?.icon.startsWith('data:') ? 
                              <img src={msg.giftData.icon} className="w-full h-full object-cover" /> : 
                              msg.giftData?.icon
                           }
                        </div>
                     </div>
                  ) : (
                     <div className="flex items-start gap-2 max-w-[90%]">
                        <div className={`mt-1 h-5 px-1.5 rounded flex items-center justify-center text-[9px] font-bold tracking-wider ${
                           msg.userLevel === UserLevel.VIP ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-900/50' : 
                           'bg-slate-700 text-slate-300 border border-slate-600'
                        }`}>
                           {msg.userLevel}
                        </div>
                        <div className="flex flex-col items-start">
                           <span className="text-[10px] text-slate-400 font-medium px-1 mb-0.5">{msg.userName}</span>
                           <div 
                              className={`rounded-2xl rounded-tr-none px-3 py-2 text-sm text-white shadow-sm transition-colors ${!msg.bubbleUrl ? 'bg-white/10 backdrop-blur-sm border border-white/5 hover:bg-white/15' : ''}`}
                              style={msg.bubbleUrl ? { 
                                 backgroundImage: `url(${msg.bubbleUrl})`, 
                                 backgroundSize: 'cover',
                                 backgroundPosition: 'center',
                                 color: 'white',
                                 textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)', // Stronger shadow for readability on any bubble
                                 fontWeight: '600'
                              } : {}}
                           >
                              {msg.content}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            ))}
            <div ref={messagesEndRef} />
         </div>

         {/* Controls Bar */}
         <div className="flex items-center gap-3">
            <button 
               onClick={() => {
                   setIsMuted(!isMuted);
                   const mySeatIdx = seats.findIndex(s => s?.id === currentUser.id);
                   if (mySeatIdx !== -1) {
                        setSeats(prev => prev.map((s, i) => i === mySeatIdx ? { ...s!, isMuted: !isMuted } : s));
                   }
                   addToast(!isMuted ? 'تم كتم الصوت' : 'تم تفعيل الصوت', !isMuted ? 'error' : 'success');
               }}
               className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  isMuted ? 'bg-slate-800 text-white border border-slate-700' : 'bg-green-500 text-white shadow-green-900/50'
               }`}
            >
               {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <div className="flex-1 bg-slate-800/80 backdrop-blur rounded-full h-11 flex items-center px-4 border border-slate-700 focus-within:border-slate-500 transition-colors">
               <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="قل شيئاً..."
                  className="bg-transparent text-white w-full outline-none text-sm placeholder:text-slate-500"
               />
               <button onClick={handleSendMessage} className="ml-2 text-blue-400 hover:text-blue-300">
                  <Send size={18} />
               </button>
            </div>

            <button 
               onClick={() => {
                  setGiftRecipientId(null); // Reset to 'All' default or nothing
                  setShowGiftModal(true);
               }}
               className="w-11 h-11 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white shadow-lg shadow-purple-900/50 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
            >
               <GiftIcon size={20} />
            </button>
         </div>
      </div>

      {/* Gift Modal */}
      <AnimatePresence>
         {showGiftModal && (
            <div className="absolute inset-0 z-[60] flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setShowGiftModal(false)}>
               <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="w-full bg-[#10141f] rounded-t-[30px] p-6 pb-8 border-t border-white/10"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Gift Header & Wallet */}
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-white font-bold text-lg">إرسال هدية</h3>
                     <div className="bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <span className="text-yellow-400 font-bold text-sm">🪙 {currentUser.coins}</span>
                        <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-black font-bold">+</div>
                     </div>
                  </div>

                  {/* Recipient Selector (Persons on Mic) */}
                  <div className="mb-4">
                     <p className="text-[10px] text-slate-400 mb-2">إرسال إلى:</p>
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Option: All */}
                        <div 
                           onClick={() => setGiftRecipientId(null)}
                           className={`flex flex-col items-center gap-1 cursor-pointer min-w-[50px] ${!giftRecipientId ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${!giftRecipientId ? 'bg-amber-500 border-amber-300 shadow-lg shadow-amber-900/50' : 'bg-slate-800 border-slate-600'}`}>
                              <span className="text-xs font-bold text-white">الجميع</span>
                           </div>
                           <span className={`text-[10px] ${!giftRecipientId ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>الغرفة</span>
                        </div>

                        {/* Active Speakers */}
                        {seats.map((seat, idx) => {
                           if (!seat) return null;
                           const isSelected = giftRecipientId === seat.id;
                           return (
                              <div 
                                 key={seat.id}
                                 onClick={() => setGiftRecipientId(seat.id)}
                                 className={`flex flex-col items-center gap-1 cursor-pointer min-w-[50px] ${isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                              >
                                 <div className={`relative w-12 h-12 rounded-full p-[2px] transition-all ${isSelected ? 'border-2 border-pink-500 shadow-lg shadow-pink-900/50' : 'border border-slate-600'}`}>
                                    <img src={seat.avatar} className="w-full h-full rounded-full object-cover" />
                                    {isSelected && (
                                       <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-0.5 border border-black">
                                          <Check size={8} className="text-white" />
                                       </div>
                                    )}
                                 </div>
                                 <span className={`text-[10px] truncate max-w-[60px] ${isSelected ? 'text-pink-400 font-bold' : 'text-slate-400'}`}>{seat.name}</span>
                              </div>
                           )
                        })}
                     </div>
                  </div>
                  
                  {/* Gifts Grid */}
                  <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto">
                     {gifts.map(gift => (
                        <button 
                           key={gift.id}
                           onClick={() => handleSendGift(gift)}
                           className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-700 border border-transparent hover:border-amber-500/50 transition-all group relative overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 to-amber-500/0 group-hover:to-amber-500/10 transition-all"></div>
                           <div className="w-12 h-12 mb-2 flex items-center justify-center filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                              {gift.icon.startsWith('http') || gift.icon.startsWith('data:') ? 
                                 <img src={gift.icon} className="w-full h-full object-contain" alt={gift.name} /> : 
                                 <span className="text-4xl">{gift.icon}</span>
                              }
                           </div>
                           <span className="text-white text-xs font-medium">{gift.name}</span>
                           <span className="text-yellow-400 text-[10px] mt-1 bg-black/30 px-2 py-0.5 rounded-full">{gift.cost}</span>
                        </button>
                     ))}
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* User Profile Sheet */}
      <AnimatePresence>
         {selectedUser && (
            <UserProfileSheet 
               user={selectedUser} 
               isCurrentUser={selectedUser.id === currentUser.id}
               onClose={() => setSelectedUser(null)}
               onAction={handleProfileAction}
            />
         )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRoom;