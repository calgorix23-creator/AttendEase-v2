
import React, { useState } from 'react';
import { AttendanceClass, AttendanceRecord, User, PaymentRecord } from '../types.ts';
import { History, ShoppingBag, CheckCircle2, ChevronRight, Calendar, User as UserIcon, CalendarDays, ClipboardCheck, MapPin, AlertCircle, Users } from 'lucide-react';

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

  const getMyRecord = (classId: string) => attendance.find(a => a.classId === classId && a.traineeId === user.id);
  
  const canCancel = (cls: AttendanceClass) => {
    const classTime = new Date(`${cls.date}T${cls.time}`).getTime();
    return Date.now() < (classTime - 30 * 60 * 1000);
  };

  const upcomingClasses = classes.filter(cls => new Date(`${cls.date}T${cls.time}`).getTime() > Date.now())
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const userAttendanceRecords = attendance
    .filter(a => a.traineeId === user.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleBooking = (cls: AttendanceClass) => {
    setBookingError(null);
    const bookedCount = attendance.filter(a => a.classId === cls.id && a.status !== 'WAITLISTED').length;
    const isFull = bookedCount >= cls.maxCapacity;

    const result = onRegister({ 
      id: Math.random().toString(36).substr(2, 9), 
      classId: cls.id, traineeId: user.id, timestamp: Date.now(), 
      method: 'APP', status: isFull ? 'WAITLISTED' : 'BOOKED' 
    });
    if (!result.success) setBookingError({ classId: cls.id, message: result.message });
  };

  const handlePurchaseClick = (pkg: any) => {
    setPaymentState('processing');
    setTimeout(() => {
      onPurchase({
        id: Math.random().toString(36).substr(2, 9), traineeId: user.id,
        amount: pkg.price, credits: pkg.credits, timestamp: Date.now(), status: 'SUCCESS'
      });
      setPaymentState('success');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
        {[
          { id: 'schedule', icon: CalendarDays, label: 'Schedule' },
          { id: 'history', icon: History, label: 'Logs' },
          { id: 'shop', icon: ShoppingBag, label: 'Store' },
          { id: 'profile', icon: UserIcon, label: 'Account' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>
            <tab.icon size={14} className="mx-auto mb-1"/> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-in">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Available Credits</p>
              <h2 className="text-3xl font-bold tracking-tight">{user.credits ?? 0}</h2>
            </div>
            <Users size={80} className="absolute -right-4 -bottom-4 text-white/10" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">Discover Classes</h2>
          {upcomingClasses.map(cls => {
            const myRecord = getMyRecord(cls.id);
            const registered = !!myRecord;
            const cancellationLocked = registered && !canCancel(cls);
            
            const bookedCount = attendance.filter(a => a.classId === cls.id && a.status !== 'WAITLISTED').length;
            const isFull = bookedCount >= cls.maxCapacity;
            const waitlistCount = attendance.filter(a => a.classId === cls.id && a.status === 'WAITLISTED').length;
            const myWaitlistRank = myRecord?.status === 'WAITLISTED' 
              ? attendance.filter(a => a.classId === cls.id && a.status === 'WAITLISTED' && a.timestamp <= myRecord.timestamp).length
              : null;

            return (
              <div key={cls.id} className="bg-white p-6 rounded-[28px] border border-slate-100 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{cls.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                        <Calendar size={12}/> {cls.date} • {cls.time}
                      </div>
                      <div className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isFull ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {bookedCount}/{cls.maxCapacity} Full
                      </div>
                    </div>
                  </div>
                  {registered && (
                    <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${myRecord.status === 'WAITLISTED' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {myRecord.status === 'WAITLISTED' ? 'Waitlisted' : 'Booked'}
                    </div>
                  )}
                </div>

                {myWaitlistRank && (
                  <div className="bg-amber-50 p-3 rounded-xl flex items-center gap-3 text-amber-700">
                    <History size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-wide">You are #{myWaitlistRank} on the waitlist</p>
                  </div>
                )}

                {bookingError?.classId === cls.id && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-[10px] font-bold uppercase flex gap-2 border border-rose-100 animate-in">
                    <AlertCircle size={14}/> {bookingError.message}
                  </div>
                )}
                
                {cancellationLocked && (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg text-center border border-amber-100 uppercase tracking-widest">
                    Cancellation Locked (30m Rule)
                  </p>
                )}

                <button 
                  onClick={() => registered ? onCancel(cls.id, user.id) : handleBooking(cls)} 
                  disabled={cancellationLocked}
                  className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${registered ? (cancellationLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent' : 'bg-white text-rose-500 border border-rose-100 shadow-sm') : (isFull ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100')}`}
                >
                  {registered ? 'Cancel Booking' : (isFull ? `Join Waitlist (${waitlistCount})` : 'Book Session (1 Credit)')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">Activity Log</h2>
          {userAttendanceRecords.length > 0 ? userAttendanceRecords.map(rec => {
            const cls = classes.find(c => c.id === rec.classId);
            return (
              <div key={rec.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{cls?.name || 'Deleted Session'}</h4>
                  <span className={`text-[8px] font-bold px-2 py-1 rounded uppercase tracking-widest ${rec.status === 'WAITLISTED' ? 'bg-slate-50 text-slate-400' : (rec.method === 'MANUAL' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}`}>
                    {rec.status === 'WAITLISTED' ? 'Waitlisted' : (rec.method === 'MANUAL' ? 'Marked by Staff' : 'Self Booked')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5"><Calendar size={12} className="text-indigo-300"/> {cls?.date} {cls?.time}</div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 truncate"><MapPin size={12} className="text-indigo-300"/> {cls?.location}</div>
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center opacity-40 uppercase text-[10px] font-bold tracking-widest">No history yet</div>
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="space-y-4 animate-in">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight px-1">Top-up Store</h2>
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => handlePurchaseClick(pkg)} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group shadow-sm active:scale-[0.98] transition-all hover:border-indigo-100 w-full">
              <div className="text-left">
                <div className="font-bold text-slate-800 text-sm">{pkg.name}</div>
                <div className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">{pkg.credits} Credits</div>
              </div>
              <div className="text-lg font-bold text-indigo-600 flex items-center gap-1">${pkg.price} <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors"/></div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={e => { e.preventDefault(); onUpdateUser({...user, ...profileData} as any); alert("Updated"); }} className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4 shadow-sm animate-in">
          <h3 className="text-center font-bold text-slate-800 tracking-tight">Account Information</h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">NAME</label>
            <input required className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:border-indigo-100" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} placeholder="Full Name"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">EMAIL</label>
            <input required type="email" className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:border-indigo-100" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} placeholder="Email"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">PASSWORD</label>
            <input required type="password" className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:border-indigo-100" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="Password"/>
          </div>
          <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg mt-4">Save Changes</button>
        </form>
      )}

      {paymentState === 'processing' && (
        <div className="fixed inset-0 bg-slate-900/40 z-[300] flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center space-y-6 shadow-2xl">
             <div className="w-12 h-12 mx-auto border-[3px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
             <p className="font-bold text-slate-800 uppercase tracking-widest text-xs">Processing Top-up...</p>
          </div>
        </div>
      )}

      {paymentState === 'success' && (
        <div className="fixed inset-0 bg-slate-900/30 z-[310] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-10 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800">Payment Successful</h3>
            <p className="text-slate-500 text-sm">Credits added to wallet.</p>
            <button onClick={() => setPaymentState('idle')} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl uppercase tracking-widest text-xs shadow-lg">Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineeView;
