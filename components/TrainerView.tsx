
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, User } from '../types.ts';
import { Plus, ClipboardList, Calendar as CalendarIcon, X, Edit2, User as UserIcon, Trash2, AlertCircle, Search } from 'lucide-react';

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
  const [scheduleFilter, setScheduleFilter] = useState<'today' | 'upcoming'>('today');
  const [showModal, setShowModal] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AttendanceClass | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', location: '', date: '', time: '', maxCapacity: 15 });
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: user.password || '' });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (showModal) {
      setClassError(null);
      if (editingClass) setForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time, maxCapacity: editingClass.maxCapacity || 15 });
      else setForm({ name: '', location: '', date: todayStr, time: '10:00', maxCapacity: 15 });
    }
  }, [editingClass, showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      onUpdateClass({ ...editingClass, ...form });
      setShowModal(false);
    } else {
      const success = onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...form, createdAt: Date.now() });
      if (success) setShowModal(false);
      else setClassError("Duplicate session details found.");
    }
  };

  const filteredClasses = classes.filter(cls => {
    if (scheduleFilter === 'today') return cls.date === todayStr;
    return cls.date > todayStr;
  }).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
        <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><CalendarIcon size={14} className="mx-auto mb-1"/> Schedule</button>
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><UserIcon size={14} className="mx-auto mb-1"/> Settings</button>
      </div>

      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sessions</h2>
            <button onClick={() => { setEditingClass(null); setShowModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={18}/></button>
          </div>

          <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-100 shadow-sm">
            <button onClick={() => setScheduleFilter('today')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${scheduleFilter === 'today' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>Today</button>
            <button onClick={() => setScheduleFilter('upcoming')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${scheduleFilter === 'upcoming' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>Upcoming</button>
          </div>

          <div className="space-y-4">
            {filteredClasses.length > 0 ? filteredClasses.map(cls => {
              const bookedCount = attendance.filter(a => a.classId === cls.id).length;
              const isFull = bookedCount >= cls.maxCapacity;
              return (
                <div key={cls.id} className={`bg-white p-5 rounded-[28px] border flex justify-between items-center shadow-sm ${cls.trainerId === user.id ? 'border-indigo-100 shadow-indigo-50/50' : 'border-slate-50 opacity-80'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{cls.name}</h3>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isFull ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {bookedCount}/{cls.maxCapacity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">{cls.date} @ {cls.time}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedClass(cls); setShowRoster(true); }} className="p-2.5 text-indigo-600"><ClipboardList size={18}/></button>
                    {cls.trainerId === user.id && (
                      <>
                        <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="p-2.5 text-amber-500"><Edit2 size={18}/></button>
                        <button onClick={() => confirm("Delete session?") && onDeleteClass(cls.id)} className="p-2.5 text-rose-500"><Trash2 size={18}/></button>
                      </>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center space-y-3">
                <CalendarIcon className="mx-auto text-slate-200" size={48} />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No sessions scheduled</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={e => { e.preventDefault(); onUpdateUser({...user, ...profileData} as any); alert("Updated"); }} className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4 shadow-sm animate-in">
          <h3 className="text-lg font-bold text-center text-slate-800 tracking-tight">Trainer Settings</h3>
          <input required className="w-full p-4 bg-slate-50 border rounded-2xl text-sm" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} placeholder="Name"/>
          <input required type="email" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} placeholder="Email"/>
          <input required type="password" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="Password"/>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest">Update Profile</button>
        </form>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-4 shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'New Session'}</h3>
            {classError && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-[10px] font-bold uppercase">{classError}</div>}
            <input required placeholder="Session Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
            <input required placeholder="Location" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium" value={form.location} onChange={e => setForm({...form, location: e.target.value})}/>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={form.date} onChange={e => setForm({...form, date: e.target.value})}/>
              <input required type="time" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={form.time} onChange={e => setForm({...form, time: e.target.value})}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Capacity</label>
              <input required type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-bold" value={form.maxCapacity} onChange={e => setForm({...form, maxCapacity: parseInt(e.target.value)})}/>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg uppercase text-xs tracking-widest">Save Session</button>
            <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest text-center mt-2">Cancel</button>
          </form>
        </div>
      )}

      {showRoster && selectedClass && (
        <div className="fixed inset-0 bg-white z-[400] flex flex-col animate-in">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Attendance List</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedClass.name}</p>
            </div>
            <button onClick={() => { setShowRoster(false); setRosterError(null); setRosterSearch(''); }} className="p-2 border rounded-full"><X size={18}/></button>
          </div>
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Find trainee in list..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30">
            {rosterError && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 animate-in">
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-700 text-xs font-medium leading-relaxed">{rosterError}</p>
              </div>
            )}
            {trainees.filter(t => t.name.toLowerCase().includes(rosterSearch.toLowerCase())).map(t => {
              const record = attendance.find(a => a.classId === selectedClass.id && a.traineeId === t.id);
              const isMarked = !!record;
              return (
                <div key={t.id} className="p-5 bg-white rounded-[28px] flex justify-between items-center shadow-sm border border-slate-100">
                  <div className="flex-1 mr-4">
                    <div className="font-bold text-slate-800 text-sm leading-none">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                      {t.credits || 0} Credits
                      {record?.status === 'WAITLISTED' && <span className="ml-2 text-amber-600 font-black">• Waitlisted</span>}
                    </div>
                  </div>
                  <button onClick={() => {
                    setRosterError(null);
                    const res = onToggleAttendance(selectedClass.id, t.id);
                    if(!res.success) setRosterError(res.message);
                  }} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${isMarked ? (record.status === 'WAITLISTED' ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-500 text-white border-emerald-600') : 'bg-white text-indigo-600 border-indigo-100'}`}>
                    {isMarked ? (record.status === 'WAITLISTED' ? 'Promote' : 'Remove') : 'Check In'}
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
