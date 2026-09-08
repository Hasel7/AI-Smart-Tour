import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

const Onboarding = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#12100e] text-slate-900 dark:text-white font-['Inter',sans-serif] bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] relative flex flex-col justify-end p-6 sm:p-8 transition-colors duration-300">
      {/* Top right gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(79,70,229,0.12),transparent_50%)] mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 max-w-md mx-auto w-full">
        {/* Pill Badge */}
        <div
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#524424] bg-[#2a2618]/60 backdrop-blur-sm mb-8"
          style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-500 text-xs font-semibold tracking-wider">
            {t('onboarding.pill')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-['Playfair_Display',serif] text-[3.5rem] leading-[1.05] tracking-tight mb-6 font-bold">
          <div className="text-slate-900 dark:text-white transition-colors" style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}>{t('onboarding.explore')}</div>
          <div className="text-amber-500" style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}>{t('onboarding.world')}</div>
          <div className="text-slate-900 dark:text-white transition-colors" style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }}>{t('onboarding.smarter')}</div>
        </h1>

        {/* Subtitle */}
        <p
          className="text-[#8b8276] dark:text-[#a19d98] text-base font-normal leading-relaxed mb-10 transition-colors"
          style={{ animation: "fadeInUp 0.5s ease-out 0.5s both" }}
        >
          {t('onboarding.subtitle')}
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col space-y-4">
          <Link
            to="/create-account"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-6 rounded-3xl transition-colors duration-200 flex items-center justify-center space-x-2"
            style={{ animation: "fadeInUp 0.5s ease-out 0.6s both" }}
          >
            <span>{t('onboarding.get_started')}</span>
            <span>&rarr;</span>
          </Link>

          <Link
            to="/login"
            className="w-full bg-white dark:bg-[#282420] hover:bg-slate-100 dark:hover:bg-[#342f2a] border border-slate-200 dark:border-[#3e3933] text-slate-900 dark:text-[#e8e6e3] font-medium py-4 px-6 rounded-3xl transition-colors duration-200 flex items-center justify-center"
            style={{ animation: "fadeInUp 0.5s ease-out 0.7s both" }}
          >
            <span>{t('onboarding.have_account')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
