import React, { useState } from 'react';
import { Trash2, Film, Download, Pencil, X, Save, User, FileText } from 'lucide-react';
import { Shot, PdfConfig, PricingRule } from '../types';
import { formatCurrency, calculatePrice } from '../utils/format';

interface ShotListProps {
  shots: Shot[];
  pricingTiers: PricingRule[];
  onRemoveShot: (id: string) => void;
  onUpdateShot: (updatedShot: Shot) => void;
  onGeneratePDF: (config: PdfConfig) => void;
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
}

const ShotList: React.FC<ShotListProps> = ({ 
  shots, 
  pricingTiers,
  onRemoveShot, 
  onUpdateShot, 
  onGeneratePDF,
  pdfConfig,
  setPdfConfig
}) => {
  const [editingShot, setEditingShot] = useState<Shot | null>(null);

  // Derived totals
  const totalFrames = shots.reduce((acc, shot) => acc + shot.frames, 0);
  const totalPrice = shots.reduce((acc, shot) => acc + shot.price, 0);

  // --- Edit Logic ---
  const handleEditClick = (shot: Shot) => {
    setEditingShot({ ...shot });
  };

  const handleSaveEdit = () => {
    if (editingShot) {
      const finalPrice = calculatePrice(editingShot.frames, pricingTiers);
      onUpdateShot({ ...editingShot, price: finalPrice });
      setEditingShot(null);
    }
  };

  const handleEditFrameChange = (val: string) => {
    if (!editingShot) return;
    const newFrames = Number(val);
    setEditingShot({
      ...editingShot,
      frames: newFrames,
      price: calculatePrice(newFrames, pricingTiers) 
    });
  };

  if (shots.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Film className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-gray-900 font-medium mb-1">Belum ada shot</h3>
        <p className="text-gray-500 text-sm">Tambahkan shot menggunakan form di atas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-800">Daftar Shot & Kalkulasi</h2>
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {shots.length} Item
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
              <th className="px-6 py-4 font-medium">Shot</th>
              <th className="px-6 py-4 font-medium">Frames</th>
              <th className="px-6 py-4 font-medium">Kategori</th>
              <th className="px-6 py-4 font-medium text-right">Harga</th>
              <th className="px-6 py-4 font-medium w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shots.map((shot) => {
              // Determine category label based on current tiers
              const currentTier = pricingTiers.find(t => shot.frames >= t.min && shot.frames <= t.max) || pricingTiers[pricingTiers.length - 1];
              
              let badgeColor = 'bg-gray-100 text-gray-700';
              // Simple logic to colorize based on index of tier for visual variety
              const tierIndex = pricingTiers.indexOf(currentTier);
              if (tierIndex === 0) badgeColor = 'bg-green-100 text-green-700';
              else if (tierIndex === 1) badgeColor = 'bg-yellow-100 text-yellow-700';
              else badgeColor = 'bg-red-100 text-red-700';

              return (
                <tr key={shot.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {shot.imagePreviewUrl ? (
                        <img 
                          src={shot.imagePreviewUrl} 
                          alt={shot.name} 
                          className="w-10 h-10 object-cover rounded-md bg-gray-100 border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{shot.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{shot.frames}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColor}`}>
                      {currentTier.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(shot.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(shot)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemoveShot(shot.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={1} className="px-6 py-4 font-semibold text-gray-900">Total</td>
              <td className="px-6 py-4 font-semibold text-gray-900">{totalFrames} Frames</td>
              <td></td>
              <td className="px-6 py-4 font-bold text-xl text-blue-600 text-right">
                {formatCurrency(totalPrice)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer Area with Form and Download */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/30">
        
        <div className="flex flex-col md:flex-row items-end gap-4 justify-between">
            {/* Inline Form */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Judul Laporan
                    </label>
                    <input 
                        type="text" 
                        value={pdfConfig.title}
                        onChange={(e) => setPdfConfig({...pdfConfig, title: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Nama 2D Artist / Compost Artist
                    </label>
                    <input 
                        type="text" 
                        value={pdfConfig.artistName}
                        onChange={(e) => setPdfConfig({...pdfConfig, artistName: e.target.value})}
                        placeholder="Nama Anda"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
            onClick={() => onGeneratePDF(pdfConfig)}
            className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]"
            >
            <Download className="w-4 h-4" />
            Download PDF
            </button>
        </div>
      </div>

      {/* --- EDIT SHOT MODAL --- */}
      {editingShot && (
        <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Edit Shot</h3>
              <button onClick={() => setEditingShot(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Shot</label>
                <input 
                  type="text" 
                  value={editingShot.name}
                  onChange={(e) => setEditingShot({...editingShot, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frames</label>
                <input 
                  type="number" 
                  value={editingShot.frames}
                  onChange={(e) => handleEditFrameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Read-only Price Preview */}
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                 <span className="text-sm text-gray-500">Estimasi Harga:</span>
                 <span className="font-semibold text-gray-900">{formatCurrency(editingShot.price)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setEditingShot(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
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

export default ShotList;