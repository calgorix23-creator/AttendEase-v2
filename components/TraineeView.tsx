
import React, { useState } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord } from '../types.ts';
import { History, ShoppingBag, CheckCircle2, ChevronRight, Calendar, Clock, User as UserIcon, CalendarDays, ClipboardCheck, AlertTriangle, AlertCircle, MapPin } from 'lucide-react';

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
  const [bookingError, setBookingError] = useState<{classId: string, message: string} | null>(null);
  
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: user.password || '' });

  const isUserRegistered = (classId: string) => attendance.some(a => a.classId === classId && a.traineeId === user.id);

  const isPastClass = (cls: AttendanceClass) => {
    const classTime = new Date(`${cls.date}T${cls.time}`).getTime();
    return classTime < Date.now();
  };

  const canCancel = (cls: AttendanceClass) => {
    const classTime = new Date(`${cls.date}T${cls.time}`).getTime();
    const limit = classTime - (30 * 60 * 1000);
    return Date.now() < limit;
  };

  const upcomingClasses = classes.filter(cls => !isPastClass(cls))
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const userAttendanceRecords = attendance
    .filter(a => a.traineeId === user.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const getClassData = (classId: string) => classes.find(c => c.id === classId);

  const handleBooking = (cls: AttendanceClass) => {
    setBookingError(null);
    const result = onRegister({ 
      id: Math.random().toString(36).substr(2, 9), 
      classId: cls.id, 
      traineeId: user.id, 
      timestamp: Date.now(), 
      method: 'APP', 
      status: 'BOOKED' 
    });
    if (!result.success) {
      setBookingError({ classId: cls.id, message: result.message });
    }
  };

  const handleCancel = (cls: AttendanceClass) => {
    setBookingError(null);
    if (!canCancel(cls)) {
      setBookingError({ classId: cls.id, message: "Cancellations are locked within 30 minutes of the session starting." });
      return;
    }
    onCancel(cls.id, user.id);
  };

  const handlePurchaseClick = (pkg: any) => {
    setPaymentState('processing');
    setTimeout(() => {
      onPurchase({
        id: Math.random().toString(36).substr(2, 9),
        traineeId: user.id,
        amount: pkg.price,
        credits: pkg.credits,
        timestamp: Date.now(),
        status: 'SUCCESS'
      });
      setPaymentState('success');
    }, 1500);
  };

  const emailWarning = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100/60 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/50">
        {[
          { id: 'schedule', icon: CalendarDays, label: 'Sessions' },
          { id: 'history', icon: History, label: 'Logs' },
          { id: 'shop', icon: ShoppingBag, label: 'Store' },
          { id: 'profile', icon: UserIcon, label: 'Profile' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[10px] font-medium transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>
            <tab.icon size={14} className="mx-auto mb-1"/> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-in">
          <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Wallet Balance</p>
            <h2 className="text-3xl font-bold tracking-tight">{user.credits ?? 0} Credits</h2>
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShoppingBag size={80}/></div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">Upcoming Classes</h2>
          {upcomingClasses.length === 0 ? (
            <div className="p-12 text-center text-slate-300 font-bold text-xs uppercase italic">No sessions found</div>
          ) : (
            upcomingClasses.map(cls => {
              const registered = isUserRegistered(cls.id);
              const cancellationLocked = registered && !canCancel(cls);
              const errorForThisClass = bookingError?.classId === cls.id;

              return (
                <div key={cls.id} className="bg-white p-6 rounded-[28px] border border-slate-100 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 leading-tight">{cls.name}</h3>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                        <Calendar size={12}/> {cls.date} • {cls.time}
                      </div>
                    </div>
                    {registered && <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-bold border border-emerald-100 uppercase tracking-widest">Booked</div>}
                  </div>
                  
                  {errorForThisClass && (
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 animate-in">
                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-rose-700 text-[10px] font-medium leading-relaxed">{bookingError.message}</p>
                    </div>
                  )}

                  {cancellationLocked && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg text-center border border-amber-100">Cancellation Locked (30m Rule)</p>}
                  
                  <button 
                    onClick={() => registered ? handleCancel(cls) : handleBooking(cls)} 
                    disabled={cancellationLocked}
                    className={`w-full py-4 rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-lg uppercase tracking-widest ${registered ? (cancellationLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-white text-rose-500 border border-rose-100') : 'bg-indigo-600 text-white'}`}
                  >
                    {registered ? 'Cancel Booking' : 'Book (1 Credit)'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">My Activity Log</h2>
          {userAttendanceRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-300 font-bold text-xs italic">No activity yet</div>
          ) : (
            <div className="space-y-4">
              {userAttendanceRecords.map(rec => {
                const cls = getClassData(rec.classId);
                return (
                  <div key={rec.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${rec.method === 'MANUAL' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                        <h4 className="font-bold text-slate-800 text-sm">{cls?.name || 'Deleted Session'}</h4>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${rec.method === 'MANUAL' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {rec.method === 'MANUAL' ? 'Marked by Staff' : 'Self Booked'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Scheduled For</span>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-700 font-medium text-[10px]">
                          <Calendar size={10} className="text-slate-300"/>
                          {cls ? `${cls.date} • ${cls.time}` : 'N/A'}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Location</span>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-700 font-medium text-[10px] truncate">
                          <MapPin size={10} className="text-slate-300"/>
                          {cls?.location || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Check-in at: {new Date(rec.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                      <ClipboardCheck size={14} className="text-indigo-400 opacity-40"/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">Top up Wallet</h2>
          <div className="grid grid-cols-1 gap-3">
            {packages.map((pkg: any) => (
              <button key={pkg.id} onClick={() => handlePurchaseClick(pkg)} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group shadow-sm active:scale-[0.98] transition-all hover:border-indigo-100">
                <div className="text-left">
                  <div className="font-bold text-slate-800 text-sm">{pkg.name}</div>
                  <div className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">{pkg.credits} Credits</div>
                </div>
                <div className="text-lg font-bold text-indigo-600 flex items-center gap-1">${pkg.price} <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors"/></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={e => { e.preventDefault(); onUpdateUser({...user, ...profileData} as any); alert("Updated"); }} className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4 shadow-sm animate-in">
          <h3 className="text-center font-bold text-slate-800">My Account</h3>
          {emailWarning && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100"><AlertTriangle size={12} className="inline mr-1"/> Warning: Changing your email will affect your login credentials.</p>}
          <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} placeholder="Name"/>
          <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} placeholder="Email"/>
          <input required type="password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="Password"/>
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Save Changes</button>
        </form>
      )}

      {paymentState === 'processing' && (
        <div className="fixed inset-0 bg-slate-900/40 z-[300] flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center space-y-6 shadow-2xl">
             <div className="w-12 h-12 mx-auto border-[3px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
             <p className="font-bold text-slate-800 uppercase tracking-widest text-xs">Verifying Payment...</p>
          </div>
        </div>
      )}

      {paymentState === 'success' && (
        <div className="fixed inset-0 bg-slate-900/30 z-[310] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-10 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800">Success!</h3>
            <p className="text-slate-500 text-sm">Your credits have been added to your wallet.</p>
            <button onClick={() => setPaymentState('idle')} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl uppercase tracking-widest text-xs">Awesome</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeView;
