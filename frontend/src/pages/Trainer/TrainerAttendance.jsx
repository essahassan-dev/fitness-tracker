import React, { useState, useEffect, useCallback } from 'react';
import {
  RiCalendarLine, RiCheckLine, RiTimeLine,
  RiQrCodeLine, RiRefreshLine,
} from 'react-icons/ri';import toast from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import QRScanner from '../../components/UI/QRScanner';

const TrainerAttendance = () => {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getTrainer({ date: dateFilter || undefined });
      setRecords(res.data.data);
      setTodayCount(res.data.todayCount);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [dateFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Client Attendance</h1>
          <p className="page-subtitle">{todayCount} of your clients present today</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanner(true)} className="btn-primary flex-shrink-0">
            <RiQrCodeLine /> Scan QR
          </button>
          <button onClick={fetchRecords} className="btn-secondary flex-shrink-0">
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Today count */}
      <div className="card-sm text-center max-w-xs">
        <p className="text-3xl font-bold text-brand-400">{todayCount}</p>
        <p className="text-dark-400 text-xs mt-1">Clients Present Today</p>
      </div>

      {/* Date filter */}
      <div className="card p-4 flex gap-3 items-center">
        <RiCalendarLine className="text-dark-500 flex-shrink-0" />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input flex-1"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="btn-secondary py-2 px-3 text-sm">All</button>
        )}
      </div>

      {/* Records */}
      {loading ? <PageLoader /> : (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">
            {dateFilter ? `Attendance on ${formatDate(dateFilter)}` : 'Recent Attendance'}
          </h2>
          {records.length === 0 ? (
            <div className="text-center py-10">
              <RiCalendarLine className="text-4xl text-dark-700 mx-auto mb-2" />
              <p className="text-dark-500 text-sm">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                  <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-400 text-sm font-bold">{getInitials(r.user?.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{r.user?.name}</p>
                    <div className="flex items-center gap-3 text-xs text-dark-500 mt-0.5">
                      <span className="flex items-center gap-1"><RiCalendarLine />{formatDate(r.date, 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><RiTimeLine />{new Date(r.checkIn).toLocaleTimeString()}</span>
                      <span className={`px-2 py-0.5 rounded-full ${r.method === 'qr' ? 'bg-brand-500/10 text-brand-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {r.method === 'qr' ? 'QR' : 'Manual'}
                      </span>
                    </div>
                  </div>
                  <RiCheckLine className="text-brand-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showScanner && <QRScanner onClose={() => { setShowScanner(false); fetchRecords(); }} />}
    </div>
  );
};

export default TrainerAttendance;
