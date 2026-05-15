import Tooltip from './Tooltip.jsx';
import { scoreTooltips } from '../logic/criteriaTexts.js';

function Bar({ label, score, weight, color, tooltip }) {
  const pct = Math.max(0, Math.min(100, score));
  const weighted = (pct * weight).toFixed(1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-500 inline-flex items-center gap-1">
          {label}
          <Tooltip content={tooltip} iconOnly />
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">{(weight * 100).toFixed(0)}%</span>
        </span>
        <span className="text-gray-700 font-semibold">
          {pct.toFixed(0)}
          <span className="ml-1 text-gray-400 font-normal">({weighted})</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ScorePanel({ scores, rule, total }) {
  const tips = scoreTooltips(rule);
  return (
    <section className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 font-medium">점수 (가중)</span>
        <span className="text-gray-900 font-semibold">
          종합 {total.toFixed(1)}
          <span className="text-[10px] text-gray-400 ml-1">/ 100</span>
        </span>
      </div>
      <Bar
        label="구조"
        score={scores.structureScore}
        weight={rule.weights.structure}
        color="bg-blue-500"
        tooltip={tips.structure}
      />
      <Bar
        label="실행"
        score={scores.executionScore}
        weight={rule.weights.execution}
        color="bg-emerald-500"
        tooltip={tips.execution}
      />
      <Bar
        label="수급"
        score={scores.supplyScore}
        weight={rule.weights.supply}
        color="bg-amber-500"
        tooltip={tips.supply}
      />
    </section>
  );
}
