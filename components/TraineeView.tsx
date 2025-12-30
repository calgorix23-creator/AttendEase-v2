
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord } from '../types';
import { History, ShoppingBag, CheckCircle2, ChevronRight, Calendar, Clock, User as UserIcon, AlertTriangle, ShieldCheck, AlertCircle, CalendarDays } from 'lucide-react';

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
  const passwordChanged = profileData.password !== user.password && profileData.password !== '';

  const getLocalDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } catch {
      return new Date();
    }
  };

  // Logic: Only show classes that haven't started yet. 
  const upcomingClasses = classes.filter(cls => {
    const classDateTime = getLocalDateTime(cls.date, cls.time);
    return classDateTime.getTime() > Date.now();
  }).sort((a, b) => {
    const timeA = getLocalDateTime(a.date, a.time).getTime();
    const timeB = getLocalDateTime(b.date, b.time).getTime();
    return timeA - timeB;
  });

  // History tab: show bookings for past classes
  const pastBookings = attendance.filter(a => {
    if (a.traineeId !== user.id) return false;
    const cls = classes.find(c => c.id === a.classId);
    if (!cls) return false;
    const classDateTime = getLocalDateTime(cls.date, cls.time);
    return classDateTime.getTime() <= Date.now();
  });

  const isUserRegistered = (classId: string) => attendance.some(a => a.classId === classId && a.traineeId === user.id);

  const handleCancelClick = (cls: AttendanceClass) => {
    const res = onCancel(cls.id, user.id);
    if (res.message) {
      alert(res.message);
    }
  };

  const initiatePurchase = (pkg: any) => {
    setSelectedPkg(pkg);
    setPaymentState('processing');
    setTimeout(() => {
      onPurchase({ id: Math.random().toString(36).substr(2, 9), traineeId: user.id, amount: pkg.price, credits: pkg.credits, timestamp: Date.now(), status: 'SUCCESS' });
      setPaymentState('success');
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar gap-1 snap-x">
        {[
          { id: 'schedule', icon: CalendarDays, label: 'CLASSES' },
          { id: 'history', icon: History, label: 'HISTORY' },
          { id: 'shop', icon: ShoppingBag, label: 'SHOP' },
          { id: 'profile', icon: UserIcon, label: 'PROFILE' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[75px] py-2 rounded-lg text-[9px] font-bold transition-all snap-center ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
            <tab.icon size={14} className="mx-auto mb-1"/> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Upcoming Sessions</h2>
            <div className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
              <AlertCircle size={10} /> 30m cancel policy
            </div>
          </div>
          {upcomingClasses.length === 0 ? (
            <div className="p-12 border-dashed border-2 rounded-3xl text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No future sessions found</div>
          ) : (
            upcomingClasses.map(cls => {
              const registered = isUserRegistered(cls.id);
              const classTime = getLocalDateTime(cls.date, cls.time);
              const cancelDeadline = new Date(classTime.getTime() - 30 * 60 * 1000);
              const canStillCancel = cancelDeadline.getTime() > Date.now();

              return (
                <div key={cls.id} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-4 shadow-sm transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg text-slate-800 leading-tight">{cls.name}</h3>
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1 mt-1">
                        <Calendar size={12}/> {cls.date} @ {cls.time}
                      </div>
                      <div className="text-[10px] text-indigo-500 font-black uppercase mt-1 tracking-tight">Venue: {cls.location}</div>
                    </div>
                    {registered && <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black border border-emerald-100 uppercase tracking-widest">Booked</div>}
                  </div>
                  {!registered ? (
                    <button 
                      onClick={() => { 
                        const res = onRegister({ 
                          id: Math.random().toString(36).substr(2, 9), 
                          classId: cls.id, 
                          traineeId: user.id, 
                          timestamp: Date.now(), 
                          method: 'APP', 
                          status: 'BOOKED' 
                        }); 
                        alert(res.message); 
                      }} 
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform shadow-lg shadow-indigo-100"
                    >
                      Book Session (1 Credit)
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 ${canStillCancel ? 'bg-slate-50 text-slate-500 border border-slate-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        <Clock size={14} /> 
                        <span>{canStillCancel ? `Refund Deadline: ${cancelDeadline.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'No Refund Possible'}</span>
                      </div>
                      <button 
                        onClick={() => handleCancelClick(cls)} 
                        className={`w-full py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform border ${canStillCancel ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'}`}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in">
          <h2 className="text-xl font-bold">Past Bookings</h2>
          {pastBookings.length === 0 ? (
            <div className="p-12 border-dashed border-2 rounded-3xl text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No past activities</div>
          ) : (
            pastBookings.map(rec => {
              const cls = classes.find(c => c.id === rec.classId);
              return (
                <div key={rec.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">{cls?.name || 'Unknown Session'}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{cls?.date} • {cls?.time}</div>
                  </div>
                  <div className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Completed</div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-[10px] font-bold uppercase mb-1">Available Wallet</p>
              <h2 className="text-4xl font-black">{user.credits ?? 0} Credits</h2>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShoppingBag size={80}/></div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {packages.map(pkg => (
              <button key={pkg.id} onClick={() => initiatePurchase(pkg)} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group shadow-sm active:scale-[0.98] transition-all hover:border-indigo-200">
                <div className="text-left">
                  <div className="font-bold text-slate-800">{pkg.name}</div>
                  <div className="text-xs text-slate-500 font-normal">{pkg.credits} Credits</div>
                </div>
                <div className="text-lg font-black text-indigo-600">${pkg.price} <ChevronRight size={16} className="inline text-slate-300 group-hover:text-indigo-600 transition-colors"/></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onUpdateUser({ ...user, ...profileData, phoneNumber: profileData.phone }); 
          alert("Profile updated successfully!"); 
        }} className="bg-white p-6 rounded-[40px] border border-slate-100 space-y-4 animate-in slide-in-from-right-4 shadow-lg">
          <h3 className="text-xl font-black text-center text-slate-800 uppercase tracking-widest">Account Settings</h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}/>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Email</label>
            <input required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all font-bold ${emailChanged ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})}/>
            {emailChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-bold leading-tight">
                <AlertTriangle size={14} className="shrink-0" />
                <span>WARNING: Email updates change your login identity.</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}/>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <input type="password" required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all font-bold ${passwordChanged ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})}/>
            {passwordChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-bold leading-tight">
                <ShieldCheck size={14} className="shrink-0" />
                <span>SECURITY: Updating your password will affect your next login.</span>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-[24px] shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs">Save Profile</button>
        </form>
      )}

      {paymentState === 'processing' && (
        <div className="fixed inset-0 bg-slate-900/80 z-[300] flex items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center space-y-6 animate-in zoom-in">
             <div className="relative w-24 h-24 mx-auto border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
             <h3 className="text-xl font-bold text-slate-800">Verifying Transaction...</h3>
             <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest"><ShieldCheck size={14} className="text-emerald-500" /> Secure 256-bit SSL Encryption</div>
          </div>
        </div>
      )}

      {paymentState === 'success' && (
        <div className="fixed inset-0 bg-slate-900/60 z-[310] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center space-y-4 animate-in zoom-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={40} /></div>
            <h3 className="text-2xl font-black text-slate-800">Purchase Successful</h3>
            <p className="text-slate-500 text-sm">Your credit balance has been topped up successfully!</p>
            <button onClick={() => setPaymentState('idle')} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl mt-4 active:scale-95 transition-transform shadow-lg shadow-indigo-100">Great, thanks!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeView;
