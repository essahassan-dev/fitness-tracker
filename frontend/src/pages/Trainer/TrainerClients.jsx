import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine, RiRunLine, RiScalesLine, RiCalendarLine,
  RiArrowRightLine, RiGroupLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { trainerAPI } from '../../services/api';
import { formatDate, formatRelativeDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';

const TrainerClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainerAPI.getMyUsers()
      .then((res) => setClients(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Clients</h1>
        <p className="page-subtitle">{clients.length} clients assigned to you</p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={RiGroupLine}
          title="No clients assigned"
          description="Ask your admin to assign clients to you."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client._id}
              onClick={() => navigate(`/trainer/client/${client._id}`)}
              className="card hover:border-dark-700 transition-all cursor-pointer group"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 font-bold">{getInitials(client.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{client.name}</p>
                  <p className="text-dark-500 text-xs truncate">{client.email}</p>
                </div>
                <RiArrowRightLine className="text-dark-600 group-hover:text-dark-400 transition-colors flex-shrink-0" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <RiRunLine className="text-orange-400 text-sm" />
                    <span className="text-dark-400 text-xs">Workouts</span>
                  </div>
                  <p className="text-white font-bold">{client.workoutCount || 0}</p>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <RiScalesLine className="text-brand-400 text-sm" />
                    <span className="text-dark-400 text-xs">Weight</span>
                  </div>
                  <p className="text-white font-bold">
                    {client.latestProgress?.weight ? `${client.latestProgress.weight} kg` : '—'}
                  </p>
                </div>
              </div>

              {/* Profile info */}
              <div className="mt-3 pt-3 border-t border-dark-800 flex flex-wrap gap-2">
                {client.profile?.goal && (
                  <span className="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-lg capitalize">
                    {client.profile.goal.replace('_', ' ')}
                  </span>
                )}
                {client.profile?.experienceLevel && (
                  <span className="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-lg capitalize">
                    {client.profile.experienceLevel}
                  </span>
                )}
                {client.lastWorkout && (
                  <span className="text-xs text-dark-500 flex items-center gap-1">
                    <RiCalendarLine /> {formatRelativeDate(client.lastWorkout.date)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerClients;
