interface Props {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryNav = ({ categories, activeCategory, onSelect }: Props) => {
  return (
    <div className="py-2">
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-6 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className="whitespace-nowrap px-5 py-2 rounded-2xl text-[12px] font-bold uppercase tracking-wider transition-all duration-300"
            style={
              activeCategory === cat
                ? {
                    backgroundColor: 'var(--accent)',
                    color: '#000',
                    boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)',
                  }
                : {}
            }
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
