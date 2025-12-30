
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types';
import { Plus, ClipboardList, CheckCircle2, UserPlus, Calendar as CalendarIcon, X, Edit2, User as UserIcon, Trash2, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';

interface TrainerViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  trainees: User[];
  onAddClass: (cls: AttendanceClass) => void;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onAddAttendance: (rec: AttendanceRecord) => { success: boolean; message: string };
  onToggleAttendance: (classId: string, traineeId: string) => { success: boolean; message: string };
  onUpdateUser: (user: User) => void;
}

const TrainerView: React.FC<TrainerViewProps> = ({ user, classes, attendance, trainees, onAddClass, onUpdateClass, onDeleteClass, onAddAttendance, onToggleAttendance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'profile'>('classes');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [showRoster, setShowRoster] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  
  const [form, setForm] = useState({ name: '', location: '', date: '', time: '' });

  // Profile management state
  const [profileData, setProfileData] = useState({ 
    name: user.name, 
    email: user.email, 
    phone: user.phoneNumber || '',
    password: user.password || ''
  });

  // Sync profile data when user prop changes
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

  useEffect(() => {
    if (editingClass) setForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
    else setForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
    setClassError(null);
  }, [editingClass, showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);

    const isDuplicate = classes.some(c => 
      c.id !== (editingClass?.id || '') &&
      c.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
      c.date === form.date && 
      c.time === form.time
    );

    if (isDuplicate) {
      setClassError("A session with this name, date, and time already exists globally.");
      return;
    }

    if (editingClass) onUpdateClass({ ...editingClass, ...form });
    else onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...form, qrSecret: 'SECRET', createdAt: Date.now() });
    
    setShowModal(false);
    setEditingClass(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button onClick={() => setActiveTab('classes')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><CalendarIcon size={16} className="mx-auto mb-1"/> Sessions</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><UserIcon size={16} className="mx-auto mb-1"/> Profile</button>
      </div>

      {activeTab === 'classes' && (
        <div className="space-y-6 animate-in slide-in-from-left-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Schedule</h2><button onClick={() => { setEditingClass(null); setShowModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={18}/></button></div>
          <div className="space-y-4">
            {classes.length === 0 ? <div className="p-12 border-dashed border-2 rounded-[40px] text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">No Sessions Available</div> : classes.map(cls => {
              const mine = cls.trainerId === user.id;
              return (
                <div key={cls.id} className="bg-white p-5 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm transition-all hover:bg-slate-50">
                  <div>
                    <h3 className="font-black text-slate-800 leading-tight">{cls.name}</h3>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{cls.date} @ {cls.time}</div>
                    <div className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">{mine ? 'Created By You' : 'By Another Trainer'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedClass(cls); setShowRoster(true); }} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl transition-colors hover:bg-indigo-600 hover:text-white"><ClipboardList size={20}/></button>
                    {mine && (
                      <>
                        <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl transition-colors hover:bg-amber-600 hover:text-white"><Edit2 size={20}/></button>
                        <button onClick={() => confirm("Delete this session?") && onDeleteClass(cls.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl transition-colors hover:bg-rose-600 hover:text-white"><Trash2 size={20}/></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onUpdateUser({ ...user, ...profileData, phoneNumber: profileData.phone }); 
          alert("Trainer profile updated successfully!"); 
        }} className="bg-white p-6 rounded-[40px] border border-slate-100 space-y-4 animate-in slide-in-from-right-4 shadow-lg">
          <h3 className="text-xl font-black text-center text-slate-800 uppercase tracking-widest">Identity Settings</h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}/>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Access</label>
            <input required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all font-bold ${emailChanged ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})}/>
            {emailChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-bold leading-tight">
                <AlertTriangle size={14} className="shrink-0" />
                <span>WARNING: Email updates change your login identity.</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}/>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <input type="password" required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all font-bold ${passwordChanged ? 'border-amber-400 bg-amber-50/30' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})}/>
            {passwordChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-bold leading-tight">
                <ShieldCheck size={14} className="shrink-0" />
                <span>SECURITY: Updating your password will affect your next login.</span>
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-xs">Update Trainer Hub</button>
        </form>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-5 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-2xl text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'Host Session'}</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="text-slate-400"/></button>
            </div>
            {classError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{classError}</span>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Session Title</label>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="Session Title" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Venue / Location</label>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Date</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Time</label>
                <input required type="time" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs outline-none" value={form.time} onChange={e => setForm({...form, time: e.target.value})}/>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg mt-2 transition-transform active:scale-95 uppercase tracking-widest text-xs">Save Session</button>
          </form>
        </div>
      )}

      {showRoster && selectedClass && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col animate-in slide-in-from-bottom-6">
          <div className="p-6 border-b flex justify-between items-center shrink-0">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{selectedClass.name} Attendee List</h3>
            <button onClick={() => { setShowRoster(false); setSelectedClass(null); }} className="p-2 bg-slate-100 rounded-full transition-colors hover:bg-slate-200"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {trainees.map(t => {
              const attendanceRecord = attendance.find(a => a.classId === selectedClass.id && a.traineeId === t.id);
              const isMarked = !!attendanceRecord;
              
              return (
                <div key={t.id} className="p-5 bg-slate-50 rounded-[32px] flex justify-between items-center shadow-sm border border-slate-100 transition-all hover:bg-slate-100">
                  <div>
                    <div className="font-black text-slate-800">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t.email}</div>
                  </div>
                  <button 
                    onClick={() => {
                      const res = onToggleAttendance(selectedClass.id, t.id);
                      if (!res.success) alert(res.message);
                    }} 
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase shadow-sm transition-all active:scale-95 border ${isMarked ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-indigo-600 border-indigo-50'}`}
                  >
                    {isMarked ? (
                      <div className="flex items-center gap-1"><CheckCircle2 size={12}/> Marked</div>
                    ) : 'Mark Manual'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerView;
