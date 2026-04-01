import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Preferences = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const categories = [
    { id: "Culture", emoji: "🏛️", label: "Culture & History", bg: "bg-[#89adc7]" },
    { id: "Nature", emoji: "🌳", label: "Nature & Parks", bg: "bg-[#9ebc90]" },
    { id: "Dining", emoji: "🍽️", label: "Food & Dining", bg: "bg-[#ffc875]" },
    { id: "Hotels", emoji: "🏨", label: "Luxury Stays", bg: "bg-[#e2dac9]" },
    { id: "Attraction", emoji: "📸", label: "Tourist Attractions", bg: "bg-[#fc84a1]" }
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
    <div className="min-h-screen bg-[#faf8f1] font-['Inter',sans-serif] flex flex-col px-6 pt-16 pb-10 line-clamp-1">
      <div className="flex-1">
        <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-[#2f2722] leading-tight mb-3">
          What kind of traveler are you?
        </h1>
        <p className="text-[#a0978c] font-medium text-sm mb-10 leading-relaxed">
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
                    ? `border-[#2f2722] bg-white shadow-md transform scale-[1.02]` 
                    : `border-transparent bg-[#f0ece1] hover:bg-[#e8e4d9] opacity-80`
                }`}
              >
                <div className={`w-14 h-14 ${cat.bg} rounded-2xl flex items-center justify-center text-3xl shadow-inner`}>
                  {cat.emoji}
                </div>
                <div className="flex-1">
                  <h3 className={`font-['Playfair_Display',serif] text-xl font-bold ${isSelected ? 'text-[#2f2722]' : 'text-[#554e49]'}`}>
                    {cat.label}
                  </h3>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-[#2f2722] rounded-full flex items-center justify-center text-white mr-2">
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
          className="w-full bg-[#2f2722] text-white font-bold py-4 rounded-2xl hover:bg-black transition-colors shadow-lg text-lg flex justify-center items-center"
        >
          {selected.length > 0 ? "Personalize My App ✨" : "Skip For Now"}
        </button>
      </div>
    </div>
  );
};

export default Preferences;
