import React from 'react';
import { Layers } from 'lucide-react';

const MachineSelector = ({ machines, selectedMachine, onSelect }) => {
  return (
    <div className="bg-white border-b border-slate-100 px-8 py-4 shrink-0 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-[#2596f1]" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Available Stations</p>
      </div>
      
      <div className="flex items-center gap-4 overflow-hidden">
        {/* All Stations Button (Fixed) */}
        <button
          onClick={() => onSelect('ALL MACHINES')}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 shrink-0 border-2 whitespace-nowrap ${
            selectedMachine === 'ALL MACHINES'
              ? 'bg-[#2596f1] border-[#2596f1] text-white shadow-lg shadow-blue-100'
              : 'bg-white border-slate-100 text-slate-500 hover:border-[#2596f1]/20 hover:text-[#2596f1]'
          }`}
        >
          All Stations
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-100 shrink-0" />

        {/* Scrollable Machine Buttons */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3 pb-1">
          {machines.map((machine) => (
            <button
              key={machine.machine_id}
              onClick={() => onSelect(machine.machine_id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 shrink-0 border-2 flex items-center justify-center gap-3 ${
                selectedMachine === machine.machine_id
                  ? 'bg-[#2596f1] border-[#2596f1] text-white shadow-lg shadow-blue-100'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-[#2596f1]/20 hover:text-[#2596f1]'
              }`}
            >
              <span className="text-[9px] uppercase opacity-80 tracking-widest bg-slate-100/10 px-2 py-0.5 rounded-md">{machine.location}</span>
              <span className="truncate">{machine.machine_id}</span>
            </button>
          ))}
          
          {machines.length === 0 && (
            <div className="flex items-center text-slate-300 italic text-xs">
              No machines registered
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineSelector;
