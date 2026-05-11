import React, { type ReactNode } from 'react';
import { Header } from '../Header/Header';
import { MobileNav } from '../MobileNav/MobileNav';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 pb-20 md:pb-0">
      <Header />
      <main className="flex-1 pt-14 container mx-auto px-4">
        {children}
      </main>
      <footer className="py-6 border-t border-foreground/10 text-center text-sm text-foreground/50">
        &copy; {new Date().getFullYear()} GameDiary. All rights reserved.
      </footer>
      <MobileNav />
    </div>
  );
};
