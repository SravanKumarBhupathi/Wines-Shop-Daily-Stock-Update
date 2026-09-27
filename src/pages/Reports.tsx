import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/format';
import { FileText, IndianRupee, Package } from 'lucide-react';

export function Reports() {
  const { brands, dailyInventory, stockOutTransactions, currentDate, settings } = useStore();
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const inventoryForDate = useMemo(() => {
    return dailyInventory.filter((inv) => inv.date === selectedDate);
  }, [dailyInventory, selectedDate]);

  const salesForDate = useMemo(() => {
    return stockOutTransactions.filter((tx) => tx.date === selectedDate);
  }, [stockOutTransactions, selectedDate]);

  const reportData = brands.filter(b => b.active || inventoryForDate.some(i => i.brandId === b.id)).map((brand) => {
    const inv = inventoryForDate.find((i) => i.brandId === brand.id);
    const openingStock = inv ? inv.openingStock : 0;
    const stockIn = inv ? inv.stockIn : 0;
    const stockOut = inv ? inv.stockOut : 0;
    const presentStock = inv ? inv.presentStock : 0;

    // Find historical price logic (exact calculation for this day)
    const brandSalesThatDay = salesForDate
      .filter((tx) => tx.brandId === brand.id)
      .reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);

    // Default price to show in report might just be the current default,
    // but the actual amount is mathematically correct.
    return {
      ...brand,
      openingStock,
      stockIn,
      stockOut,
      presentStock,
      totalSales: brandSalesThatDay
    };
  }).filter(row => row.openingStock > 0 || row.stockIn > 0 || row.stockOut > 0 || row.presentStock > 0);

  const grandTotals = reportData.reduce(
    (acc, row) => {
      acc.openingStock += row.openingStock;
      acc.stockIn += row.stockIn;
      acc.stockOut += row.stockOut;
      acc.presentStock += row.presentStock;
      acc.totalSales += row.totalSales;
      return acc;
    },
    { openingStock: 0, stockIn: 0, stockOut: 0, presentStock: 0, totalSales: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Daily Reports</h1>
          <p className="text-gray-400 mt-1">Review historical stock and sales records.</p>
        </div>
        <div className="flex items-center gap-3 bg-dark-800 p-2 rounded-lg border border-dark-600">
          <label className="text-sm font-medium text-gray-400 pl-2">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={currentDate}
            className="bg-dark-900 border border-dark-600 text-white px-3 py-1.5 rounded focus:outline-none focus:border-gold-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-dark-800 border-dark-600 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-dark-700 text-gray-400"><FileText /></div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Report Date</p>
            <p className="text-lg font-bold text-gray-100">{formatDate(selectedDate)}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-dark-800 border-dark-600 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-dark-700 text-gray-400"><Package /></div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Bottles Sold</p>
            <p className="text-xl font-bold text-gray-100">{grandTotals.stockOut}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-gold-600/10 border-gold-600/30 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-gold-600/20 text-gold-500"><IndianRupee /></div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Sales Amount</p>
            <p className="text-xl font-bold text-gold-500">{formatCurrency(grandTotals.totalSales, settings.currency)}</p>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
        <div className="p-4 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-gray-200">End of Day Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-900/50 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium text-right">Opening</th>
                <th className="px-4 py-3 font-medium text-right">Stock In</th>
                <th className="px-4 py-3 font-medium text-right">Sold</th>
                <th className="px-4 py-3 font-medium text-right">Present</th>
                <th className="px-4 py-3 font-medium text-right text-gold-400">Sales Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {reportData.length > 0 ? (
                reportData.map((row) => (
                  <tr key={row.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-200">{row.name}</td>
                    <td className="px-4 py-3 text-gray-400">{row.category}</td>
                    <td className="px-4 py-3 text-gray-400">{row.bottleSize}</td>
                    <td className="px-4 py-3 text-right">{row.openingStock}</td>
                    <td className="px-4 py-3 text-right text-green-400">{row.stockIn || '-'}</td>
                    <td className="px-4 py-3 text-right text-red-400">{row.stockOut || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-200">{row.presentStock}</td>
                    <td className="px-4 py-3 text-right font-medium text-gold-500">{formatCurrency(row.totalSales, settings.currency)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No activity recorded for this date.
                  </td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot className="bg-dark-700 font-bold text-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs">Grand Total</td>
                  <td className="px-4 py-3 text-right">{grandTotals.openingStock}</td>
                  <td className="px-4 py-3 text-right text-green-400">{grandTotals.stockIn}</td>
                  <td className="px-4 py-3 text-right text-red-400">{grandTotals.stockOut}</td>
                  <td className="px-4 py-3 text-right">{grandTotals.presentStock}</td>
                  <td className="px-4 py-3 text-right text-gold-500">{formatCurrency(grandTotals.totalSales, settings.currency)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
