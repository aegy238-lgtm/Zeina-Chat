
import React, { useState, useEffect, useRef } from 'react';
import { Room, User, ChatMessage, Gift, UserLevel, GameSettings } from '../types';
import { CURRENT_USER } from '../constants';
import { Mic, MicOff, Gift as GiftIcon, X, Send, Heart, Crown, Shield, Lock, Check, LayoutGrid, Gamepad2, Settings, ChevronDown, Clover, Repeat, Gem, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import { generateSimulatedChat, generateSystemAnnouncement } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileSheet from './UserProfileSheet';
import Toast, { ToastMessage } from './Toast';
import WheelGameModal from './WheelGameModal';
import SlotsGameModal from './SlotsGameModal';
import GameCenterModal from './GameCenterModal';
import RoomSettingsModal from './RoomSettingsModal';
import WinStrip from './WinStrip';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, updateDoc, doc, increment, getDoc } from 'firebase/firestore';

interface VoiceRoomProps {
  room: Room;
  onLeave: () => void;
  onMinimize: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  gifts: Gift[];
  onEditProfile: () => void;
  gameSettings: GameSettings;
  onUpdateRoom: (roomId: string, data: Partial<Room>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface ComboState {
  gift: Gift;
  recipientId: string | null;
  quantity: number;
  timer: number;
  active: boolean;
}

const GIFT_MULTIPLIERS = [1, 10, 20, 50, 99];

const VoiceRoom: React.FC<VoiceRoomProps> = ({ 
  room, onLeave, onMinimize, currentUser, onUpdateUser, gifts, onEditProfile, gameSettings, onUpdateRoom, isMuted, onToggleMute 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  // Local state for visual seats mapping. 
  const [seats, setSeats] = useState<(User | null)[]>(new Array(8).fill(null));

  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  
  // Game States
  const [showGameCenter, setShowGameCenter] = useState(false);
  const [activeGame, setActiveGame] = useState<'wheel' | 'slots' | null>(null);

  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState(false);

  const [activeGiftEffect, setActiveGiftEffect] = useState<Gift | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string | null>(null);
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState(1);
  
  const [luckyWinAmount, setLuckyWinAmount] = useState<number>(0);
  const luckyWinTimeoutRef = useRef<any>(null);

  const [comboState, setComboState] = useState<ComboState>({
     gift: gifts[0],
     recipientId: null,
     quantity: 1,
     timer: 0,
     active: false
  });

  const [entranceBanner, setEntranceBanner] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- FIREBASE SYNC: Seats Logic with seatIndex ---
  useEffect(() => {
     // Ensure seats array reflects the latest room.speakers data
     const newSeats = new Array(8).fill(null);
     
     if (room.speakers && Array.isArray(room.speakers)) {
        room.speakers.forEach((speaker) => {
           const pos = (speaker.seatIndex !== undefined && speaker.seatIndex !== null) ? speaker.seatIndex : -1;
           if (pos >= 0 && pos < 8) newSeats[pos] = speaker;
        });
     }
     
     setSeats(newSeats);
  }, [room.speakers]);


  // --- FIREBASE CHAT SYNC ---
  useEffect(() => {
    if (!room.id) return;
    
    const messagesRef = collection(db, "rooms", room.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as ChatMessage;
        });
        
        setMessages(prev => fetchedMessages);
    });

    return () => unsubscribe();
  }, [room.id]);


