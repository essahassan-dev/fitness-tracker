import React, { useState, useEffect, useCallback } from 'react';
import {
  RiQrCodeLine, RiCheckLine, RiCalendarLine, RiTimeLine,
  RiRefreshLine, RiShieldCheckLine, RiUserLocationLine,
  RiCloseCircleLine, RiAlertLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { attendanceAPI, attendanceRequestAPI } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';

// Manual request modal
const ManualRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setLoading(true);
    try {
      await attendanceRequestAPI.submit({ reason });
      toast.success('Request submitted! Admin will review it.');
      onSuccess();
      onClose();
      setReason('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Manual Attendance" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-yellow-400 text-xs flex items-start gap-2">
            <RiAlertLine className="flex-shrink-0 mt-0.5" />
            This sends a request to the admin. Your attendance will only be marked if approved.
          </p>
        </div>
        <div>
          <label className="label">Reason for not attending in person *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. I was sick, had an emergency, working from home..."
            rows={3}
            className="textarea"
            required
            maxLength={300}
          />
          <p className="text-dark-600 text-xs mt-1">{reason.length}/300</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Attendance = () => {
  const [qrData, setQrData]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [qrLoading, setQrLoading]   = useState(false);
  const [stats, setStats]           = useState({ total: 0, thisMonth: 0 });
  const [timeLeft, setTimeLeft]     = useState(0);
  const [showManual, setShowManual] = useState(false);

  const fetchQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await attendanceAPI.generateQR();
      setQrData(res.data.data);
      setTimeLeft(res.data.data.expiresIn || 600);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setQrLoading(false); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [histRes, reqRes] = await Promise.all([
        attendanceAPI.getMy(),
        attendanceRequestAPI.getMy(),
      ]);
      setHistory(histRes.data.data);
      setMyRequests(reqRes.data.data);
      setStats({ total: histRes.data.total, thisMonth: histRes.data.thisMonth });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQR(); fetchData(); }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p <= 1 ? 0 : p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return <PageLoader />;

  const REQUEST_STYLES = {
    PENDING:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    APPROVED: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Mark your daily attendance</p>
        </div>
        <button onClick={() => setShowManual(true)} className="btn-secondary text-sm">
          <RiUserLocationLine /> Mark Manually
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-sm text-center">
          <p className="text-3xl font-bold text-brand-400">{stats.thisMonth}</p>
          <p className="text-dark-400 text-xs mt-1">This Month</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.total}</p>
          <p className="text-dark-400 text-xs mt-1">Total Days</p>
        </div>
      </div>

      {/* QR Code card */}
      <div className="card text-center">
        <h2 className="text-white font-semibold mb-1">Your QR Code</h2>
        <p className="text-dark-400 text-xs mb-4">Show this to your trainer or scan at gym entrance</p>

        {qrData?.alreadyMarked ? (
          <div className="py-8">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <RiShieldCheckLine className="text-brand-400 text-3xl" />
            </div>
            <p className="text-brand-400 font-semibold text-lg">Attendance Marked!</p>
            <p className="text-dark-500 text-sm mt-1">
              Checked in at {qrData.markedAt ? new Date(qrData.markedAt).toLocaleTimeString() : 'today'}
            </p>
          </div>
        ) : (
          <>
            {qrLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-2 border-dark-700 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : qrData?.qrImage ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
                  <img src={qrData.qrImage} alt="Attendance QR" className="w-52 h-52" />
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  timeLeft > 120 ? 'bg-brand-500/10 text-brand-400' :
                  timeLeft > 30  ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  <RiTimeLine />
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'QR Expired'}
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchQR} disabled={qrLoading || timeLeft > 540} className="btn-secondary text-sm">
                    <RiRefreshLine /> Refresh QR
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(qrData.qrToken); toast.success('Token copied!'); }}
                    className="btn-secondary text-sm"
                  >
                    Copy Token
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={fetchQR} className="btn-primary mx-auto"><RiQrCodeLine /> Generate QR</button>
            )}
          </>
        )}
      </div>

      {/* How to use */}
      <div className="card border-blue-500/20 bg-blue-500/5">
        <h3 className="text-white font-semibold text-sm mb-2">How to mark attendance</h3>
        <ol className="space-y-1.5 text-dark-400 text-xs">
          <li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Generate QR → show trainer → attendance marked</li>
          <li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Can't come? Click "Mark Manually" → give reason → await admin approval</li>
          <li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> QR valid for 10 minutes, one attendance per day</li>
        </ol>
      </div>

      {/* Manual requests */}
      {myRequests.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Manual Requests</h2>
          <div className="space-y-3">
            {myRequests.map((r) => (
              <div key={r._id} className="p-3 rounded-xl bg-dark-800/50 border border-dark-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{formatDate(r.date)}</p>
                    <p className="text-dark-400 text-xs mt-0.5">"{r.reason}"</p>
                    {r.adminNote && <p className="text-dark-500 text-xs mt-1">Admin: {r.adminNote}</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0 ${REQUEST_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance history */}
      <div className="card">
        <h2 className="text-white font-semibold mb-4">Attendance History</h2>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <RiCalendarLine className="text-4xl text-dark-700 mx-auto mb-2" />
            <p className="text-dark-500 text-sm">No attendance records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <div key={r._id} className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <RiCheckLine className="text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{formatDate(r.date, 'EEEE, MMM d yyyy')}</p>
                  <p className="text-dark-500 text-xs">
                    {new Date(r.checkIn).toLocaleTimeString()} · {r.method === 'qr' ? 'QR Scan' : 'Manual'}
                  </p>
                </div>
                <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full">Present</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ManualRequestModal
        isOpen={showManual}
        onClose={() => setShowManual(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Attendance;
