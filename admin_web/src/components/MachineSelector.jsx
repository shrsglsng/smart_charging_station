import React, { useState } from 'react';
import { Layers, MapPin, Eye } from 'lucide-react';

const MachineSelector = ({ machines, selectedMachine, onSelect }) => {
  const [showPassword, setShowPassword] = useState(false);

  const currentMachine = selectedMachine !== 'ALL MACHINES' 
    ? machines.find(m => m.machine_id === selectedMachine)
    : null;

  return (
    <div className="bg-card border-b border-border px-8 py-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300 font-sans">
      {/* Left Side: Title & Buttons */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-primary" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Available Stations</p>
        </div>
        
        <div className="flex items-center gap-4 overflow-hidden">
          {/* All Stations Button */}
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
                className={`px-5 py-2 rounded-md font-bold text-xs transition-all duration-300 shrink-0 border-2 whitespace-nowrap cursor-pointer ${
                  selectedMachine === machine.machine_id
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
                }`}
              >
                {machine.machine_id} — {machine.location}
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

      {/* Right Side: Machine Status & Info Card */}
      {currentMachine && (
        <div className="flex items-center gap-4 bg-muted/40 border border-border/80 px-5 py-3 rounded-lg animate-in slide-in-from-right-4 duration-300 self-start md:self-auto shadow-sm">
          {/* Station ID & Location */}
          <div className="flex flex-col pr-4 border-r border-border/50">
            <span className="text-[10px] font-black text-foreground tracking-tight uppercase">
              Station {currentMachine.machine_id}
            </span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
              <MapPin size={10} className="text-primary" /> {currentMachine.location}
            </span>
          </div>

          {/* Machine Password (reveal on press & hold) */}
          <div className="flex flex-col pr-4 border-r border-border/50">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              Machine Password
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold tracking-wider text-foreground min-w-[70px] select-none">
                {showPassword ? currentMachine.password_plain : '••••••••'}
              </span>
              <button
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors active:scale-95"
                title="Hold to reveal password"
              >
                <Eye size={12} />
              </button>
            </div>
          </div>

          {/* Slot Stats */}
          <div className="flex items-center gap-4">
            {/* Available Slots */}
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Available
              </span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {currentMachine.availableSlots} / {currentMachine.slotCount}
              </span>
            </div>

            {/* Booked Slots */}
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Booked
              </span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1">
                {currentMachine.bookedSlots} / {currentMachine.slotCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineSelector;
