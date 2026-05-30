import React, { useState, useEffect } from 'react';
import { X, Settings2, MapPin, Layers, Save, Loader2, Key } from 'lucide-react';

const EditMachineModal = ({ isOpen, onClose, machines, onUpdate, onDelete }) => {
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [location, setLocation] = useState('');
  const [numSlots, setNumSlots] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Delete States
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // When a machine is selected, pre-fill its current data
  useEffect(() => {
    if (selectedMachineId) {
      const machine = machines.find(m => m.machine_id === selectedMachineId);
      if (machine) {
        setLocation(machine.location || '');
        setNumSlots(machine.slotCount || ''); 
        setPassword(''); // Reset password input on select swap
        setShowConfirmDelete(false);
        setAdminPassword('');
      }
    } else {
      setLocation('');
      setNumSlots('');
      setPassword('');
      setShowConfirmDelete(false);
      setAdminPassword('');
    }
  }, [selectedMachineId, machines]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachineId || !location || !numSlots) return;

    setLoading(true);
    try {
      await onUpdate(selectedMachineId, { 
        location, 
        num_slots: numSlots,
        machine_password: password 
      });
      onClose();
      setSelectedMachineId('');
      setPassword('');
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 transition-colors duration-300 font-sans">
        {/* Header */}
        <div className="bg-muted px-6 py-4 border-b border-border flex justify-between items-center text-foreground transition-colors duration-300">
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">Edit Machine</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Update Existing Station</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-md transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Machine Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Select Machine</label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors">
                <Settings2 size={16} />
              </div>
              <select
                required
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full bg-background border border-input rounded-md py-2.5 pl-10 pr-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300 appearance-none"
              >
                <option value="" className="dark:bg-slate-900 text-muted-foreground">Choose a station...</option>
                {machines.map((m) => (
                  <option key={m.machine_id} value={m.machine_id} className="dark:bg-slate-900 text-foreground font-bold">
                    {m.machine_id} — {m.location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Fields */}
          {selectedMachineId && (
            <div className="space-y-5 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">New Location</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors">
                    <MapPin size={16} />
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="e.g. PHOENIX MALL, ENTRANCE A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value.toUpperCase())}
                    className="w-full bg-background border border-input rounded-md py-2.5 pl-10 pr-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">Adjust Slot Count</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors">
                    <Layers size={16} />
                  </div>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={numSlots}
                    onChange={(e) => setNumSlots(e.target.value)}
                    className="w-full bg-background border border-input rounded-md py-2.5 pl-10 pr-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold px-1">
                  Increasing this will add new lockers. Decreasing will remove unused ones.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5 mb-1.5 block">
                  New Machine Password (Optional)
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors">
                    <Key size={16} />
                  </div>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-input rounded-md py-2.5 pl-10 pr-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-md shadow-sm transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer"
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

              {/* Delete Machine Section */}
              <div className="pt-4 border-t border-border mt-5 space-y-4">
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 font-bold py-2.5 rounded-md text-xs tracking-widest uppercase transition-all duration-300 border border-destructive/20 cursor-pointer"
                  >
                    Delete Machine
                  </button>
                ) : (
                  <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-md space-y-3 animate-in fade-in duration-300">
                    <p className="text-[10px] font-black text-destructive uppercase tracking-widest">
                      ⚠️ DANGER: PERMANENTLY DELETE MACHINE
                    </p>
                    <p className="text-muted-foreground text-[10px] font-semibold leading-relaxed">
                      This will permanently delete machine {selectedMachineId} and all of its associated locker slot documents from the database.
                    </p>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-0.5">
                        Admin Password Required
                      </label>
                      <input
                        required={showConfirmDelete}
                        type="password"
                        placeholder="Enter your admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-background border border-input rounded-md py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={deleteLoading}
                        onClick={async () => {
                          if (!adminPassword) return;
                          setDeleteLoading(true);
                          const success = await onDelete(selectedMachineId, adminPassword);
                          setDeleteLoading(false);
                          if (success) {
                            onClose();
                            setSelectedMachineId('');
                          }
                        }}
                        className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold py-2 rounded-md text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer"
                      >
                        {deleteLoading ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          'Confirm Delete'
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={deleteLoading}
                        onClick={() => {
                          setShowConfirmDelete(false);
                          setAdminPassword('');
                        }}
                        className="bg-muted hover:bg-muted-foreground/10 text-foreground font-semibold px-4 py-2 rounded-md text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditMachineModal;
