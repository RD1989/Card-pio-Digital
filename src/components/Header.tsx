import { Search } from 'lucide-react';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-2xl font-serif text-amber-500 italic tracking-tighter">Premium Menu</h1>
      </div>
      <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
        <Search className="w-6 h-6 text-zinc-400" />
      </button>
    </header>
  );
};
