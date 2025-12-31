import React, { useState } from 'react';
import { Calculator, Info, Pencil, X, Save, ArrowDown } from 'lucide-react';
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
    notes: ''
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
    // Pass current pricing tiers to PDF generator
    generateInvoicePDF(shots, config, pricingTiers);
  };

  const openPriceModal = () => {
    // Clone to avoid reference issues
    setTempTiers(JSON.parse(JSON.stringify(pricingTiers)));
    setIsPriceModalOpen(true);
  };

  const handleTierChange = (index: number, field: keyof PricingRule, value: string | number) => {
    const updated = [...tempTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTempTiers(updated);
  };

  const savePricingTiers = () => {
    setPricingTiers(tempTiers);
    // Recalculate ALL existing shots with new prices/rules
    setShots(prevShots => prevShots.map(shot => ({
      ...shot,
      price: calculatePrice(shot.frames, tempTiers)
    })));
    setIsPriceModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-md">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">FrameCount Pro</h1>
              <p className="text-xs text-gray-500">2D Animator Cost Estimator</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
             <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">Powered by Gemini AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* SECTION 1: PRICING INFO (TOP) */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Kategori Harga Saat Ini</h3>
            <button 
              onClick={openPriceModal}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Ketentuan & Harga
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pricingTiers.map((tier, index) => (
              <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-xs uppercase font-bold text-gray-400 mb-2">{tier.label}</span>
                <span className="text-xs text-gray-500 mb-1">{tier.min} - {tier.max > 90000 ? '∞' : tier.max} frames</span>
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(tier.price)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: INPUT AREA (MIDDLE) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
             <ShotForm onAddShot={handleAddShot} pricingTiers={pricingTiers} />
          </div>
          <div className="md:col-span-1">
             <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 h-full flex flex-col justify-center">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Info className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">Panduan Penggunaan</h4>
                    <ul className="text-sm text-blue-800 space-y-2 list-disc list-outside ml-4">
                       <li>Gunakan tombol <strong>"Upload Foto"</strong> untuk memasukkan data otomatis dari screenshot slate/folder.</li>
                       <li>Anda bisa melakukan <strong>Paste (Ctrl+V)</strong> gambar langsung ke area form.</li>
                       <li>Harga akan terhitung otomatis berdasarkan tabel di atas.</li>
                    </ul>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* SECTION 3: LIST AREA (BOTTOM) */}
        <section>
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

      {/* --- Global Price Edit Modal --- */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Edit Kategori & Harga</h3>
              <button onClick={() => setIsPriceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {tempTiers.map((tier, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="mb-3">
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Nama Kategori</label>
                        <input 
                            type="text"
                            value={tier.label}
                            onChange={(e) => handleTierChange(index, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Min Frame</label>
                            <input 
                                type="number"
                                value={tier.min}
                                onChange={(e) => handleTierChange(index, 'min', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Max Frame</label>
                            <input 
                                type="number"
                                value={tier.max}
                                onChange={(e) => handleTierChange(index, 'max', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Harga (IDR)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                                <input 
                                    type="number"
                                    value={tier.price}
                                    onChange={(e) => handleTierChange(index, 'price', Number(e.target.value))}
                                    className="w-full pl-8 pr-3 py-2 border border-blue-300 bg-white rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm font-semibold text-blue-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs mt-4">
              <p>Perhatian: Merubah rentang frame akan mempengaruhi kalkulasi otomatis shot yang sudah ada maupun yang baru.</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsPriceModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
              <button 
                onClick={savePricingTiers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;