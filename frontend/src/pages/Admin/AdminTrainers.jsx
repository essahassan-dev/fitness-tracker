import React, { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiUserHeartLine,
  RiGroupLine, RiRefreshLine, RiCloseLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { trainerAPI, adminAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import Modal from '../../components/UI/Modal';

// Create trainer modal
const CreateTrainerModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await trainerAPI.createTrainer(form);
      toast.success('Trainer account created!');
      onSuccess();
      onClose();
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Trainer Account" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Trainer name" className="input" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="trainer@email.com" className="input" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className="input" required minLength={6} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span> : 'Create Trainer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Assign user modal
const AssignUserModal = ({ isOpen, onClose, trainerId, trainerName, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    adminAPI.getUsers({ limit: 100, role: 'user' })
      .then((res) => setUsers(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [isOpen]);

  const handleAssign = async (userId) => {
    setAssigning(userId);
    try {
      await trainerAPI.assignUser({ trainerId, userId });
      toast.success('User assigned!');
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssigning(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Users to ${trainerName}`} size="md">
      <div className="space-y-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="input"
        />
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map((user) => (
            <div key={user._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors">
              <div className="w-9 h-9 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-brand-400 text-xs font-bold">{getInitials(user.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-dark-500 text-xs truncate">{user.email}</p>
              </div>
              <button
                onClick={() => handleAssign(user._id)}
                disabled={assigning === user._id}
                className="btn-primary text-xs py-1.5 px-3"
              >
                {assigning === user._id ? '...' : 'Assign'}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-dark-500 text-sm text-center py-4">No users found</p>}
        </div>
      </div>
    </Modal>
  );
};

// Main component
const AdminTrainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // { id, name }
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trainerAPI.getAllTrainers();
      setTrainers(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrainers(); }, [fetchTrainers]);

  const handleUnassign = async (trainerId, userId) => {
    try {
      await trainerAPI.unassignUser({ trainerId, userId });
      toast.success('User unassigned');
      fetchTrainers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await trainerAPI.deleteTrainer(deleteId);
      toast.success('Trainer deleted');
      setDeleteId(null);
      fetchTrainers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Trainer Management</h1>
          <p className="page-subtitle">{trainers.length} trainers · Assign users to trainers for progress tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTrainers} className="btn-secondary">
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <RiAddLine /> Add Trainer
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : trainers.length === 0 ? (
        <EmptyState
          icon={RiUserHeartLine}
          title="No trainers yet"
          description="Create trainer accounts to let them track client progress"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary"><RiAddLine /> Add First Trainer</button>}
        />
      ) : (
        <div className="space-y-4">
          {trainers.map((trainer) => (
            <div key={trainer._id} className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">{getInitials(trainer.name)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{trainer.name}</p>
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Trainer</span>
                    </div>
                    <p className="text-dark-500 text-xs">{trainer.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignModal({ id: trainer._id, name: trainer.name })}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    <RiGroupLine /> Assign Users
                  </button>
                  <button
                    onClick={() => setDeleteId(trainer._id)}
                    className="btn-danger text-sm py-1.5 px-3"
                  >
                    <RiDeleteBinLine />
                  </button>
                </div>
              </div>

              {/* Assigned users */}
              <div>
                <p className="text-dark-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Assigned Clients ({trainer.assignedUsers?.length || 0})
                </p>
                {trainer.assignedUsers?.length === 0 ? (
                  <p className="text-dark-600 text-sm">No clients assigned yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trainer.assignedUsers.map((u) => (
                      <div key={u._id} className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5">
                        <span className="text-white text-sm">{u.name}</span>
                        <button
                          onClick={() => handleUnassign(trainer._id, u._id)}
                          className="text-dark-500 hover:text-red-400 transition-colors"
                          title="Unassign"
                        >
                          <RiCloseLine className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTrainerModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={fetchTrainers}
      />

      {assignModal && (
        <AssignUserModal
          isOpen={!!assignModal}
          onClose={() => setAssignModal(null)}
          trainerId={assignModal.id}
          trainerName={assignModal.name}
          onSuccess={fetchTrainers}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Trainer"
        message="This will delete the trainer account and unassign all their clients. Cannot be undone."
        confirmText="Delete Trainer"
      />
    </div>
  );
};

export default AdminTrainers;
