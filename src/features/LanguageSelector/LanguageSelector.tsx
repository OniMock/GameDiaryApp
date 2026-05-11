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
    <div className="relative h-9 flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-full flex items-center gap-2.5 px-3 rounded-xl transition-all duration-200 shadow-sm",
          "bg-card border border-border text-muted-foreground hover:text-foreground hover:shadow-md hover:scale-[1.02]",
          isOpen && "bg-card text-foreground ring-2 ring-primary/20 border-primary/30"
        )}
      >
        <Globe size={16} className="opacity-80 text-primary" />
        <span className="text-xs font-black uppercase tracking-widest">{currentConfig?.code.split('-')[0]}</span>
        <ChevronDown size={14} className={cn("transition-transform opacity-60", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 min-w-[140px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-down">
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
                    ? "bg-primary/10 text-primary font-bold" 
                    : "hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("fi", `fi-${lang.flag}`, "rounded-sm w-4 h-3 shrink-0")}></span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
