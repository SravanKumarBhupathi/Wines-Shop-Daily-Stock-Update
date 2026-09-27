import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import { Package, TrendingUp, IndianRupee, Wine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { brands, dailyInventory, stockOutTransactions, currentDate, settings } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const activeBrands = brands.filter((b) => b.active);

  const todayInventory = useMemo(() => {
    return dailyInventory.filter((inv) => inv.date === currentDate);
  }, [dailyInventory, currentDate]);

  const todaySalesTransactions = useMemo(() => {
    return stockOutTransactions.filter((tx) => tx.date === currentDate);
  }, [stockOutTransactions, currentDate]);

  // Dashboard Stats
  const totalBrands = activeBrands.length;

  const totalBottlesSold = todaySalesTransactions.reduce((sum, tx) => sum + tx.quantity, 0);

  const totalSalesAmount = todaySalesTransactions.reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);

  const currentStockValue = activeBrands.reduce((sum, brand) => {
    const inv = todayInventory.find(i => i.brandId === brand.id);
    const presentStock = inv ? inv.presentStock : 0;
    return sum + (presentStock * brand.defaultPrice);
  }, 0);

  // Table Data (Brand-wise)
  const tableData = activeBrands.map((brand) => {
    const inv = todayInventory.find((i) => i.brandId === brand.id);
    const openingStock = inv ? inv.openingStock : 0;
    const stockIn = inv ? inv.stockIn : 0;
    const stockOut = inv ? inv.stockOut : 0;
    const presentStock = inv ? inv.presentStock : 0;

    // Total sales for this specific brand today
    const brandSalesToday = todaySalesTransactions
      .filter((tx) => tx.brandId === brand.id)
      .reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);

    return {
      ...brand,
      openingStock,
      stockIn,
      stockOut,
      presentStock,
      brandSalesToday
    };
  });

  const filteredTableData = tableData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grandTotals = filteredTableData.reduce(
    (acc, row) => {
      acc.openingStock += row.openingStock;
      acc.stockIn += row.stockIn;
      acc.stockOut += row.stockOut;
      acc.presentStock += row.presentStock;
      acc.totalSales += row.brandSalesToday;
      return acc;
    },
    { openingStock: 0, stockIn: 0, stockOut: 0, presentStock: 0, totalSales: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Daily Stock & Sales</h1>
          <p className="text-gray-400 mt-1">Track your stock, monitor sales and keep your shop running smoothly.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stock-in')} className="bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + Add Stock
          </button>
          <button onClick={() => navigate('/stock-out')} className="bg-gold-600 hover:bg-gold-500 text-dark-900 px-4 py-2 rounded-lg font-bold transition-colors">
            Update Sales
          </button>
          <button onClick={() => navigate('/print')} className="bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors hidden sm:block">
            Report / Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wine />} label="Total Brands" value={totalBrands.toString()} />
        <StatCard icon={<Package />} label="Total Bottles Sold" value={totalBottlesSold.toString()} />
        <StatCard icon={<IndianRupee />} label="Total Sales Amount" value={formatCurrency(totalSalesAmount, settings.currency)} highlight />
        <StatCard icon={<TrendingUp />} label="Current Stock Value" value={formatCurrency(currentStockValue, settings.currency)} />
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-dark-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-200">Brand-wise Sales Analysis</h2>
          <input
            type="text"
            placeholder="Search brands or categories..."
            className="bg-dark-900 border border-dark-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gold-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-900/50 text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium text-right">Opening</th>
                <th className="px-4 py-3 font-medium text-right">Stock In</th>
                <th className="px-4 py-3 font-medium text-right">Sold</th>
                <th className="px-4 py-3 font-medium text-right">Present</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right text-gold-400">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredTableData.length > 0 ? (
                filteredTableData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-200">{row.name}</td>
                    <td className="px-4 py-3 text-gray-400">{row.category}</td>
                    <td className="px-4 py-3 text-gray-400">{row.bottleSize}</td>
                    <td className="px-4 py-3 text-right">{row.openingStock}</td>
                    <td className="px-4 py-3 text-right text-green-400">{row.stockIn || '-'}</td>
                    <td className="px-4 py-3 text-right text-red-400">{row.stockOut || '-'}</td>
                    <td className={`px-4 py-3 text-right font-medium ${row.presentStock <= settings.lowStockThreshold ? 'text-red-500' : 'text-gray-200'}`}>
                      {row.presentStock}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(row.defaultPrice, settings.currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gold-500">{formatCurrency(row.brandSalesToday, settings.currency)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No active brands found. Go to Brands to add or import.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredTableData.length > 0 && (
              <tfoot className="bg-dark-700 font-bold text-gray-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs">Grand Total</td>
                  <td className="px-4 py-3 text-right">{grandTotals.openingStock}</td>
                  <td className="px-4 py-3 text-right text-green-400">{grandTotals.stockIn}</td>
                  <td className="px-4 py-3 text-right text-red-400">{grandTotals.stockOut}</td>
                  <td className="px-4 py-3 text-right">{grandTotals.presentStock}</td>
                  <td className="px-4 py-3 text-right text-gray-500">-</td>
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

function StatCard({ icon, label, value, highlight = false }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-gold-600/10 border-gold-600/30' : 'bg-dark-800 border-dark-600'} flex items-center space-x-4`}>
      <div className={`p-3 rounded-lg ${highlight ? 'bg-gold-600/20 text-gold-500' : 'bg-dark-700 text-gray-400'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className={`text-xl font-bold mt-1 ${highlight ? 'text-gold-500' : 'text-gray-100'}`}>{value}</p>
      </div>
    </div>
  );
}
