import React, { useState, useEffect } from 'react';
import { X, Settings2, MapPin, Layers, Save, Loader2 } from 'lucide-react';

const EditMachineModal = ({ isOpen, onClose, machines, onUpdate }) => {
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [location, setLocation] = useState('');
  const [numSlots, setNumSlots] = useState('');
  const [loading, setLoading] = useState(false);

  // When a machine is selected, pre-fill its current data
  useEffect(() => {
    if (selectedMachineId) {
      const machine = machines.find(m => m.machine_id === selectedMachineId);
      if (machine) {
        setLocation(machine.location || '');
        // We'll need to fetch the actual slot count from the machine data if not provided
        // For now, we'll default it or let user enter it. 
        // In a real app, machines list should include slotCount.
        setNumSlots(machine.slotCount || ''); 
      }
    } else {
      setLocation('');
      setNumSlots('');
    }
  }, [selectedMachineId, machines]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachineId || !location || !numSlots) return;

    setLoading(true);
    try {
      await onUpdate(selectedMachineId, { location, num_slots: numSlots });
      onClose();
      setSelectedMachineId('');
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Machine</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Update Existing Station</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Machine Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Machine</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2596f1] transition-colors">
                <Settings2 size={18} />
              </div>
              <select
                required
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:border-[#2596f1]/20 focus:bg-white outline-none transition-all appearance-none"
              >
                <option value="">Choose a station...</option>
                {machines.map((m) => (
                  <option key={m.machine_id} value={m.machine_id}>
                    {m.machine_id} — {m.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Fields */}
          {selectedMachineId && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Location</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2596f1] transition-colors">
                    <MapPin size={18} />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="e.g. PHOENIX MALL, ENTRANCE A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:border-[#2596f1]/20 focus:bg-white outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjust Slot Count</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2596f1] transition-colors">
                    <Layers size={18} />
                  </div>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={numSlots}
                    onChange={(e) => setNumSlots(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-bold focus:border-[#2596f1]/20 focus:bg-white outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold px-2">
                  Increasing this will add new lockers. Decreasing will remove unused ones.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2596f1] hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                    <span>SAVE CHANGES</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditMachineModal;
