
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, PaymentRecord, User, UserRole } from '../types.ts';
import { 
  LayoutDashboard, Users, Calendar, Plus, X, Edit2, ShieldCheck, 
  ClipboardList, UserPlus, Trash2, TrendingUp, Package, 
  AlertCircle, AlertTriangle, History, RefreshCw, MapPin, Search
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  users: User[];
  packages: any[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onAddClass: (cls: AttendanceClass) => boolean;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onToggleAttendance: (classId: string, traineeId: string) => { success: boolean; message: string };
  setPackages: (pkgs: any[]) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  user, classes, attendance, payments, users, packages, 
  onAddUser, onUpdateUser, onAddClass, onUpdateClass, 
  onDeleteClass, onToggleAttendance, setPackages 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'classes' | 'bookings' | 'packages' | 'profile'>('dashboard');
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<AttendanceClass | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [classError, setClassError] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [classForm, setClassForm] = useState({ name: '', location: '', date: '', time: '', maxCapacity: 15 });
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: '', credits: 0 });
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: user.password || '' });

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  useEffect(() => {
    if (showClassModal) {
      setClassError(null);
      if (editingClass) setClassForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time, maxCapacity: editingClass.maxCapacity || 15 });
      else setClassForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00', maxCapacity: 15 });
    }
  }, [editingClass, showClassModal]);

  useEffect(() => {
    if (showUserModal) {
      if (editingUser) {
        setUserForm({ 
          name: editingUser.name, 
          email: editingUser.email, 
          phone: editingUser.phoneNumber || '', 
          role: editingUser.role, 
          password: editingUser.password || '', 
          credits: editingUser.credits || 0 
        });
      } else {
        setUserForm({ 
          name: '', email: '', phone: '', role: UserRole.TRAINEE, 
          password: generateRandomPassword(), credits: 0 
        });
      }
    }
  }, [editingUser, showUserModal]);

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      onUpdateClass({ ...editingClass, ...classForm });
      setShowClassModal(false);
    } else {
      const success = onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...classForm, createdAt: Date.now() });
      if (success) setShowClassModal(false);
      else setClassError("Duplicate session (Name/Date/Time).");
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { id: editingUser?.id || Math.random().toString(36).substr(2, 9), ...userForm, phoneNumber: userForm.phone };
    if (editingUser) onUpdateUser(userData as any);
    else onAddUser(userData as any);
    setShowUserModal(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const chartData = classes.slice(-5).map(cls => ({
    name: cls.name.substring(0, 8),
    count: attendance.filter(a => a.classId === cls.id).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/50 shadow-inner">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'classes', icon: Calendar, label: 'Classes' },
          { id: 'bookings', icon: History, label: 'Log' },
          { id: 'profile', icon: ShieldCheck, label: 'Profile' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 min-w-[75px] py-2.5 rounded-xl text-[10px] font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <tab.icon size={14} className="mx-auto mb-1" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
              <TrendingUp className="text-emerald-500 mb-2" size={18} />
              <div className="text-xl font-bold text-slate-800">${totalRevenue}</div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Revenue</p>
            </div>
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
              <Users className="text-indigo-500 mb-2" size={18} />
              <div className="text-xl font-bold text-slate-800">{users.filter(u => u.role === UserRole.TRAINEE).length}</div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Trainees</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Users</h3>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"><UserPlus size={18}/></button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredUsers.length > 0 ? filteredUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-sm text-slate-800">{u.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight">{u.role} • {u.credits || 0} Credits</p>
                </div>
                <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-indigo-600"><Edit2 size={16}/></button>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">No users found</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sessions</h3>
            <button onClick={() => { setEditingClass(null); setShowClassModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={18}/></button>
          </div>
          <div className="space-y-3">
            {classes.map(cls => {
              const bookedCount = attendance.filter(a => a.classId === cls.id).length;
              const isFull = bookedCount >= cls.maxCapacity;
              return (
                <div key={cls.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{cls.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{cls.date} @ {cls.time}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isFull ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
                        {bookedCount}/{cls.maxCapacity}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-2 text-amber-500"><Edit2 size={18}/></button>
                    <button onClick={() => setSelectedClassForRoster(cls)} className="p-2 text-indigo-600"><ClipboardList size={18}/></button>
                    <button onClick={() => confirm("Delete?") && onDeleteClass(cls.id)} className="p-2 text-rose-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-in">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Activity Log</h3>
          <div className="space-y-3">
            {attendance.slice(0, 50).map(rec => {
              const trainee = users.find(u => u.id === rec.traineeId);
              const cls = classes.find(c => c.id === rec.classId);
              return (
                <div key={rec.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-800 text-xs uppercase">{trainee?.name || 'Unknown'}</span>
                      <p className={`text-[8px] font-bold px-1 py-0.5 rounded inline-block ml-2 uppercase ${rec.status === 'WAITLISTED' ? 'bg-slate-100 text-slate-500' : (rec.method === 'MANUAL' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600')}`}>
                        {rec.status === 'WAITLISTED' ? 'Waitlisted' : (rec.method === 'MANUAL' ? 'Marked by Staff' : 'Self Booked')}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-300 font-bold">{new Date(rec.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                  </div>
                  {cls && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={12} className="text-indigo-400"/>
                        <span className="text-[10px]">{cls.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={12} className="text-indigo-400"/>
                        <span className="text-[10px] truncate">{cls.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleClassSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-4 shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'New Session'}</h3>
            {classError && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-[10px] font-bold uppercase">{classError}</div>}
            <input required placeholder="Session Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})}/>
            <input required placeholder="Location" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-medium" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})}/>
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})}/>
              <input required type="time" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Capacity</label>
              <input required type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm font-bold" value={classForm.maxCapacity} onChange={e => setClassForm({...classForm, maxCapacity: parseInt(e.target.value)})}/>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg uppercase text-xs tracking-widest">Save Session</button>
            <button type="button" onClick={() => setShowClassModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest text-center">Cancel</button>
          </form>
        </div>
      )}

      {selectedClassForRoster && (
        <div className="fixed inset-0 bg-white z-[400] flex flex-col animate-in">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{selectedClassForRoster.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedClassForRoster.date} @ {selectedClassForRoster.time}</p>
            </div>
            <button onClick={() => { setSelectedClassForRoster(null); setRosterError(null); setRosterSearch(''); }} className="p-2 border rounded-full"><X size={18}/></button>
          </div>
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Find trainee in roster..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
            {rosterError && <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700 text-xs font-medium">{rosterError}</div>}
            {users.filter(u => u.role === UserRole.TRAINEE && u.name.toLowerCase().includes(rosterSearch.toLowerCase())).map(t => {
              const record = attendance.find(a => a.classId === selectedClassForRoster.id && a.traineeId === t.id);
              const isMarked = !!record;
              return (
                <div key={t.id} className="p-4 bg-white rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {t.credits || 0} Credits 
                      {record?.status === 'WAITLISTED' && <span className="ml-2 text-amber-600">• Waitlisted</span>}
                    </div>
                  </div>
                  <button onClick={() => {
                    setRosterError(null);
                    const res = onToggleAttendance(selectedClassForRoster.id, t.id);
                    if(!res.success) setRosterError(res.message);
                  }} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${isMarked ? (record.status === 'WAITLISTED' ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-500 text-white border-emerald-600 shadow-sm') : 'bg-white text-indigo-600 border-indigo-100'}`}>
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

export default AdminView;
