import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Map, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", labelKey: "dashboard.nav_home",    Icon: Home },
  { path: "/map",       labelKey: "dashboard.nav_map",     Icon: Map },
  { path: "/saved",     labelKey: "dashboard.nav_saved",   Icon: Heart },
  { path: "/profile",   labelKey: "dashboard.nav_profile", Icon: User },
];

const BottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.5s_ease-out]">
      <nav className="flex items-center space-x-2 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] px-6 py-3.5 rounded-4xl transition-all duration-300">
        {NAV_ITEMS.map(({ path, labelKey, Icon }) => {
          const isActive = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center justify-center space-y-1 w-14 transition-all focus:outline-none group"
            >
              <div className={`
                absolute inset-0 bg-indigo-600/10 dark:bg-white/10 rounded-2xl -z-10
                transition-all duration-300 transform
                ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-50 group-hover:scale-75'}
              `} />

              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 group-hover:text-slate-900 dark:group-hover:text-[#ccc]'}`}
                style={{ transform: isActive ? "translateY(-2px)" : "translateY(0)" }}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive && Icon === Heart ? "currentColor" : "none"}
              />
              <span
                className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-300
                  ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-[#ccc]'}
                `}
              >
                {t(labelKey).split(' ')[0]} {/* Shorten label for the pill */}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
