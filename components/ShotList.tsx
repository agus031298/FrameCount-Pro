import React, { useState, useMemo } from 'react';
import { Trash2, Film, Download, Pencil, X, Save, User, FileText, ArrowRight, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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

type SortKey = 'name' | 'frames' | 'category' | 'price';
type SortDirection = 'asc' | 'desc';

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
  const [nameError, setNameError] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentYear = new Date().getFullYear();

  const totalFrames = shots.reduce((acc, shot) => acc + shot.frames, 0);
  const totalPrice = shots.reduce((acc, shot) => acc + shot.price, 0);

  // Sorting Logic
  const sortedShots = useMemo(() => {
    let sortableShots = [...shots];
    if (sortConfig !== null) {
      sortableShots.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'category') {
             // For category, we sort by the label string
             const getTier = (s: Shot) => pricingTiers.find(t => s.frames >= t.min && s.frames <= t.max) || pricingTiers[pricingTiers.length - 1];
             aValue = getTier(a).label;
             bValue = getTier(b).label;
        } else {
             // For name, frames, price
             aValue = a[sortConfig.key as keyof Shot];
             bValue = b[sortConfig.key as keyof Shot];
        }

        // String comparison needs specific handling to be case-insensitive
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableShots;
  }, [shots, sortConfig, pricingTiers]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3" /> 
      : <ArrowDown className="w-3 h-3" />;
  };

  const handleEditClick = (shot: Shot) => setEditingShot({ ...shot });
  
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

  const handleDownloadClick = () => {
    if (!pdfConfig.artistName.trim()) {
      setNameError(true);
      alert("Nama Artist wajib diisi untuk melanjutkan download PDF.");
      return;
    }
    setNameError(false);
    onGeneratePDF(pdfConfig);
  };

  if (shots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Film className="w-6 h-6 text-gray-300" />
        </div>
        <h3 className="text-gray-900 font-bold text-lg">List Kosong</h3>
        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Mulai tambahkan shot manual atau upload slate untuk memulai estimasi.</p>
      </div>
    );
  }

  // Komponen Header Tabel yang bisa diklik untuk sorting
  const ThSortable = ({ label, sortKey, align = 'left' }: { label: string, sortKey: SortKey, align?: 'left' | 'center' | 'right' }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th className={`px-4 py-4 cursor-pointer group select-none ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
          onClick={() => requestSort(sortKey)}>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 border ${isActive ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'} ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            {getSortIcon(sortKey)}
          </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left w-16">No</th>
                <ThSortable label="Shot Name" sortKey="name" align="left" />
                <ThSortable label="Frames" sortKey="frames" align="center" />
                <ThSortable label="Kategori" sortKey="category" align="center" />
                <ThSortable label="Harga" sortKey="price" align="right" />
                <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedShots.map((shot, idx) => {
                const currentTier = pricingTiers.find(t => shot.frames >= t.min && shot.frames <= t.max) || pricingTiers[pricingTiers.length - 1];
                const tierIndex = pricingTiers.indexOf(currentTier);
                
                // Minimalist Badge Colors
                let badgeClass = 'bg-gray-100 text-gray-600';
                if (tierIndex === 0) badgeClass = 'bg-emerald-50 text-emerald-700';
                else if (tierIndex === 1) badgeClass = 'bg-amber-50 text-amber-700';
                else badgeClass = 'bg-rose-50 text-rose-700';

                return (
                  <tr key={shot.id} className="group hover:bg-[#FAFAFA] transition-colors border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4 text-left">
                        <span className="text-xs text-gray-400 font-mono">{idx + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {shot.imagePreviewUrl ? (
                          <img 
                            src={shot.imagePreviewUrl} 
                            alt={shot.name} 
                            className="w-12 h-8 object-cover rounded bg-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-semibold text-gray-800 text-sm tracking-tight">{shot.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">{shot.frames}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeClass}`}>
                        {currentTier.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 text-sm">
                      {formatCurrency(shot.price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(shot)} 
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200" 
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onRemoveShot(shot.id)} 
                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all duration-200" 
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
          </table>
        </div>
        
        {/* Footer Summary */}
        <div className="bg-gray-50/50 p-6 flex items-center justify-between border-t border-gray-100">
            <div className="text-xs text-gray-400 font-medium">Total Shot: {shots.length}</div>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Total Frames</div>
                    <div className="text-lg font-bold text-gray-900">{totalFrames}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Total Estimasi</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(totalPrice)}</div>
                </div>
            </div>
        </div>
      </div>

      {/* Action Card / Export */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${nameError ? 'text-rose-400' : 'text-gray-500'}`} />
                    <input 
                        type="text" 
                        value={pdfConfig.artistName}
                        onChange={(e) => {
                           setPdfConfig({...pdfConfig, artistName: e.target.value});
                           if(e.target.value) setNameError(false);
                        }}
                        placeholder="Nama Artist (Wajib)"
                        className={`w-full pl-9 pr-4 py-3 bg-gray-800 border ${nameError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-transparent'} rounded-xl text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-white/30 transition-all`}
                    />
                </div>
                
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={pdfConfig.periodMonth}
                        onChange={(e) => setPdfConfig({...pdfConfig, periodMonth: e.target.value})}
                        className="w-full pl-9 pr-4 py-3 bg-gray-800 border-none rounded-xl text-sm text-white focus:ring-1 focus:ring-white/30 appearance-none cursor-pointer"
                    >
                         {months.map(m => (
                             <option key={m} value={`${m} ${currentYear}`}>{m} {currentYear}</option>
                         ))}
                    </select>
                </div>

                <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        value={pdfConfig.title}
                        onChange={(e) => setPdfConfig({...pdfConfig, title: e.target.value})}
                        className="w-full pl-9 pr-4 py-3 bg-gray-800 border-none rounded-xl text-sm text-white focus:ring-1 focus:ring-white/30"
                    />
                </div>
            </div>
            
            <button
              onClick={handleDownloadClick}
              className="w-full bg-white text-gray-900 px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
        </div>
      </div>

      {/* Edit Modal (Minimalist) */}
      {editingShot && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Edit Shot</h3>
              <button onClick={() => setEditingShot(null)} className="text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Nama</label>
                <input 
                  type="text" 
                  value={editingShot.name}
                  onChange={(e) => setEditingShot({...editingShot, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Frames</label>
                <input 
                  type="number" 
                  value={editingShot.frames}
                  onChange={(e) => handleEditFrameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div className="pt-2 flex justify-between items-center text-sm">
                 <span className="text-gray-500">Estimasi Baru</span>
                 <span className="font-bold text-gray-900">{formatCurrency(editingShot.price)}</span>
              </div>
            </div>

            <button 
              onClick={handleSaveEdit}
              className="w-full mt-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              Simpan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShotList;