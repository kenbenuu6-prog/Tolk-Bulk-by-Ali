import React from 'react';
import { Theme } from '../types';
import { Sun, Moon, Palette } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  themeClasses: any;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange, themeClasses }) => {
  return (
    <div className={`flex space-x-1 p-1 rounded-full border ${themeClasses.border} ${themeClasses.surface}`}>
      <button
        onClick={() => onThemeChange(Theme.Light)}
        className={`p-2 rounded-full transition-all ${currentTheme === Theme.Light ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        title="Light Mode"
      >
        <Sun size={18} />
      </button>
      <button
        onClick={() => onThemeChange(Theme.Dark)}
        className={`p-2 rounded-full transition-all ${currentTheme === Theme.Dark ? 'bg-gray-700 shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
        title="Dark Mode"
      >
        <Moon size={18} />
      </button>
      <button
        onClick={() => onThemeChange(Theme.Gradient)}
        className={`p-2 rounded-full transition-all ${currentTheme === Theme.Gradient ? 'bg-gradient-to-r from-orange-400 to-pink-500 shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
        title="Gradient Mode"
      >
        <Palette size={18} />
      </button>
    </div>
  );
};

export default ThemeSelector;