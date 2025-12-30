
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, PaymentRecord, User, UserRole } from '../types';
import { LayoutDashboard, Users, Calendar, Plus, X, Edit2, ShieldCheck, ClipboardList, CheckCircle2, UserPlus, Trash2, TrendingUp, Package, AlertCircle, AlertTriangle, ChevronRight, History } from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminViewProps {
  user: User;
  classes: AttendanceClass[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  users: User[];
  packages: any[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onAddClass: (cls: AttendanceClass) => void;
  onUpdateClass: (cls: AttendanceClass) => void;
  onDeleteClass: (id: string) => void;
  onAddAttendance: (rec: AttendanceRecord) => { success: boolean; message: string };
  onToggleAttendance: (classId: string, traineeId: string) => { success: boolean; message: string };
  setPackages: (pkgs: any[]) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ user, classes, attendance, payments, users, packages, onAddUser, onUpdateUser, onAddClass, onUpdateClass, onDeleteClass, onAddAttendance, onToggleAttendance, setPackages }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'classes' | 'bookings' | 'packages' | 'profile'>('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<AttendanceClass | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  const [classForm, setClassForm] = useState({ name: '', location: '', date: '', time: '' });
  const [pkgForm, setPkgForm] = useState({ name: '', credits: 0, price: 0 });
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: '' });
  const [classError, setClassError] = useState<string | null>(null);

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
    if (editingClass) setClassForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
    else setClassForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
    setClassError(null);
  }, [editingClass, showClassModal]);

  useEffect(() => {
    if (editingPkg) setPkgForm({ name: editingPkg.name, credits: editingPkg.credits, price: editingPkg.price });
    else setPkgForm({ name: '', credits: 0, price: 0 });
  }, [editingPkg, showPkgModal]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const traineesCount = users.filter(u => u.role === UserRole.TRAINEE).length;
  const sessionsCount = classes.length;
  const bookingsCount = attendance.length;

  const chartData = classes.slice(0, 6).reverse().map(cls => ({
    name: cls.name.substring(0, 8),
    bookings: attendance.filter(a => a.classId === cls.id).length
  }));

  const handleDeleteClass = (id: string) => {
    if (confirm("Delete this session and all its records?")) onDeleteClass(id);
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);

    const isDuplicate = classes.some(c => 
      c.id !== (editingClass?.id || '') &&
      c.name.trim().toLowerCase() === classForm.name.trim().toLowerCase() &&
      c.date === classForm.date && 
      c.time === classForm.time
    );

    if (isDuplicate) {
      setClassError("A session with these details already exists.");
      return;
    }

    if (editingClass) onUpdateClass({ ...editingClass, ...classForm });
    else onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...classForm, qrSecret: 'SECRET', createdAt: Date.now() });
    
    setShowClassModal(false);
    setEditingClass(null);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...userForm, phoneNumber: userForm.phone });
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...userForm,
        phoneNumber: userForm.phone,
        credits: userForm.role === UserRole.TRAINEE ? 0 : undefined
      };
      onAddUser(newUser);
    }
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handlePkgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkg) setPackages(packages.map(p => p.id === editingPkg.id ? { ...p, ...pkgForm } : p));
    else setPackages([...packages, { id: Math.random().toString(36).substr(2, 9), ...pkgForm }]);
    setShowPkgModal(false);
    setEditingPkg(null);
  };

  const getTrainerName = (trainerId: string) => {
    const found = users.find(u => u.id === trainerId);
    return found ? found.name : 'Unknown';
  };

  const getTraineeName = (traineeId: string) => {
    const found = users.find(u => u.id === traineeId);
    return found ? found.name : 'Deleted User';
  };

  const getClassName = (classId: string) => {
    const found = classes.find(c => c.id === classId);
    return found ? found.name : 'Deleted Class';
  };

  const getClassDateTime = (classId: string) => {
    const found = classes.find(c => c.id === classId);
    return found ? `${found.date} ${found.time}` : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Navigation Bar - Refined weights */}
      <div className="flex bg-slate-100/80 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/50 snap-x scroll-smooth shadow-inner">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'classes', icon: Calendar, label: 'Classes' },
          { id: 'bookings', icon: History, label: 'Log' },
          { id: 'packages', icon: Package, label: 'Store' },
          { id: 'profile', icon: ShieldCheck, label: 'Admin' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 min-w-[70px] py-2 rounded-xl text-[10px] font-medium transition-all duration-200 snap-center shrink-0 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <tab.icon size={14} className="mx-auto mb-1" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'packages', icon: TrendingUp, value: `$${totalRevenue}`, label: 'Revenue', color: 'emerald' },
              { id: 'users', icon: Users, value: traineesCount, label: 'Trainees', color: 'indigo' },
              { id: 'classes', icon: Calendar, value: sessionsCount, label: 'Classes', color: 'amber' },
              { id: 'bookings', icon: ClipboardList, value: bookingsCount, label: 'Bookings', color: 'purple' }
            ].map(stat => (
              <div key={stat.id} onClick={() => setActiveTab(stat.id as any)} className="group cursor-pointer bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
                <stat.icon className={`text-${stat.color}-500 mb-2`} size={18} />
                <div className="text-xl font-semibold text-slate-800 tracking-tight">{stat.value}</div>
                <div className="text-[10px] font-medium text-slate-400 flex items-center justify-between">{stat.label} <ChevronRight size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" /></div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-64">
            <h4 className="text-[11px] font-medium text-slate-400 mb-4 flex items-center gap-2">Activity Overview</h4>
            <ResponsiveContainer width="100%" height="80%">
              <ReBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: '500', fontSize: '12px'}} />
                <Bar dataKey="bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1"><h3 className="font-medium text-slate-400 text-xs">Sessions Control</h3><button onClick={() => { setEditingClass(null); setShowClassModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={18}/></button></div>
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center text-slate-400 text-sm font-medium italic">No active sessions.</div>
            ) : classes.map(cls => (
              <div key={cls.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex justify-between items-center shadow-sm hover:bg-slate-50 transition-all">
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm tracking-tight">{cls.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{cls.date} • {cls.time}</div>
                  <div className="text-[9px] text-indigo-500 font-medium mt-1 flex items-center gap-1">By {getTrainerName(cls.trainerId)}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedClassForRoster(cls)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ClipboardList size={18}/></button>
                  <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                  <button onClick={() => handleDeleteClass(cls.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-in">
          <h3 className="font-medium text-slate-400 text-xs px-1">Attendance Records</h3>
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
            {attendance.length === 0 ? (
              <div className="p-12 text-center text-slate-300 font-medium text-xs">No records found</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {attendance.map(rec => (
                  <div key={rec.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="font-semibold text-slate-800 text-sm">{getTraineeName(rec.traineeId)}</div>
                      <div className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${rec.status === 'ATTENDED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {rec.status || 'BOOKED'}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {getClassName(rec.classId)} • {getClassDateTime(rec.classId)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1"><h3 className="font-medium text-slate-400 text-xs">Inventory</h3><button onClick={() => { setEditingPkg(null); setShowPkgModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg transition-transform active:scale-90"><Plus size={18}/></button></div>
          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex justify-between items-center shadow-sm">
                <div><div className="font-semibold text-slate-800 text-sm">{pkg.name}</div><div className="text-[10px] text-indigo-500 font-medium mt-0.5">{pkg.credits} Credits • ${pkg.price}</div></div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditingPkg(pkg); setShowPkgModal(true); }} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                  <button onClick={() => confirm("Delete package?") && setPackages(packages.filter(p => p.id !== pkg.id))} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1"><h3 className="font-medium text-slate-400 text-xs">Registry</h3><button onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: '' }); setShowUserModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg transition-transform active:scale-90"><Plus size={18}/></button></div>
          <div className="bg-white rounded-[32px] border border-slate-100 divide-y overflow-hidden shadow-sm">
            {users.map(u => (
              <div key={u.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div><div className="text-sm font-semibold text-slate-800">{u.name}</div><div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{u.email} • {u.role}</div></div>
                <button onClick={() => { setEditingUser(u); setUserForm({ name: u.name, email: u.email, phone: u.phoneNumber || '', role: u.role, password: u.password || '' }); setShowUserModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          onUpdateUser({ ...user, ...profileData, phoneNumber: profileData.phone }); 
          alert("Profile updated!"); 
        }} className="bg-white p-7 rounded-[32px] border border-slate-100 space-y-5 animate-in shadow-sm">
          <h3 className="text-lg font-semibold text-center text-slate-800">Identity Settings</h3>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Full Name</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}/>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Admin Email</label>
            <input required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-medium ${emailChanged ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})}/>
            {emailChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-medium">
                <AlertTriangle size={14} className="shrink-0" />
                <span>Email changes will update your login identity.</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Contact Phone</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})}/>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 ml-1">Access Password</label>
            <input type="password" required className={`w-full p-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-medium ${passwordChanged ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 focus:ring-2 focus:ring-indigo-500'}`} value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})}/>
            {passwordChanged && (
              <div className="flex gap-2 mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-medium">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Password updated. Will be required at next login.</span>
              </div>
            )}
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all mt-2 text-sm">Save Changes</button>
        </form>
      )}

      {/* MODALS remain unchanged */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
          <form onSubmit={handleClassSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-5 animate-in shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-xl text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'New Session'}</h3>
              <button type="button" onClick={() => setShowClassModal(false)}><X className="text-slate-400"/></button>
            </div>
            {classError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-medium flex gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{classError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500 ml-1">Title</label>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="HIIT Training" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})}/>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500 ml-1">Location</label>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="Studio 4" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 ml-1">Date</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 ml-1">Time</label>
                <input required type="time" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})}/>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg mt-2 transition-all active:scale-95 text-sm">Save Session</button>
          </form>
        </div>
      )}

      {selectedClassForRoster && (
        <div className="fixed inset-0 bg-white z-[250] flex flex-col animate-in">
          <div className="p-6 border-b flex justify-between items-center shrink-0 bg-slate-50 border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm">Attendance: {selectedClassForRoster.name}</h3>
            <button onClick={() => setSelectedClassForRoster(null)} className="p-2 bg-white shadow-sm border border-slate-100 rounded-full hover:bg-slate-50 transition-colors"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
            {users.filter(u => u.role === UserRole.TRAINEE).map(t => {
              const attendanceRecord = attendance.find(a => a.classId === selectedClassForRoster.id && a.traineeId === t.id);
              const isMarked = !!attendanceRecord;
              
              return (
                <div key={t.id} className="p-5 bg-white rounded-[28px] flex justify-between items-center shadow-sm border border-slate-100 transition-all hover:bg-slate-50">
                  <div className="flex-1 mr-4">
                    <div className="font-semibold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-tight">{t.email}</div>
                  </div>
                  <button 
                    onClick={() => {
                      const res = onToggleAttendance(selectedClassForRoster.id, t.id);
                      if (!res.success) alert(res.message);
                    }} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 border ${isMarked ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-indigo-600 border-indigo-100'}`}
                  >
                    {isMarked ? 'Marked' : 'Check In'}
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
