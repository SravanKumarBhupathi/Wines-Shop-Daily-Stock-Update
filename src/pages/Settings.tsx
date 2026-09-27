import { useState } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { Check, CalendarDays, Download, Upload, AlertTriangle } from 'lucide-react';

export function Settings() {
  const state = useStore();
  const { settings, updateSettings, currentDate, startNewDay, clearData, importData } = state;
  const [formData, setFormData] = useState(settings);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    toast.success('Settings updated');
  };

  const handleStartNewDay = () => {
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const newDateStr = tomorrow.toISOString().split('T')[0];

    if (window.confirm(`Start a new day? Yesterday's present stock will automatically become today's opening stock for ${newDateStr}.`)) {
      startNewDay(newDateStr);
      toast.success(`Successfully rolled over to ${newDateStr}`);
    }
  };

  const handleExportBackup = () => {
    // Only save the necessary state (exclude actions)
    const backupData = {
      brands: state.brands,
      dailyInventory: state.dailyInventory,
      stockInTransactions: state.stockInTransactions,
      stockOutTransactions: state.stockOutTransactions,
      settings: state.settings,
      currentDate: state.currentDate
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `shop_backup_${currentDate}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Backup downloaded');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm('Importing a backup will completely replace your current data. Are you sure?')) {
          importData(json);
          toast.success('Backup imported successfully');
        }
      } catch (e) {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (deleteConfirm === 'DELETE') {
      clearData();
      toast.success('All data has been wiped.');
      setDeleteConfirm('');
    } else {
      toast.error('You must type DELETE to confirm.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your shop and manage data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-6">
          <h2 className="text-lg font-bold text-gray-200 mb-4 border-b border-dark-600 pb-2">General Settings</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Shop Name</label>
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Low Stock Threshold</label>
              <input
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({...formData, lowStockThreshold: parseInt(e.target.value) || 0})}
                className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
              />
            </div>
            <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-dark-900 px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center mt-2">
              <Check className="w-4 h-4 mr-2" /> Save Settings
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-dark-800 rounded-xl border border-dark-600 p-6">
            <h2 className="text-lg font-bold text-gray-200 mb-4 border-b border-dark-600 pb-2">Daily Operations</h2>
            <div className="p-4 bg-dark-900 border border-dark-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-4">
                Roll over the inventory to the next day. This ensures yesterday's present stock accurately becomes today's opening stock.
              </p>
              <button onClick={handleStartNewDay} className="w-full bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
                <CalendarDays className="w-4 h-4 mr-2" /> Start New Day
              </button>
            </div>
          </div>

          <div className="bg-dark-800 rounded-xl border border-dark-600 p-6">
            <h2 className="text-lg font-bold text-gray-200 mb-4 border-b border-dark-600 pb-2">Data Backup</h2>
            <div className="flex gap-4">
              <button onClick={handleExportBackup} className="flex-1 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" /> Export JSON
              </button>
              <label className="flex-1 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer">
                <Upload className="w-4 h-4 mr-2" /> Import JSON
                <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 md:col-span-2 mt-4">
          <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" /> Danger Zone
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-red-400/80">
                Permanently delete all brands, history, and settings from this browser. This cannot be undone. Type <strong className="text-red-400">DELETE</strong> to confirm.
              </p>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full sm:w-32 bg-dark-900 border border-red-500/50 text-white px-3 py-2 rounded focus:outline-none"
              />
              <button
                onClick={handleClearData}
                disabled={deleteConfirm !== 'DELETE'}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
