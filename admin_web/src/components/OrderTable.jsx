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
    let styles = 'bg-secondary text-secondary-foreground border border-border';
    let icon = <Clock size={10} />;
    
    switch (status) {
      case 'PENDING':
        styles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
        icon = <Clock size={10} />;
        break;
      case 'LOCKED_CHARGING':
        styles = 'bg-primary/10 text-primary border border-primary/20';
        icon = <Clock size={10} className="animate-pulse" />;
        break;
      case 'LOCKED_EXPIRED':
        styles = 'bg-destructive/10 text-destructive border border-destructive/20';
        icon = <AlertCircle size={10} />;
        break;
      case 'COMPLETED':
        styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
        icon = <CheckCircle size={10} />;
        break;
      default:
        styles = 'bg-secondary text-secondary-foreground border border-border';
    }

    return (
      <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${styles}`}>
        {icon}
        {status}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card p-12 transition-colors duration-300 font-sans">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Loading Records...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card p-12 text-center transition-colors duration-300 font-sans">
        <div className="w-16 h-16 bg-secondary border border-border rounded-full flex items-center justify-center text-muted-foreground mb-6">
          <Smartphone size={32} />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Session Records</h3>
        <p className="text-muted-foreground text-sm max-w-xs">Select a machine or create a new session to see data populating here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card text-card-foreground overflow-hidden transition-colors duration-300 font-sans">
      {/* Table Header */}
      <div className="bg-muted/40 border-b border-border px-8 py-4 shrink-0 transition-colors duration-300">
        <div className="grid grid-cols-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
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
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-border/30">
        {data.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-8 items-center px-8 py-4 hover:bg-muted/30 border-b border-border/40 transition-colors duration-200 group text-foreground"
          >
            <div className="flex items-center gap-3">
              <span className="text-foreground font-bold text-sm">{row.user_phone}</span>
            </div>

            <div className="flex justify-center">
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md font-mono text-xs font-bold tracking-widest border border-border/50">
                {row.pin || '----'}
              </span>
            </div>

            <div className="flex justify-center">
              <span className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-slate-100 dark:text-slate-200 border border-border flex items-center justify-center font-black text-xs select-none shadow-sm">
                {row.slot_number.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex justify-center">
              <StatusBadge status={row.status || 'Completed'} />
            </div>

            <div className="text-center text-muted-foreground font-semibold text-sm">
              {formatDate(row.started_at)}
            </div>

            <div className="text-center text-muted-foreground font-semibold text-sm">
              {formatDate(row.collected_at)}
            </div>

            <div className="flex justify-center">
              <span className={`px-3 py-1 rounded-md font-bold text-xs text-white shadow-sm ${
                row.total_minutes > 60 
                  ? 'bg-destructive/90 shadow-sm' 
                  : 'bg-primary shadow-sm'
              }`}>
                {formatDuration(row.total_minutes)}
              </span>
            </div>

            <div className="flex justify-end">
              {row.status === 'PENDING' && (
                <button
                  onClick={() => handleReset(row.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all duration-300 active:scale-95 cursor-pointer"
                  title="Reset Pending Slot"
                >
                  <Trash2 size={16} />
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