  // Update mute state in Firestore when isMuted prop changes
  useEffect(() => {
     const isSpeaker = room.speakers.find(s => s.id === currentUser.id);
     
     if (isSpeaker && isSpeaker.isMuted !== isMuted) {
        const updatedSpeakers = room.speakers.map(s => {
           if (s.id === currentUser.id) return { ...s, isMuted: isMuted };
           return s;
        });
        
        updateDoc(doc(db, "rooms", room.id), { speakers: updatedSpeakers }).catch(console.error);
     }
  }, [isMuted]); 

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
    };
    announceEntrance();
  }, []);

  // Combo Timer Countdown
  useEffect(() => {
     let interval: ReturnType<typeof setInterval>;
     if (comboState.active && comboState.timer > 0) {
        interval = setInterval(() => {
           setComboState(prev => {
              if (prev.timer <= 0.1) {
                 return { ...prev, active: false, timer: 0 };
              }
              return { ...prev, timer: prev.timer - 0.1 };
           });
        }, 100);
     } else if (comboState.timer <= 0) {
        setComboState(prev => ({...prev, active: false}));
     }
     return () => clearInterval(interval);
  }, [comboState.active, comboState.timer]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
     }, 3000);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const newMessage = {
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      userNameStyle: currentUser.nameStyle || '', 
      content: inputValue,
      type: 'text',
      bubbleUrl: currentUser.activeBubble || '',
      timestamp: serverTimestamp()
    };
    
    try {
        await addDoc(collection(db, "rooms", room.id, "messages"), newMessage);
        setInputValue('');
    } catch (e) {
        console.error("Error sending message", e);
    }
  };

  const handleSendGift = async (gift: Gift, quantity: number = 1, recipientId: string | null = null) => {
    const totalCost = gift.cost * quantity;

    if (currentUser.coins < totalCost) {
      addToast('عذراً، رصيدك لا يكفي لإرسال هذه الهدية! 🪙', 'error');
      setComboState(prev => ({ ...prev, active: false }));
      return;
    }

    const finalRecipientId = recipientId || giftRecipientId;
    
    let recipientName = 'الجميع';
    if (finalRecipientId) {
       const targetUser = room.speakers.find(s => s.id === finalRecipientId);
       if (targetUser) recipientName = targetUser.name;
    }

    setShowGiftModal(false);

    setComboState({
       gift: gift,
       recipientId: finalRecipientId,
       quantity: quantity,
       timer: 3, 
       active: true
    });

    setActiveGiftEffect(gift);
    setTimeout(() => setActiveGiftEffect(null), 3000);

    let refundAmount = 0;
    let isLuckyWin = false;

    if (gift.isLucky) {
       const chance = Math.random() * 100;
       if (chance < gameSettings.luckyGiftWinRate) {
           isLuckyWin = true;
           refundAmount = Math.floor(totalCost * (gameSettings.luckyGiftRefundPercent / 100));
           
           if (luckyWinTimeoutRef.current) clearTimeout(luckyWinTimeoutRef.current);
           setLuckyWinAmount(refundAmount);
           luckyWinTimeoutRef.current = setTimeout(() => setLuckyWinAmount(0), 4000);
       }
    }

    try {
        await updateDoc(doc(db, "users", currentUser.id), {
            coins: increment(refundAmount - totalCost),
            wealth: increment(totalCost)
        });

        if (finalRecipientId) {
           updateDoc(doc(db, "users", finalRecipientId), {
               charm: increment(totalCost)
           }).catch(console.error);
        }

        const roomRef = doc(db, "rooms", room.id);
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
            const currentSpeakers = roomSnap.data().speakers as User[];
            const updatedSpeakers = currentSpeakers.map(s => {
                const speakerCopy = { ...s };
                if (s.id === currentUser.id) {
                    speakerCopy.wealth = (speakerCopy.wealth || 0) + totalCost;
                    if (finalRecipientId === currentUser.id) {
                        speakerCopy.charm = (speakerCopy.charm || 0) + totalCost;
                    }
                }
                if (finalRecipientId && s.id === finalRecipientId && s.id !== currentUser.id) {
                    speakerCopy.charm = (speakerCopy.charm || 0) + totalCost;
                }
                return speakerCopy;
            });
            await updateDoc(roomRef, { speakers: updatedSpeakers });
        }

        const content = quantity > 1 
          ? `أرسل ${gift.name} x${quantity} إلى ${recipientName}` 
          : `أرسل ${gift.name} إلى ${recipientName}`;

        const giftMessage = {
          userId: currentUser.id,
          userName: currentUser.name,
          userLevel: currentUser.level,
          userNameStyle: currentUser.nameStyle || '',
          content: content,
          type: 'gift',
          giftData: gift,
          isLuckyWin: isLuckyWin,
          winAmount: refundAmount,
          timestamp: serverTimestamp()
        };
        
        await addDoc(collection(db, "rooms", room.id, "messages"), giftMessage);

    } catch(e) { console.error("Gift Transaction Failed", e); }
  };

  const handleComboClick = () => {
     if (comboState.active) {
        setComboState(prev => ({ ...prev, timer: 3 }));
        handleSendGift(comboState.gift, comboState.quantity, comboState.recipientId);
     }
  };

  const handleSeatClick = async (index: number) => {
    const userAtSeat = seats[index];
    const amISitting = room.speakers.some(s => s.id === currentUser.id);

    if (userAtSeat) {
      setSelectedUser(userAtSeat);
    } else {
      if (amISitting) {
          const oldIndex = room.speakers.find(s => s.id === currentUser.id)?.seatIndex;
          if (oldIndex === index) return;

          const updatedSpeakers = room.speakers.map(s => {
              if (s.id === currentUser.id) return { ...s, seatIndex: index };
              return s;
          });
          await updateDoc(doc(db, "rooms", room.id), { speakers: updatedSpeakers });
          addToast("تم تغيير المقعد", "success");
      } else {
          const userRef = doc(db, "users", currentUser.id);
          const userSnap = await getDoc(userRef);
          const freshUserData = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : currentUser;
          const newSpeakerData = { ...freshUserData, isMuted: false, seatIndex: index };
          await updateDoc(doc(db, "rooms", room.id), { speakers: [...room.speakers, newSpeakerData] });
      }
    }
  };
  
  const handleResetCounters = async () => {
      const amISitting = room.speakers.some(s => s.id === currentUser.id);
      if (!amISitting) {
          addToast("يجب أن تكون على المايك لتصفير العداد", "error");
          return;
      }

      if (confirm("هل أنت متأكد من تصفير عداد الكاريزما (تحت المايك)؟")) {
          try {
              const updatedSpeakers = room.speakers.map(s => {
                  if (s.id === currentUser.id) {
                      return { ...s, wealth: 0, charm: 0 };
                  }
                  return s;
              });
              await updateDoc(doc(db, "rooms", room.id), { speakers: updatedSpeakers });
              addToast("تم تصفير الكاريزما بنجاح", "success");
              setShowMenuModal(false);
          } catch(e) {
              console.error(e);
              addToast("حدث خطأ أثناء التصفير", "error");
          }
      }
  };

  const handleProfileAction = async (action: string, payload?: any) => {
    if (!selectedUser) return;
    if (action === 'gift') {
       setGiftRecipientId(selectedUser.id);
       setShowGiftModal(true);
       setSelectedUser(null);
    } else if (action === 'toggleFollow') {
       addToast("تمت المتابعة", 'success');
    } else if (action === 'toggleMute') {
       const updatedSpeakers = room.speakers.map(s => {
           if (s.id === selectedUser.id) return { ...s, isMuted: !s.isMuted };
           return s;
       });
       await updateDoc(doc(db, "rooms", room.id), { speakers: updatedSpeakers });
    } else if (action === 'copyId') {
       addToast("تم نسخ المعرف بنجاح", 'success');
    } else if (action === 'editProfile') {
       setSelectedUser(null); 
       onEditProfile(); 
    }
  };

  const handleSafeLeave = () => {
      if (room.hostId === currentUser.id) {
          if (confirm("⚠️ تحذير: بصفتك المضيف، الخروج سيؤدي إلى إغلاق الغرفة نهائياً.\n\nهل أنت متأكد من الخروج؟")) {
              onLeave();
          }
      } else {
          if (confirm("هل تريد مغادرة الغرفة؟")) {
              onLeave();
          }
      }
  };

  const handleUpdateCoins = (newCoins: number) => {
      updateDoc(doc(db, "users", currentUser.id), { coins: newCoins }).catch(console.error);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col" style={{ background: room.background }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <AnimatePresence>
         {luckyWinAmount > 0 && (
            <WinStrip amount={luckyWinAmount} />
         )}
      </AnimatePresence>

      <div className="flex justify-between items-center p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent">
         <div className="flex items-center gap-2">
            <button 
               onClick={handleSafeLeave}
               className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400 backdrop-blur-md transition-colors"
            >
               <X size={18} />
            </button>
            <button 
               onClick={onMinimize} 
               className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors"
            >
               <ChevronDown size={20} />
            </button>
            <div className="text-white mr-1">
               <h2 className="font-bold text-sm drop-shadow-md">{room.title}</h2>
               <p className="text-[10px] text-white/80">ID: {room.id}</p>
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

      <div className="flex-1 px-4 overflow-y-auto mt-2">
         <div className="grid grid-cols-4 gap-x-2 gap-y-12">
            {seats.map((speaker, index) => (
               <div key={index} className="flex flex-col items-center gap-1 relative">
                  <button 
                    onClick={() => handleSeatClick(index)}
                    className="relative w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all active:scale-95"
                  >
                     {speaker ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                           <div className={`w-[86%] h-[86%] rounded-full overflow-hidden ${
                             !speaker.frame ? (speaker.id === 'u1' ? 'p-[2px] bg-gradient-to-tr from-amber-400 to-yellow-200' : 'p-[2px] bg-gradient-to-tr from-blue-400 to-cyan-200') : ''
                           }`}>
                             <img 
                                src={speaker.avatar} 
                                alt={speaker.name} 
                                className={`w-full h-full rounded-full object-cover ${speaker.isMuted ? 'grayscale' : ''}`}
                             />
                           </div>
                           {speaker.frame && (
                              <img 
                                src={speaker.frame} 
                                alt="Frame" 
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 scale-[1.15]"
                              />
                           )}
                           {speaker.isVip && !speaker.frame && (
                              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-slate-900 z-10">
                                 <Crown size={10} className="text-white" fill="white" />
                              </div>
                           )}
                           {speaker.isMuted && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                                 <MicOff size={16} className="text-white" />
                              </div>
                           )}
                           <div className="absolute -bottom-5 w-full flex justify-center z-30">
                             <span className={`text-[9px] bg-black/40 backdrop-blur-sm px-2 rounded-full truncate max-w-[120%] border border-white/5 ${speaker.nameStyle ? speaker.nameStyle : 'text-white'}`}>
                               {speaker.name}
                             </span>
                           </div>
                           
                           {/* --- ACTIVATED CHARISMA BADGE --- */}
                           <motion.div 
                              key={speaker.charm}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 0.75 }}
                              className="absolute -bottom-9 flex items-center justify-center gap-1 bg-black/70 px-2 py-0.5 rounded-full backdrop-blur-md border border-pink-500/40 shadow-lg z-20"
                           >
                              <Heart size={10} className="text-pink-500 animate-pulse" fill="currentColor" />
                              <span className="text-[10px] text-white font-black font-mono">{(speaker.charm || 0).toLocaleString()}</span>
                           </motion.div>
                        </div>
                     ) : (
                        <div className="relative w-full h-full flex items-center justify-center rounded-full bg-slate-800/40 border-2 border-dashed border-slate-600 hover:border-amber-500/50 hover:bg-slate-800 transition-all">
                           <Mic size={18} className="text-slate-500" />
                           <div className="absolute bottom-2 text-[8px] text-slate-500 font-mono opacity-50">{index + 1}</div>
                        </div>
                     )}
                  </button>
               </div>
            ))}
         </div>
      </div>

      <div className="h-[35%] bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent px-4 pb-4 pt-10 flex flex-col justify-end relative">
         <div className="overflow-y-auto mb-4 space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg) => (
               <div key={msg.id} className={`flex flex-col items-start ${msg.type === 'system' ? 'items-center w-full my-2' : ''}`}>
                  {msg.type === 'system' ? (
                     <div className="bg-white/10 backdrop-blur-md border border-white/10 text-xs px-3 py-1 rounded-full text-amber-200">
                        {msg.content}
                     </div>
                  ) : msg.type === 'gift' ? (
                     <div className={`rounded-full p-1 pr-3 pl-1 flex items-center gap-2 self-start border ${
                        msg.isLuckyWin ? 'bg-gradient-to-r from-green-900/90 to-emerald-800/90 border-green-500' : 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 border-purple-500/30'
                     }`}>
                        <span className={`text-xs font-bold ${msg.userNameStyle ? msg.userNameStyle : 'text-amber-400'}`}>{msg.userName}:</span>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-white opacity-90">{msg.content.replace(`${msg.userName}:`, '')}</span>
                            {msg.isLuckyWin && <span className="text-[9px] text-green-400 font-bold">ربح {msg.winAmount} كوينز! 🍀</span>}
                        </div>
                        <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm overflow-hidden relative">
                           {msg.giftData?.icon.startsWith('http') ? <img src={msg.giftData.icon} className="w-full h-full object-cover" /> : msg.giftData?.icon}
                        </div>
                     </div>
                  ) : (
                     <div className="flex items-start gap-2 max-w-[90%]">
                        <div className={`mt-1 h-5 px-1.5 rounded flex items-center justify-center text-[9px] font-bold ${
                           msg.userLevel === UserLevel.VIP ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black' : 'bg-slate-700 text-slate-300'
                        }`}>
                           {msg.userLevel}
                        </div>
                        <div className="flex flex-col items-start">
                           <span className={`text-[10px] font-medium px-1 mb-0.5 ${msg.userNameStyle ? msg.userNameStyle : 'text-slate-400'}`}>{msg.userName}</span>
                           <div className="rounded-2xl rounded-tr-none px-3 py-2 text-sm text-white shadow-sm bg-white/10 backdrop-blur-sm border border-white/5" style={msg.bubbleUrl ? { backgroundImage: `url(${msg.bubbleUrl})`, backgroundSize: 'cover' } : {}}>
                              {msg.content}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            ))}
            <div ref={messagesEndRef} />
         </div>

         <div className="flex items-center gap-2">
            <button 
               onClick={() => {
                   if (room.speakers.some(s => s.id === currentUser.id)) onToggleMute();
                   else addToast("اضغط على مقعد فارغ للصعود", "info");
               }}
               className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${
                  isMuted ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 shadow-green-500/50'
               }`}
            >
               {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <div className="flex-1 bg-slate-800/80 backdrop-blur rounded-full h-10 flex items-center px-4 border border-slate-700">
               <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="قل شيئاً..."
                  className="bg-transparent text-white w-full outline-none text-xs"
               />
               <button onClick={handleSendMessage} className="ml-2 text-blue-400"><Send size={16} /></button>
            </div>

             <button onClick={() => setShowMenuModal(true)} className="w-10 h-10 bg-slate-800 rounded-full text-white border border-slate-700 shadow-lg flex items-center justify-center">
               <LayoutGrid size={18} />
            </button>

            <button onClick={() => { setGiftRecipientId(null); setSelectedGiftQuantity(1); setShowGiftModal(true); }} className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white shadow-lg flex items-center justify-center">
               <GiftIcon size={18} />
            </button>
         </div>
      </div>

      <AnimatePresence>
         {comboState.active && (
            <motion.button
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               onClick={handleComboClick}
               className="absolute bottom-28 left-4 z-50 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.6)] border-4 border-white/20 active:scale-95 cursor-pointer"
            >
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="36" className="stroke-white/20 fill-none stroke-[4]" />
                  <circle cx="40" cy="40" r="36" className="stroke-yellow-400 fill-none stroke-[4] transition-all duration-100 ease-linear" strokeDasharray="226" strokeDashoffset={226 - (226 * comboState.timer / 3)} />
               </svg>
               <div className="relative z-10 flex flex-col items-center justify-center -mt-1">
                  <div className="w-8 h-8 flex items-center justify-center mb-0.5">
                      {comboState.gift.icon.startsWith('http') ? <img src={comboState.gift.icon} className="w-full h-full object-contain" alt="gift" /> : <span className="text-2xl leading-none">{comboState.gift.icon}</span>}
                  </div>
                  <div className="flex items-center justify-center leading-none">
                     <span className="text-xl font-black text-white italic">x{comboState.quantity}</span>
                  </div>
               </div>
            </motion.button>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showMenuModal && (
             <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMenuModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
                 <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-[#10141f] rounded-t-[30px] p-6 pb-8 border-t border-white/10 pointer-events-auto" >
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => { setShowMenuModal(false); setShowGameCenter(true); }} className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all" >
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400"><Gamepad2 size={24} /></div>
                            <span className="font-bold text-sm text-white">مركز الألعاب</span>
                        </button>
                        <button onClick={() => { setShowMenuModal(false); setShowRoomSettingsModal(true); }} className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all" >
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400"><Settings size={24} /></div>
                            <span className="font-bold text-sm text-white">إعدادات الغرفة</span>
                        </button>
                        {room.speakers.some(s => s.id === currentUser.id) && (
                           <button onClick={handleResetCounters} className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all col-span-2" >
                              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400"><RotateCcw size={24} /></div>
                              <span className="font-bold text-sm text-white">تصفير العداد (الكاريزما)</span>
                           </button>
                        )}
                    </div>
                 </motion.div>
             </div>
         )}
      </AnimatePresence>

      {/* Actual Modals */}
      <GameCenterModal 
        isOpen={showGameCenter} 
        onClose={() => setShowGameCenter(false)} 
        onSelectGame={(game) => { setActiveGame(game); setShowGameCenter(false); }} 
      />
      
      <WheelGameModal 
        isOpen={activeGame === 'wheel'} 
        onClose={() => setActiveGame(null)} 
        userCoins={currentUser.coins} 
        onUpdateCoins={handleUpdateCoins} 
        winRate={gameSettings.wheelWinRate} 
      />

      <SlotsGameModal 
        isOpen={activeGame === 'slots'} 
        onClose={() => setActiveGame(null)} 
        userCoins={currentUser.coins} 
        onUpdateCoins={handleUpdateCoins} 
        winRate={gameSettings.slotsWinRate} 
      />

      <RoomSettingsModal 
        isOpen={showRoomSettingsModal} 
        onClose={() => setShowRoomSettingsModal(false)} 
        room={room} 
        onUpdate={onUpdateRoom} 
      />

      <AnimatePresence>
         {showGiftModal && (
            <div className="absolute inset-0 z-[60] flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setShowGiftModal(false)}>
               <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full bg-[#10141f] rounded-t-[30px] p-6 pb-8 border-t border-white/10" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-white font-bold text-lg">إرسال هدية</h3>
                     <div className="bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <span className="text-yellow-400 font-bold text-sm">🪙 {currentUser.coins.toLocaleString()}</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-h-[35vh] overflow-y-auto mb-4">
                     {gifts.map(gift => (
                        <button key={gift.id} onClick={() => handleSendGift(gift, selectedGiftQuantity)} className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-700 border border-transparent hover:border-amber-500/50 transition-all">
                           <div className="w-12 h-12 mb-2 flex items-center justify-center">
                              {gift.icon.startsWith('http') ? <img src={gift.icon} className="w-full h-full object-contain" alt={gift.name} /> : <span className="text-4xl">{gift.icon}</span>}
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
