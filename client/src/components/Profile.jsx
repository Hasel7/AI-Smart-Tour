import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  // Get user details from sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user") || '{}');

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f1] text-[#2f2722] font-['Inter',sans-serif] pb-24">
      {/* Header */}
      <header className="bg-[#2f2722] pt-12 pb-14 px-6 rounded-b-[2.5rem] shadow-lg relative flex flex-col items-center">
        <button 
          onClick={() => navigate("/dashboard")}
          className="absolute top-12 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition backdrop-blur-sm shadow-sm text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        {/* Avatar */}
        <div className="w-24 h-24 bg-[#e2dac9] rounded-full mt-6 mb-4 flex items-center justify-center text-4xl font-bold text-[#c85a3c] shadow-inner border-4 border-white">
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : "👤"}
        </div>
        
        <h1 className="font-['Playfair_Display',serif] text-3xl font-bold text-white">
          {user.full_name || "Tourist"}
        </h1>
        <p className="text-[#a0978c] text-sm mt-1 font-medium">{user.email || "Welcome to Smart Tour"}</p>
      </header>

      <main className="px-6 mt-10 space-y-6">
        {/* Account Details Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#f0ece1]">
          <h2 className="font-['Playfair_Display',serif] text-xl font-bold mb-5 flex items-center">
            <span className="mr-2">⚙️</span> Account Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#f0ece1]">
              <span className="text-[#a0978c] font-bold text-xs uppercase tracking-wider">Full Name</span>
              <span className="font-semibold">{user.full_name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#f0ece1]">
              <span className="text-[#a0978c] font-bold text-xs uppercase tracking-wider">Email</span>
              <span className="font-semibold">{user.email || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#f0ece1]">
              <span className="text-[#a0978c] font-bold text-xs uppercase tracking-wider">Language</span>
              <span className="font-semibold bg-[#faf8f1] px-3 py-1 rounded-md text-sm">{user.preferred_language?.toUpperCase() || "EN"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <button 
            onClick={() => alert("Edit profile feature coming soon!")}
            className="w-full bg-[#f0ece1] text-[#2f2722] font-bold py-4 rounded-2xl hover:bg-[#e2dac9] transition-colors shadow-sm"
          >
            Edit Profile
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full bg-[#c85a3c] text-white font-bold py-4 rounded-2xl hover:bg-red-700 transition-colors shadow-sm flex justify-center items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
