import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types.ts';
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
  const [showRoster, setShowRoster] = useState(false);
  
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', location: '', date: '', time: '' });

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
      setClassError("A session with these details already exists.");
      return;
    }
    if (editingClass) onUpdateClass({ ...editingClass, ...form });
    else onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...form, qrSecret: 'SECRET', createdAt: Date.now() });
    setShowModal(false);
    setEditingClass(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100/60 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
        <button onClick={() => setActiveTab('classes')} className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all ${activeTab === 'classes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><CalendarIcon size={16} className="mx-auto mb-1"/> Sessions</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><UserIcon size={16} className="mx-auto mb-1"/> Profile</button>
      </div>

      {activeTab === 'classes' && (
        <div className="space-y-6 animate-in">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Schedule</h2>
            <button onClick={() => { setEditingClass(null); setShowModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={18}/></button>
          </div>
          <div className="space-y-4">
            {classes.length === 0 ? (
              <div className="p-12 border-dashed border-2 rounded-[32px] text-center text-slate-300 font-medium text-xs">No active sessions found.</div>
            ) : (
              classes.map(cls => (
                <div key={cls.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex justify-between items-center shadow-sm hover:bg-slate-50 transition-all">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight tracking-tight">{cls.name}</h3>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">{cls.date} @ {cls.time}</div>
                    {cls.trainerId !== user.id && (
                      <div className="text-[9px] text-indigo-400 font-bold mt-1 uppercase tracking-tighter italic">External Session</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedClass(cls); setShowRoster(true); }} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="View Roster"><ClipboardList size={18}/></button>
                    {cls.trainerId === user.id && (
                      <>
                        <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Edit Session"><Edit2 size={18}/></button>
                        <button onClick={() => confirm("Delete this session?") && onDeleteClass(cls.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Session"><Trash2 size={18}/></button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onUpdateUser({ ...user, ...profileData, phoneNumber: profileData.phone }); 
          alert("Profile updated!"); 
        }} className="bg-white p-7 rounded-[32px] border border-slate-100 space-y-5 animate-in shadow-sm">
          <h3 className="text-lg font-semibold text-center text-slate-800">Account Settings</h3>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Full Name</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Trainer Email</label>
            <input required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-medium ${emailChanged ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})}/>
            {emailChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-medium">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Changing your email updates your login credentials.</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Contact Phone</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Secure Password</label>
            <input type="password" required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-medium ${passwordChanged ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})}/>
            {passwordChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-medium">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Password change detected. It will be required at next login.</span>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all text-sm">Save Profile</button>
        </form>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6 animate-in shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'New Session'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
            </div>
            {classError && <div className="p-3 bg-rose-50 text-rose-600 text-[10px] rounded-xl font-bold flex items-center gap-2 border border-rose-100"><AlertCircle size={14}/> {classError}</div>}
            <div className="space-y-4">
              <input required placeholder="Session Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
              <input required placeholder="Location" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={form.location} onChange={e => setForm({...form, location: e.target.value})}/>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs focus:ring-2 focus:ring-indigo-500" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
                <input required type="time" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs focus:ring-2 focus:ring-indigo-500" value={form.time} onChange={e => setForm({...form, time: e.target.value})}/>
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider">
              {editingClass ? 'Save Changes' : 'Launch Session'}
            </button>
          </form>
        </div>
      )}

      {showRoster && selectedClass && (
        <div className="fixed inset-0 bg-white z-[250] flex flex-col animate-in">
          <div className="p-6 border-b flex justify-between items-center shrink-0 bg-slate-50 border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Roster: {selectedClass.name}</h3>
            <button onClick={() => { setShowRoster(false); setSelectedClass(null); }} className="p-2 bg-white border border-slate-100 rounded-full transition-colors hover:bg-slate-100 shadow-sm"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {trainees.map(t => {
              const attendanceRecord = attendance.find(a => a.classId === selectedClass.id && a.traineeId === t.id);
              const isMarked = !!attendanceRecord;
              return (
                <div key={t.id} className="p-5 bg-white rounded-[28px] flex justify-between items-center shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 mr-4">
                    <div className="font-semibold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-tight">{t.email}</div>
                  </div>
                  <button onClick={() => onToggleAttendance(selectedClass.id, t.id)} className={`px-4 py-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 border ${isMarked ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-white text-indigo-600 border-indigo-100'}`}>
                    {isMarked ? 'Signed In' : 'Sign In'}
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