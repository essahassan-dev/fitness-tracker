import React from 'react';
import { RiSunLine, RiMoonLine } from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="sidebar-link w-full"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <RiSunLine className="text-lg text-yellow-400" />
      ) : (
        <RiMoonLine className="text-lg text-blue-400" />
      )}
      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};

export default ThemeToggle;
