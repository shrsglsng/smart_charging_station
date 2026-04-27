import React from 'react';
import { Smartphone, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const OrderTable = ({ data, loading, onReset }) => {
  const formatDuration = (mins) => {
    if (mins === null || mins === undefined) return '—';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReset = async (id) => {
    if (window.confirm('Are you sure you want to reset this pending session? User data will be cleared and slot will become AVAILABLE.')) {
      try {
        const res = await fetch(`/api/v1/admin/sessions/${id}/reset`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          onReset(); // Trigger refresh
        } else {
          alert(data.message);
        }
      } catch (err) {
        alert('Failed to reset session');
      }
    }
  };

  const StatusBadge = ({ status }) => {
    let styles = 'bg-slate-50 text-slate-400';
    let icon = <Clock size={12} />;
    
    switch (status) {
      case 'PENDING':
        styles = 'bg-amber-50 text-amber-600 border border-amber-100';
        icon = <Clock size={12} />;
        break;
      case 'LOCKED_CHARGING':
        styles = 'bg-blue-50 text-blue-600 border border-blue-100';
        icon = <Clock size={12} className="animate-pulse" />;
        break;
      case 'LOCKED_EXPIRED':
        styles = 'bg-rose-50 text-rose-600 border border-rose-100';
        icon = <AlertCircle size={12} />;
        break;
      case 'COMPLETED':
        styles = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
        icon = <CheckCircle size={12} />;
        break;
      default:
        styles = 'bg-slate-50 text-slate-500 border border-slate-100';
    }

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${styles}`}>
        {icon}
        {status}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-12">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Records...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-12 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
          <Smartphone size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Session Records</h3>
        <p className="text-slate-400 text-sm max-w-xs">Select a machine or create a new session to see data populating here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-4 shrink-0">
        <div className="grid grid-cols-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span>User Mobile</span>
          <span className="text-center">PIN</span>
          <span className="text-center">Slot</span>
          <span className="text-center">Status</span>
          <span className="text-center">Started At</span>
          <span className="text-center">Collected At</span>
          <span className="text-center">Usage Time</span>
          <span className="text-right">Actions</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
        {data.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-8 items-center px-8 py-5 hover:bg-slate-50/50 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-700 font-bold text-sm">{row.user_phone}</span>
            </div>

            <div className="flex justify-center">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md font-mono text-xs font-bold tracking-widest">
                {row.pin || '----'}
              </span>
            </div>

            <div className="flex justify-center">
              <span className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shadow-md">
                {row.slot_number.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex justify-center">
              <StatusBadge status={row.status || 'Completed'} />
            </div>

            <div className="text-center text-slate-500 font-semibold text-sm">
              {formatDate(row.started_at)}
            </div>

            <div className="text-center text-slate-500 font-semibold text-sm">
              {formatDate(row.collected_at)}
            </div>

            <div className="flex justify-center">
              <span className={`px-3 py-1 rounded-lg font-bold text-xs text-white shadow-sm ${
                row.total_minutes > 60 
                  ? 'bg-rose-500 shadow-rose-100' 
                  : 'bg-[#2596f1] shadow-blue-100'
              }`}>
                {formatDuration(row.total_minutes)}
              </span>
            </div>

            <div className="flex justify-end">
              {row.status === 'PENDING' && (
                <button
                  onClick={() => handleReset(row.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                  title="Reset Pending Slot"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTable;
