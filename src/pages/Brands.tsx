import { useState } from 'react';
import { useStore, type Brand } from '../store/useStore';
import { formatCurrency } from '../utils/format';
import { parseExcel, downloadBrandTemplate } from '../utils/excel';
import { Plus, Upload, Download, Edit2, Trash2, PowerOff, Check, X, Wine as WineIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export function Brands() {
  const { brands, addBrand, updateBrand, deleteBrand, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState({
    name: '', category: '', bottleSize: '', defaultPrice: '', brandCode: '', manufacturer: '', active: true
  });

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.brandCode && b.brandCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelection = (id: string) => {
    const newSel = new Set(selectedIds);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelectedIds(newSel);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filteredBrands.map(b => b.id)));
    else setSelectedIds(new Set());
  };

  const openForm = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        category: brand.category,
        bottleSize: brand.bottleSize,
        defaultPrice: brand.defaultPrice.toString(),
        brandCode: brand.brandCode || '',
        manufacturer: brand.manufacturer || '',
        active: brand.active
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '', category: '', bottleSize: '', defaultPrice: '', brandCode: '', manufacturer: '', active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.bottleSize || !formData.defaultPrice) {
      toast.error('Please fill required fields');
      return;
    }

    const price = parseFloat(formData.defaultPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Invalid price');
      return;
    }

    // Check duplication (same name and bottle size)
    const duplicate = brands.find(b =>
      b.name.toLowerCase() === formData.name.toLowerCase() &&
      b.bottleSize.toLowerCase() === formData.bottleSize.toLowerCase() &&
      b.id !== editingBrand?.id
    );

    if (duplicate) {
      if (!window.confirm('A brand with this name and size already exists. Continue?')) {
        return;
      }
    }

    if (editingBrand) {
      updateBrand(editingBrand.id, {
        name: formData.name,
        category: formData.category,
        bottleSize: formData.bottleSize,
        defaultPrice: price,
        brandCode: formData.brandCode,
        manufacturer: formData.manufacturer,
        active: formData.active
      });
      toast.success('Brand updated');
    } else {
      addBrand({
        id: uuidv4(),
        name: formData.name,
        category: formData.category,
        bottleSize: formData.bottleSize,
        defaultPrice: price,
        brandCode: formData.brandCode,
        manufacturer: formData.manufacturer,
        active: formData.active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Brand added');
    }
    setIsModalOpen(false);
  };

  const handleBulkDeactivate = () => {
    if (!window.confirm(`Deactivate ${selectedIds.size} brands?`)) return;
    selectedIds.forEach(id => updateBrand(id, { active: false }));
    setSelectedIds(new Set());
    toast.success('Brands deactivated');
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} brands? This may affect historical transaction displays if you don't just deactivate them. Proceed?`)) return;
    selectedIds.forEach(id => deleteBrand(id));
    setSelectedIds(new Set());
    toast.success('Brands deleted');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcel(file);
      let count = 0;
      data.forEach((row: any) => {
        const name = row['Brand Name'];
        const price = parseFloat(row['Default Price']);
        const size = row['Bottle Size'];

        if (name && !isNaN(price) && size) {
          // Check if exists
          const exists = brands.find(b => b.name === name && b.bottleSize === size);
          if (!exists) {
            addBrand({
              id: uuidv4(),
              name,
              category: row['Category'] || 'General',
              bottleSize: size,
              defaultPrice: price,
              brandCode: row['Brand Code'] || '',
              manufacturer: row['Manufacturer'] || '',
              active: String(row['Active']).toLowerCase() !== 'false',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            count++;
          }
        }
      });
      toast.success(`Imported ${count} new brands successfully`);
    } catch (err) {
      toast.error('Failed to parse Excel file. Please use the template.');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Brand Master</h1>
          <p className="text-gray-400 mt-1">Manage your liquor brands, prices, and status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => downloadBrandTemplate()} className="text-sm text-gold-500 hover:text-gold-400 font-medium flex items-center">
            <Download className="w-4 h-4 mr-1" /> Template
          </button>

          <label className="bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImport} />
          </label>

          <button onClick={() => openForm()} className="bg-gold-600 hover:bg-gold-500 text-dark-900 px-4 py-2 rounded-lg font-bold transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Brand
          </button>
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-dark-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                <span className="text-sm font-medium text-gold-400">{selectedIds.size} selected</span>
                <button onClick={handleBulkDeactivate} className="bg-dark-700 hover:bg-dark-600 border border-dark-600 text-gray-200 px-3 py-1.5 rounded-lg text-sm flex items-center ml-2">
                  <PowerOff className="w-4 h-4 mr-1" /> Deactivate
                </button>
                <button onClick={handleBulkDelete} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm flex items-center">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </button>
              </>
            ) : (
              <h2 className="text-lg font-semibold text-gray-200">All Brands</h2>
            )}
          </div>
          <input
            type="text"
            placeholder="Search brand, category, code..."
            className="bg-dark-900 border border-dark-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-gold-600 min-w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-900/50 text-gray-400">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filteredBrands.length} onChange={handleSelectAll} className="rounded bg-dark-900 border-dark-600 text-gold-500 focus:ring-gold-500" />
                </th>
                <th className="px-4 py-3 font-medium">Brand Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium text-right">Default Price</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className={`hover:bg-dark-700/50 transition-colors ${!brand.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(brand.id)} onChange={() => toggleSelection(brand.id)} className="rounded bg-dark-900 border-dark-600 text-gold-500 focus:ring-gold-500" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-200">{brand.name}</td>
                    <td className="px-4 py-3 text-gray-400">{brand.category}</td>
                    <td className="px-4 py-3 text-gray-400">{brand.bottleSize}</td>
                    <td className="px-4 py-3 text-right text-gray-200">{formatCurrency(brand.defaultPrice, settings.currency)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${brand.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {brand.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openForm(brand)} className="text-gray-400 hover:text-gold-400 mx-2">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <WineIcon className="w-12 h-12 mx-auto text-dark-600 mb-3" />
                    <p className="text-lg font-medium text-gray-400 mb-1">No brands found</p>
                    <p className="text-sm">Import your brand list from Excel or add one manually.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-screen">
            <div className="p-4 border-b border-dark-600 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-100">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <form id="brandForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Brand Name *</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Bottle Size *</label>
                    <input required type="text" placeholder="e.g. 750ml" value={formData.bottleSize} onChange={(e) => setFormData({...formData, bottleSize: e.target.value})} className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Default Price *</label>
                    <input required type="number" min="0" step="0.01" value={formData.defaultPrice} onChange={(e) => setFormData({...formData, defaultPrice: e.target.value})} className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Brand Code/SKU</label>
                    <input type="text" value={formData.brandCode} onChange={(e) => setFormData({...formData, brandCode: e.target.value})} className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Manufacturer</label>
                    <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} className="w-full bg-dark-900 border border-dark-600 text-white px-3 py-2 rounded focus:outline-none focus:border-gold-600" />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="activeStatus" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} className="rounded bg-dark-900 border-dark-600 text-gold-500 focus:ring-gold-500" />
                  <label htmlFor="activeStatus" className="text-sm font-medium text-gray-200 cursor-pointer">Active Brand</label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-dark-600 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white font-medium">Cancel</button>
              <button type="submit" form="brandForm" className="bg-gold-600 hover:bg-gold-500 text-dark-900 px-6 py-2 rounded font-bold flex items-center">
                <Check className="w-4 h-4 mr-2" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
