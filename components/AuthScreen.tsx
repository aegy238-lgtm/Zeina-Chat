
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn, Crown, AlertCircle } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UserLevel } from '../types';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign Up Flow
        if (!name.trim()) throw new Error("الرجاء إدخال الاسم");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Display Name
        await updateProfile(user, { displayName: name });

        // Create User Document in Firestore
        // Note: The main logic for document creation is also handled in App.tsx just in case, 
        // but doing it here ensures immediate data availability.
        const newUserDoc = {
            id: user.uid,
            name: name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, // Random Avatar
            level: UserLevel.NEW,
            coins: 1000, // Welcome Bonus
            isVip: false,
            vipLevel: 0,
            bio: 'مستخدم جديد في صوت العرب',
            gender: 'male',
            stats: { likes: 0, visitors: 0, following: 0, followers: 0 },
            ownedItems: [],
            isFollowing: false,
            isMuted: false
        };
        
        await setDoc(doc(db, "users", user.uid), newUserDoc);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-email') setError('البريد الإلكتروني غير صالح');
      else if (err.code === 'auth/user-not-found') setError('المستخدم غير موجود');
      else if (err.code === 'auth/wrong-password') setError('كلمة المرور غير صحيحة');
      else if (err.code === 'auth/email-already-in-use') setError('البريد الإلكتروني مسجل بالفعل');
      else if (err.code === 'auth/weak-password') setError('كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)');
      else setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden font-cairo">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-900/50">
                    <Crown size={40} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">صوت العرب</h1>
                <p className="text-slate-400 text-sm">مجتمع صوتي تفاعلي، دردشة، وألعاب</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                    <div className="relative">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="الاسم المستعار"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-colors"
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                        type="email" 
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-colors"
                    />
                </div>

                <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                        type="password" 
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pr-12 pl-4 text-white focus:border-amber-500 outline-none transition-colors"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                            <LogIn size={20} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-slate-400 text-xs">
                    {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'} {' '}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
                    >
                        {isLogin ? 'سجل الآن' : 'تسجيل الدخول'}
                    </button>
                </p>
            </div>
        </motion.div>
    </div>
  );
};

export default AuthScreen;
