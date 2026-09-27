import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import { Plus, Check, X, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export function StockOut() {
  const { brands, dailyInventory, stockOutTransactions, currentDate, addStockOut, settings } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const activeBrands = brands.filter(b => b.active);

  const [formData, setFormData] = useState({
    brandId: '', quantity: '', notes: ''
  });


  const getPresentStock = (brandId: string) => {
    const inv = dailyInventory.find(inv => inv.date === currentDate && inv.brandId === brandId);
    if (inv) return inv.presentStock;
    const prev = dailyInventory
      .filter(inv => inv.brandId === brandId && inv.date < currentDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return prev ? prev.presentStock : 0;
  };

  const presentStockForSelected = formData.brandId ? getPresentStock(formData.brandId) : 0;

  const todayTransactions = useMemo(() => {
    return stockOutTransactions
      .filter(tx => tx.date === currentDate)
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [stockOutTransactions, currentDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandId || !formData.quantity) {
      toast.error('Please fill required fields');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    const brand = brands.find(b => b.id === formData.brandId);
    if (!brand) return;

    if (qty > presentStockForSelected) {
      toast.error(`Insufficient stock! Available: ${presentStockForSelected}. Requested: ${qty}.`);
      return;
    }

    try {
      addStockOut({
        id: uuidv4(),
        date: currentDate,
        time: new Date().toTimeString().substring(0, 5),
        brandId: formData.brandId,
        quantity: qty,
        priceAtSale: brand.defaultPrice, // Store current price permanently
        notes: formData.notes
      });

      toast.success(`Sold ${qty} bottles of ${brand.name}`);
      setIsFormOpen(false);
      setFormData({ brandId: '', quantity: '', notes: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to record sale');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Stock Out & Sales</h1>
          <p className="text-gray-400 mt-1">Record bottles sold/outgoing.</p>
        </div>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)} className="bg-gold-600 hover:bg-gold-500 text-dark-900 px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center">
            <Plus className="w-5 h-5 mr-2" />
            Update Sales
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-4 md:p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-dark-600 pb-4">
            <h2 className="text-lg font-bold text-gray-200">Record Sale</h2>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Brand *</label>
                <select
                  required
                  value={formData.brandId}
                  onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
                >
                  <option value="">Select a brand...</option>
                  {activeBrands.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.bottleSize}) - {formatCurrency(b.defaultPrice, settings.currency)}
                    </option>
                  ))}
                </select>
                {formData.brandId && (
                  <div className={`mt-2 text-sm flex items-center ${presentStockForSelected === 0 ? 'text-red-400' : 'text-green-400'}`}>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Available present stock: <span className="font-bold ml-1">{presentStockForSelected}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Quantity Sold *</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={presentStockForSelected > 0 ? presentStockForSelected : 1}
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white font-medium">Cancel</button>
              <button type="submit" className="bg-gold-600 hover:bg-gold-500 text-dark-900 px-6 py-2 rounded font-bold flex items-center">
                <Check className="w-4 h-4 mr-2" /> Save Stock Out
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
        <div className="p-4 border-b border-dark-600 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-200">Today's Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-900/50 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium text-right">Quantity</th>
                <th className="px-4 py-3 font-medium text-right">Price at Sale</th>
                <th className="px-4 py-3 font-medium text-right text-gold-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {todayTransactions.length > 0 ? (
                todayTransactions.map(tx => {
                  const brand = brands.find(b => b.id === tx.brandId);
                  return (
                    <tr key={tx.id} className="hover:bg-dark-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{tx.time}</td>
                      <td className="px-4 py-3 font-medium text-gray-200">{brand?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-400">{brand?.bottleSize || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-400">-{tx.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(tx.priceAtSale, settings.currency)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gold-500">{formatCurrency(tx.quantity * tx.priceAtSale, settings.currency)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No sales recorded today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
