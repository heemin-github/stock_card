import { useMemo, useState } from 'react';
import {
  Activity,
  TrendingUp,
  Gauge,
  Waves,
  BarChart3,
  Globe2,
  Flame,
  Zap,
  TrendingDown,
} from 'lucide-react';
import ModeTab from './ModeTab.jsx';
import MiniChart from './MiniChart.jsx';
import LogicBadge from './LogicBadge.jsx';
import TargetTable from './TargetTable.jsx';
import ScorePanel from './ScorePanel.jsx';
import TechnicalsPanel from './TechnicalsPanel.jsx';
import EventsPanel from './EventsPanel.jsx';
import FundamentalsPanel from './FundamentalsPanel.jsx';
import ReturnsTable from './ReturnsTable.jsx';
import { useStockData } from '../hooks/useStockData.js';
import { judgeStock, buildTargets, getRule } from '../logic/judgeStock.js';
import { indicatorTooltips } from '../logic/criteriaTexts.js';
import { indicatorTone } from '../logic/indicatorTones.js';
import { buildSummary } from '../logic/buildSummary.js';

const STRATEGY_LABEL = {
  BUY: '매수',
  WATCH_ONLY: '관찰',
  REJECT: '회피',
};

const TREND_LABEL = { up: '상승', down: '하락', sideways: '횡보' };

const STAGE_STYLE = {
  ENTRY: 'bg-green-100 text-green-700',
  WATCH_ONLY: 'bg-blue-100 text-blue-600',
  REJECT: 'bg-red-100 text-red-600',
};

const GRADE_STYLE = {
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-orange-500 text-white',
  D: 'bg-red-500 text-white',
  F: 'bg-red-600 text-white',
};

function formatNumber(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return '—';
  return Number(v).toFixed(digits);
}

