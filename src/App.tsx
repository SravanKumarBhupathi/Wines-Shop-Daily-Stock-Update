import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Brands } from './pages/Brands';
import { StockIn } from './pages/StockIn';
import { StockOut } from './pages/StockOut';
import { Reports } from './pages/Reports';
import { PrintExcel } from './pages/PrintExcel';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#2C2C2C', color: '#fff', border: '1px solid #3A3A3A' }
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="brands" element={<Brands />} />
          <Route path="stock-in" element={<StockIn />} />
          <Route path="stock-out" element={<StockOut />} />
          <Route path="sales" element={<Navigate to="/stock-out" />} />
          <Route path="reports" element={<Reports />} />
          <Route path="print" element={<PrintExcel />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
