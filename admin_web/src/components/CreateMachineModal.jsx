import React, { useState } from 'react';
import { X, Cpu, MapPin, Hash, Check } from 'lucide-react';

const CreateMachineModal = ({ isOpen, onClose, onSuccess }) => {
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
        headers: { 'Content-Type': 'application/json' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#2596f1] px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Register Machine</h2>
            <p className="text-blue-50 text-[10px] font-bold uppercase tracking-widest mt-1">Add New Infrastructure</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Machine ID */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block flex justify-between">
                <span>Machine Identifier</span>
                <span className="text-[#2596f1] lowercase font-bold tracking-normal italic">(Format: A01-Z99)</span>
              </label>
              <div className="relative group">
                <Cpu size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2596f1] transition-colors" />
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
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#2596f1]/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                Physical Location
              </label>
              <div className="relative group">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2596f1] transition-colors" />
                <input
                  required
                  type="text"
                  placeholder="e.g. CENTRAL MALL"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#2596f1]/20 focus:bg-white transition-all uppercase"
                />
              </div>
            </div>

            {/* Number of Slots */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                Charging Slots
              </label>
              <div className="relative group">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2596f1] transition-colors" />
                <input
                  required
                  type="number"
                  min="1"
                  max="50"
                  value={formData.num_slots}
                  onChange={(e) => setFormData({ ...formData, num_slots: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#2596f1]/20 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-xl ${
              loading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 active:scale-95'
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
