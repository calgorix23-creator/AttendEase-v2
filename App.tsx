
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, AuthState, AttendanceClass, AttendanceRecord, PaymentRecord } from './types.ts';
import Auth from './components/Auth.tsx';
import AdminView from './components/AdminView.tsx';
import TrainerView from './components/TrainerView.tsx';
import TraineeView from './components/TraineeView.tsx';
import { LogOut, User as UserIcon, Loader2, AlertTriangle, RefreshCw, Cloud, Database } from 'lucide-react';
import { MOCK_USERS, APP_STORAGE_KEY } from './constants.ts';

interface AppDB {
  users: User[];
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  packages: any[];
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('cloud');
  const skipSync = useRef(true);
  const syncTimer = useRef<number | null>(null);
  
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('attendease_auth');
    try {
      return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });

  const [db, setDb] = useState<AppDB>({
    users: [],
    classes: [],
    attendance: [],
    payments: [],
    packages: []
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Small timeout to allow the Node.js process to warm up on Hostinger
      const response = await fetch('/api/data');
      
      if (response.status === 404) {
        console.warn("Backend API not detected. Using Local Storage.");
        setStorageMode('local');
        const localData = localStorage.getItem(APP_STORAGE_KEY);
        if (localData) {
          setDb(JSON.parse(localData));
        } else {
          setDb({ users: MOCK_USERS, classes: [], attendance: [], payments: [], packages: [] });
        }
        setLoading(false);
        setTimeout(() => { skipSync.current = false; }, 500);
        return;
      }

      if (!response.ok) {
        throw new Error(`Cloud Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStorageMode('cloud');
      
      if (!data.users || data.users.length === 0) {
        const initial: AppDB = { 
          users: MOCK_USERS,
          classes: data.classes || [],
          attendance: data.attendance || [],
          payments: data.payments || [],
          packages: data.packages || []
        };
        setDb(initial);
        await syncWithServer(initial);
      } else {
        setDb(data);
      }
    } catch (error: any) {
      console.error("Data fetch error:", error);
      setError(error.message || "Unable to reach the backend server.");
    } finally {
      setLoading(false);
      setTimeout(() => { skipSync.current = false; }, 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const syncWithServer = async (currentState: AppDB) => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentState));
    if (storageMode === 'local') return;

    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      });
    } catch (error) {
      console.error("Cloud sync failed:", error);
    }
  };

  useEffect(() => {
    if (!loading && !skipSync.current) {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => {
        syncWithServer(db);
      }, 1500); // Slightly longer debounce for cloud stability
    }
    return () => { if (syncTimer.current) window.clearTimeout(syncTimer.current); };
  }, [db, loading, storageMode]);

  useEffect(() => {
    localStorage.setItem('attendease_auth', JSON.stringify(auth));
  }, [auth]);

  const handleLogin = (email: string, password?: string): boolean => {
    const foundUser = db.users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (foundUser && foundUser.password === password) {
      setAuth({ user: foundUser, isAuthenticated: true });
      return true;
    }
    return false;
  };

  const handleLogout = () => setAuth({ user: null, isAuthenticated: false });

  const addClass = (newClass: AttendanceClass): boolean => {
    const isDuplicate = db.classes.some(c => 
      c.name.trim().toLowerCase() === newClass.name.trim().toLowerCase() && 
      c.date === newClass.date && 
      c.time === newClass.time
    );
    if (isDuplicate) return false;
    setDb(prev => ({ ...prev, classes: [newClass, ...prev.classes] }));
    return true;
  };

  const updateClass = (updated: AttendanceClass) => 
    setDb(prev => ({ ...prev, classes: prev.classes.map(c => c.id === updated.id ? updated : c) }));
  
  const deleteClass = (id: string) => {
    setDb(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== id),
      attendance: prev.attendance.filter(a => a.classId !== id)
    }));
  };

  const updateUser = (updated: User) => {
    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === updated.id ? updated : u)
    }));
    if (auth.user?.id === updated.id) {
      setAuth(prev => ({ ...prev, user: updated }));
    }
  };

  const toggleAttendance = (classId: string, traineeId: string) => {
    const trainee = db.users.find(u => u.id === traineeId);
    if (!trainee) return { success: false, message: "User not found" };

    const existingRecord = db.attendance.find(a => a.classId === classId && a.traineeId === traineeId);
    
    if (existingRecord) {
      setDb(prev => ({
        ...prev,
        attendance: prev.attendance.filter(a => a.id !== existingRecord.id),
        users: prev.users.map(u => u.id === traineeId && u.role === UserRole.TRAINEE 
          ? { ...u, credits: (u.credits || 0) + 1 } 
          : u)
      }));
      if (auth.user?.id === traineeId) {
        setAuth(prev => prev.user ? { ...prev, user: { ...prev.user, credits: (prev.user.credits || 0) + 1 } } : prev);
      }
      return { success: true, message: "Removed and credit refunded." };
    } else {
      if (trainee.role === UserRole.TRAINEE && (trainee.credits || 0) < 1) {
        return { success: false, message: "Insufficient credits. Trainee must top up." };
      }
      
      const isStaff = auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.TRAINER;
      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        classId, 
        traineeId, 
        timestamp: Date.now(), 
        method: isStaff ? 'MANUAL' : 'APP', 
        status: 'BOOKED'
      };

      setDb(prev => ({
        ...prev,
        attendance: [newRecord, ...prev.attendance],
        users: prev.users.map(u => u.id === traineeId && u.role === UserRole.TRAINEE 
          ? { ...u, credits: (u.credits || 0) - 1 } 
          : u)
      }));
      if (auth.user?.id === traineeId) {
        setAuth(prev => prev.user ? { ...prev, user: { ...prev.user, credits: (prev.user.credits || 0) - 1 } } : prev);
      }
      return { success: true, message: "Checked in and 1 credit deducted." };
    }
  };

  const handlePurchase = (payment: PaymentRecord) => {
    const trainee = db.users.find(u => u.id === payment.traineeId);
    if (!trainee) return;
    setDb(prev => ({
      ...prev,
      payments: [payment, ...prev.payments],
      users: prev.users.map(u => u.id === payment.traineeId 
        ? { ...u, credits: (u.credits || 0) + payment.credits } 
        : u)
    }));
    if (auth.user?.id === payment.traineeId) {
      setAuth(prev => prev.user ? { ...prev, user: { ...prev.user, credits: (prev.user.credits || 0) + payment.credits } } : prev);
    }
  };

  const handleResetPassword = (email: string, phone: string, newPass: string) => {
    const found = db.users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.phoneNumber?.trim() === phone.trim());
    if (found) {
      updateUser({ ...found, password: newPass });
      return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connecting to Cloud...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-rose-100 max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Cloud Unreachable</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{error}</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={fetchData} 
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <RefreshCw size={16} /> Retry Cloud
            </button>
            <button 
              onClick={() => { setStorageMode('local'); setError(null); fetchData(); }} 
              className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              <Database size={16} /> Run Locally
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden border-x border-slate-100">
      {auth.isAuthenticated && auth.user ? (
        <>
          <header className="px-5 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center shrink-0 z-50 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner relative">
                <UserIcon size={20} className="text-white" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                  {storageMode === 'cloud' ? (
                    <Cloud size={8} className="text-blue-600" />
                  ) : (
                    <Database size={8} className="text-amber-500" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none tracking-tight flex items-center gap-2">
                  AttendEase
                  <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter ${storageMode === 'cloud' ? 'bg-blue-400/20 text-blue-100' : 'bg-amber-400/20 text-amber-100'}`}>
                    {storageMode}
                  </span>
                </h1>
                <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest mt-1 opacity-80">{auth.user.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 border border-white/10">
              <LogOut size={20} />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar bg-slate-50 relative">
            {auth.user.role === UserRole.ADMIN && (
              <AdminView 
                user={auth.user} classes={db.classes} attendance={db.attendance} 
                users={db.users} payments={db.payments} packages={db.packages}
                onAddUser={u => setDb(prev => ({...prev, users: [...prev.users, u]}))} 
                onUpdateUser={updateUser} 
                onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass}
                onToggleAttendance={(c, t) => toggleAttendance(c, t)}
                setPackages={pkgs => setDb(prev => ({...prev, packages: pkgs}))}
              />
            )}
            {auth.user.role === UserRole.TRAINER && (
              <TrainerView 
                user={auth.user} classes={db.classes} attendance={db.attendance} trainees={db.users.filter(u => u.role === UserRole.TRAINEE)}
                onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} 
                onToggleAttendance={(c, t) => toggleAttendance(c, t)} onUpdateUser={updateUser}
              />
            )}
            {auth.user.role === UserRole.TRAINEE && (
              <TraineeView 
                user={auth.user} classes={db.classes} attendance={db.attendance} 
                payments={db.payments} packages={db.packages}
                onRegister={(rec) => toggleAttendance(rec.classId, rec.traineeId)}
                onCancel={(c, t) => toggleAttendance(c, t)}
                onPurchase={handlePurchase} onUpdateUser={updateUser}
              />
            )}
          </main>
        </>
      ) : (
        <Auth onLogin={handleLogin} onResetPassword={handleResetPassword} />
      )}
    </div>
  );
};

export default App;
