import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MachineSelector from './components/MachineSelector';
import OrderTable from './components/OrderTable';
import CreateMachineModal from './components/CreateMachineModal';
import EditMachineModal from './components/EditMachineModal';
import Login from './components/Login';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [email, setEmail] = useState(localStorage.getItem('admin_email') || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('ALL MACHINES');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Apply root theme class on changes and persist choice
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Authenticated fetch wrapper to automatically attach JWT and handle 401s
  const authenticatedFetch = async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        setToken(null);
        return null;
      }
      return res;
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  };

  // Fetch all machines
  const fetchMachines = async () => {
    if (!token) return;
    try {
      const res = await authenticatedFetch('/api/v1/admin/machines');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setMachines(data.machines);
      }
    } catch (err) {
      console.error('Failed to fetch machines:', err);
    }
  };

  const handleUpdateMachine = async (machineId, updateData) => {
    try {
      const res = await authenticatedFetch(`/api/v1/admin/machines/${machineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        await fetchMachines();
        if (selectedMachine === machineId) {
          fetchSessions(machineId);
        }
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('Network error');
    }
  };

  // Fetch session history for selected machine
  const fetchSessions = async (machineId) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/v1/admin/history?machine_id=${machineId}`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        const allSessions = [...(data.active || []), ...(data.history || [])];
        setSessions(allSessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken, newEmail) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_email', newEmail || '');
    setToken(newToken);
    setEmail(newEmail || '');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    setToken(null);
    setEmail('');
  };

  useEffect(() => {
    if (token) {
      fetchMachines();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSessions(selectedMachine);
    }
  }, [selectedMachine, token]);

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} theme={theme} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar 
        onCreateClick={() => setIsModalOpen(true)} 
        onEditClick={() => setIsEditModalOpen(true)}
        onLogout={handleLogout}
        email={email}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
      
      <MachineSelector 
        machines={machines} 
        selectedMachine={selectedMachine} 
        onSelect={setSelectedMachine} 
      />

      <main className="flex-1 min-h-0 flex flex-col px-8 pb-8">
        <div className="bg-white dark:bg-slate-950/40 rounded-[2rem] shadow-xl shadow-slate-100 dark:shadow-none flex-1 flex flex-col overflow-hidden border border-slate-50 dark:border-slate-800/80">
          <OrderTable 
            data={sessions} 
            loading={loading} 
            onReset={() => fetchSessions(selectedMachine)}
          />
        </div>
      </main>

      <CreateMachineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchMachines}
        token={token}
      />

      <EditMachineModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        machines={machines}
        onUpdate={handleUpdateMachine}
      />
    </div>
  );
};

export default App;