function formatMoney(v, currency = 'USD') {
  if (v == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(v);
}

function formatVolume(v) {
  if (v == null) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(0);
}

function formatSigned(v, suffix = '%') {
  if (v == null) return '—';
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toFixed(2)}${suffix}`;
}

export default function StockCard({ ticker }) {
  const { loading, error, data, loadIntraday } = useStockData(ticker);
  const [mode, setMode] = useState('swing');

  const judgement = useMemo(() => {
    if (!data) return null;
    return judgeStock(data.indicators, data.structure, mode);
  }, [data, mode]);

  const targets = useMemo(() => {
    if (!data) return [];
    return buildTargets(data.price, data.indicators.atrPct);
  }, [data]);

  const rule = getRule(mode);
  const tips = useMemo(() => indicatorTooltips(rule), [rule]);
  const summary = useMemo(
    () => (data && judgement ? buildSummary(data, judgement, rule) : null),
    [data, judgement, rule]
  );

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
      <header>
        <div className="text-xs text-gray-400">{ticker}</div>
        <div className="text-lg font-semibold text-gray-900">
          {data?.name ?? (loading ? '불러오는 중…' : ticker)}
        </div>
        {data?.profile?.sector ? (
          <div className="text-[11px] text-gray-400 mt-0.5">
            {data.profile.sector}
            {data.profile.industry ? ` · ${data.profile.industry}` : ''}
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          데이터 로드 실패: {error}
          <div className="text-xs text-red-500 mt-1">
            프록시 서버가 실행 중인지 확인해주세요. (`node server/proxy.js`)
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-400 py-6 text-center">시세를 불러오는 중…</div>
      ) : null}

      {data ? (
        <>
          {/* === 모드 무관 정보 === */}
          <section>
            <div className="text-3xl font-bold text-gray-900">
              {formatMoney(data.price, data.currency)}
            </div>
            <div
              className={`text-sm mt-1 ${
                data.change >= 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {data.change >= 0 ? '+' : ''}
              {formatNumber(data.change, 2)} ({formatNumber(data.changePct, 2)}%)
            </div>
          </section>

          <MiniChart chart={data.chart} onRangeSelect={loadIntraday} />

          <ReturnsTable returns={data.returns} />
          <FundamentalsPanel fundamentals={data.fundamentals} />
          <TechnicalsPanel tech={data.technicals} currency={data.currency} />
          <EventsPanel events={data.events} currency={data.currency} />

          <section className="grid grid-cols-3 gap-2">
            <LogicBadge
              icon={Activity}
              label="RSI(14)"
              value={formatNumber(data.indicators.rsi, 1)}
              tooltip={tips.rsi}
              tone={indicatorTone('rsi', data.indicators.rsi, rule)}
            />
            <LogicBadge
              icon={Waves}
              label="MFI"
              value={formatNumber(data.indicators.mfi, 1)}
              tooltip={tips.mfi}
              tone={indicatorTone('mfi', data.indicators.mfi, rule)}
            />
            <LogicBadge
              icon={BarChart3}
              label="OBV ratio"
              value={formatNumber(data.indicators.obv, 2)}
              tooltip={tips.obv}
              tone={indicatorTone('obv', data.indicators.obv, rule)}
            />
            <LogicBadge
              icon={Globe2}
              label="시장 ATR%"
              value={`${formatNumber(data.indicators.marketAtrPct, 2)}%`}
              tooltip={tips.marketAtrPct}
              tone={indicatorTone('marketAtrPct', data.indicators.marketAtrPct, rule)}
            />
            <LogicBadge
              icon={data.indicators.rsSpy1M >= 0 ? TrendingUp : TrendingDown}
              label="RS vs SPY (1M)"
              value={formatSigned(data.indicators.rsSpy1M, '%p')}
              tooltip={tips.rsSpy1M}
              tone={indicatorTone('rsSpy1M', data.indicators.rsSpy1M, rule)}
            />
            <LogicBadge
              icon={Gauge}
              label="ATR%"
              value={`${formatNumber(data.indicators.atrPct, 2)}%`}
              tooltip={tips.atrPct}
              tone={indicatorTone('atrPct', data.indicators.atrPct, rule)}
            />
            <LogicBadge
              icon={Zap}
              label="Vol spike"
              value={
                data.indicators.volSpike != null
                  ? `${data.indicators.volSpike.toFixed(2)}×`
                  : '—'
              }
              hint={
                data.indicators.volSpike != null && data.indicators.volSpike >= 1.5
                  ? '평균 대비 급증'
                  : data.indicators.volSpike != null && data.indicators.volSpike <= 0.5
                  ? '거래 부진'
                  : null
              }
              tooltip={tips.volSpike}
              tone={indicatorTone('volSpike', data.indicators.volSpike, rule)}
            />
            <LogicBadge
              icon={TrendingUp}
              label="추세"
              value={TREND_LABEL[data.structure.trend] ?? data.structure.trend}
              tooltip={tips.trend}
              tone={indicatorTone('trend', data.structure.trend, rule)}
            />
            <LogicBadge
              icon={Flame}
              label="연속 상승"
              value={`${data.structure.consecutiveUp}일`}
              tooltip={tips.consecutiveUp}
              tone={indicatorTone('consecutiveUp', data.structure.consecutiveUp, rule)}
            />
          </section>

          {data.apiStatus ? (
            <div className="flex flex-wrap gap-1 text-[10px] text-gray-400">
              <span className="text-gray-500">데이터 상태:</span>
              {Object.entries(data.apiStatus).map(([k, ok]) => (
                <span
                  key={k}
                  className={`px-1.5 py-0.5 rounded ${
                    ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}
                >
                  {k} {ok ? '✓' : '✗'}
                </span>
              ))}
            </div>
          ) : null}

          {/* === 모드 탭 + 모드별 판단 그룹 === */}
          <div className="border-t border-gray-100 pt-4 -mx-1">
            <div className="flex justify-center mb-3">
              <ModeTab mode={mode} onChange={setMode} />
            </div>

            {judgement ? (
              <div className="bg-blue-50/40 border border-blue-100/60 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">{rule.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STAGE_STYLE[judgement.entryStage]
                      }`}
                    >
                      {judgement.entryStage}
                      <span className="ml-1 text-[10px] opacity-70">
                        / {STRATEGY_LABEL[judgement.strategy]}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-bold w-7 h-7 grid place-items-center rounded-md ${
                        GRADE_STYLE[judgement.finalGrade] ?? 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {judgement.finalGrade}
                    </span>
                  </div>
                </div>

                {summary ? (
                  <div className="bg-white/60 rounded-lg p-3 flex flex-col gap-2 border border-blue-100/60">
                    <div className="text-sm font-semibold text-gray-800">
                      {summary.headline}
                    </div>
                    {summary.pros.length > 0 ? (
                      <div>
                        <div className="text-[10px] text-green-700 font-semibold mb-1">
                          매수 우호 ({summary.pros.length})
                        </div>
                        <ul className="space-y-0.5">
                          {summary.pros.map((p, i) => (
                            <li
                              key={`pro-${i}`}
                              className="text-[11px] text-gray-700 flex gap-1.5 leading-snug"
                            >
                              <span className="text-green-500 mt-0.5">+</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {summary.cons.length > 0 ? (
                      <div>
                        <div className="text-[10px] text-red-600 font-semibold mb-1">
                          부정 시그널 ({summary.cons.length})
                        </div>
                        <ul className="space-y-0.5">
                          {summary.cons.map((c, i) => (
                            <li
                              key={`con-${i}`}
                              className="text-[11px] text-gray-700 flex gap-1.5 leading-snug"
                            >
                              <span className="text-red-500 mt-0.5">−</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-[10px] text-gray-400 leading-snug">
                  로직 출력: {judgement.reason}
                </div>

                <ScorePanel
                  scores={judgement.scores}
                  rule={rule}
                  total={
                    judgement.scores.structureScore * rule.weights.structure +
                    judgement.scores.executionScore * rule.weights.execution +
                    judgement.scores.supplyScore * rule.weights.supply
                  }
                />

                <TargetTable
                  targets={targets}
                  highlight={rule.highlightHorizon}
                  currency={data.currency}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
