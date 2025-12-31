import React, { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { calculatePrice, formatCurrency } from '../utils/format';
import { analyzeShotImage } from '../services/geminiService';
import { Shot, PricingRule } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ShotFormProps {
  onAddShot: (shot: Shot) => void;
  pricingTiers: PricingRule[];
}

const ShotForm: React.FC<ShotFormProps> = ({ onAddShot, pricingTiers }) => {
  const [name, setName] = useState('');
  const [frames, setFrames] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Paste Event Listener
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNewFile(e.target.files[0]);
    }
  };

  const handleNewFile = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Optional: Auto-analyze on upload if API Key exists
    if (process.env.API_KEY) {
      handleAnalyze(file);
    }
  };

  const handleAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisMessage("Sedang menganalisa gambar dengan Gemini AI...");
    try {
      const results = await analyzeShotImage(file);
      
      if (results.length === 0) {
        alert("Tidak ada shot yang terdeteksi. Silakan isi manual.");
      } else if (results.length === 1) {
        // Single shot found - fill form for review
        if (results[0].name) setName(results[0].name);
        if (results[0].frames) setFrames(results[0].frames);
        setAnalysisMessage("1 Shot terdeteksi!");
      } else {
        // Multiple shots found - Bulk add
        let addedCount = 0;
        results.forEach(item => {
          if (item.name && item.frames) {
             const numFrames = Number(item.frames);
             const newShot: Shot = {
               id: crypto.randomUUID(),
               name: item.name,
               frames: numFrames,
               price: calculatePrice(numFrames, pricingTiers), // Use dynamic tiers
               imagePreviewUrl: null, 
               imageData: null,
             };
             onAddShot(newShot);
             addedCount++;
          }
        });
        
        // Reset form immediately for bulk add
        setImageFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        alert(`Berhasil menambahkan ${addedCount} shot dari gambar secara otomatis!`);
        setAnalysisMessage('');
      }
    } catch (error) {
      console.error(error);
      alert("Gagal menganalisa gambar.");
    } finally {
      setIsAnalyzing(false);
      // Clear success message after 3 seconds if single shot
      setTimeout(() => {
          if(!imageFile) setAnalysisMessage('');
      }, 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || frames === '') return;

    const numFrames = Number(frames);
    const newShot: Shot = {
      id: crypto.randomUUID(),
      name,
      frames: numFrames,
      price: calculatePrice(numFrames, pricingTiers), // Use dynamic tiers
      imagePreviewUrl: previewUrl,
      imageData: imageFile,
    };

    onAddShot(newShot);
    
    // Reset form
    setName('');
    setFrames('');
    setImageFile(null);
    setPreviewUrl(null);
    setAnalysisMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-600" />
        Tambah Shot Baru
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload Area */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referensi Gambar / Slate / List File
          </label>
          <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${previewUrl ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
            <div className="space-y-1 text-center">
              {previewUrl ? (
                <div className="relative h-32 w-full mx-auto">
                   <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-full mx-auto object-contain rounded-md"
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setImageFile(null);
                      setPreviewUrl(null);
                      setAnalysisMessage('');
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ) : (
                <div 
                    className="cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                    <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        Upload Foto
                    </span>
                    <p className="pl-1">, drag & drop, atau paste (Ctrl+V)</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* AI Analysis Indicator */}
        {(isAnalyzing || analysisMessage) && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${isAnalyzing ? 'bg-blue-50 text-blue-600 animate-pulse' : 'bg-green-50 text-green-700'}`}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analysisMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Shot
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: SH001_COMP"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Frame
            </label>
            <input
              type="number"
              value={frames}
              onChange={(e) => setFrames(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* Price Preview for current entry */}
        {frames !== '' && (
           <div className="text-right text-sm text-gray-500">
             Estimasi item ini: <span className="font-semibold text-gray-900">{formatCurrency(calculatePrice(Number(frames), pricingTiers))}</span>
           </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambahkan ke Daftar
        </button>
      </form>
    </div>
  );
};

export default ShotForm;