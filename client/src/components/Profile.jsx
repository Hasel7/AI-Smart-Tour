import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BottomNav from "./BottomNav";
import { useToast } from "./Toast";
import { useTheme } from "../hooks/useTheme";
import { Settings, ShieldCheck, User } from "lucide-react";

const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const showToast = useToast();
  const { themeMode, setThemeMode } = useTheme();
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem("user") || '{}'));
  const [savedCount, setSavedCount] = useState(null);
  const [updatingLang, setUpdatingLang] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  useEffect(() => {
    // Fetch saved count for stats row
    const token = sessionStorage.getItem("token");
    if (!token) return;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    fetch(`${API_BASE}/places/saved`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSavedCount(data.saved_places?.length ?? 0); })
      .catch(() => {});
  }, []);

  const openEditModal = () => {
    setEditFullName(user.full_name || "");
    setEditPassword("");
    setShowEditModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const token = sessionStorage.getItem("token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const payload = { full_name: editFullName };
      if (editPassword) payload.password = editPassword;
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...data.user };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowEditModal(false);
        showToast("Profile updated successfully!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      showToast("Error updating profile.", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setUpdatingLang(true);
    try {
      const token = sessionStorage.getItem("token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferred_language: newLang })
      });
      if (res.ok) {
        try { await i18n.changeLanguage(newLang); } catch (i18nErr) { console.error(i18nErr); }
        const updatedUser = { ...user, preferred_language: newLang };
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showToast("Language updated!", "success");
      } else {
        showToast("Failed to update language.", "error");
      }
    } catch (err) {
      showToast("Error updating language.", "error");
    } finally {
      setUpdatingLang(false);
    }
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    i18n.changeLanguage("en");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-['Inter',sans-serif] pb-28 transition-colors duration-300">

      {/* Header */}
      <header className="bg-slate-900 dark:bg-slate-950 pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-lg relative flex flex-col items-center transition-colors">
        <button onClick={() => navigate("/dashboard")}
          className="absolute top-12 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm shadow-sm text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-24 h-24 bg-slate-200 rounded-full mt-6 mb-4 flex items-center justify-center text-4xl font-bold text-indigo-600 shadow-inner border-4 border-white/20"
          style={{ animation: "fadeInUp 0.4s ease-out both" }}>
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-9 h-9" />}
        </div>
        <h1 className="font-['Playfair_Display',serif] text-3xl font-bold text-white" style={{ animation: "fadeInUp 0.4s ease-out 0.1s both" }}>
          {user.full_name || t('profile.tourist')}
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium" style={{ animation: "fadeInUp 0.4s ease-out 0.2s both" }}>
          {user.email || "Welcome to Smart Tour"}
        </p>

        {/* Stats Row */}
        <div className="flex items-center space-x-6 mt-5 pt-4 border-t border-white/10 w-full justify-center" style={{ animation: "fadeInUp 0.4s ease-out 0.3s both" }}>
          <div className="text-center">
            <div className="text-white font-bold text-xl">
              {savedCount !== null ? savedCount : "—"}
            </div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Saved</div>
          </div>
          {joinedDate && (
            <>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-white font-bold text-sm">{joinedDate}</div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Member Since</div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="px-6 mt-10 space-y-6">
        {/* Account Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors" style={{ animation: "fadeInUp 0.4s ease-out 0.15s both" }}>
          <h2 className="font-['Playfair_Display',serif] text-xl font-bold mb-5 flex items-center">
            <Settings className="w-5 h-5 mr-2" /> {t('profile.account_settings')}
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 transition-colors">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('profile.full_name')}</span>
              <span className="font-semibold">{user.full_name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 transition-colors">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('profile.email')}</span>
              <span className="font-semibold truncate max-w-45">{user.email || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 transition-colors">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('profile.language')}</span>
              <select
                value={user.preferred_language?.toLowerCase() || "en"}
                onChange={handleLanguageChange}
                disabled={updatingLang}
                className={`font-semibold bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-md text-sm outline-none border-none cursor-pointer transition-colors ${updatingLang ? "opacity-50" : ""}`}
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="jp">Japanese</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-2 transition-colors">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t('profile.mode')}</span>
              <select
                value={themeMode}
                onChange={(e) => setThemeMode(e.target.value)}
                className="font-semibold bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-md text-sm outline-none border-none cursor-pointer transition-colors"
              >
                <option value="system">{t('profile.mode_device')}</option>
                <option value="light">{t('profile.mode_light')}</option>
                <option value="dark">{t('profile.mode_dark')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-2" style={{ animation: "fadeInUp 0.4s ease-out 0.25s both" }}>
          <button onClick={openEditModal}
            className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm">
            {t('profile.edit_profile')}
          </button>
          <button onClick={() => setShowLogoutModal(true)}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-800 transition-colors shadow-sm flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {t('profile.sign_out')}
          </button>

          {user.role === "admin" && (
            <button onClick={() => navigate("/admin")}
              className="w-full bg-slate-950 text-amber-500 font-extrabold py-4 rounded-2xl hover:bg-gray-900 transition-all shadow-xl flex justify-center items-center border border-amber-500/20 uppercase tracking-widest text-xs">
              <ShieldCheck className="w-5 h-5 mr-2" />
              {t('profile.admin_dashboard', 'Go to Admin Dashboard')}
            </button>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-700"
            style={{ animation: "fadeInUp 0.25s ease-out both" }}>
            <h3 className="font-['Playfair_Display',serif] text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" /> {t('profile.edit_title')}
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1 block">{t('profile.full_name')}</label>
                <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all" />
              </div>
              <div>
                <label className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1 block">{t('profile.new_password')}</label>
                <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder={t('profile.new_password')}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder-[#a0978c] dark:placeholder-[#666]" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} disabled={isUpdatingProfile}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  {t('profile.cancel')}
                </button>
                <button type="submit" disabled={isUpdatingProfile}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-800 transition-colors disabled:opacity-50 flex items-center space-x-2">
                  {isUpdatingProfile
                    ? <svg className="w-4 h-4 spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <span>{t('profile.save')}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-700"
            style={{ animation: "fadeInUp 0.25s ease-out both" }}>
            <h3 className="font-['Playfair_Display',serif] text-xl font-bold mb-4 text-slate-900 dark:text-white">{t('profile.sign_out')}</h3>
            <p className="text-slate-500 mb-8 font-medium">{t('profile.confirm_sign_out')}</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowLogoutModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {t('profile.cancel')}
              </button>
              <button onClick={confirmLogout} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-800 transition-colors">
                {t('profile.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
