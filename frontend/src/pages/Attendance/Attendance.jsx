import React, { useState, useEffect, useCallback } from 'react';
import {
  RiQrCodeLine, RiCheckLine, RiCalendarLine,
  RiTimeLine, RiRefreshLine, RiShieldCheckLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';
import { PageLoader } from '../../components/UI/LoadingSpinner';

const Attendance = () => {
  const [qrData, setQrData]       = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [stats, setStats]         = useState({ total: 0, thisMonth: 0 });
  const [timeLeft, setTimeLeft]   = useState(0);

  const fetchQR = useCallback(async () => {
    setQrLoading(true);
    try {
      const res = await attendanceAPI.generateQR();
      setQrData(res.data.data);
      setTimeLeft(res.data.data.expiresIn || 600);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setQrLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await attendanceAPI.getMy();
      setHistory(res.data.data);
      setStats({ total: res.data.total, thisMonth: res.data.thisMonth });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQR();
    fetchHistory();
  }, []);

  // Countdown timer for QR expiry
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Mark your daily attendance using your QR code</p>
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
        <p className="text-dark-400 text-xs mb-4">Show this to your trainer or scan it at the gym entrance</p>

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

                {/* Timer */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  timeLeft > 120 ? 'bg-brand-500/10 text-brand-400' :
                  timeLeft > 30  ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  <RiTimeLine />
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'QR Expired'}
                </div>

                <button
                  onClick={fetchQR}
                  disabled={qrLoading || timeLeft > 540}
                  className="btn-secondary text-sm"
                >
                  <RiRefreshLine /> Refresh QR
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(qrData.qrToken); toast.success('Token copied!'); }}
                  className="btn-secondary text-sm"
                  title="Copy token for manual entry"
                >
                  Copy Token
                </button>
              </div>
            ) : (
              <button onClick={fetchQR} className="btn-primary mx-auto">
                <RiQrCodeLine /> Generate QR Code
              </button>
            )}
          </>
        )}
      </div>

      {/* How to use */}
      <div className="card border-blue-500/20 bg-blue-500/5">
        <h3 className="text-white font-semibold text-sm mb-2">How to mark attendance</h3>
        <ol className="space-y-1.5 text-dark-400 text-xs">
          <li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span> Generate your QR code above</li>
          <li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span> Show it to your trainer or gym scanner</li>
          <li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span> QR is valid for 10 minutes only</li>
          <li className="flex gap-2"><span className="text-brand-400 font-bold">4.</span> One attendance per day allowed</li>
        </ol>
      </div>

      {/* History */}
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
                    Check-in: {new Date(r.checkIn).toLocaleTimeString()} · {r.method === 'qr' ? 'QR Scan' : 'Manual'}
                  </p>
                </div>
                <span className="text-xs bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full">Present</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
