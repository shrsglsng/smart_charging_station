import React from 'react';
import { LogOut, Plus, User, Wrench, Sun, Moon } from 'lucide-react';

const Navbar = ({ onCreateClick, onEditClick, onLogout, email, theme, onThemeToggle }) => {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-card text-card-foreground border-b border-border shadow-sm shrink-0 z-10 transition-colors duration-300 font-sans">
      <div className="flex items-center gap-4">
        {/* Logo Icon Container */}
        <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center shadow-md text-primary-foreground">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tight text-foreground uppercase">
          Charging<span className="text-primary">Station</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Machine Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onEditClick}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md transition-all duration-300 shadow-sm hover:scale-[1.01] active:scale-95 text-sm font-bold border border-border group cursor-pointer"
          >
            <Wrench size={16} className="group-hover:rotate-12 transition-transform" />
            Edit Machine
          </button>

          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-all duration-300 shadow-sm hover:scale-[1.01] active:scale-95 text-sm font-bold cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            Create New Machine
          </button>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-4">
          {/* User Details */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-muted-foreground lowercase select-all">
              {email || 'aibotink.web@gmail.com'}
            </span>
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Admin Dashboard
            </span>
          </div>

          {/* User Profile Circle */}
          <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <User size={18} />
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Dynamic Light/Dark Theme Switcher */}
          <button 
            onClick={onThemeToggle}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all duration-300 group cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon size={18} className="group-hover:-rotate-12 transition-transform" />
            ) : (
              <Sun size={18} className="group-hover:rotate-45 transition-transform" />
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all duration-300 group cursor-pointer"
            title="Log Out"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
