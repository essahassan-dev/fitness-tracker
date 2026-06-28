import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  RiQrScanLine, RiCloseLine, RiCheckLine,
  RiAlertLine, RiKeyboardLine, RiCameraLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';

const QRScanner = ({ onClose }) => {
  const html5QrRef  = useRef(null);
  const [status, setStatus]     = useState('idle');
  const [result, setResult]     = useState(null);
  const [errMsg, setErrMsg]     = useState('');
  const [scanning, setScanning] = useState(false);
  const [mode, setMode]         = useState('camera'); // 'camera' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const stopScanner = async () => {
    try {
      if (html5QrRef.current?.isScanning) {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      }
    } catch {}
    setScanning(false);
  };

  const handleScan = async (qrToken) => {
    setStatus('loading');
    try {
      const res = await attendanceAPI.scan(qrToken);
      setResult(res.data.data);
      setStatus('success');
      toast.success(res.data.message);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid or expired QR code';
      setErrMsg(msg);
      setStatus('error');
    }
  };

  const startScanner = async () => {
    setStatus('scanning');
    setScanning(true);
    setErrMsg('');

    try {
      // Check if camera is available
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No camera found');
      }

      html5QrRef.current = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await stopScanner();
          await handleScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      await stopScanner();
      setStatus('idle');
      // Switch to manual mode automatically
      setMode('manual');
      setErrMsg('Camera not available. Use manual token input below.');
      toast.error('Camera unavailable — use manual input');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setSubmitting(true);
    await handleScan(manualToken.trim());
    setSubmitting(false);
  };

  const reset = async () => {
    await stopScanner();
    setStatus('idle');
    setResult(null);
    setErrMsg('');
    setManualToken('');
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={async () => { await stopScanner(); onClose(); }} />

      <div className="relative w-full max-w-sm bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <RiQrScanLine className="text-brand-400 text-xl" />
            <h2 className="text-white font-semibold">Scan Attendance QR</h2>
          </div>
          <button onClick={async () => { await stopScanner(); onClose(); }} className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-800 transition-colors">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <div className="p-5">
          {/* Mode tabs */}
          {(status === 'idle' || mode === 'manual') && (
            <div className="flex gap-1 bg-dark-800 rounded-xl p-1 mb-4">
              <button
                onClick={() => setMode('camera')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'camera' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'}`}
              >
                <RiCameraLine /> Camera
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'}`}
              >
                <RiKeyboardLine /> Manual
              </button>
            </div>
          )}

          {/* Error message */}
          {errMsg && status !== 'error' && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-xs">{errMsg}</p>
            </div>
          )}

          {/* CAMERA MODE */}
          {mode === 'camera' && status === 'idle' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <RiCameraLine className="text-brand-400 text-4xl" />
              </div>
              <div>
                <p className="text-white font-semibold">Camera Scanner</p>
                <p className="text-dark-400 text-sm mt-1">Point camera at the user's QR code</p>
              </div>
              <button onClick={startScanner} className="btn-primary w-full justify-center">
                <RiQrScanLine /> Open Camera
              </button>
            </div>
          )}

          {/* SCANNING */}
          {status === 'scanning' && (
            <div className="space-y-4">
              <div id="qr-reader" className="rounded-xl overflow-hidden w-full" />
              <p className="text-dark-400 text-xs text-center">Align QR code within the frame</p>
              <button onClick={reset} className="btn-secondary w-full justify-center">
                <RiCloseLine /> Cancel
              </button>
            </div>
          )}

          {/* MANUAL MODE */}
          {mode === 'manual' && status !== 'loading' && status !== 'success' && status !== 'error' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="label">Paste QR Token</label>
                <textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Ask user to copy their QR token from the Attendance page and paste it here"
                  rows={4}
                  className="textarea text-xs font-mono"
                />
                <p className="text-dark-600 text-xs mt-1">User can copy the token from Attendance → Show QR → Copy Token</p>
              </div>
              <button type="submit" disabled={submitting || !manualToken.trim()} className="btn-primary w-full justify-center">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RiCheckLine /> Mark Attendance</>}
              </button>
            </form>
          )}

          {/* LOADING */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-dark-700 border-t-brand-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-dark-400 text-sm">Marking attendance...</p>
            </div>
          )}

          {/* SUCCESS */}
          {status === 'success' && result && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <RiCheckLine className="text-brand-400 text-3xl" />
              </div>
              <div>
                <p className="text-brand-400 font-bold text-lg">Attendance Marked!</p>
                <div className="mt-3 bg-dark-800/50 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Name</span>
                    <span className="text-white font-medium">{result.user?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Date</span>
                    <span className="text-white">{formatDate(result.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Check-in</span>
                    <span className="text-white">{new Date(result.checkIn).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary flex-1 justify-center">
                  <RiQrScanLine /> Scan Another
                </button>
                <button onClick={async () => { await stopScanner(); onClose(); }} className="btn-primary flex-1 justify-center">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                <RiAlertLine className="text-red-400 text-3xl" />
              </div>
              <div>
                <p className="text-red-400 font-bold">Failed</p>
                <p className="text-dark-400 text-sm mt-1">{errMsg}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="btn-primary flex-1 justify-center">
                  <RiQrScanLine /> Try Again
                </button>
                <button onClick={async () => { await stopScanner(); onClose(); }} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
