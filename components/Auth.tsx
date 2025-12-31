
import React, { useState, useEffect } from 'react';
import { UserCircle2, Mail, Lock, Phone, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, password?: string) => boolean;
  onResetPassword: (email: string, phone: string, newPassword: string) => boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onResetPassword }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Recovery states
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    setError(null);
  }, [mode, email, password, recoveryEmail, recoveryPhone, newPassword, confirmPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      if (email) {
        const success = onLogin(email, password);
        if (!success) {
          setError("Invalid email or password. Please try again.");
        }
      }
    } else {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      const success = onResetPassword(recoveryEmail, recoveryPhone, newPassword);
      if (success) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          setMode('login');
          setRecoveryEmail('');
          setRecoveryPhone('');
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setError("Verification failed. Please check your registered email and phone number.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 space-y-8 animate-in">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            {mode === 'login' ? <UserCircle2 size={36} /> : <ShieldCheck size={36} />}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">AttendEase</h2>
          <p className="text-slate-500 mt-1.5 text-sm">
            {mode === 'login' ? 'Welcome back! Please sign in.' : 'Recover your access'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 animate-in">
            <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-rose-700 text-xs font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {resetSuccess ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-3 animate-in">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-emerald-800 font-medium">Password Reset!</h3>
            <p className="text-emerald-600 text-xs">Returning to login screen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'login' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      className={`block w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all ${error ? 'border-rose-200' : 'border-slate-100'}`}
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-medium text-slate-500">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type="password"
                      required
                      className={`block w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all ${error ? 'border-rose-200' : 'border-slate-100'}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/50 rounded-xl text-[11px] text-blue-600 leading-relaxed border border-blue-100">
                    Verify identity with registered email and phone number.
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 ml-1">Registered Email</label>
                    <input required type="email" className="block w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 ml-1">Registered Phone Number</label>
                    <input required type="text" className="block w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" placeholder="+1..." value={recoveryPhone} onChange={e => setRecoveryPhone(e.target.value)} />
                  </div>
                  <div className="pt-2 border-t border-slate-50 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 ml-1">New Password (Min 8 chars)</label>
                      <input required type="password" className="block w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 ml-1">Confirm New Password</label>
                      <input required type="password" className="block w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] text-sm"
            >
              {mode === 'login' ? 'Sign In' : 'Reset Password'}
            </button>

            {mode === 'forgot' && (
              <button 
                type="button" 
                onClick={() => setMode('login')}
                className="w-full flex items-center justify-center gap-2 text-slate-400 text-xs font-medium hover:text-slate-600 pt-1"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            )}
          </form>
        )}

        {mode === 'login' && (
          <div className="pt-6 border-t border-slate-50">
            <p className="text-center text-[10px] text-slate-400 font-medium mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="space-y-2">
              {[
                { label: 'Admin', email: 'admin@test.com' },
                { label: 'Trainer', email: 'trainer@test.com' },
                { label: 'Trainee', email: 'trainee@test.com' }
              ].map(demo => (
                <button 
                  key={demo.email}
                  type="button"
                  onClick={() => { setEmail(demo.email); setPassword('password123'); }}
                  className="w-full py-2 px-4 text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all text-left flex justify-between items-center"
                >
                  <span>{demo.label}: {demo.email}</span>
                  <ArrowLeft size={12} className="rotate-180 opacity-40"/>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
