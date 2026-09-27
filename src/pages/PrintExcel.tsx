import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/format';
import { exportToExcel } from '../utils/excel';
import { Printer, Download } from 'lucide-react';

export function PrintExcel() {
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
    const brandSalesThatDay = salesForDate
      .filter((tx) => tx.brandId === brand.id)
      .reduce((sum, tx) => sum + (tx.quantity * tx.priceAtSale), 0);

    return {
      'Brand': brand.name,
      'Size': brand.bottleSize,
      'Opening': inv ? inv.openingStock : 0,
      'Stock In': inv ? inv.stockIn : 0,
      'Stock Out': inv ? inv.stockOut : 0,
      'Present': inv ? inv.presentStock : 0,
      'Price': brand.defaultPrice,
      'Sales Amount': brandSalesThatDay
    };
  }).filter(row => row['Opening'] > 0 || row['Stock In'] > 0 || row['Stock Out'] > 0 || row['Present'] > 0);

  const grandTotals = reportData.reduce(
    (acc, row) => {
      acc.opening += row['Opening'];
      acc.stockIn += row['Stock In'];
      acc.stockOut += row['Stock Out'];
      acc.present += row['Present'];
      acc.sales += row['Sales Amount'];
      return acc;
    },
    { opening: 0, stockIn: 0, stockOut: 0, present: 0, sales: 0 }
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportToExcel(reportData, `Daily_Report_${selectedDate}`, 'Daily Report');
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Print / Excel Export</h1>
          <p className="text-gray-400 mt-1">Generate reports for offline viewing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={currentDate}
            className="bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600"
          />
          <button onClick={handleExport} className="bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </button>
          <button onClick={handlePrint} className="bg-gold-600 hover:bg-gold-500 text-dark-900 px-4 py-2 rounded-lg font-bold transition-colors flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Print A4
          </button>
        </div>
      </div>

      {/* A4 Print Container */}
      <div className="bg-white text-black p-8 rounded-xl shadow-lg print:shadow-none print:m-0 print:p-0 mx-auto w-full max-w-[210mm] min-h-[297mm] font-serif border border-gray-200 print:border-none">

        {/* Print Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-wider">{settings.shopName}</h1>
          <p className="text-lg mt-1">{settings.shopAddress || 'Daily Stock & Sales Report'}</p>
          <div className="flex justify-between mt-6 text-sm font-bold">
            <p>Report Date: {formatDate(selectedDate)}</p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Print Table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-2 text-left">#</th>
              <th className="border border-gray-400 px-2 py-2 text-left">Brand</th>
              <th className="border border-gray-400 px-2 py-2 text-left">Size</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Opening</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Stock In</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Sold</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Present</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Price</th>
              <th className="border border-gray-400 px-2 py-2 text-right">Sales Amount</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-gray-400 px-2 py-1 text-center">{idx + 1}</td>
                <td className="border border-gray-400 px-2 py-1">{row['Brand']}</td>
                <td className="border border-gray-400 px-2 py-1">{row['Size']}</td>
                <td className="border border-gray-400 px-2 py-1 text-right">{row['Opening']}</td>
                <td className="border border-gray-400 px-2 py-1 text-right">{row['Stock In'] || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-right">{row['Stock Out'] || '-'}</td>
                <td className="border border-gray-400 px-2 py-1 text-right font-bold">{row['Present']}</td>
                <td className="border border-gray-400 px-2 py-1 text-right">{formatCurrency(row['Price'], settings.currency)}</td>
                <td className="border border-gray-400 px-2 py-1 text-right font-bold">{formatCurrency(row['Sales Amount'], settings.currency)}</td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={9} className="border border-gray-400 px-2 py-8 text-center text-gray-500 italic">
                  No records to display.
                </td>
              </tr>
            )}
          </tbody>
          {reportData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td colSpan={3} className="border border-gray-400 px-2 py-2 text-right uppercase">Grand Total</td>
                <td className="border border-gray-400 px-2 py-2 text-right">{grandTotals.opening}</td>
                <td className="border border-gray-400 px-2 py-2 text-right">{grandTotals.stockIn}</td>
                <td className="border border-gray-400 px-2 py-2 text-right">{grandTotals.stockOut}</td>
                <td className="border border-gray-400 px-2 py-2 text-right">{grandTotals.present}</td>
                <td className="border border-gray-400 px-2 py-2 text-right">-</td>
                <td className="border border-gray-400 px-2 py-2 text-right text-lg">{formatCurrency(grandTotals.sales, settings.currency)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:border-none {
            border: none !important;
          }

          /* The element to print */
          .bg-white, .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
