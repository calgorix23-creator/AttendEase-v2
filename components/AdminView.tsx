
import React, { useState, useEffect } from 'react';
import { AttendanceClass, AttendanceRecord, PaymentRecord, User, UserRole } from '../types.ts';
import { 
  LayoutDashboard, Users, Calendar, Plus, X, Edit2, ShieldCheck, 
  ClipboardList, UserPlus, Trash2, TrendingUp, Package, 
  AlertCircle, AlertTriangle, History, CreditCard, Lock, RefreshCw,
  MapPin, Clock
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
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingClass, setEditingClass] = useState<AttendanceClass | null>(null);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<AttendanceClass | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const [classForm, setClassForm] = useState({ name: '', location: '', date: '', time: '' });
  const [pkgForm, setPkgForm] = useState({ name: '', credits: 1, price: 0 });
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: UserRole.TRAINEE, password: '', credits: 0 });
  
  const [profileData, setProfileData] = useState({ name: user.name, email: user.email, password: user.password || '' });

  const generateRandomPassword = () => {
    const caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const smalls = "abcdefghijklmnopqrstuvwxyz";
    const nums = "0123456789";
    const specials = "!@#$%^&*";
    
    let password = [
      caps[Math.floor(Math.random() * caps.length)],
      smalls[Math.floor(Math.random() * smalls.length)],
      nums[Math.floor(Math.random() * nums.length)],
      specials[Math.floor(Math.random() * specials.length)]
    ];
    
    const all = caps + smalls + nums + specials;
    for (let i = 0; i < 4; i++) {
      password.push(all[Math.floor(Math.random() * all.length)]);
    }
    
    return password.sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    if (showClassModal) {
      setClassError(null);
      if (editingClass) setClassForm({ name: editingClass.name, location: editingClass.location, date: editingClass.date, time: editingClass.time });
      else setClassForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
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
          name: '', 
          email: '', 
          phone: '', 
          role: UserRole.TRAINEE, 
          password: generateRandomPassword(), 
          credits: 0 
        });
      }
    }
  }, [editingUser, showUserModal]);

  useEffect(() => {
    if (showPkgModal && editingPkg) setPkgForm({ name: editingPkg.name, credits: editingPkg.credits, price: editingPkg.price });
    else if (showPkgModal) setPkgForm({ name: '', credits: 1, price: 0 });
  }, [editingPkg, showPkgModal]);

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    if (editingClass) {
      onUpdateClass({ ...editingClass, ...classForm });
      setShowClassModal(false);
    } else {
      const success = onAddClass({ id: Math.random().toString(36).substr(2, 9), trainerId: user.id, ...classForm, createdAt: Date.now() });
      if (success) {
        setShowClassModal(false);
      } else {
        setClassError("Error: A class with the same name, date, and time already exists.");
      }
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = { id: editingUser?.id || Math.random().toString(36).substr(2, 9), ...userForm, phoneNumber: userForm.phone };
    if (editingUser) onUpdateUser(userData as any);
    else onAddUser(userData as any);
    setShowUserModal(false);
  };

  const handlePkgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPkg) {
      setPackages(packages.map(p => p.id === editingPkg.id ? { ...p, ...pkgForm } : p));
    } else {
      setPackages([...packages, { id: Math.random().toString(36).substr(2, 9), ...pkgForm }]);
    }
    setShowPkgModal(false);
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const traineesCount = users.filter(u => u.role === UserRole.TRAINEE).length;
  const sessionsCount = classes.length;
  const chartData = [...classes].slice(-5).map(cls => ({
    name: cls.name.substring(0, 8),
    count: attendance.filter(a => a.classId === cls.id).length
  }));

  const emailWarning = profileData.email !== user.email;

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 border border-slate-200/50 shadow-inner">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'classes', icon: Calendar, label: 'Classes' },
          { id: 'bookings', icon: History, label: 'Log' },
          { id: 'packages', icon: Package, label: 'Store' },
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
            <button onClick={() => setActiveTab('packages')} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all">
              <TrendingUp className="text-emerald-500 mb-2" size={18} />
              <div className="text-xl font-bold text-slate-800">${totalRevenue}</div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Revenue</p>
            </button>
            <button onClick={() => setActiveTab('users')} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all">
              <Users className="text-indigo-500 mb-2" size={18} />
              <div className="text-xl font-bold text-slate-800">{traineesCount}</div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Trainees</p>
            </button>
            <button onClick={() => setActiveTab('classes')} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all">
              <Calendar className="text-amber-500 mb-2" size={18} />
              <div className="text-xl font-bold text-slate-800">{sessionsCount}</div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Sessions</p>
            </button>
            <button onClick={() => setActiveTab('bookings')} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all">
              <History className="text-purple-500 mb-2" size={18} />
              <div className="text-xl font-bold text-slate-800">{attendance.length}</div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Attendance</p>
            </button>
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Management</h3>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"><UserPlus size={18}/></button>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold bg-slate-50 text-slate-400">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 leading-none">{u.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">{u.role} • {u.credits || 0} Credits</p>
                  </div>
                </div>
                <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Sessions</h3>
            <button onClick={() => { setEditingClass(null); setShowClassModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={18}/></button>
          </div>
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{cls.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{cls.date} • {cls.time}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedClassForRoster(cls)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ClipboardList size={18}/></button>
                  <button onClick={() => { setEditingClass(cls); setShowClassModal(true); }} className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                  <button onClick={() => confirm("Delete session?") && onDeleteClass(cls.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-in">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Global Activity Log</h3>
          <div className="space-y-3">
            {attendance.slice(0, 50).map(rec => {
              const trainee = users.find(u => u.id === rec.traineeId);
              const cls = classes.find(c => c.id === rec.classId);
              return (
                <div key={rec.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-3 shadow-sm transition-all hover:border-slate-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${rec.method === 'MANUAL' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>
                      <div>
                        <span className="font-bold text-slate-800 uppercase tracking-tight text-xs">{trainee?.name || 'User'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${rec.method === 'MANUAL' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {rec.method === 'MANUAL' ? 'Marked by Staff' : 'Self Booked'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-400 font-bold text-[10px] uppercase">{new Date(rec.timestamp).toLocaleDateString()}</p>
                       <p className="text-slate-300 font-bold text-[9px]">{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  {cls && (
                    <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={12} className="text-slate-300"/>
                        <span className="font-medium">{cls.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin size={12} className="text-slate-300"/>
                        <span className="truncate">{cls.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="space-y-4 animate-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inventory Management</h3>
            <button onClick={() => { setEditingPkg(null); setShowPkgModal(true); }} className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg transition-all"><Plus size={18}/></button>
          </div>
          {packages.map((pkg: any) => (
            <div key={pkg.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-bold text-slate-800 text-sm">{pkg.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{pkg.credits} Credits • ${pkg.price}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingPkg(pkg); setShowPkgModal(true); }} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16}/></button>
                <button onClick={() => setPackages(packages.filter(p => p.id !== pkg.id))} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="animate-in space-y-6">
          <form onSubmit={e => { e.preventDefault(); onUpdateUser({...user, ...profileData} as any); alert("Admin Profile Updated"); }} className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 text-center">Admin Profile</h3>
            {emailWarning && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100"><AlertTriangle size={12} className="inline mr-1"/> Warning: Changing your email will affect your login credentials.</p>}
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} placeholder="Name"/>
            <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} placeholder="Email"/>
            <input required type="password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="Password"/>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Update Profile</button>
          </form>
        </div>
      )}

      {showPkgModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handlePkgSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-4 shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingPkg ? 'Edit Package' : 'New Package'}</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Package Name</label>
              <input required placeholder="e.g. Starter Pack" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Credits</label>
                <input required type="number" placeholder="0" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={pkgForm.credits} onChange={e => setPkgForm({...pkgForm, credits: parseInt(e.target.value)})}/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Price ($)</label>
                <input required type="number" placeholder="0.00" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: parseFloat(e.target.value)})}/>
              </div>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg mt-2">Save Package</button>
            <button type="button" onClick={() => setShowPkgModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest text-center">Cancel</button>
          </form>
        </div>
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleClassSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-4 shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingClass ? 'Edit Session' : 'New Session'}</h3>
            {classError && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100"><AlertCircle size={12} className="inline mr-1"/> {classError}</p>}
            <input required placeholder="Session Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})}/>
            <input required placeholder="Location" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})}/>
            <div className="grid grid-cols-2 gap-2">
              <input required type="date" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})}/>
              <input required type="time" className="p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})}/>
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg">Save Session</button>
            <button type="button" onClick={() => setShowClassModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest text-center mt-2">Cancel</button>
          </form>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleUserSubmit} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-4 shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingUser ? 'Edit User' : 'Add User'}</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
              <input required placeholder="John Doe" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email</label>
                <input required type="email" placeholder="email@test.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                <input required type="tel" placeholder="+1..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})}/>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Default Password (Visible)</label>
              <div className="relative">
                <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm pr-12" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}/>
                <button type="button" onClick={() => setUserForm({...userForm, password: generateRandomPassword()})} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><RefreshCw size={16}/></button>
              </div>
            </div>
            <div className={`grid ${userForm.role === UserRole.TRAINEE ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">User Role</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                  <option value={UserRole.TRAINEE}>Trainee</option>
                  <option value={UserRole.TRAINER}>Trainer</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              {userForm.role === UserRole.TRAINEE && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Starting Credits</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-xs" value={userForm.credits} onChange={e => setUserForm({...userForm, credits: parseInt(e.target.value) || 0})}/>
                </div>
              )}
            </div>
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg mt-2">Save User</button>
            <button type="button" onClick={() => setShowUserModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest text-center">Cancel</button>
          </form>
        </div>
      )}

      {selectedClassForRoster && (
        <div className="fixed inset-0 bg-white z-[200] flex flex-col animate-in">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-800">{selectedClassForRoster.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedClassForRoster.date} @ {selectedClassForRoster.time}</p>
            </div>
            <button onClick={() => { setSelectedClassForRoster(null); setRosterError(null); }} className="p-2 border rounded-full"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4">Manual Roster Management</h4>
            {rosterError && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 animate-in">
                <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-700 text-xs font-medium leading-relaxed">{rosterError}</p>
              </div>
            )}
            {users.filter(u => u.role === UserRole.TRAINEE).map(t => {
              const isMarked = attendance.some(a => a.classId === selectedClassForRoster.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="p-4 bg-white rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                    <div className="text-[10px] text-slate-400">{t.email} • {t.phoneNumber}</div>
                  </div>
                  <button onClick={() => {
                    setRosterError(null);
                    const res = onToggleAttendance(selectedClassForRoster.id, t.id);
                    if(!res.success) setRosterError(res.message);
                  }} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${isMarked ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100' : 'bg-white text-indigo-600 border-indigo-100'}`}>
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

export default AdminView;
