import React from 'react';
import { Layers } from 'lucide-react';

const MachineSelector = ({ machines, selectedMachine, onSelect }) => {
  return (
    <div className="bg-card border-b border-border px-8 py-4 shrink-0 flex flex-col gap-3 transition-colors duration-300 font-sans">
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-primary" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Available Stations</p>
      </div>
      
      <div className="flex items-center gap-4 overflow-hidden">
        {/* All Stations Button (Fixed) */}
        <button
          onClick={() => onSelect('ALL MACHINES')}
          className={`px-5 py-2 rounded-md font-bold text-xs transition-all duration-300 shrink-0 border-2 whitespace-nowrap cursor-pointer ${
            selectedMachine === 'ALL MACHINES'
              ? 'bg-primary border-primary text-primary-foreground shadow-sm'
              : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
          }`}
        >
          All Stations
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-border shrink-0" />

        {/* Scrollable Machine Buttons */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3 pb-1">
          {machines.map((machine) => (
            <button
              key={machine.machine_id}
              onClick={() => onSelect(machine.machine_id)}
              className={`px-5 py-2 rounded-md font-bold text-xs transition-all duration-300 shrink-0 border-2 flex items-center justify-center gap-3 cursor-pointer ${
                selectedMachine === machine.machine_id
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
            >
              <span className="text-[9px] uppercase opacity-80 tracking-widest bg-muted px-2 py-0.5 rounded-sm text-muted-foreground">{machine.location}</span>
              <span className="truncate">{machine.machine_id}</span>
            </button>
          ))}
          
          {machines.length === 0 && (
            <div className="flex items-center text-muted-foreground italic text-xs">
              No machines registered
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineSelector;
