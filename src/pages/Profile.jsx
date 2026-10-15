// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import service from '../api/service';

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const sectionCls = "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden";

const TABS = ['My Profile', 'Security', 'Employees', 'Company'];
const ROLE_COLORS = {
  admin:    'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  employee: 'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300',
};

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState('My Profile');

  /* ── Profile state ── */
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [pwForm,      setPwForm]      = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [companyForm, setCompanyForm] = useState({ shopName: '', address: '', phone: '', email: '' });
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoUrl,     setLogoUrl]     = useState('');

  /* ── Employee state ── */
  const [employees,     setEmployees]    = useState([]);
  const [loadingEmp,    setLoadingEmp]   = useState(false);
  const [showAddEmp,    setShowAddEmp]   = useState(false);
  const [empForm,       setEmpForm]      = useState({ name: '', email: '', password: '', role: 'employee' });
  const [savingEmp,     setSavingEmp]    = useState(false);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load on mount ── */
  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', email: user.email || '' });
  }, [user]);

  useEffect(() => {
    if (tab === 'Employees') loadEmployees();
    if (tab === 'Company')   loadCompany();
  }, [tab]);

  const loadEmployees = async () => {
    try {
      setLoadingEmp(true);
      const res  = await service.getEmployees();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setEmployees(list);
    } catch { setEmployees([]); } finally { setLoadingEmp(false); }
  };

  const loadCompany = async () => {
    try {
      const res = await service.getCompany?.();
      if (res) {
        setCompanyForm({
          shopName: res.shopName || '',
          address: res.address || '',
          phone: res.phone || '',
          email: res.email || ''
        });
        setLogoUrl(res.logo || '');
      }
    } catch { /* company endpoint may not exist yet */ }
  };

  /* ── Save profile ── */
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await service.updateProfile?.(profileForm);
      showToast('Profile updated successfully!');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to update profile', false); }
    finally { setSaving(false); }
  };

  /* ── Change password ── */
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return showToast('Passwords do not match', false);
    if (pwForm.newPassword.length < 6) return showToast('Password must be at least 6 characters', false);
    try {
      setSaving(true);
      await service.changePassword?.(pwForm);
      showToast('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { showToast(err.response?.data?.message || 'Failed to change password', false); }
    finally { setSaving(false); }
  };

  /* ── Save company ── */
  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('shopName', companyForm.shopName);
      fd.append('phone', companyForm.phone);
      fd.append('email', companyForm.email);
      fd.append('address', companyForm.address);
      if (logoFile) {
        fd.append('logo', logoFile);
      }
      await service.updateCompany?.(fd);
      showToast('Company details updated!');
      window.dispatchEvent(new Event('company-updated'));
      setLogoFile(null);
      await loadCompany();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to save', false); }
    finally { setSaving(false); }
  };

  /* ── Add employee ── */
  const addEmployee = async (e) => {
    e.preventDefault();
    try {
      setSavingEmp(true);
      await service.createEmployee(empForm);
      setShowAddEmp(false);
      setEmpForm({ name: '', email: '', password: '', role: 'employee' });
      await loadEmployees();
      showToast('Employee added!');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to add employee', false); }
    finally { setSavingEmp(false); }
  };

  /* ── Toggle employee status ── */
  const toggleEmployee = async (emp) => {
    try {
      await service.updateEmployee(emp._id, { isActive: !emp.isActive });
      await loadEmployees();
      showToast(`Employee ${emp.isActive ? 'deactivated' : 'activated'}`);
    } catch { showToast('Failed to update employee', false); }
  };

  const initials = (name) => name ? name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : '?';

  return (
    <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium transition-all ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className={`${sectionCls}`}>
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold shadow-inner">
                {initials(user?.name || '')}
              </div>
              <div>
                <h1 className="text-xl font-bold">{user?.name || 'User'}</h1>
                <p className="text-violet-200 text-sm">{user?.email}</p>
                <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${user?.role === 'admin' ? 'bg-white/30 text-white' : 'bg-white/20 text-white'}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4">
            {TABS.filter(t => user?.role === 'admin' || t !== 'Employees').map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB: My Profile ── */}
        {tab === 'My Profile' && (
          <div className={sectionCls}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Personal Information</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update your name and email address</p>
            </div>
            <form onSubmit={saveProfile} className="p-6 space-y-4 max-w-md">
              <div>
                <label className={labelCls}>Full Name</label>
                <input value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))}
                  className={inputCls} placeholder="Your name"/>
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({...p, email: e.target.value}))}
                  className={inputCls} placeholder="you@example.com"/>
              </div>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB: Security ── */}
        {tab === 'Security' && (
          <div className={sectionCls}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ensure your account uses a strong password</p>
            </div>
            <form onSubmit={changePassword} className="p-6 space-y-4 max-w-md">
              {[
                { key: 'currentPassword', label: 'Current Password' },
                { key: 'newPassword',     label: 'New Password' },
                { key: 'confirmPassword', label: 'Confirm New Password' },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="password" value={pwForm[f.key]}
                    onChange={e => setPwForm(p => ({...p, [f.key]: e.target.value}))}
                    className={inputCls} placeholder="••••••••"/>
                </div>
              ))}
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                  </svg>
                  Logged-in Devices & Active Sessions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  View and terminate active sessions on phones, tablets, or other computers.
                </p>
              </div>
              <a
                href="/settings"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-sm font-semibold transition-all flex-shrink-0"
              >
                <span>Manage Devices</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* ── TAB: Employees (admin only) ── */}
        {tab === 'Employees' && (
          <div className={sectionCls}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Manage Employees</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{employees.length} team member{employees.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowAddEmp(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all">
                + Add Employee
              </button>
            </div>

            {loadingEmp ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : employees.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">No employees found.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {employees.map(emp => (
                  <div key={emp._id} className="flex items-center justify-between px-6 py-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {initials(emp.name || emp.email)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{emp.name || '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${ROLE_COLORS[emp.role] || ROLE_COLORS.employee}`}>
                        {emp.role}
                      </span>
                      <button onClick={() => toggleEmployee(emp)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${emp.isActive !== false
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100'
                          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'}`}>
                        {emp.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Company ── */}
        {tab === 'Company' && (
          <div className={sectionCls}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Company Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Shown on invoices and reports</p>
            </div>
            <form onSubmit={saveCompany} className="p-6 space-y-4 max-w-md">
              {[
                { key: 'shopName', label: 'Company Name',    type: 'text' },
                { key: 'phone',    label: 'Phone',           type: 'tel' },
                { key: 'email',    label: 'Email',           type: 'email' },
                { key: 'address',  label: 'Address',         type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type={f.type} value={companyForm[f.key] || ''}
                    onChange={e => setCompanyForm(p => ({...p, [f.key]: e.target.value}))}
                    className={inputCls}/>
                </div>
              ))}
              
              <div>
                <label className={labelCls}>Company Logo</label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No Logo</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setLogoFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-violet-50 file:text-violet-700
                        hover:file:bg-violet-100
                        dark:file:bg-violet-900/30 dark:file:text-violet-300"
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, or SVG. Will be uploaded to Cloudinary automatically.</p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Company Details'}
              </button>
            </form>
          </div>
        )}

        {/* ── Add Employee Modal ── */}
        {showAddEmp && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Employee</h2>
                <button onClick={() => setShowAddEmp(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
              </div>
              <form onSubmit={addEmployee} className="p-6 space-y-4">
                {[
                  { key:'name',     label:'Full Name',    type:'text' },
                  { key:'email',    label:'Email',        type:'email' },
                  { key:'password', label:'Password',     type:'password' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <input type={f.type} required value={empForm[f.key]}
                      onChange={e => setEmpForm(p => ({...p, [f.key]: e.target.value}))}
                      className={inputCls}/>
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Role</label>
                  <select value={empForm.role} onChange={e => setEmpForm(p => ({...p, role: e.target.value}))}
                    className={inputCls}>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddEmp(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingEmp}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-medium text-sm hover:from-violet-700 hover:to-purple-800 transition-all disabled:opacity-60">
                    {savingEmp ? 'Adding…' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}