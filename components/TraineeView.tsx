import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord } from '../types.ts';
import { History, ShoppingBag, CheckCircle2, ChevronRight, Calendar, Clock, User as UserIcon, AlertTriangle, ShieldCheck, AlertCircle, CalendarDays, ClipboardCheck } from 'lucide-react';

interface TraineeViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  packages: any[];
  onRegister: (rec: AttendanceRecord) => { success: boolean, message: string };
  onCancel: (classId: string, traineeId: string) => { success: boolean, message: string };
  onPurchase: (payment: PaymentRecord) => void;
  onUpdateUser: (user: User) => void;
}

const TraineeView: React.FC<TraineeViewProps> = ({ user, classes, attendance, payments, packages, onRegister, onCancel, onPurchase, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'history' | 'shop' | 'profile'>('schedule');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  
  const [profileData, setProfileData] = useState({ 
    name: user.name, 
    email: user.email, 
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  useEffect(() => {
    setProfileData({
      name: user.name,
      email: user.email,
      phone: user.phoneNumber || '',
      password: user.password || ''
    });
  }, [user]);

  const emailChanged = profileData.email.trim().toLowerCase() !== user.email.trim().toLowerCase();
  const passwordChanged = (profileData.password !== user.password && profileData.password !== '');

  const getLocalDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } catch {
      return new Date();
    }
  };

  const upcomingClasses = classes.filter(cls => {
    const classDateTime = getLocalDateTime(cls.date, cls.time);
    return classDateTime.getTime() > Date.now();
  }).sort((a, b) => {
    const timeA = getLocalDateTime(a.date, a.time).getTime();
    const timeB = getLocalDateTime(b.date, b.time).getTime();
    return timeA - timeB;
  });

  const isUserRegistered = (classId: string) => attendance.some(a => a.classId === classId && a.traineeId === user.id);

  const handleBookingClick = (cls: AttendanceClass) => {
    const result = onRegister({ 
      id: Math.random().toString(36).substr(2, 9), 
      classId: cls.id, 
      traineeId: user.id, 
      timestamp: Date.now(), 
      method: 'APP', 
      status: 'BOOKED' 
    });
    alert(result.message);
  };

  const handleCancelClick = (classId: string) => {
    const result = onCancel(classId, user.id);
    alert(result.message);
  };

  const userAttendanceRecords = attendance
    .filter(a => a.traineeId === user.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'Deleted Session';
  const getClassDetails = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.date} at ${cls.time}` : 'Date Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100/60 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/50 snap-x">
        {[
          { id: 'schedule', icon: CalendarDays, label: 'CLASSES' },
          { id: 'history', icon: History, label: 'LOG' },
          { id: 'shop', icon: ShoppingBag, label: 'STORE' },
          { id: 'profile', icon: UserIcon, label: 'ACCOUNT' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[10px] font-medium transition-all snap-center shrink-0 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-500'}`}>
            <tab.icon size={14} className="mx-auto mb-1"/> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Available Classes</h2>
          </div>
          {upcomingClasses.length === 0 ? (
            <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center text-slate-400 text-sm font-medium italic shadow-inner">No upcoming sessions found</div>
          ) : (
            upcomingClasses.map(cls => {
              const registered = isUserRegistered(cls.id);
              const classTime = getLocalDateTime(cls.date, cls.time);
              const cancelDeadline = new Date(classTime.getTime() - 30 * 60 * 1000);
              const canStillCancel = cancelDeadline.getTime() > Date.now();
              return (
                <div key={cls.id} className="bg-white p-6 rounded-[28px] border border-slate-100 space-y-4 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800 leading-tight">{cls.name}</h3>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                        <Calendar size={12}/> {cls.date} • {cls.time}
                      </div>
                      {registered && !canStillCancel && (
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                          <AlertCircle size={10}/> Cancellation locked (starts in &lt;30m)
                        </div>
                      )}
                    </div>
                    {registered && <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl text-[10px] font-semibold border border-emerald-100/50">Booked</div>}
                  </div>
                  {!registered ? (
                    <button onClick={() => handleBookingClick(cls)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all shadow-lg shadow-indigo-100">
                      Book Session (1 Credit)
                    </button>
                  ) : (
                    <button onClick={() => handleCancelClick(cls.id)} className={`w-full py-3 rounded-2xl font-semibold text-xs transition-all active:scale-95 border ${canStillCancel ? 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'}`}>
                      Cancel Booking
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Activity Log</h2>
          </div>
          {userAttendanceRecords.length === 0 ? (
            <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center text-slate-400 text-sm font-medium italic shadow-inner">No activity recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {userAttendanceRecords.map(rec => (
                <div key={rec.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${rec.method === 'MANUAL' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {rec.method === 'MANUAL' ? <ClipboardCheck size={20}/> : <CheckCircle2 size={20}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{getClassName(rec.classId)}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{getClassDetails(rec.classId)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${rec.method === 'MANUAL' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {rec.method}
                    </span>
                    <p className="text-[9px] text-slate-300 mt-1">{new Date(rec.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in">
          <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-[11px] font-medium uppercase tracking-wider mb-1 opacity-80">Wallet Balance</p>
              <h2 className="text-4xl font-semibold tracking-tight">{user.credits ?? 0} Credits</h2>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShoppingBag size={100}/></div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {packages.map(pkg => (
              <button key={pkg.id} onClick={() => { setSelectedPkg(pkg); setPaymentState('processing'); setTimeout(() => { onPurchase({ id: Math.random().toString(36).substr(2, 9), traineeId: user.id, amount: pkg.price, credits: pkg.credits, timestamp: Date.now(), status: 'SUCCESS' }); setPaymentState('success'); }, 1500); }} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group shadow-sm active:scale-[0.98] transition-all hover:border-indigo-100">
                <div className="text-left">
                  <div className="font-semibold text-slate-800 text-sm">{pkg.name}</div>
                  <div className="text-xs text-slate-400 font-medium">{pkg.credits} Credits</div>
                </div>
                <div className="text-lg font-semibold text-indigo-600 flex items-center gap-1">${pkg.price} <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors"/></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onUpdateUser({ ...user, ...profileData, phoneNumber: profileData.phone }); 
          alert("Account updated!"); 
        }} className="bg-white p-7 rounded-[32px] border border-slate-100 space-y-5 animate-in shadow-sm">
          <h3 className="text-lg font-semibold text-center text-slate-800">Account Settings</h3>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Full Name</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Account Email</label>
            <input required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-medium ${emailChanged ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})}/>
            {emailChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-medium">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Changing your email updates your login credentials.</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Phone Number</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">New Password</label>
            <input type="password" required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-medium ${passwordChanged ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})}/>
            {passwordChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-medium">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Password change detected. It will be required at next login.</span>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all text-sm mt-2">Update Account</button>
        </form>
      )}

      {paymentState === 'processing' && (
        <div className="fixed inset-0 bg-slate-900/40 z-[300] flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center space-y-6 animate-in shadow-2xl">
             <div className="w-16 h-16 mx-auto border-[3px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
             <h3 className="text-lg font-semibold text-slate-800">Verifying...</h3>
          </div>
        </div>
      )}

      {paymentState === 'success' && (
        <div className="fixed inset-0 bg-slate-900/30 z-[310] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-10 text-center space-y-4 animate-in shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={32} /></div>
            <h3 className="text-xl font-semibold text-slate-800">Payment Verified</h3>
            <button onClick={() => setPaymentState('idle')} className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl mt-4 active:scale-95 transition-all shadow-lg text-sm">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeView;