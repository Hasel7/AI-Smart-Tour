import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Trees, UtensilsCrossed, Hotel, Camera, Sparkles } from "lucide-react";

const Preferences = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const categories = [
    { id: "Culture", Icon: Landmark, label: "Culture & History", bg: "bg-sky-500" },
    { id: "Nature", Icon: Trees, label: "Nature & Parks", bg: "bg-teal-500" },
    { id: "Dining", Icon: UtensilsCrossed, label: "Food & Dining", bg: "bg-amber-400" },
    { id: "Hotels", Icon: Hotel, label: "Luxury Stays", bg: "bg-slate-200", fg: "text-slate-700" },
    { id: "Attraction", Icon: Camera, label: "Tourist Attractions", bg: "bg-rose-400" }
  ];

  const toggleCategory = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(item => item !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSave = () => {
    if (selected.length === 0) {
      if (!window.confirm("Are you sure you want to skip selecting preferences? We won't be able to personalize your dashboard.")) {
        return;
      }
    }
    
    sessionStorage.setItem("travel_preferences", JSON.stringify(selected));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Inter',sans-serif] flex flex-col px-6 pt-16 pb-10 transition-colors duration-300">
      <div className="flex-1">
        <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-3 transition-colors">
          What kind of traveler are you?
        </h1>
        <p className="text-slate-500 dark:text-gray-300 font-medium text-sm mb-10 leading-relaxed transition-colors">
          Select the experiences you love most, and our AI will personalize your Smart Tour dashboard.
        </p>

        <div className="space-y-4">
          {categories.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <div 
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`w-full p-4 rounded-3xl flex items-center space-x-4 cursor-pointer transition-all border-2 ${
                  isSelected 
                    ? `border-slate-900 dark:border-slate-400 bg-white dark:bg-slate-800 shadow-md transform scale-[1.02]` 
                    : `border-transparent bg-slate-100 dark:bg-slate-900 hover:bg-[#e8e4d9] dark:hover:bg-slate-700 opacity-80`
                }`}
              >
                <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                  <cat.Icon className={`w-7 h-7 ${cat.fg || "text-white"}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-['Playfair_Display',serif] text-xl font-bold transition-colors ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-400'}`}>
                    {cat.label}
                  </h3>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-slate-900 mr-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-8">
        <button 
          onClick={handleSave}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl hover:bg-slate-950 dark:hover:bg-gray-200 transition-colors shadow-lg text-lg flex justify-center items-center"
        >
          {selected.length > 0 ? (
            <span className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Personalize My App</span>
          ) : "Skip For Now"}
        </button>
      </div>
    </div>
  );
};

export default Preferences;
