import React, { useState } from 'react';
import { Calculator, Info, Pencil, X, Save, Sparkles, Trash2, Plus } from 'lucide-react';
import ShotForm from './components/ShotForm';
import ShotList from './components/ShotList';
import { Shot, PRICING_TIERS as DEFAULT_TIERS, PdfConfig, PricingRule } from './types';
import { generateInvoicePDF } from './services/pdfService';
import { formatCurrency, calculatePrice } from './utils/format';

const App: React.FC = () => {
  const [shots, setShots] = useState<Shot[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingRule[]>(DEFAULT_TIERS);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  
  // Temp state for editing prices inside modal
  const [tempTiers, setTempTiers] = useState<PricingRule[]>(DEFAULT_TIERS);

  // PDF Configuration State
  const [pdfConfig, setPdfConfig] = useState<PdfConfig>({
    title: 'Estimasi Biaya Shot LOM',
    artistName: '',
    reportId: Math.floor(Math.random() * 100000).toString(),
    notes: '',
    periodMonth: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  });

  const handleAddShot = (shot: Shot) => {
    setShots((prev) => [...prev, shot]);
  };

  const handleRemoveShot = (id: string) => {
    setShots((prev) => prev.filter((shot) => shot.id !== id));
  };

  const handleUpdateShot = (updatedShot: Shot) => {
    const recalculatedPrice = calculatePrice(updatedShot.frames, pricingTiers);
    const finalShot = { ...updatedShot, price: recalculatedPrice };
    
    setShots((prev) => prev.map((shot) => (shot.id === finalShot.id ? finalShot : shot)));
  };

  const handleGeneratePDF = (config: PdfConfig) => {
    generateInvoicePDF(shots, config, pricingTiers);
  };

  const openPriceModal = () => {
    setTempTiers(JSON.parse(JSON.stringify(pricingTiers)));
    setIsPriceModalOpen(true);
  };

  const handleTierChange = (index: number, field: keyof PricingRule, value: string | number) => {
    const updated = [...tempTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTempTiers(updated);
  };

  const handleAddTier = () => {
    setTempTiers([
      ...tempTiers,
      { min: 0, max: 0, price: 0, label: `Kategori ${tempTiers.length + 1}` }
    ]);
  };

  const handleDeleteTier = (index: number) => {
    setTempTiers(tempTiers.filter((_, i) => i !== index));
  };

  const isTierInUse = (tier: PricingRule) => {
    return shots.some(shot => shot.frames >= tier.min && shot.frames <= tier.max);
  };

  const savePricingTiers = () => {
    setPricingTiers(tempTiers);
    setShots(prevShots => prevShots.map(shot => ({
      ...shot,
      price: calculatePrice(shot.frames, tempTiers)
    })));
    setIsPriceModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* Navbar Minimalist */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                <span className="font-bold text-lg leading-none tracking-tighter">Fc</span>
             </div>
             <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">FrameCount Pro | 2D Animator Cost Estimator</h1>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
             <div className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Gemini AI Inside</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-24 flex flex-col gap-10">
        
        {/* SECTION 1: Pricing Dashboard (Top) */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kategori Harga</h2>
              <p className="text-gray-500 text-sm mt-1">Acuan perhitungan otomatis per shot.</p>
            </div>
            <button 
              onClick={openPriceModal}
              className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-2 border-b border-transparent hover:border-gray-900 pb-0.5"
            >
              <Pencil className="w-3 h-3" />
              Sesuaikan Harga
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{tier.label}</span>
                   <div className={`w-2 h-2 rounded-full ${index % 3 === 0 ? 'bg-emerald-400' : index % 3 === 1 ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                </div>
                <div className="mt-auto">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrency(tier.price).replace(',00', '')}</div>
                  <div className="text-sm font-medium text-gray-400 mt-1">{tier.min} - {tier.max} frames</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Input & Guide (Middle) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <div className="md:col-span-2">
             <ShotForm 
                onAddShot={handleAddShot} 
                pricingTiers={pricingTiers} 
                existingShots={shots} 
             />
          </div>
          <div className="md:col-span-1">
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-full flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                     <Info className="w-5 h-5 text-gray-900" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Panduan</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-500 leading-relaxed">
                   <li className="flex gap-2">
                      <span className="font-bold text-gray-900">•</span>
                      <span>Upload screenshot folder/slate untuk auto-detect nama shot & frame count.</span>
                   </li>
                   <li className="flex gap-2">
                      <span className="font-bold text-gray-900">•</span>
                      <span>Gunakan <strong>Ctrl+V</strong> untuk paste gambar langsung ke area input.</span>
                   </li>
                   <li className="flex gap-2">
                      <span className="font-bold text-gray-900">•</span>
                      <span>Format nama otomatis dirapikan (Contoh: SQ21 SC1 SH2 -> SQ21_SC01_SH02).</span>
                   </li>
                   <li className="flex gap-2">
                      <span className="font-bold text-gray-900">•</span>
                      <span>Sistem otomatis menolak nama shot yang duplikat.</span>
                   </li>
                </ul>
             </div>
          </div>
        </section>

        {/* SECTION 3: List & Table (Bottom) */}
        <section>
          <div className="mb-6">
             <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Rekap Shoot & Biaya</h2>
             <p className="text-gray-500 text-sm mt-1">Daftar lengkap shot yang telah diinput.</p>
          </div>
          <ShotList 
            shots={shots} 
            pricingTiers={pricingTiers}
            onRemoveShot={handleRemoveShot}
            onUpdateShot={handleUpdateShot} 
            onGeneratePDF={handleGeneratePDF}
            pdfConfig={pdfConfig}
            setPdfConfig={setPdfConfig}
          />
        </section>

      </main>

      {/* --- Global Price Edit Modal (Clean) --- */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Edit Konfigurasi Harga</h3>
              <button onClick={() => setIsPriceModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {tempTiers.map((tier, index) => {
                const inUse = isTierInUse(tier);
                return (
                  <div key={index} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors relative group">
                      <div className="w-full md:w-1/4">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Label</label>
                          <input 
                              type="text"
                              value={tier.label}
                              onChange={(e) => handleTierChange(index, 'label', e.target.value)}
                              className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-gray-900"
                          />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Min</label>
                              <input 
                                  type="number"
                                  value={tier.min}
                                  onChange={(e) => handleTierChange(index, 'min', Number(e.target.value))}
                                  className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Max</label>
                              <input 
                                  type="number"
                                  value={tier.max}
                                  onChange={(e) => handleTierChange(index, 'max', Number(e.target.value))}
                                  className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-gray-900"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">IDR</label>
                              <input 
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) => handleTierChange(index, 'price', Number(e.target.value))}
                                  className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-gray-900"
                              />
                          </div>
                      </div>
                      <div className="flex items-center justify-center pl-2 md:pt-6">
                         <button 
                            onClick={() => handleDeleteTier(index)}
                            disabled={inUse}
                            title={inUse ? "Kategori sedang digunakan oleh shot yang ada" : "Hapus Kategori"}
                            className={`p-2 rounded-lg transition-colors ${inUse ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'}`}
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                  </div>
                );
              })}
              
              <button 
                onClick={handleAddTier}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-semibold text-sm hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Kategori Baru
              </button>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsPriceModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Batal
              </button>
              <button 
                onClick={savePricingTiers}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold shadow-lg shadow-gray-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;