
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types.ts';
import { Plus, ClipboardList, Calendar as CalendarIcon, X, Edit2, User as UserIcon, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';

interface TrainerViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  trainees: User[];
  onAddClass: (cls: AttendanceClass) => boolean;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onToggleAttendance: (classId: string, traineeId: string) => { success: boolean; message: string };
  onUpdateUser: (user: User) => void;
}

const TrainerView: React.FC<TrainerViewProps> = ({ user, classes, attendance, trainees, onAddClass, onUpdateClass, onDeleteClass, onToggleAttendance, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'profile'>('schedule');
  const [showModal, setShowModal] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', location: '', date: '', time: '' });
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: user.password || '' });

  useEffect(() => {
    if (showModal) {
      setClassError(null);
      if (editingClass) setForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
      else setForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
    }
  }, [editingClass, showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    if (editingClass) {
      onUpdateClass({ ...editingClass, ...form });
      setShowModal(false);
    } else {
      const success = onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...form, createdAt: Date.now() });
      if (success) {
        setShowModal(false);
      } else {
        setClassError("Error: A class with the same name, date, and time already exists.");
      }
    }
  };

  const emailWarning = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-inner">
        <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><CalendarIcon size={14} className="mx-auto mb-1"/> Schedule</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><UserIcon size={14} className="mx-auto mb-1"/> Settings</button>
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Public Sessions</h2>
            <button onClick={() => { setEditingClass(null); setShowModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={18}/></button>
          </div>
          <div className="space-y-4">
            {classes.map(cls => (
              <div key={cls.id} className={`bg-white p-5 rounded-[28px] border flex justify-between items-center shadow-sm ${cls.trainerId === user.id ? 'border-indigo-100' : 'border-slate-50 opacity-80'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">{cls.name}</h3>
                    {cls.trainerId === user.id && <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Mine</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{cls.date} @ {cls.time}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setSelectedClass(cls); setShowRoster(true); }} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ClipboardList size={18}/></button>
                  {cls.trainerId === user.id && (
                    <>
                      <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                      <button onClick={() => confirm("Delete session?") && onDeleteClass(cls.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={e => { e.preventDefault(); onUpdateUser({...user, ...profileData} as any); alert("Profile Updated"); }} className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-6 animate-in shadow-sm">
          <h3 className="text-lg font-bold text-center text-slate-800 tracking-tight">Trainer Settings</h3>
          {emailWarning && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100"><AlertTriangle size={12} className="inline mr-1"/> Warning: Changing your email will affect your login credentials.</p>}
          <div className="space-y-4">
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} placeholder="Name"/>
            <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} placeholder="Email"/>
            <input required type="password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-medium" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="Password"/>
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg transition-all text-sm uppercase tracking-widest">Update Profile</button>
        </form>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-4 shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'New Session'}</h3>
            {classError && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100"><AlertCircle size={12} className="inline mr-1"/> {classError}</p>}
            <input required placeholder="Session Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
            <input required placeholder="Location" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium transition-all" value={form.location} onChange={e => setForm({...form, location: e.target.value})}/>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
              <input required type="time" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={form.time} onChange={e => setForm({...form, time: e.target.value})}/>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg uppercase tracking-widest text-xs">Save Session</button>
            <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest text-center mt-2">Cancel</button>
          </form>
        </div>
      )}

      {showRoster && selectedClass && (
        <div className="fixed inset-0 bg-white z-[250] flex flex-col animate-in">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">Roster: {selectedClass.name}</h3>
            <button onClick={() => { setShowRoster(false); setRosterError(null); }} className="p-2 border rounded-full transition-colors hover:bg-slate-100 shadow-sm"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {rosterError && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 animate-in">
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-700 text-xs font-medium leading-relaxed">{rosterError}</p>
              </div>
            )}
            {trainees.map(t => {
              const isMarked = attendance.some(a => a.classId === selectedClass.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="p-5 bg-white rounded-[28px] flex justify-between items-center shadow-sm border border-slate-100">
                  <div className="flex-1 mr-4">
                    <div className="font-bold text-slate-800 text-sm leading-none">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{t.phoneNumber}</div>
                  </div>
                  <button onClick={() => {
                    setRosterError(null);
                    const res = onToggleAttendance(selectedClass.id, t.id);
                    if(!res.success) setRosterError(res.message);
                  }} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${isMarked ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-indigo-600 border-indigo-100'}`}>
                    {isMarked ? 'In Roster' : 'Check In'}
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
