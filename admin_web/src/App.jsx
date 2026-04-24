import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MachineSelector from './components/MachineSelector';
import OrderTable from './components/OrderTable';
import CreateMachineModal from './components/CreateMachineModal';
import EditMachineModal from './components/EditMachineModal';

const App = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('ALL MACHINES');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch all machines on mount
  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/v1/admin/machines');
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
      const res = await fetch(`/api/v1/admin/machines/${machineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMachines();
        // If current selected machine was updated, refresh sessions
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

  // Fetch session history (active + past) for selected machine
  const fetchSessions = async (machineId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/history?machine_id=${machineId}`);
      const data = await res.json();
      if (data.success) {
        // Merge active (ongoing) sessions with past history
        const allSessions = [...(data.active || []), ...(data.history || [])];
        setSessions(allSessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    fetchSessions(selectedMachine);
  }, [selectedMachine]);

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#F8FAFC]">
      <Navbar 
        onCreateClick={() => setIsModalOpen(true)} 
        onEditClick={() => setIsEditModalOpen(true)}
      />
      
      <MachineSelector 
        machines={machines} 
        selectedMachine={selectedMachine} 
        onSelect={setSelectedMachine} 
      />

      <main className="flex-1 min-h-0 flex flex-col px-8 pb-8">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 flex-1 flex flex-col overflow-hidden border border-slate-50">
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
