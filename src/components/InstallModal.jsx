import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Copy, Check, Download, Share2 } from 'lucide-react';

const InstallModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const [serverIp, setServerIp] = React.useState('172.20.10.2'); // Detected local IP
  const port = window.location.port || '5173';
  const appUrl = `http://${serverIp}:${port}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EMI Pro - Advanced Loan Calculator',
          text: 'Check out this professional EMI Calculator app! Install it on your phone.',
          url: appUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl relative z-10"
          >
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-center relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white active:scale-90 transition-all"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-4 shadow-inner">
                <Smartphone size={32} />
              </div>
              <h2 className="text-xl font-black text-white">Connect Mobile</h2>
              <p className="text-xs text-indigo-100 font-medium opacity-80 mt-1">Scan QR code using your phone</p>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="bg-gray-50 p-4 rounded-[2rem] border-4 border-gray-100 mb-6 shadow-inner">
                <img 
                  src={qrCodeUrl} 
                  alt="App QR Code" 
                  className="w-40 h-40 object-contain rounded-xl"
                />
              </div>

              <div className="w-full mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left px-1">
                  Server IP Address (Local Network)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="e.g. 192.168.1.XX"
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:border-blue-500/20 transition-all"
                  />
                  <button 
                    onClick={handleCopy}
                    className="p-3 bg-white rounded-xl text-blue-600 shadow-sm border border-gray-100 active:scale-90 transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 font-medium mt-2 leading-tight">
                  Mobile devices must be on the same Wi-Fi. Your current local IP seems to be <span className="text-blue-600 font-bold">172.20.10.2</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs active:scale-95 transition-all"
                >
                  <Share2 size={16} />
                  Share Link
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs active:scale-95 transition-all"
                >
                  <Download size={16} />
                  Ready
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InstallModal;
