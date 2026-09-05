import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      // Save token to sessionStorage
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      // Sync active language to user's remote preference immediately
      if (res.data.user?.preferred_language) {
        i18n.changeLanguage(res.data.user.preferred_language.toLowerCase());
      }

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#110e0c] text-slate-900 dark:text-white font-['Inter',sans-serif] flex flex-col p-6 sm:p-8 transition-colors duration-300">
      <div className="flex-1 w-full max-w-md mx-auto pt-8 pb-12">
        {/* Branding Badge */}
        <div className="flex items-center space-x-2 mb-10">
          <span className="text-amber-500 text-lg leading-none">✦</span>
          <span className="text-amber-500 text-sm font-semibold tracking-[0.2em] uppercase">
            Smarttour
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-['Playfair_Display',serif] text-[3.2rem] leading-[1.05] tracking-tight mb-4 font-bold">
          <div className="text-slate-900 dark:text-white transition-colors">{t('auth.welcome_back')}</div>
        </h1>

        {/* Subtitle */}
        <p className="text-[#8b8276] dark:text-[#9e9185] text-base mb-10 transition-colors">
          {t('auth.login_subtitle')}
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6 flex flex-col" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div className="flex flex-col space-y-2">
            <label className="text-[#7d6e5d] text-xs font-semibold tracking-wider uppercase">
              {t('auth.email')}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 opacity-50 text-[#a09eaf]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                  <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-white dark:bg-[#251f1a] border border-[#e2dcd0] dark:border-[#42372d] text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-2">
            <label className="text-[#7d6e5d] text-xs font-semibold tracking-wider uppercase">
              {t('auth.password')}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 opacity-50 text-amber-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-white dark:bg-[#251f1a] border border-[#e2dcd0] dark:border-[#42372d] text-slate-900 dark:text-white rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono tracking-widest"
                style={{ fontSize: "1.0rem" }}
              />
              <button
                type="button"
                className="absolute right-4 text-[#42372d] hover:text-[#7d6e5d] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z" />
                    <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0 1 15.75 12ZM12.53 15.713l-4.243-4.244a3.75 3.75 0 0 0 4.244 4.243Z" />
                    <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 0 1 6.75 12Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path
                      fillRule="evenodd"
                      d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end pt-1">
              <a href="#" className="text-amber-500 text-sm hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-2xl transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <svg className="w-5 h-5 spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <>
                  <span>{t('auth.login_btn')}</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6 pt-2">
            <span className="text-[#9e9185] text-sm tracking-wide">
              {t('auth.no_account')}{" "}
            </span>
            <Link
              to="/create-account"
              className="text-amber-500 text-sm font-medium hover:underline"
            >
              {t('auth.register')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
