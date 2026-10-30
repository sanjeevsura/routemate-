import React, { useState } from 'react';
import { UserRole } from '../server/db';

interface AuthScreenProps {
  onAuthSuccess: (user: any, token: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('TRAVELLER');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Traveller fields
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  // Guide fields
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [languages, setLanguages] = useState('English, Tamil');
  const [yearsExperience, setYearsExperience] = useState(3);
  const [coverageRadiusKm, setCoverageRadiusKm] = useState(15);
  const [ratePerSessionInr, setRatePerSessionInr] = useState(150);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (authMode === 'LOGIN') {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Authentication failed');
        }

        localStorage.setItem('routemate_token', data.token);
        onAuthSuccess(data.user, data.token);
      } else if (authMode === 'REGISTER') {
        const payload: any = {
          email,
          password,
          fullName,
          role: selectedRole
        };

        if (selectedRole === 'TRAVELLER') {
          payload.emergencyContactName = emergencyContactName;
          payload.emergencyContactPhone = emergencyContactPhone;
          payload.preferredLanguage = preferredLanguage;
        } else if (selectedRole === 'GUIDE') {
          payload.phone = phone;
          payload.specialty = specialty;
          payload.languages = languages.split(',').map(s => s.trim()).filter(Boolean);
          payload.yearsExperience = Number(yearsExperience);
          payload.coverageRadiusKm = Number(coverageRadiusKm);
          payload.ratePerSessionInr = Number(ratePerSessionInr);
        }

        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Registration failed');
        }

        localStorage.setItem('routemate_token', data.token);
        onAuthSuccess(data.user, data.token);
      } else if (authMode === 'FORGOT') {
        const res = await fetch('/api/v1/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Password reset request failed');
        }
        setInfoMessage(data.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Brand Hero */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-[#032517] rounded-2xl flex items-center justify-center mx-auto shadow-md mb-2">
          <span className="material-symbols-outlined text-[32px] text-[#c7ebd4]">explore</span>
        </div>
        <h1 className="text-2xl font-bold text-[#032517] font-headline tracking-tight">RouteMate</h1>
        <p className="text-xs text-[#424843] max-w-xs mx-auto mt-1 leading-relaxed">
          "When the map doesn't know the way, a person who does can help."
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-[#e5e2dc]">
        {/* Role Selector Tabs */}
        {authMode !== 'FORGOT' && (
          <div className="mb-4">
            <span className="text-[10px] text-[#424843] uppercase font-bold tracking-wider block mb-1.5 text-center">
              Select Your Role
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#f1eee7] rounded-xl border border-[#c1c8c2]/50">
              {(['TRAVELLER', 'GUIDE', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                    selectedRole === r
                      ? 'bg-[#032517] text-white shadow-sm'
                      : 'text-[#424843] hover:text-[#1c1c18]'
                  }`}
                >
                  {r === 'TRAVELLER' ? 'Traveller' : r === 'GUIDE' ? 'Guide' : 'Admin'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Switcher: Login vs Register */}
        {authMode !== 'FORGOT' && selectedRole !== 'ADMIN' && (
          <div className="flex border-b border-[#e5e2dc] mb-4">
            <button
              type="button"
              onClick={() => setAuthMode('LOGIN')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
                authMode === 'LOGIN'
                  ? 'border-[#032517] text-[#032517]'
                  : 'border-transparent text-[#555f71]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('REGISTER')}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
                authMode === 'REGISTER'
                  ? 'border-[#032517] text-[#032517]'
                  : 'border-transparent text-[#555f71]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Notifications / Errors */}
        {errorMessage && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs font-medium flex items-center gap-1.5 border border-[#ffb4ab]">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-3.5 p-2.5 rounded-lg bg-[#c7ebd4] text-[#002113] text-xs font-medium flex items-center gap-1.5 border border-[#abcfb8]">
            <span className="material-symbols-outlined text-[16px] shrink-0">check_circle</span>
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {authMode === 'REGISTER' && (
            <div>
              <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
            />
          </div>

          {authMode !== 'FORGOT' && (
            <div>
              <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
              />
            </div>
          )}

          {/* Traveller specific registration fields */}
          {authMode === 'REGISTER' && selectedRole === 'TRAVELLER' && (
            <>
              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Trusted Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Kavita Sharma (Mother)"
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+91 98402 11928"
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>
            </>
          )}

          {/* Guide specific registration fields */}
          {authMode === 'REGISTER' && selectedRole === 'GUIDE' && (
            <>
              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Mobile / VHF Radio Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94881 22334"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Route Specialty &amp; Known Corridors
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Bodimettu Ghat &amp; High Altitude Pass"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2] outline-none focus:border-[#032517]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                    Coverage Radius
                  </label>
                  <select
                    value={coverageRadiusKm}
                    onChange={(e) => setCoverageRadiusKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2]"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km</option>
                    <option value={50}>Remote (&gt;25 km)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                    Rate / Session
                  </label>
                  <input
                    type="number"
                    value={ratePerSessionInr}
                    onChange={(e) => setRatePerSessionInr(Number(e.target.value))}
                    placeholder="150"
                    className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2]"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#ffdcc3] text-[#6e3900] text-[11px] leading-relaxed">
                ℹ Note: Guide profiles start with status <strong className="font-mono">PENDING_VERIFICATION</strong> and become discoverable once approved by Dispatch.
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#032517] hover:bg-[#1b3b2b] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all mt-1"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto block"></span>
            ) : authMode === 'LOGIN' ? (
              `Sign In as ${selectedRole}`
            ) : authMode === 'REGISTER' ? (
              `Register as ${selectedRole}`
            ) : (
              'Send Password Reset Link'
            )}
          </button>
        </form>

        {/* Helper footer links */}
        <div className="mt-4 pt-3 border-t border-[#e5e2dc] flex items-center justify-between text-xs text-[#555f71]">
          {authMode === 'LOGIN' ? (
            <>
              <button
                type="button"
                onClick={() => setAuthMode('FORGOT')}
                className="hover:text-[#032517] transition-colors"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                className="font-bold text-[#032517] hover:underline"
              >
                Create Account
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className="w-full text-center font-bold text-[#032517] hover:underline"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
