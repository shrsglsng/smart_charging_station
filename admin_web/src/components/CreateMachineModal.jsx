import React, { useState } from 'react';
import { X, Cpu, MapPin, Hash, Check } from 'lucide-react';

const CreateMachineModal = ({ isOpen, onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    machine_id: '',
    location: '',
    num_slots: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/admin/machines', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        onSuccess();
        onClose();
        setFormData({ machine_id: '', location: '', num_slots: 10 });
      } else {
        setError(data.message || 'Failed to create machine');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-300 transition-colors duration-300 font-sans">
        {/* Header */}
        <div className="bg-muted px-6 py-4 border-b border-border flex justify-between items-center text-foreground">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Register Machine</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Add New Infrastructure</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-md transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3.5 rounded-md text-xs font-semibold border border-destructive/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Machine ID */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5 mb-1.5 block flex justify-between">
                <span>Machine Identifier</span>
                <span className="text-primary lowercase font-bold tracking-normal italic">(Format: A01-Z99)</span>
              </label>
              <div className="relative group">
                <Cpu size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors" />
                <input
                  required
                  type="text"
                  maxLength={3}
                  placeholder="e.g. A01"
                  value={formData.machine_id}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (val === '' || /^[A-Z]?[0-9]{0,2}$/.test(val)) {
                      setFormData({ ...formData, machine_id: val });
                    }
                  }}
                  className="w-full bg-background border border-input rounded-md pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5 mb-1.5 block">
                Physical Location
              </label>
              <div className="relative group">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors" />
                <input
                  required
                  type="text"
                  placeholder="e.g. CENTRAL MALL"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                  className="w-full bg-background border border-input rounded-md pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300 uppercase"
                />
              </div>
            </div>

            {/* Number of Slots */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-0.5 mb-1.5 block">
                Charging Slots
              </label>
              <div className="relative group">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/75 group-focus-within:text-primary transition-colors" />
                <input
                  required
                  type="number"
                  min="1"
                  max="50"
                  value={formData.num_slots}
                  onChange={(e) => setFormData({ ...formData, num_slots: e.target.value })}
                  className="w-full bg-background border border-input rounded-md pl-10 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-md font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
              loading 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} strokeWidth={3} />
                Deploy Machine
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMachineModal;
