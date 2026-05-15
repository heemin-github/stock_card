const TABS = [
  { id: 'swing', label: '스윙' },
  { id: 'mid', label: '중장기' },
  { id: 'long', label: '장기' },
];

export default function ModeTab({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1">
      {TABS.map((t) => {
        const active = t.id === mode;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              active ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
