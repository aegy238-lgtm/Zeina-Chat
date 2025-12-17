
import React, { useState, useEffect, useRef } from 'react';
import { Room, User, ChatMessage, Gift, UserLevel, GameSettings } from '../types';
import { CURRENT_USER } from '../constants';
import { Mic, MicOff, Gift as GiftIcon, X, Send, Heart, Crown, Shield, Lock, Check, LayoutGrid, Gamepad2, Settings, ChevronDown, Clover, Repeat } from 'lucide-react';
import { generateSimulatedChat, generateSystemAnnouncement } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileSheet from './UserProfileSheet';
import Toast, { ToastMessage } from './Toast';
import WheelGameModal from './WheelGameModal';
import SlotsGameModal from './SlotsGameModal';
import GameCenterModal from './GameCenterModal';
import RoomSettingsModal from './RoomSettingsModal';
import WinStrip from './WinStrip';

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
  // Initialize 8 fixed seats. Fill starting ones with room.speakers
  const [seats, setSeats] = useState<(User | null)[]>(() => {
    const initialSeats = new Array(8).fill(null);
    room.speakers.forEach((speaker, idx) => {
      if (idx < 8) initialSeats[idx] = speaker;
    });
    return initialSeats;
  });
  
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false); // New Menu State
  
  // Game States
  const [showGameCenter, setShowGameCenter] = useState(false);
  const [activeGame, setActiveGame] = useState<'wheel' | 'slots' | null>(null);

  const [showRoomSettingsModal, setShowRoomSettingsModal] = useState(false); // Room Settings State

  const [activeGiftEffect, setActiveGiftEffect] = useState<Gift | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string | null>(null); // null means 'All'
  const [selectedGiftQuantity, setSelectedGiftQuantity] = useState(1); // Default x1
  
  // Lucky Gift Win Strip State
  const [luckyWinAmount, setLuckyWinAmount] = useState<number>(0);
  // Ref to hold the timeout ID for hiding the strip
  const luckyWinTimeoutRef = useRef<any>(null);

  // Combo Logic State
  const [comboState, setComboState] = useState<ComboState>({
     gift: gifts[0],
     recipientId: null,
     quantity: 1,
     timer: 0,
     active: false
  });

  const [entranceBanner, setEntranceBanner] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // For Profile Sheet
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync seat user data with current user updates (like VIP purchase)
  useEffect(() => {
     setSeats(prev => prev.map(s => s?.id === currentUser.id ? currentUser : s));
  }, [currentUser]);

  // Update mute state in seats visually when isMuted prop changes
  useEffect(() => {
     const mySeatIdx = seats.findIndex(s => s?.id === currentUser.id);
     if (mySeatIdx !== -1) {
        setSeats(prev => prev.map((s, i) => i === mySeatIdx ? { ...s!, isMuted: isMuted } : s));
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

  const handleSendGift = (gift: Gift, quantity: number = 1, recipientId: string | null = null) => {
    const totalCost = gift.cost * quantity;

    // 1. Check Balance
    if (currentUser.coins < totalCost) {
      addToast('عذراً، رصيدك لا يكفي لإرسال هذه الهدية! 🪙', 'error');
      // Stop combo if balance runs out
      setComboState(prev => ({ ...prev, active: false }));
      return;
    }

    // 2. Lucky Gift Logic Calculation
    let refundAmount = 0;
    let isLuckyWin = false;

    if (gift.isLucky) {
       // Run luck check for the batch (simplification: one check for the whole batch or sum of checks?)
       // Let's do a check proportional to the batch size to simulate multiple throws
       const chance = Math.random() * 100;
       // Slightly increase chance for higher combos? No, keep it flat for fairness.
       if (chance < gameSettings.luckyGiftWinRate) {
           isLuckyWin = true;
           refundAmount = Math.floor(totalCost * (gameSettings.luckyGiftRefundPercent / 100));
       }
    }

    // 3. Update Balance (Deduct Cost + Add Refund if Won)
    const newBalance = currentUser.coins - totalCost + refundAmount;
    
    onUpdateUser({
      ...currentUser,
      coins: newBalance
    });

    // Handle Lucky Win Visuals (Strip)
    if (isLuckyWin) {
       // Clear any existing timeout to prevent the strip from hiding if player wins again quickly
       if (luckyWinTimeoutRef.current) {
          clearTimeout(luckyWinTimeoutRef.current);
       }

       // Display Win Strip
       setLuckyWinAmount(refundAmount);
       
       // Hide strip after 4 seconds (extended time)
       luckyWinTimeoutRef.current = setTimeout(() => {
          setLuckyWinAmount(0);
       }, 4000);
    }

    setShowGiftModal(false);
    
    // Determine recipient name
    let recipientName = 'الجميع';
    const finalRecipientId = recipientId || giftRecipientId; // Use passed ID (for combo) or state ID
    
    if (finalRecipientId) {
       const targetUser = seats.find(s => s?.id === finalRecipientId);
       if (targetUser) recipientName = targetUser.name;
    }

    // Trigger visual effect
    setActiveGiftEffect(gift);
    setTimeout(() => setActiveGiftEffect(null), 3000);

    // Add Message
    const content = quantity > 1 
      ? `أرسل ${gift.name} x${quantity} إلى ${recipientName}` 
      : `أرسل ${gift.name} إلى ${recipientName}`;

    setMessages([...messages, {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userLevel: currentUser.level,
      content: content,
      type: 'gift',
      giftData: gift,
      isLuckyWin: isLuckyWin,
      winAmount: refundAmount
    }]);
    
    // Removed Toast Notification for sending gifts as requested
    // if (!isLuckyWin) {
    //     addToast(content, 'success');
    // }

    // 4. Activate Combo Button
    setComboState({
       gift: gift,
       recipientId: finalRecipientId,
       quantity: quantity,
       timer: 3, // 3 Seconds
       active: true
    });
  };

  // Handler for Combo Button Click
  const handleComboClick = () => {
     if (comboState.active) {
        // Reset timer
        setComboState(prev => ({ ...prev, timer: 3 }));
        // Send again
        handleSendGift(comboState.gift, comboState.quantity, comboState.recipientId);
     }
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
        // Move seat - SILENT
        newSeats[myCurrentSeatIndex] = null;
        newSeats[index] = currentUser;
      } else {
        // Take seat - SILENT
        newSeats[index] = currentUser;
        // Check if we should auto-mute or respect global mute
        if (isMuted) {
           // already muted
        } else {
           // Not muted, so user goes on mic live
        }
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
             return { ...u, isMuted: newState };
          }
          return u;
       }));
    } else if (action === 'copyId') {
       addToast("تم نسخ المعرف بنجاح", 'success');
    } else if (action === 'message') {
       setSelectedUser(null);
    } else if (action === 'editProfile') {
       setSelectedUser(null); // Close profile sheet first
       onEditProfile(); // Trigger parent handler
    } else if (action === 'support') {
       addToast("تم إرسال الدعم", 'success');
    } else if (action === 'more') {
       // addToast("لا توجد خيارات إضافية حالياً", 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col" style={{ background: room.background }}>
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Win Strip for Lucky Gifts */}
      <AnimatePresence>
         {luckyWinAmount > 0 && (
            <WinStrip amount={luckyWinAmount} />
         )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-8 bg-gradient-to-b from-black/60 to-transparent">
         <div className="flex items-center gap-2">
            <button 
               onClick={onLeave} 
               className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400 backdrop-blur-md transition-colors"
               title="خروج نهائي"
            >
               <X size={18} />
            </button>
            <button 
               onClick={onMinimize} 
               className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md transition-colors"
               title="تصغير الغرفة"
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

      {/* Gift Effect Overlay */}
      <AnimatePresence>
        {activeGiftEffect && (
           <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 1.5, opacity: 0 }}
             className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
           >
              <div className="relative flex flex-col items-center justify-center">
                 {activeGiftEffect.animationType === 'full-screen' && (
                    <div className="absolute inset-[-500px] bg-gradient-to-r from-purple-500/20 to-amber-500/20 blur-3xl rounded-full animate-pulse"></div>
                 )}
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
                 {activeGiftEffect.isLucky && (
                     <div className="absolute -top-10 animate-bounce">
                         <Clover size={64} className="text-green-500 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]" fill="currentColor" />
                     </div>
                 )}
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
                    className={`relative w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all active:scale-95`}
                  >
                     {speaker ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                           <div className={`w-[86%] h-[86%] rounded-full overflow-hidden ${
                             !speaker.frame ? (speaker.id === 'u1' ? 'p-[2px] bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-amber-500/50 shadow-lg' : 'p-[2px] bg-gradient-to-tr from-blue-400 to-cyan-200') : ''
                           }`}>
                             <img 
                                src={speaker.avatar} 
                                alt={speaker.name} 
                                className={`w-full h-full rounded-full object-cover ${!speaker.frame ? 'border-2 border-slate-900' : ''} ${speaker.isMuted ? 'grayscale' : ''}`}
                             />
                           </div>
                           {speaker.frame && (
                              <img 
                                src={speaker.frame} 
                                alt="Frame" 
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-lg scale-[1.15]"
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
                           {!speaker.isMuted && (
                              <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping opacity-0"></div>
                           )}
                           <div className="absolute -bottom-5 w-full flex justify-center z-30">
                             <span className="text-[9px] text-white bg-black/40 backdrop-blur-sm px-2 rounded-full truncate max-w-[120%] border border-white/5">
                               {speaker.name}
                             </span>
                           </div>
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

      {/* Chat Area */}
      <div className="h-[35%] bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent px-4 pb-4 pt-10 flex flex-col justify-end relative">
         <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-slate-900/10 pointer-events-none"></div>

         <div className="overflow-y-auto mb-4 space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg) => (
               <div key={msg.id} className={`flex flex-col items-start ${msg.type === 'system' ? 'items-center w-full my-2' : ''}`}>
                  {msg.type === 'system' ? (
                     <div className="bg-white/10 backdrop-blur-md border border-white/10 text-xs px-3 py-1 rounded-full text-amber-200 shadow-lg">
                        {msg.content}
                     </div>
                  ) : msg.type === 'gift' ? (
                     <div className={`rounded-full p-1 pr-3 pl-1 flex items-center gap-2 self-start animate-pulse border ${
                        msg.isLuckyWin 
                          ? 'bg-gradient-to-r from-green-900/90 to-emerald-800/90 border-green-500 shadow-[0_0_10px_rgba(0,255,0,0.3)]' 
                          : 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 border-purple-500/30'
                     }`}>
                        <span className="text-xs font-bold text-amber-400">{msg.userName}:</span>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-white opacity-90">{msg.content.replace(`${msg.userName}:`, '')}</span>
                            {msg.isLuckyWin && (
                                <span className="text-[9px] text-green-400 font-bold">ربح {msg.winAmount} كوينز! 🍀</span>
                            )}
                        </div>
                        <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm overflow-hidden relative">
                           {msg.giftData?.icon.startsWith('http') || msg.giftData?.icon.startsWith('data:') ? 
                              <img src={msg.giftData.icon} className="w-full h-full object-cover" /> : 
                              msg.giftData?.icon
                           }
                           {msg.isLuckyWin && (
                              <div className="absolute -top-1 -right-1 text-[8px]">🍀</div>
                           )}
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
                                 textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.5)', 
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
         <div className="flex items-center gap-2">
            <button 
               onClick={onToggleMute}
               className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 border-2 relative overflow-hidden group ${
                  isMuted 
                    ? 'bg-slate-800 text-slate-400 border-slate-600' 
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 shadow-green-500/50'
               }`}
            >
               {/* Pulse Animation when active */}
               {!isMuted && (
                  <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75"></span>
               )}
               {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <div className="flex-1 bg-slate-800/80 backdrop-blur rounded-full h-10 flex items-center px-4 border border-slate-700 focus-within:border-slate-500 transition-colors">
               <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="قل شيئاً..."
                  className="bg-transparent text-white w-full outline-none text-xs placeholder:text-slate-500"
               />
               <button onClick={handleSendMessage} className="ml-2 text-blue-400 hover:text-blue-300">
                  <Send size={16} />
               </button>
            </div>

            {/* Menu Grid Button */}
             <button 
               onClick={() => setShowMenuModal(true)}
               className="w-10 h-10 bg-slate-800 rounded-full text-white border border-slate-700 shadow-lg flex items-center justify-center hover:bg-slate-700 transition-all active:scale-95"
            >
               <LayoutGrid size={18} />
            </button>

            {/* Gift Button */}
            <button 
               onClick={() => {
                  setGiftRecipientId(null); // Reset to 'All' default or nothing
                  setSelectedGiftQuantity(1); // Reset qty
                  setShowGiftModal(true);
               }}
               className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white shadow-lg shadow-purple-900/50 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
            >
               <GiftIcon size={18} />
            </button>
         </div>
      </div>

      {/* Combo Gift Button (Floating) */}
      <AnimatePresence>
         {comboState.active && (
            <motion.button
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               onClick={handleComboClick}
               className="absolute bottom-28 left-4 z-50 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.6)] border-4 border-white/20 active:scale-95 cursor-pointer"
            >
               {/* Progress Ring Background */}
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                     cx="32" cy="32" r="30"
                     className="stroke-white/20 fill-none stroke-[4]"
                  />
                  <circle
                     cx="32" cy="32" r="30"
                     className="stroke-yellow-400 fill-none stroke-[4] transition-all duration-100 ease-linear"
                     strokeDasharray="188"
                     strokeDashoffset={188 - (188 * comboState.timer / 3)}
                  />
               </svg>
               
               <div className="relative z-10 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">Combo</span>
                  <div className="text-lg font-black text-white leading-none">x{comboState.quantity}</div>
                  <span className="text-[10px] text-yellow-300 font-bold">{comboState.timer.toFixed(1)}</span>
               </div>
            </motion.button>
         )}
      </AnimatePresence>

      {/* Menus and Modals */}
      
      {/* 1. Grid Menu Modal */}
      <AnimatePresence>
         {showMenuModal && (
             <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
                 <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }}
                     onClick={() => setShowMenuModal(false)}
                     className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                 />
                 <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="relative w-full max-w-md bg-[#10141f] rounded-t-[30px] p-6 pb-8 border-t border-white/10 pointer-events-auto"
                 >
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                           onClick={() => { setShowMenuModal(false); setShowGameCenter(true); }}
                           className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                <Gamepad2 size={24} />
                            </div>
                            <span className="font-bold text-sm text-white">مركز الألعاب</span>
                        </button>
                        
                        <button 
                           onClick={() => { setShowMenuModal(false); setShowRoomSettingsModal(true); }}
                           className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                <Settings size={24} />
                            </div>
                            <span className="font-bold text-sm text-white">إعدادات الغرفة</span>
                        </button>
                    </div>
                 </motion.div>
             </div>
         )}
      </AnimatePresence>

      {/* 2. Gift Modal */}
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
                        <span className="text-yellow-400 font-bold text-sm">🪙 {currentUser.coins.toLocaleString()}</span>
                        <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] text-black font-bold">+</div>
                     </div>
                  </div>

                  {/* Recipient Selector */}
                  <div className="mb-4">
                     <p className="text-[10px] text-slate-400 mb-2">إرسال إلى:</p>
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <div 
                           onClick={() => setGiftRecipientId(null)}
                           className={`flex flex-col items-center gap-1 cursor-pointer min-w-[50px] ${!giftRecipientId ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${!giftRecipientId ? 'bg-amber-500 border-amber-300 shadow-lg shadow-amber-900/50' : 'bg-slate-800 border-slate-600'}`}>
                              <span className="text-xs font-bold text-white">الجميع</span>
                           </div>
                           <span className={`text-[10px] ${!giftRecipientId ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>الغرفة</span>
                        </div>

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
                  <div className="grid grid-cols-3 gap-3 max-h-[35vh] overflow-y-auto mb-4">
                     {gifts.map(gift => (
                        <button 
                           key={gift.id}
                           onClick={() => handleSendGift(gift, selectedGiftQuantity)}
                           className="flex flex-col items-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-700 border border-transparent hover:border-amber-500/50 transition-all group relative overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 to-amber-500/0 group-hover:to-amber-500/10 transition-all"></div>
                           
                           {/* Lucky Badge */}
                           {gift.isLucky && (
                               <div className="absolute top-1 right-1 text-green-500">
                                   <Clover size={14} fill="currentColor" />
                               </div>
                           )}

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

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2 border-t border-white/10 pt-4">
                     <span className="text-xs text-slate-400 font-bold ml-2">الكمية:</span>
                     <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {GIFT_MULTIPLIERS.map(qty => (
                           <button
                              key={qty}
                              onClick={() => setSelectedGiftQuantity(qty)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                 selectedGiftQuantity === qty 
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                                    : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'
                              }`}
                           >
                              x{qty}
                           </button>
                        ))}
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* 3. Game Center Modal */}
      <AnimatePresence>
        {showGameCenter && (
            <GameCenterModal 
                isOpen={showGameCenter}
                onClose={() => setShowGameCenter(false)}
                onSelectGame={(game) => {
                    setShowGameCenter(false);
                    setActiveGame(game);
                }}
            />
        )}
      </AnimatePresence>

      {/* 4. Active Game Modals */}
      <AnimatePresence>
        {activeGame === 'wheel' && (
            <WheelGameModal 
                isOpen={true}
                onClose={() => setActiveGame(null)}
                userCoins={currentUser.coins}
                onUpdateCoins={(newCoins) => onUpdateUser({...currentUser, coins: newCoins})}
                winRate={gameSettings.wheelWinRate}
            />
        )}
        {activeGame === 'slots' && (
            <SlotsGameModal
                isOpen={true}
                onClose={() => setActiveGame(null)}
                userCoins={currentUser.coins}
                onUpdateCoins={(newCoins) => onUpdateUser({...currentUser, coins: newCoins})}
                winRate={gameSettings.slotsWinRate}
            />
        )}
      </AnimatePresence>

      {/* 5. Room Settings Modal */}
      <AnimatePresence>
        {showRoomSettingsModal && (
            <RoomSettingsModal 
                isOpen={showRoomSettingsModal}
                onClose={() => setShowRoomSettingsModal(false)}
                room={room}
                onUpdate={onUpdateRoom}
            />
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
