import { Menu } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { settings, currentDate } = useStore();

  return (
    <header className="bg-dark-800 border-b border-dark-600 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden mr-4 p-2 text-gray-400 hover:text-gray-200"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="md:hidden">
          <h1 className="text-lg font-bold text-gold-500">{settings.shopName}</h1>
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-semibold text-gray-100">{settings.shopName}</h2>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center bg-dark-700 px-4 py-2 rounded-lg border border-dark-600">
          <span className="text-sm font-medium text-gold-400">
            {format(new Date(currentDate), 'dd MMM yyyy')}
          </span>
        </div>
      </div>
    </header>
  );
}
