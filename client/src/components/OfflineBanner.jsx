import React, { useState, useEffect } from 'react';
import { useOffline } from '../hooks/useOffline';

const OfflineBanner = () => {
    const isOffline = useOffline();
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        if (isOffline) {
            setShouldShow(true);
        } else {
            // Delay hiding the banner slightly to show "Back online" message if desired
            const timer = setTimeout(() => setShouldShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOffline]);

    if (!shouldShow) return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all transform duration-500 ${isOffline ? 'translate-y-0' : '-translate-y-full'} flex items-center justify-center p-3 animate-[fadeInDown_0.3s_ease-out]`}>
            <div className={`px-6 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center space-x-3 border ${isOffline ? 'bg-red-500/90 border-red-400 text-white' : 'bg-green-500/90 border-green-400 text-white'}`}>
                <span className="text-lg">{isOffline ? '📡' : '✅'}</span>
                <span className="font-bold text-sm tracking-wide">
                    {isOffline ? 'You are currently offline' : 'Back online!'}
                </span>
            </div>
        </div>
    );
};

export default OfflineBanner;
