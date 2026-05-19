
import React from 'react';
import { Home, Map, PlusCircle, AlertTriangle, Briefcase } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'map', icon: <Map size={24} />, label: 'Map' },
    { id: 'trips', icon: <Briefcase size={24} />, label: 'Trips' },
    { id: 'owner', icon: <PlusCircle size={24} />, label: 'Add Place' },
    { id: 'emergency', icon: <AlertTriangle size={24} />, label: 'Help' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 shadow-lg z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              activeTab === item.id
                ? 'text-saffron-600 dark:text-saffron-500'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
