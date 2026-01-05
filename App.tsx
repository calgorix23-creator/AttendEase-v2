
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, AuthState, AttendanceClass, AttendanceRecord, PaymentRecord } from './types.ts';
import Auth from './components/Auth.tsx';
import AdminView from './components/AdminView.tsx';
import TrainerView from './components/TrainerView.tsx';
import TraineeView from './components/TraineeView.tsx';
import { LogOut, User as UserIcon, Loader2 } from 'lucide-react';
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

  const fetchData = () => {
    setLoading(true);
    const localData = localStorage.getItem(APP_STORAGE_KEY);
    if (localData) {
      try {
        setDb(JSON.parse(localData));
      } catch {
        setDb({ users: MOCK_USERS, classes: [], attendance: [], payments: [], packages: [] });
      }
    } else {
      setDb({ users: MOCK_USERS, classes: [], attendance: [], payments: [], packages: [] });
    }
    setLoading(false);
    setTimeout(() => { skipSync.current = false; }, 500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const syncWithLocalStorage = (currentState: AppDB) => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentState));
  };

  useEffect(() => {
    if (!loading && !skipSync.current) {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => {
        syncWithLocalStorage(db);
      }, 500);
    }
    return () => { if (syncTimer.current) window.clearTimeout(syncTimer.current); };
  }, [db, loading]);

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
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading AttendEase...</p>
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
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
                <UserIcon size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-none tracking-tight">AttendEase</h1>
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
