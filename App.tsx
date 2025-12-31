
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuthState, AttendanceClass, AttendanceRecord, PaymentRecord } from './types.ts';
import { MOCK_USERS, APP_STORAGE_KEY, MOCK_PACKAGES } from './constants.ts';
import Auth from './components/Auth.tsx';
import AdminView from './components/AdminView.tsx';
import TrainerView from './components/TrainerView.tsx';
import TraineeView from './components/TraineeView.tsx';
import { LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('attendease_auth');
    try {
      return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });

  const [classes, setClasses] = useState<AttendanceClass[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_classes`);
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_attendance`);
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_all_users`);
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [packages, setPackages] = useState(() => {
    const saved = localStorage.getItem(`${APP_STORAGE_KEY}_packages`);
    return saved ? JSON.parse(saved) : MOCK_PACKAGES;
  });

  useEffect(() => {
    localStorage.setItem('attendease_auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(`${APP_STORAGE_KEY}_classes`, JSON.stringify(classes));
    localStorage.setItem(`${APP_STORAGE_KEY}_attendance`, JSON.stringify(attendance));
    localStorage.setItem(`${APP_STORAGE_KEY}_payments`, JSON.stringify(payments));
    localStorage.setItem(`${APP_STORAGE_KEY}_all_users`, JSON.stringify(users));
    localStorage.setItem(`${APP_STORAGE_KEY}_packages`, JSON.stringify(packages));
  }, [classes, attendance, payments, users, packages]);

  const handleLogin = (email: string, password?: string): boolean => {
    const foundUser = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (foundUser && foundUser.password === password) {
      setAuth({ user: foundUser, isAuthenticated: true });
      return true;
    }
    return false;
  };

  const handleLogout = () => setAuth({ user: null, isAuthenticated: false });

  const addClass = (newClass: AttendanceClass): boolean => {
    const isDuplicate = classes.some(c => 
      c.name.trim().toLowerCase() === newClass.name.trim().toLowerCase() && 
      c.date === newClass.date && 
      c.time === newClass.time
    );
    if (isDuplicate) {
      return false;
    }
    setClasses(prev => [newClass, ...prev]);
    return true;
  };

  const updateClass = (updated: AttendanceClass) => setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
  
  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setAttendance(prev => prev.filter(a => a.classId !== id));
  };

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (auth.user?.id === updated.id) {
      setAuth(prev => ({ ...prev, user: updated }));
    }
  };

  const toggleAttendance = (classId: string, traineeId: string) => {
    const trainee = users.find(u => u.id === traineeId);
    if (!trainee) return { success: false, message: "User not found" };

    const recordIndex = attendance.findIndex(a => a.classId === classId && a.traineeId === traineeId);
    
    if (recordIndex !== -1) {
      // Unregister
      setAttendance(prev => prev.filter((_, i) => i !== recordIndex));
      
      // Always refund if the target is a trainee
      if (trainee.role === UserRole.TRAINEE) {
        updateUser({ ...trainee, credits: (trainee.credits || 0) + 1 });
      }
      return { success: true, message: "Removed successfully." };
    } else {
      // Register
      // Every trainee must have at least 1 credit to be marked present, 
      // even if a staff member is doing it.
      if (trainee.role === UserRole.TRAINEE && (trainee.credits || 0) < 1) {
        return { success: false, message: "Insufficient credits. Trainee must top up." };
      }
      
      const isStaff = auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.TRAINER;
      
      setAttendance(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        classId, 
        traineeId, 
        timestamp: Date.now(), 
        method: isStaff ? 'MANUAL' : 'APP', 
        status: 'BOOKED'
      }, ...prev]);
      
      // Deduct credit for every new trainee check-in
      if (trainee.role === UserRole.TRAINEE) {
        updateUser({ ...trainee, credits: (trainee.credits || 0) - 1 });
      }
      return { success: true, message: "Registered successfully." };
    }
  };

  const handlePurchase = (payment: PaymentRecord) => {
    const trainee = users.find(u => u.id === payment.traineeId);
    if (!trainee) return;
    setPayments(prev => [payment, ...prev]);
    updateUser({ ...trainee, credits: (trainee.credits || 0) + payment.credits });
  };

  const handleResetPassword = (email: string, phone: string, newPass: string) => {
    const found = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.phoneNumber?.trim() === phone.trim());
    if (found) {
      updateUser({ ...found, password: newPass });
      return true;
    }
    return false;
  };

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
                user={auth.user} classes={classes} attendance={attendance} 
                users={users} payments={payments} packages={packages}
                onAddUser={u => setUsers(prev => [...prev, u])} onUpdateUser={updateUser} 
                onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass}
                onToggleAttendance={(c, t) => toggleAttendance(c, t)}
                setPackages={setPackages}
              />
            )}
            {auth.user.role === UserRole.TRAINER && (
              <TrainerView 
                user={auth.user} classes={classes} attendance={attendance} trainees={users.filter(u => u.role === UserRole.TRAINEE)}
                onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} 
                onToggleAttendance={(c, t) => toggleAttendance(c, t)} onUpdateUser={updateUser}
              />
            )}
            {auth.user.role === UserRole.TRAINEE && (
              <TraineeView 
                user={auth.user} classes={classes} attendance={attendance} 
                payments={payments} packages={packages}
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
