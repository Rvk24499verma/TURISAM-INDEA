import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-saffron-600" />
      <p className="text-stone-600 dark:text-stone-400 font-medium animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;
