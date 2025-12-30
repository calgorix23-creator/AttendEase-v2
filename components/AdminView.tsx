import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, PaymentRecord, User, UserRole } from '../types.ts';
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
  const [showClassModal, setShowClassModal] = useState(false);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<AttendanceClass | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  const [classForm, setClassForm] = useState({ name: '', location: '', date: '', time: '' });
  const [pkgForm, setPkgForm] = useState({ name: '', credits: 0, price: 0 });
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: 'password123' });
  
  const [classError, setClassError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

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
    if (editingUser) setUserForm({ name: editingUser.name, email: editingUser.email, phone: editingUser.phoneNumber || '', role: editingUser.role, password: editingUser.password || 'password123' });
    else setUserForm({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: 'password123' });
    setUserError(null);
  }, [editingUser, showUserModal]);

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
    setUserError(null);
    const isDuplicate = users.some(u => u.id !== (editingUser?.id || '') && u.email.toLowerCase() === userForm.email.toLowerCase());
    if (isDuplicate) {
      setUserError("This email is already in use.");
      return;
    }
    if (editingUser) onUpdateUser({ ...editingUser, ...userForm, phoneNumber: userForm.phone });
    else onAddUser({ id: Math.random().toString(36).substr(2, 9), ...userForm, phoneNumber: userForm.phone });
    setShowUserModal(false);
    setEditingUser(null);
  };

  const getTraineeName = (traineeId: string) => users.find(u => u.id === traineeId)?.name || 'Deleted User';
  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'Deleted Class';
  const getTrainerName = (trainerId: string) => users.find(u => u.id === trainerId)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100/80 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/50 snap-x scroll-smooth shadow-inner">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'classes', icon: Calendar, label: 'Classes' },
          { id: 'bookings', icon: History, label: 'Log' },
          { id: 'packages', icon: Package, label: 'Store' },
          { id: 'profile', icon: ShieldCheck, label: 'Admin' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[70px] py-2 rounded-xl text-[10px] font-medium transition-all duration-200 snap-center shrink-0 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-500'}`}>
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
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: 'none', fontWeight: '500', fontSize: '12px'}} />
                <Bar dataKey="bookings" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-medium text-slate-400 text-xs uppercase tracking-wider text-indigo-600">User Management</h3>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"><UserPlus size={18}/></button>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-[24px] border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{u.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{u.email} • {u.role}</div>
                  {u.role === UserRole.TRAINEE && <div className="text-[10px] text-indigo-500 font-bold mt-0.5">{u.credits || 0} Credits</div>}
                </div>
                <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-medium text-slate-400 text-xs uppercase tracking-wider text-indigo-600">Session Management</h3>
            <button onClick={() => { setEditingClass(null); setShowClassModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={18}/></button>
          </div>
          <div className="space-y-3">
            {classes.length === 0 ? (
              <div className="p-12 bg-white rounded-[32px] border border-slate-100 text-center text-slate-400 text-sm font-medium italic">No active sessions.</div>
            ) : classes.map(cls => (
              <div key={cls.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm tracking-tight">{cls.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{cls.date} • {cls.time}</div>
                  <div className="text-[9px] text-indigo-500 font-medium mt-1">By {getTrainerName(cls.trainerId)}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedClassForRoster(cls)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl"><ClipboardList size={18}/></button>
                  <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit2 size={18}/></button>
                  <button onClick={() => confirm("Delete session?") && onDeleteClass(cls.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-in">
          <h3 className="font-medium text-slate-400 text-xs uppercase tracking-wider px-1 text-indigo-600">Global Activity Log</h3>
          <div className="space-y-2">
            {attendance.length === 0 ? <div className="p-8 text-center text-slate-400 text-xs italic">No activity logs found.</div> : attendance.map(rec => (
              <div key={rec.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center text-[10px] shadow-sm">
                <div>
                  <div className="font-bold text-slate-800 uppercase tracking-tight">{getTraineeName(rec.traineeId)}</div>
                  <div className="text-slate-500">{getClassName(rec.classId)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">{new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  <div className={`font-bold uppercase ${rec.method === 'MANUAL' ? 'text-amber-500' : 'text-indigo-600'}`}>{rec.method}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-medium text-slate-400 text-xs uppercase tracking-wider text-indigo-600">Inventory & Pricing</h3>
            <button onClick={() => { setEditingPkg(null); setShowPkgModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={18}/></button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{pkg.name}</div>
                  <div className="text-xs text-slate-400 font-medium">{pkg.credits} Credits • ${pkg.price}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingPkg(pkg); setShowPkgModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                  <button onClick={() => setPackages(packages.filter(p => p.id !== pkg.id))} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                </div>
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
          <h3 className="text-lg font-semibold text-center text-slate-800">Admin Identity</h3>
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
                <span>Changing your email updates your login identity.</span>
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
                <span>Password change detected. It will be required at next login.</span>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all mt-2 text-sm">Save Changes</button>
        </form>
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleClassSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6 animate-in shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingClass ? 'Edit Session' : 'New Session'}</h3>
              <button type="button" onClick={() => setShowClassModal(false)} className="p-2 text-slate-400"><X size={20}/></button>
            </div>
            {classError && <div className="p-3 bg-rose-50 text-rose-600 text-[10px] rounded-xl font-bold border border-rose-100 flex items-center gap-2"><AlertCircle size={14}/> {classError}</div>}
            <div className="space-y-4">
              <input required placeholder="Session Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})}/>
              <input required placeholder="Location" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})}/>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})}/>
                <input required type="time" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-xs" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})}/>
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">
              {editingClass ? 'Save Changes' : 'Create Session'}
            </button>
          </form>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleUserSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6 animate-in shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button type="button" onClick={() => setShowUserModal(false)} className="p-2 text-slate-400"><X size={20}/></button>
            </div>
            {userError && <div className="p-3 bg-rose-50 text-rose-600 text-[10px] rounded-xl font-bold flex items-center gap-2 border border-rose-100"><AlertCircle size={14}/> {userError}</div>}
            <div className="space-y-4">
              <input required placeholder="Full Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}/>
              <input required type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}/>
              <input required placeholder="Phone Number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})}/>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">Account Password</label>
                <input required placeholder="Set Password" type="text" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}/>
              </div>

              <select className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
                <option value={UserRole.TRAINEE}>Trainee</option>
                <option value={UserRole.TRAINER}>Trainer</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-all">
              {editingUser ? 'Update Account' : 'Register Account'}
            </button>
          </form>
        </div>
      )}

      {showPkgModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingPkg) setPackages(packages.map(p => p.id === editingPkg.id ? {...p, ...pkgForm} : p));
            else setPackages([...packages, {id: Math.random().toString(36).substr(2,9), ...pkgForm}]);
            setShowPkgModal(false);
          }} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6 animate-in shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingPkg ? 'Edit Package' : 'New Package'}</h3>
            <div className="space-y-4">
              <input required placeholder="Package Name" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})}/>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">Credits</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={pkgForm.credits} onChange={e => setPkgForm({...pkgForm, credits: parseInt(e.target.value)})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase tracking-wider">Price $</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-sm" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: parseInt(e.target.value)})}/>
                </div>
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-all">Confirm Package</button>
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
                  <button onClick={() => onToggleAttendance(selectedClassForRoster.id, t.id)} className={`px-4 py-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 border ${isMarked ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-indigo-600 border-indigo-100'}`}>
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