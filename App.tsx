
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuthState, AttendanceClass, AttendanceRecord, PaymentRecord } from './types';
import { MOCK_USERS, APP_STORAGE_KEY, CREDIT_PACKAGES as INITIAL_PACKAGES } from './constants';
import Auth from './components/Auth';
import AdminView from './components/AdminView';
import TrainerView from './components/TrainerView';
import TraineeView from './components/TraineeView';
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
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
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

  const handleLogin = (email: string, password?: string) => {
    const foundUser = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (foundUser && foundUser.password === password) {
      setAuth({ user: foundUser, isAuthenticated: true });
    } else {
      alert("Invalid credentials. Please check your email and password.");
    }
  };

  const handleLogout = () => setAuth({ user: null, isAuthenticated: false });

  const handleResetPassword = (email: string, phone: string, newPassword: string) => {
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.phoneNumber === phone);
    if (idx !== -1) {
      const updated = [...users];
      updated[idx] = { ...updated[idx], password: newPassword };
      setUsers(updated);
      return true;
    }
    return false;
  };

  const addClass = (newClass: AttendanceClass) => setClasses(prev => [newClass, ...prev]);
  const updateClass = (updated: AttendanceClass) => setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setAttendance(prev => prev.filter(a => a.classId !== id));
  };

  const addUser = (newUser: User) => {
    const preparedUser = {
      ...newUser,
      credits: newUser.role === UserRole.TRAINEE ? (newUser.credits ?? 0) : undefined
    };
    setUsers(prev => [...prev, preparedUser]);
  };

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (auth.user?.id === updated.id) {
      setAuth({ user: updated, isAuthenticated: true });
    }
  };

  const handleBooking = (record: AttendanceRecord) => {
    const trainee = users.find(u => u.id === record.traineeId);
    if (!trainee || trainee.role !== UserRole.TRAINEE) {
      return { success: false, message: "Trainee account error." };
    }
    
    const userCredits = trainee.credits ?? 0;
    if (userCredits < 1) {
      return { success: false, message: "Insufficient credits. Please purchase more." };
    }
    
    const updatedTrainee = { ...trainee, credits: userCredits - 1 };
    updateUser(updatedTrainee);
    setAttendance(prev => [record, ...prev]);
    return { success: true, message: "Booking confirmed!" };
  };

  const handleToggleManualAttendance = (classId: string, traineeId: string) => {
    const existingIndex = attendance.findIndex(a => a.classId === classId && a.traineeId === traineeId);
    const trainee = users.find(u => u.id === traineeId);
    
    if (existingIndex !== -1) {
      // Unmarking: Remove record and refund credit
      setAttendance(prev => prev.filter((_, i) => i !== existingIndex));
      if (trainee) {
        updateUser({ ...trainee, credits: (trainee.credits || 0) + 1 });
      }
      return { success: true, message: "Attendance removed. Credit refunded." };
    } else {
      // Marking: Check credits and add record
      if (!trainee || trainee.role !== UserRole.TRAINEE) return { success: false, message: "Invalid user." };
      
      const credits = trainee.credits ?? 0;
      if (credits < 1) return { success: false, message: "Trainee has no credits remaining." };
      
      updateUser({ ...trainee, credits: credits - 1 });
      setAttendance(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        classId,
        traineeId,
        timestamp: Date.now(),
        method: 'MANUAL',
        status: 'ATTENDED'
      }, ...prev]);
      return { success: true, message: "Attendance marked manually." };
    }
  };

  const handleCancelBooking = (classId: string, traineeId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return { success: false, message: "Critical Error: Class session missing." };

    const [year, month, day] = cls.date.split('-').map(Number);
    const [hours, minutes] = cls.time.split(':').map(Number);
    const classTime = new Date(year, month - 1, day, hours, minutes);
    
    const now = new Date();
    const diffInMinutes = (classTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffInMinutes < 30) {
      const msg = diffInMinutes <= 0 
        ? "Cancellation Failed: This session has already started or finished." 
        : `Cancellation Failed: This class starts in ${Math.floor(diffInMinutes)} minutes. 30m notice required.`;
      return { success: false, message: msg };
    }

    setAttendance(prev => {
      const exists = prev.some(a => a.classId === classId && a.traineeId === traineeId);
      if (!exists) return prev;
      return prev.filter(a => !(a.classId === classId && a.traineeId === traineeId));
    });

    const trainee = users.find(u => u.id === traineeId);
    if (trainee) {
      const currentCredits = trainee.credits ?? 0;
      updateUser({ ...trainee, credits: currentCredits + 1 });
    }

    return { success: true, message: "Success: Booking cancelled and credit refunded." };
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      {auth.isAuthenticated && auth.user ? (
        <>
          <header className="px-5 py-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center transition-transform hover:rotate-6"><UserIcon size={20} /></div>
              <div>
                <h1 className="font-semibold text-lg leading-none tracking-tight">AttendEase</h1>
                <p className="text-[10px] text-indigo-100 uppercase font-medium tracking-wider mt-1">{auth.user.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2.5 hover:bg-white/10 rounded-full transition-all active:scale-90"><LogOut size={20} /></button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar bg-slate-50">
            {auth.user.role === UserRole.ADMIN && (
              <AdminView 
                user={auth.user} classes={classes} attendance={attendance} payments={payments} users={users} packages={packages}
                onAddUser={addUser} onUpdateUser={updateUser} onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass}
                onAddAttendance={handleBooking} onToggleAttendance={handleToggleManualAttendance} setPackages={setPackages}
              />
            )}
            {auth.user.role === UserRole.TRAINER && (
              <TrainerView 
                user={auth.user} classes={classes} attendance={attendance} trainees={users.filter(u => u.role === UserRole.TRAINEE)}
                onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} onAddAttendance={handleBooking} onToggleAttendance={handleToggleManualAttendance} onUpdateUser={updateUser}
              />
            )}
            {auth.user.role === UserRole.TRAINEE && (
              <TraineeView 
                user={auth.user} classes={classes} attendance={attendance} payments={payments} packages={packages}
                onRegister={handleBooking} onCancel={handleCancelBooking} onPurchase={p => {
                  setPayments(prev => [...prev, p]);
                  const trainee = users.find(u => u.id === p.traineeId);
                  if (trainee) {
                    updateUser({ ...trainee, credits: (trainee.credits || 0) + p.credits });
                  }
                }} onUpdateUser={updateUser}
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
