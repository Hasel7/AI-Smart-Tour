import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    preferred_language: "gb",
    agreed: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        preferred_language: formData.preferred_language,
      });

      // Save token to sessionStorage
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#110e0c] text-white font-['Inter',sans-serif] flex flex-col p-6 sm:p-8">
      <div className="flex-1 w-full max-w-md mx-auto pt-8 pb-12">
        {/* Branding Badge */}
        <div className="flex items-center space-x-2 mb-10">
          <span className="text-[#dcb35f] text-lg leading-none">✦</span>
          <span className="text-[#dcb35f] text-sm font-semibold tracking-[0.2em] uppercase">
            Smarttour
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-['Playfair_Display',serif] text-[3.2rem] leading-[1.05] tracking-tight mb-4 font-bold">
          <div className="text-white">Create your</div>
          <div className="text-white">Account</div>
        </h1>

        {/* Subtitle */}
        <p className="text-[#9e9185] text-base mb-10">
          Start exploring personalised destinations
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6 flex flex-col" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="flex flex-col space-y-2">
            <label className="text-[#7d6e5d] text-xs font-semibold tracking-wider uppercase">
              Full Name
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 opacity-50 text-[#9682b1]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full bg-[#251f1a] border border-[#42372d] text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#dcb35f] transition-colors"
                placeholder="Input your full name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col space-y-2">
            <label className="text-[#7d6e5d] text-xs font-semibold tracking-wider uppercase">
              Email Address
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
                className="w-full bg-[#251f1a] border border-[#42372d] text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#dcb35f] transition-colors"
                placeholder="Input your email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-2">
            <label className="text-[#7d6e5d] text-xs font-semibold tracking-wider uppercase">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 opacity-50 text-[#dca34f]">
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
                className="w-full bg-[#251f1a] border border-[#42372d] text-[#7d6e5d] rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#dcb35f] transition-colors font-mono tracking-widest"
                style={{ fontSize: "1.0rem" }}
                placeholder="Input your password"
              />
              <button
                type="button"
                className="absolute right-4 text-[#7d6e5d] hover:text-white transition-colors"
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
          </div>

          {/* Preferred Language */}
          <div className="flex flex-col space-y-2">
            <label className="text-[#7d6e5d] text-xs font-semibold tracking-wider uppercase">
              Preferred Language
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 opacity-70 text-[#4ca6c2]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM2.858 12.479a8.232 8.232 0 0 1 1.834-4.576 71.91 71.91 0 0 0 0 8.164c-.754-.925-1.385-1.99-1.834-3.588ZM3.524 9.086A8.25 8.25 0 0 1 10.5 4.015v4.204a74.128 74.128 0 0 0-6.976.867Zm16.952 3.393a8.232 8.232 0 0 0-1.834-4.576 71.91 71.91 0 0 1 0 8.164c.754-.925 1.385-1.99 1.834-3.588ZM11.05 4.148A8.25 8.25 0 0 0 4.07 9.219a74.136 74.136 0 0 1 6.98-.867V4.148Zm2.4 0v4.204c2.516.2 4.887.498 6.976.867A8.25 8.25 0 0 0 13.45 4.148Zm0 5.719v5.266c2.516-.2 4.887-.498 6.976-.867A8.25 8.25 0 0 0 13.45 19.852Zm-2.4 5.266v-5.266a74.13 74.13 0 0 1-6.98.867A8.25 8.25 0 0 0 11.05 19.852ZM10.5 9.867v4.266a72.633 72.633 0 0 0 3 0V9.867a72.633 72.633 0 0 0-3 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <select
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="w-full bg-[#251f1a] border border-[#42372d] text-white rounded-2xl py-4 pl-12 pr-10 focus:outline-none focus:border-[#dcb35f] transition-colors appearance-none cursor-pointer"
              >
                <option value="gb">GB English</option>
                <option value="us">US English</option>
                <option value="es">ES Español</option>
                <option value="fr">FR Français</option>
              </select>
              <div className="absolute right-4 pointer-events-none text-[#564a3e]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-center space-x-3 pt-4">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="peer appearance-none w-6 h-6 border-2 border-[#cc5529] rounded bg-[#cc5529] checked:bg-[#cc5529] checked:border-[#cc5529] cursor-pointer transition-colors"
              />
              <svg
                className="absolute w-4 h-4 text-white pointer-events-none left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[#9e9185] text-sm">
              I agree to the{" "}
              <a href="#" className="text-[#c19139] hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#c19139] hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#cc5529] hover:bg-[#b04523] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-3xl transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-[#cc5529]/20"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6 pt-2">
            <span className="text-[#9e9185] text-sm tracking-wide">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="text-[#c19139] text-sm font-medium hover:underline"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;
