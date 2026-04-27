import React from 'react';
import { LogOut, Plus, User, Wrench } from 'lucide-react';

const Navbar = ({ onCreateClick, onEditClick }) => {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shadow-sm shrink-0 z-10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#2596f1] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="text-xl font-black tracking-tight text-slate-800 uppercase">
          Charging<span className="text-[#2596f1]">Station</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onEditClick}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-95 text-sm font-bold border border-slate-200 group"
          >
            <Wrench size={18} className="group-hover:rotate-12 transition-transform" />
            Edit Machine
          </button>
          
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-[#2596f1] hover:brightness-110 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-blue-100 hover:scale-[1.02] active:scale-95 text-sm font-bold"
          >
            <Plus size={18} strokeWidth={3} />
            Create New Machine
          </button>
        </div>

        <div className="h-8 w-px bg-slate-100" />

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800">Admin User</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Dashboard</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
            <User size={20} />
          </div>
          <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 group">
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
