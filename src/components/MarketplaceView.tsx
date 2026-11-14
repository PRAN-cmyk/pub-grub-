import React, { useState } from 'react';
import { Plus, MessageSquare, MapPin, Tag, Search, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MarketplaceItem } from '../types';

export const MarketplaceView: React.FC = () => {
  const {
    marketplace,
    addMarketplaceItem,
    openChatWith,
    sendMessage,
    language,
    t,
    showToast,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);

  // New listing form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<'electronics' | 'vehicles' | 'furniture' | 'apparel' | 'hobbies'>('electronics');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    { id: 'all', labelEn: 'All Items', labelBn: 'সব সামগ্রী' },
    { id: 'electronics', labelEn: 'Electronics', labelBn: 'ইলেকট্রনিক্স' },
    { id: 'vehicles', labelEn: 'Vehicles', labelBn: 'যানবাহন' },
    { id: 'furniture', labelEn: 'Furniture', labelBn: 'আসবাবপত্র' },
    { id: 'hobbies', labelEn: 'Cameras & Hobbies', labelBn: 'ক্যামেরা ও শখ' },
  ];

  const filteredItems = marketplace.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.titleBn && item.titleBn.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !imagePreview) {
      showToast(language === 'bn' ? 'দয়া করে শিরোনাম, মূল্য এবং ছবি প্রদান করুন' : 'Please provide title, price, and image');
      return;
    }

    addMarketplaceItem({
      title: title.trim(),
      price: Number(price),
      currency: '৳',
      location: location.trim() || 'Dhaka, Bangladesh',
      category,
      imageUrl: imagePreview,
      description: description.trim() || 'Well-maintained item.',
    });

    setTitle('');
    setPrice('');
    setLocation('');
    setDescription('');
    setImagePreview(null);
    setIsSellModalOpen(false);
  };

  const handleContactSeller = (item: MarketplaceItem) => {
    openChatWith(item.seller);
    sendMessage(
      item.seller.id,
      language === 'bn'
        ? `হ্যালো! আপনার "${item.titleBn || item.title}" (মূল্য: ${item.currency}${item.price.toLocaleString()}) কি এখনও বিক্রির জন্য উপলব্ধ আছে?`
        : `Hi! Is your listing "${item.title}" (${item.currency}${item.price.toLocaleString()}) still available?`,
    );
    showToast(language === 'bn' ? 'মেসেঞ্জারে বিক্রেতাকে বার্তা পাঠানো হয়েছে!' : 'Inquiry sent in Messenger!');
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t.marketplace}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold">
              Buy & Sell
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'bn' ? 'আপনার এলাকায় কেনাবেচা করুন নিরাপদে' : 'Buy and sell items in your community'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'মার্কেটপ্লেসে খুঁজুন...' : 'Search Marketplace...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => setIsSellModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.sellItem}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === c.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {language === 'bn' ? c.labelBn : c.labelEn}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-lg">
                {item.currency} {item.price.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                  {language === 'bn' ? item.titleBn || item.title : item.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {language === 'bn' ? item.locationBn || item.location : item.location}
                  </span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <img
                    src={item.seller.avatar}
                    alt={item.seller.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {language === 'bn' ? item.seller.nameBn || item.seller.name : item.seller.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleContactSeller(item)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{t.messageSeller}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <p className="text-slate-400 text-sm">
            {language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No items match your query.'}
          </p>
        </div>
      )}

      {/* Create Listing Modal */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {t.sellItem}
              </h3>
              <button
                onClick={() => setIsSellModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.itemTitle}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sony Wireless Noise Cancelling Headphones"
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.itemPrice} (৳)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.itemLocation}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Banani, Dhaka"
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.categories}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="electronics">{t.electronics}</option>
                  <option value="vehicles">{t.vehicles}</option>
                  <option value="furniture">{t.furniture}</option>
                  <option value="hobbies">{t.hobbies}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {language === 'bn' ? 'বিজ্ঞাপন দিন' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
