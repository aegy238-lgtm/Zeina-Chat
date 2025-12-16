import React, { useState } from 'react';
import { Home, User as UserIcon, Plus, Bell, Crown, Gem, Settings, ChevronRight, Edit3, Share2, LogOut, Shield, Database } from 'lucide-react';
import RoomCard from './components/RoomCard';
import VoiceRoom from './components/VoiceRoom';
import Toast, { ToastMessage } from './components/Toast';
import VIPModal from './components/VIPModal';
import AdminPanel from './components/AdminPanel';
import { MOCK_ROOMS, CURRENT_USER } from './constants';
import { Room, User, VIPPackage, UserLevel } from './types';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'rank'>('home');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User>(CURRENT_USER);
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleRoomJoin = (room: Room) => {
    setCurrentRoom(room);
  };

  const handleRoomLeave = () => {
    setCurrentRoom(null);
  };
  
  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
     const id = Date.now().toString();
     setToasts(prev => [...prev, { id, message, type }]);
     setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
     }, 3000);
  };

  const handleEditProfile = () => {
     const newName = prompt("أدخل اسمك الجديد:", user.name);
     if (newName) {
        setUser({...user, name: newName});
        addToast("تم تحديث الملف الشخصي بنجاح", 'success');
     }
  };

  const handleBuyVIP = (pkg: VIPPackage) => {
     if (user.coins >= pkg.cost) {
        setUser(prev => ({
           ...prev,
           coins: prev.coins - pkg.cost,
           isVip: true,
           vipLevel: pkg.level,
           frame: pkg.frameUrl,
           level: UserLevel.VIP 
        }));
        addToast(`مبروك! تم تفعيل عضوية ${pkg.name} بنجاح`, 'success');
     } else {
        addToast("رصيدك غير كافي لإتمام العملية", 'error');
     }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col font-cairo">
      <Toast toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {/* Admin Panel */}
      <AnimatePresence>
         {showAdminPanel && (
            <AdminPanel 
               isOpen={showAdminPanel} 
               onClose={() => setShowAdminPanel(false)}
               rooms={rooms}
               setRooms={setRooms}
               currentUser={user}
               onUpdateUser={setUser}
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showVIPModal && (
            <VIPModal 
               user={user} 
               onClose={() => setShowVIPModal(false)} 
               onBuy={handleBuyVIP}
            />
         )}
      </AnimatePresence>

      {/* Active Room Overlay */}
      {currentRoom && (
        <VoiceRoom 
           room={currentRoom} 
           currentUser={user} 
           onLeave={handleRoomLeave} 
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        
        {/* Top Bar (Only show on Home/Rank) */}
        {activeTab !== 'profile' && (
           <div className="p-5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">صوت العرب</h1>
              </div>
              <div className="flex gap-4">
                 <button className="relative p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition" onClick={() => addToast('لا توجد إشعارات جديدة', 'info')}>
                    <Bell size={20} className="text-slate-300" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                 </button>
              </div>
           </div>
        )}

        {/* Tabs Content */}
        <div className="space-y-4">
           {activeTab === 'home' && (
              <div className="px-4 mt-4">
                {/* Stories / Active Users */}
                 <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                       <h2 className="text-sm font-bold text-slate-400">المتواجدون الآن</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                      {[1,2,3,4,5].map((i) => (
                         <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer" onClick={() => addToast(`فتح قصة المستخدم ${i}`, 'info')}>
                            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-pink-500 group-hover:scale-105 transition-transform">
                               <img 
                                 src={`https://picsum.photos/100/100?random=${i+10}`} 
                                 className="w-full h-full rounded-full border-2 border-slate-900 object-cover" 
                                 alt="User" 
                               />
                            </div>
                            <span className="text-[10px] text-slate-300 truncate w-14 text-center">مستخدم {i}</span>
                         </div>
                      ))}
                    </div>
                 </div>

                <div className="flex justify-between items-center mb-3">
                   <h2 className="text-lg font-bold text-white flex items-center gap-2">
                     الغرف النشطة 🔥
                   </h2>
                   <span className="text-xs text-amber-500 cursor-pointer hover:text-amber-400">مشاهدة الكل</span>
                </div>
                <div className="grid gap-4 pb-4">
                   {rooms.map(room => (
                      <RoomCard key={room.id} room={room} onClick={handleRoomJoin} />
                   ))}
                   {rooms.length === 0 && (
                      <div className="text-center py-10 text-slate-500 border border-dashed border-white/10 rounded-xl">
                         لا توجد غرف نشطة حالياً
                      </div>
                   )}
                </div>
              </div>
           )}

           {activeTab === 'rank' && (
             <div className="px-4 mt-6 space-y-4">
                <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl shadow-amber-900/40">
                   <Crown className="absolute -top-4 -right-4 text-white/10 w-40 h-40 rotate-12" />
                   <h2 className="text-2xl font-black mb-1">قائمة المتصدرين</h2>
                   <p className="text-amber-100/80 text-xs font-medium uppercase tracking-wider">أساطير هذا الأسبوع</p>
                </div>
                
                <div className="bg-slate-900 rounded-3xl p-2 space-y-1 border border-white/5">
                   {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${i < 4 ? 'hover:bg-white/5' : ''}`}>
                         <span className={`font-black text-xl w-8 text-center ${i === 1 ? 'text-yellow-400 drop-shadow-lg' : i === 2 ? 'text-slate-300' : i === 3 ? 'text-orange-400' : 'text-slate-600'}`}>{i}</span>
                         <img src={`https://picsum.photos/50?random=${i+20}`} className="w-12 h-12 rounded-full border border-white/10" alt="Rank" />
                         <div className="flex-1">
                            <h4 className="font-bold text-sm">داعم مميز {i}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                               <Gem size={10} className="text-purple-400" />
                               <span>{(10000 - (i * 1000)).toLocaleString()} نقطة</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           )}

           {/* Professional Profile Tab */}
           {activeTab === 'profile' && (
             <div className="relative">
                {/* Header Image */}
                <div className="h-40 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                   <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => addToast('تم نسخ رابط المشاركة', 'success')} className="p-2 bg-black/30 backdrop-blur rounded-full hover:bg-black/40 text-white">
                         <Share2 size={18} />
                      </button>
                      <button onClick={() => addToast('صفحة الإعدادات', 'info')} className="p-2 bg-black/30 backdrop-blur rounded-full hover:bg-black/40 text-white">
                         <Settings size={18} />
                      </button>
                   </div>
                </div>

                <div className="px-5 pb-10">
                   {/* Avatar & Basic Info */}
                   <div className="relative -mt-12 mb-4 flex justify-between items-end">
                      <div className="relative">
                         <div className={`w-24 h-24 rounded-full p-1 bg-slate-950 relative ${!user.frame ? 'border-4 border-slate-800' : ''}`}>
                            <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt="Me" />
                            {user.frame && (
                               <img src={user.frame} className="absolute -inset-[18%] w-[136%] h-[136%] object-contain pointer-events-none drop-shadow-lg z-20" alt="Frame" />
                            )}
                         </div>
                         <div className="absolute bottom-1 right-1 bg-slate-950 p-1 rounded-full cursor-pointer z-30" onClick={handleEditProfile}>
                            <div className="bg-amber-500 rounded-full p-0.5">
                               <Edit3 size={12} className="text-slate-900" />
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-4 text-center mb-1">
                         <div>
                            <div className="font-bold text-lg">{user.stats?.following}</div>
                            <div className="text-[10px] text-slate-400">متابعة</div>
                         </div>
                         <div>
                            <div className="font-bold text-lg">{user.stats?.followers}</div>
                            <div className="text-[10px] text-slate-400">متابعين</div>
                         </div>
                         <div>
                            <div className="font-bold text-lg">{user.stats?.visitors}</div>
                            <div className="text-[10px] text-slate-400">زوار</div>
                         </div>
                      </div>
                   </div>

                   <div className="mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                         {user.name}
                         <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-full font-black">Lv.{user.level}</span>
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 font-mono">ID: 8392102</p>
                      <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                         {user.bio}
                      </p>
                   </div>

                   {/* Wallet Card */}
                   <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center shadow-lg">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">🪙</div>
                         <div>
                            <div className="text-xs text-slate-400">رصيد العملات</div>
                            <div className="font-bold text-lg text-yellow-400">{user.coins.toLocaleString()}</div>
                         </div>
                      </div>
                      <button onClick={() => addToast('جاري فتح بوابة الدفع...', 'info')} className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                         شحن رصيد
                      </button>
                   </div>

                   {/* Menu Items */}
                   <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                      <div 
                         onClick={() => setShowAdminPanel(true)} 
                         className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors bg-gradient-to-r from-slate-900 to-slate-800"
                      >
                         <div className="flex items-center gap-3">
                            <Database size={18} className="text-red-500" />
                            <span className="text-sm font-bold text-red-400">لوحة التحكم (الإدارة)</span>
                         </div>
                         <ChevronRight size={16} className="text-slate-600" />
                      </div>

                      {[
                         { icon: <Crown size={18} className="text-amber-500" />, label: 'متجر الإطارات VIP', badge: 'جديد', action: () => setShowVIPModal(true) },
                         { icon: <Gem size={18} className="text-purple-500" />, label: 'إنجازاتي', badge: '' },
                         { icon: <Shield size={18} className="text-blue-500" />, label: 'مركز المساعدة', badge: '' },
                      ].map((item, idx) => (
                         <div key={idx} onClick={item.action || (() => addToast(`تم النقر على ${item.label}`, 'info'))} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                               {item.icon}
                               <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               {item.badge && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">{item.badge}</span>}
                               <ChevronRight size={16} className="text-slate-600" />
                            </div>
                         </div>
                      ))}
                      <div onClick={() => { if(confirm("هل أنت متأكد من تسجيل الخروج؟")) addToast("تم تسجيل الخروج", 'success'); }} className="flex items-center justify-between p-4 hover:bg-red-900/10 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <LogOut size={18} className="text-red-500" />
                               <span className="text-sm font-medium text-red-500">تسجيل الخروج</span>
                            </div>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-white/5 flex justify-around items-center h-20 pb-2 z-20">
         <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">الرئيسية</span>
         </button>

         <button 
            className="flex flex-col items-center gap-1 p-2 -mt-8 group cursor-pointer"
         >
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-orange-900/50 border-4 border-slate-900 group-hover:scale-105 transition-transform">
               <Plus size={28} className="text-white" />
            </div>
         </button>

         <button 
            onClick={() => setActiveTab('rank')}
            className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'rank' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <Crown size={24} strokeWidth={activeTab === 'rank' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">المتصدرين</span>
         </button>

         <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'profile' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
         >
            <UserIcon size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">حسابي</span>
         </button>
      </div>
    </div>
  );
}