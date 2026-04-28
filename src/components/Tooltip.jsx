import { useState } from 'react';
import { Info } from 'lucide-react';

// Lightweight hover/focus tooltip. Content can be a string (newlines preserved)
// or a node. Pass `iconOnly` to render only the ⓘ trigger.
export default function Tooltip({ content, children, side = 'top', iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const trigger = iconOnly ? (
    <Info size={11} className="text-gray-300 hover:text-gray-500 cursor-help" />
  ) : (
    children
  );
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {trigger}
      {open ? (
        <span
          role="tooltip"
          className={`absolute z-30 left-1/2 -translate-x-1/2 ${
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } w-56 px-2.5 py-1.5 bg-gray-900 text-white text-[11px] leading-snug rounded-md shadow-lg whitespace-pre-wrap pointer-events-none`}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
