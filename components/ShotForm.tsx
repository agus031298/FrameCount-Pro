import React, { useState, useRef, useEffect } from 'react';
import { Plus, Loader2, Sparkles, Image as ImageIcon, CheckCircle, AlertCircle, X } from 'lucide-react';
import { calculatePrice, formatCurrency, normalizeShotName } from '../utils/format';
import { analyzeShotImage } from '../services/geminiService';
import { Shot, PricingRule } from '../types';

interface ShotFormProps {
  onAddShot: (shot: Shot) => void;
  pricingTiers: PricingRule[];
  existingShots: Shot[];
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const ShotForm: React.FC<ShotFormProps> = ({ onAddShot, pricingTiers, existingShots }) => {
  const [name, setName] = useState('');
  const [frames, setFrames] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  const [notification, setNotification] = useState<Notification | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          handleNewFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNewFile(e.target.files[0]);
    }
  };

  const handleNewFile = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    if (process.env.API_KEY) {
      handleAnalyze(file);
    }
  };

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisMessage("AI sedang membaca...");
    try {
      const results = await analyzeShotImage(file);
      
      if (results.length === 0) {
        showNotification("Tidak ada shot yang terdeteksi.", 'error');
      } else {
        let addedCount = 0;
        let duplicateCount = 0;
        const currentBatchNames = new Set<string>(); // To track duplicates within the upload itself

        results.forEach(item => {
          if (item.name && item.frames) {
             const normalizedName = normalizeShotName(item.name);
             
             // Check if exists in DB or in current batch
             const isDuplicateInDb = existingShots.some(s => s.name === normalizedName);
             const isDuplicateInBatch = currentBatchNames.has(normalizedName);

             if (isDuplicateInDb || isDuplicateInBatch) {
                duplicateCount++;
                return;
             }

             currentBatchNames.add(normalizedName);
             const numFrames = Number(item.frames);
             const newShot: Shot = {
               id: crypto.randomUUID(),
               name: normalizedName,
               frames: numFrames,
               price: calculatePrice(numFrames, pricingTiers),
               imagePreviewUrl: null, 
               imageData: null,
             };
             onAddShot(newShot);
             addedCount++;
          }
        });
        
        setImageFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        setAnalysisMessage('');
        
        if (duplicateCount > 0) {
            showNotification(`+ ${addedCount} shot ditambahkan. (${duplicateCount} duplikat dilewati)`, 'success');
        } else {
            showNotification(`+ ${addedCount} shot berhasil ditambahkan.`, 'success');
        }
      }
    } catch (error) {
      console.error(error);
      showNotification("Gagal menganalisa gambar.", 'error');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
          if(!imageFile) setAnalysisMessage('');
      }, 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || frames === '') return;

    // Normalize and Check Duplicate
    const normalizedName = normalizeShotName(name);
    
    if (existingShots.some(s => s.name === normalizedName)) {
        showNotification(`Nama shot "${normalizedName}" sudah ada!`, 'error');
        return;
    }

    const numFrames = Number(frames);
    const newShot: Shot = {
      id: crypto.randomUUID(),
      name: normalizedName,
      frames: numFrames,
      price: calculatePrice(numFrames, pricingTiers),
      imagePreviewUrl: previewUrl,
      imageData: imageFile,
    };

    onAddShot(newShot);
    showNotification('Shot berhasil ditambahkan', 'success');
    
    setName('');
    setFrames('');
    setImageFile(null);
    setPreviewUrl(null);
    setAnalysisMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFrameInputDisabled = !name.trim();

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Input Shot</h2>
          {(isAnalyzing || analysisMessage) && (
            <div className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full ${isAnalyzing ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {analysisMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Upload Area */}
          <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group relative w-full h-32 rounded-xl border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden
              ${previewUrl ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
          >
              {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          Ganti Gambar
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-200 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                        Upload atau Paste (Ctrl+V)
                    </p>
                  </div>
                )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Nama Shot
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SQ01_SH10"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-gray-900 transition-all"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1 transition-colors ${isFrameInputDisabled ? 'text-gray-300' : 'text-gray-400'}`}>
                  Jumlah Frame
                  </label>
                  <input
                    type="number"
                    value={frames}
                    onChange={(e) => setFrames(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={isFrameInputDisabled ? "Isi nama dulu" : "0"}
                    min="0"
                    disabled={isFrameInputDisabled}
                    className={`w-full px-4 py-3 border-none rounded-xl font-medium transition-all
                      ${isFrameInputDisabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed placeholder-gray-300' 
                        : 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900'
                      }`}
                    required
                  />
              </div>
              {/* Live Price Preview */}
              <div className="flex-1 flex flex-col justify-end">
                  <div className={`h-[46px] flex items-center justify-end px-4 border border-gray-100 rounded-xl text-right transition-colors ${isFrameInputDisabled ? 'bg-gray-50 opacity-50' : 'bg-white'}`}>
                      {frames !== '' && !isFrameInputDisabled && (
                          <div>
                            <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Estimasi</div>
                            <div className="text-sm font-bold text-gray-900">{formatCurrency(calculatePrice(Number(frames), pricingTiers))}</div>
                          </div>
                      )}
                  </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-gray-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah ke List
          </button>
        </form>
      </div>

      {/* Modern Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border ${
            notification.type === 'success' 
              ? 'bg-white border-emerald-100 text-emerald-800' 
              : 'bg-white border-rose-100 text-rose-800'
          }`}>
            <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              {notification.type === 'success' ? (
                <CheckCircle className={`w-5 h-5 ${notification.type === 'success' ? 'text-emerald-600' : 'text-emerald-600'}`} />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold">{notification.type === 'success' ? 'Berhasil' : 'Peringatan'}</p>
              <p className="text-xs font-medium opacity-80">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ShotForm;