import React, { useState, useRef } from 'react';
import { VocabSprintStorage, CefrLevel } from '../types';
import { 
  updateSettingsInStorage, 
  exportBackupJson, 
  importBackupJson, 
  resetAllStorage 
} from '../services/storage';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Calendar, 
  Layers, 
  AlertTriangle, 
  Check, 
  Info 
} from 'lucide-react';

interface SettingsViewProps {
  storage: VocabSprintStorage;
  onStorageChange: (updated: VocabSprintStorage) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  storage,
  onStorageChange,
}) => {
  const [startDate, setStartDate] = useState(storage.settings.start);
  const [endDate, setEndDate] = useState(storage.settings.end);
  const [selectedLevels, setSelectedLevels] = useState<CefrLevel[]>(storage.settings.levels);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [importStatus, setImportStatus] = useState<{ msg: string; isError: boolean } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLevel = (lvl: CefrLevel) => {
    let next: CefrLevel[];
    if (selectedLevels.includes(lvl)) {
      if (selectedLevels.length === 1) {
        // Must keep at least one level
        return;
      }
      next = selectedLevels.filter(l => l !== lvl);
    } else {
      next = [...selectedLevels, lvl];
    }
    setSelectedLevels(next);
  };

  const handleSaveSettings = () => {
    const updated = updateSettingsInStorage({
      start: startDate,
      end: endDate,
      levels: selectedLevels,
    });
    onStorageChange(updated);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleExport = () => {
    exportBackupJson();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupJson(content);
      if (res.success && res.storage) {
        onStorageChange(res.storage);
        setStartDate(res.storage.settings.start);
        setEndDate(res.storage.settings.end);
        setSelectedLevels(res.storage.settings.levels);
        setImportStatus({ msg: 'Data backup berhasil dipulihkan!', isError: false });
      } else {
        setImportStatus({ msg: res.error || 'Gagal memulihkan backup.', isError: true });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmReset = () => {
    const fresh = resetAllStorage();
    onStorageChange(fresh);
    setStartDate(fresh.settings.start);
    setEndDate(fresh.settings.end);
    setSelectedLevels(fresh.settings.levels);
    setShowResetConfirm(false);
    setImportStatus({ msg: 'Seluruh progres telah direset ke setelan awal.', isError: false });
  };

  return (
    <div className="max-w-[760px] mx-auto py-6 px-4 md:px-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-app-primary">
          Pengaturan Sprint & Data
        </h1>
        <p className="text-xs text-app-secondary mt-1">
          Konfigurasi rentang tanggal sprint, filter tingkat kesulitan CEFR, serta kelola cadangan data.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-app-success/15 border border-app-success/30 text-app-success text-xs font-semibold flex items-center space-x-2">
          <Check strokeWidth={1.5} className="w-4 h-4" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      {importStatus && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
          importStatus.isError
            ? 'bg-red-500/15 border-red-500/30 text-red-500'
            : 'bg-app-success/15 border-app-success/30 text-app-success'
        }`}>
          {importStatus.isError ? (
            <AlertTriangle strokeWidth={1.5} className="w-4 h-4" />
          ) : (
            <Check strokeWidth={1.5} className="w-4 h-4" />
          )}
          <span>{importStatus.msg}</span>
        </div>
      )}

      {/* Sprint Schedule Settings */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-app-primary flex items-center space-x-2">
          <Calendar strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
          <span>Rentang Waktu Sprint</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-app-secondary mb-1.5">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-bg text-app-primary text-xs focus:outline-none focus:border-app-accent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-secondary mb-1.5">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-bg text-app-primary text-xs focus:outline-none focus:border-app-accent font-mono"
            />
          </div>
        </div>

        {/* Level Filters */}
        <div className="pt-2 border-t border-app-border">
          <label className="block text-xs font-medium text-app-secondary mb-2.5">
            Tingkat CEFR yang Disertakan
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['a1', 'a2', 'b1', 'b2'] as CefrLevel[]).map((lvl) => {
              const isChecked = selectedLevels.includes(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => toggleLevel(lvl)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-app-accent/10 border-app-accent text-app-accent'
                      : 'bg-app-bg border-app-border text-app-secondary hover:text-app-primary'
                  }`}
                >
                  <span className="uppercase">Level {lvl}</span>
                  {isChecked && <Check strokeWidth={1.5} className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-app-secondary mt-2">
            Target kata harian akan otomatis dikalkulasikan berdasarkan jumlah kata pada level aktif ini.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 rounded-full bg-app-accent hover:bg-app-accent-hover text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-app-primary flex items-center space-x-2">
          <Layers strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
          <span>Cadangan & Pemulihan Data</span>
        </h2>
        <p className="text-xs text-app-secondary">
          Data Anda disimpan secara aman di peramban lokal (<code className="font-mono bg-app-bg px-1 py-0.5 rounded border border-app-border">vocabSprint.v1</code>). Unduh berkas cadangan jika ingin berpindah perangkat.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl border border-app-border bg-app-bg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-app-primary text-xs font-medium transition-colors flex items-center space-x-2"
          >
            <Download strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
            <span>Ekspor Data (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl border border-app-border bg-app-bg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-app-primary text-xs font-medium transition-colors flex items-center space-x-2"
          >
            <Upload strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
            <span>Impor Cadangan</span>
          </button>
        </div>
      </div>

      {/* Reset Progress Section */}
      <div className="bg-app-surface border border-red-500/20 rounded-2xl p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-red-500 flex items-center space-x-2">
          <AlertTriangle strokeWidth={1.5} className="w-4 h-4" />
          <span>Zona Berbahaya: Reset Semua Data</span>
        </h2>
        <p className="text-xs text-app-secondary">
          Menghapus semua status kata yang telah dihafal, streak ulangan, dan riwayat aktivitas sprint harian.
        </p>

        {showResetConfirm ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
              Apakah Anda yakin ingin menghapus seluruh progres? Tindakan ini tidak dapat dibatalkan kecuali Anda telah mengekspor cadangan JSON.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
              >
                Ya, Reset Sekarang
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-app-border bg-app-surface text-app-primary text-xs font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw strokeWidth={1.5} className="w-3.5 h-3.5" />
              <span>Reset Seluruh Progres</span>
            </button>
          </div>
        )}
      </div>

      {/* About App */}
      <div className="p-4 rounded-2xl bg-app-bg border border-app-border space-y-2 text-xs text-app-secondary">
        <div className="flex items-center space-x-2 font-semibold text-app-primary">
          <Info strokeWidth={1.5} className="w-4 h-4 text-app-accent" />
          <span>Tentang Vocab Sprint</span>
        </div>
        <p className="leading-relaxed">
          Vocab Sprint dirancang berdasarkan spesifikasi Oxford 3000 (A1–B2) dengan metodologi Spaced Repetition (+1, +3, +7 hari). Beroperasi 100% *client-side* tanpa pelacak pihak ketiga ataupun kunci API eksternal.
        </p>
      </div>
    </div>
  );
};
