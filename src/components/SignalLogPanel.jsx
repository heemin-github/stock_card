import { ClipboardList } from 'lucide-react';

const LOG_KEY = 'stockcard.signalLog';

const ACTION_STYLE = {
  READY: 'bg-green-100 text-green-700',
  WAIT: 'bg-amber-100 text-amber-700',
  BLOCKED: 'bg-red-100 text-red-700',
};

export function appendSignalLog(entry) {
  try {
    const prev = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    const last = prev[0];
    if (
      last?.ticker === entry.ticker &&
      last?.mode === entry.mode &&
      last?.action === entry.action &&
      Date.now() - new Date(last.at).getTime() < 5 * 60 * 1000
    ) {
      return;
    }
    const next = [{ ...entry, at: new Date().toISOString() }, ...prev].slice(0, 12);
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch (_e) {
    /* ignore storage errors */
  }
}

function loadSignalLog() {
  try {
    const arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    return Array.isArray(arr) ? arr.slice(0, 5) : [];
  } catch (_e) {
    return [];
  }
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SignalLogPanel({ onSelect }) {
  const logs = loadSignalLog();
  if (!logs.length) return null;

  return (
    <section>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
        <ClipboardList size={13} /> 최근 신호
      </div>
      <div className="flex flex-col gap-1.5">
        {logs.map((log, i) => (
          <button
            key={`${log.ticker}-${log.mode}-${log.at}-${i}`}
            type="button"
            onClick={() => onSelect(log.ticker)}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-left hover:bg-gray-50"
          >
            <span className="min-w-0">
              <span className="text-xs font-semibold text-gray-900">{log.ticker}</span>
              <span className="ml-1 text-[10px] text-gray-400">{log.modeLabel}</span>
              <span className="ml-1 text-[10px] text-gray-300">{fmtTime(log.at)}</span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                ACTION_STYLE[log.action] ?? 'bg-gray-100 text-gray-500'
              }`}
            >
              {log.action}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
