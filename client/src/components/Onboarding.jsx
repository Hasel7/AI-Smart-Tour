import { Link } from "react-router-dom";

const Onboarding = () => {
  return (
    <div className="min-h-screen bg-[#12100e] text-white font-['Inter',sans-serif] bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px] relative flex flex-col justify-end p-6 sm:p-8">
      {/* Top right gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(200,80,40,0.15),transparent_50%)] mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 max-w-md mx-auto w-full">
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#524424] bg-[#2a2618]/60 backdrop-blur-sm mb-8">
          <span className="text-[#dcb35f] text-sm leading-none">✦</span>
          <span className="text-[#dcb35f] text-xs font-semibold tracking-wider">
            AI-POWERED TRAVEL
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-['Playfair_Display',serif] text-[3.5rem] leading-[1.05] tracking-tight mb-6 font-bold">
          <div className="text-white">Explore the</div>
          <div className="text-[#d85c34]">World</div>
          <div className="text-white">Smarter</div>
        </h1>

        {/* Subtitle */}
        <p className="text-[#a19d98] text-base font-normal leading-relaxed mb-10">
          Personalised, multilingual travel guidance powered by AI — wherever
          you are.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col space-y-4">
          <Link
            to="/create-account"
            className="w-full bg-[#c9532e] hover:bg-[#b04523] text-white font-medium py-4 px-6 rounded-3xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Get Started</span>
            <span>&rarr;</span>
          </Link>

          <Link
            to="/login"
            className="w-full bg-[#282420] hover:bg-[#342f2a] border border-[#3e3933] text-[#e8e6e3] font-medium py-4 px-6 rounded-3xl transition-colors duration-200 flex items-center justify-center"
          >
            <span>I already have an account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
