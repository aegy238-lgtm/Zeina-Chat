import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Radio, Settings, X, Search, 
  MoreVertical, Ban, Trash2, ShieldAlert, CheckCircle, 
  Coins, Crown, BarChart3, Bell, Power
} from 'lucide-react';
import { Room, User, UserLevel } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

// Mock data for the user table (since we only have one real user in state)
const MOCK_ALL_USERS = [
  { id: 'u1', name: 'الملك', level: UserLevel.DIAMOND, coins: 500000, status: 'active', ip: '192.168.1.1' },
  { id: 'u2', name: 'سارة', level: UserLevel.GOLD, coins: 12000, status: 'active', ip: '192.168.1.2' },
  { id: 'u3', name: 'GamerPro', level: UserLevel.BRONZE, coins: 500, status: 'banned', ip: '192.168.1.55' },
  { id: 'u4', name: 'ضيف 102', level: UserLevel.NEW, coins: 0, status: 'active', ip: '192.168.1.9' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, rooms, setRooms, currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'rooms' | 'settings'>('dashboard');
  const [localUsers, setLocalUsers] = useState([...MOCK_ALL_USERS, { 
    id: currentUser.id, 
    name: currentUser.name, 
    level: currentUser.level, 
    coins: currentUser.coins, 
    status: 'active',
    ip: '127.0.0.1' 
  }]);

  if (!isOpen) return null;

  const handleDeleteRoom = (roomId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة وإغلاقها نهائياً؟')) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  const handleBanUser = (userId: string) => {
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
  };

  const handleAddCoins = (userId: string) => {
    const amount = prompt("أدخل كمية العملات للإضافة:");
    if (amount && !isNaN(Number(amount))) {
       const val = Number(amount);
       if (userId === currentUser.id) {
          onUpdateUser({ ...currentUser, coins: currentUser.coins + val });
       }
       setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: u.coins + val } : u));
    }
  };

  const SidebarItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 p-3 w-full rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-900/20' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col font-cairo overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur">
         <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 rounded-lg">
               <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
               <h1 className="font-bold text-lg leading-none">لوحة القيادة</h1>
               <span className="text-[10px] text-slate-400">Admin Control Panel v2.0</span>
            </div>
         </div>
         <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition">
            <X size={20} className="text-slate-400" />
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
         {/* Sidebar */}
         <div className="w-20 lg:w-64 border-l border-white/5 p-4 flex flex-col gap-2 bg-slate-900/20">
            <SidebarItem id="dashboard" icon={LayoutDashboard} label="الرئيسية" />
            <SidebarItem id="users" icon={Users} label="المستخدمين" />
            <SidebarItem id="rooms" icon={Radio} label="الغرف" />
            <SidebarItem id="settings" icon={Settings} label="النظام" />
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto p-6 bg-slate-950 relative">
            
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 {/* Stats Cards */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">إجمالي المستخدمين</h3>
                       <p className="text-2xl font-black mt-1 text-white">{localUsers.length + 1420}</p>
                       <span className="text-[10px] text-green-400 flex items-center gap-1 mt-2">
                          <BarChart3 size={10} /> +12% هذا الأسبوع
                       </span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Radio size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">الغرف النشطة</h3>
                       <p className="text-2xl font-black mt-1 text-amber-400">{rooms.length}</p>
                       <span className="text-[10px] text-slate-500 mt-2">
                          سعة السيرفر: مستقرة
                       </span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 col-span-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Coins size={64} /></div>
                       <h3 className="text-slate-400 text-xs font-bold">إجمالي المبيعات (اليوم)</h3>
                       <p className="text-3xl font-black mt-1 text-green-400">$4,250.00</p>
                    </div>
                 </div>

                 {/* Recent Activity Mock */}
                 <div>
                    <h3 className="font-bold mb-3 text-sm">آخر العمليات</h3>
                    <div className="bg-slate-900 rounded-2xl border border-white/5 p-4 space-y-3">
                       {[1,2,3].map(i => (
                          <div key={i} className="flex items-center gap-3 text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                <Bell size={14} className="text-slate-400" />
                             </div>
                             <div>
                                <p className="text-white">قام <span className="text-amber-400">User_{i}99</span> بشراء باقة VIP</p>
                                <p className="text-slate-500">منذ {i * 5} دقائق</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex gap-2 bg-slate-900 p-2 rounded-xl border border-white/5">
                     <Search className="text-slate-500 ml-2" />
                     <input type="text" placeholder="بحث عن مستخدم (ID, Name)..." className="bg-transparent w-full outline-none text-sm" />
                  </div>
                  
                  <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                     <table className="w-full text-right text-xs">
                        <thead className="bg-white/5 text-slate-400 font-bold">
                           <tr>
                              <th className="p-3">المستخدم</th>
                              <th className="p-3">المستوى</th>
                              <th className="p-3">الرصيد</th>
                              <th className="p-3">الحالة</th>
                              <th className="p-3">تحكم</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {localUsers.map(u => (
                              <tr key={u.id}>
                                 <td className="p-3 font-bold flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700"></div>
                                    {u.name}
                                 </td>
                                 <td className="p-3">{u.level}</td>
                                 <td className="p-3 text-yellow-400 font-mono">{u.coins.toLocaleString()}</td>
                                 <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                       {u.status === 'active' ? 'نشط' : 'محظور'}
                                    </span>
                                 </td>
                                 <td className="p-3 flex gap-2">
                                    <button onClick={() => handleBanUser(u.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20">
                                       <Ban size={14} />
                                    </button>
                                    <button onClick={() => handleAddCoins(u.id)} className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20">
                                       <Coins size={14} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </motion.div>
            )}

            {activeTab === 'rooms' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid gap-3">
                     {rooms.map(room => (
                        <div key={room.id} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <img src={room.thumbnail} className="w-12 h-12 rounded-lg object-cover" />
                              <div>
                                 <h4 className="font-bold text-sm">{room.title}</h4>
                                 <p className="text-[10px] text-slate-400">ID: {room.id} • {room.category}</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20">تثبيت</button>
                              <button onClick={() => handleDeleteRoom(room.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 flex items-center gap-1">
                                 <Trash2 size={12} /> حذف
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}

            {activeTab === 'settings' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                   <div className="bg-slate-900 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><ShieldAlert size={20} /></div>
                         <div>
                            <h4 className="font-bold text-sm">وضع الصيانة</h4>
                            <p className="text-[10px] text-slate-400">إيقاف التطبيق لجميع المستخدمين عدا الإدارة</p>
                         </div>
                      </div>
                      <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                         <div className="w-3 h-3 bg-slate-400 rounded-full absolute top-1 left-1"></div>
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Bell size={20} /></div>
                         <div>
                            <h4 className="font-bold text-sm">إرسال تنبيه عام</h4>
                            <p className="text-[10px] text-slate-400">رسالة تظهر لجميع المتواجدين حالياً</p>
                         </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">إرسال</button>
                   </div>
                   
                   <div className="bg-red-900/10 rounded-xl p-4 border border-red-500/20 mt-8">
                       <h4 className="font-bold text-red-400 text-sm mb-2 flex items-center gap-2"><Power size={14} /> منطقة الخطر</h4>
                       <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-xs">
                          إعادة تشغيل السيرفر
                       </button>
                   </div>
               </motion.div>
            )}

         </div>
      </div>
    </div>
  );
};

export default AdminPanel;