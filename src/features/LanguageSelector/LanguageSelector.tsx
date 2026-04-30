import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { cn } from '../../shared/lib/utils';

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = availableLanguages.find(l => l.code === currentLanguage);

  return (
    <div className="relative h-8 flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-full flex items-center gap-2 px-2.5 rounded-lg transition-all duration-200",
          "hover:bg-white/10 text-white/70 hover:text-white border border-transparent hover:border-white/10",
          isOpen && "bg-white/10 text-white border-white/20"
        )}
      >
        <Globe size={14} className="opacity-60" />
        <span className="text-xs font-bold uppercase tracking-tight">{currentConfig?.code.split('-')[0]}</span>
        <ChevronDown size={12} className={cn("transition-transform opacity-40", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 min-w-[140px] bg-[#0B1220] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-down">
          <div className="py-1">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors",
                  currentLanguage === lang.code 
                    ? "bg-white/10 text-white font-bold" 
                    : "hover:bg-white/5 text-white/50 hover:text-white"
                )}
              >
                <span className={cn("fi", `fi-${lang.flag}`, "rounded-sm w-4")}></span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
