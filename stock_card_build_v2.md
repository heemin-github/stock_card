# 종목 카드 UI — Claude Code 빌드 지시서 v2

## 📌 목표

주식 종목 분석 카드를 React + Tailwind CSS로 구현한다.
- 실제 주가: Yahoo Finance 비공식 API (프록시 서버 경유)
- 판단 로직: 스윙 / 중장기 / 장기 탭 전환으로 동적 변경
- Mock 데이터 없음, 실시간 데이터 기반

---

## 🗂️ 파일 구조

```
stock-card/
├── server/
│   └── proxy.js                # Yahoo Finance CORS 프록시
├── src/
│   ├── components/
│   │   ├── StockCard.jsx       # 메인 카드
│   │   ├── MiniChart.jsx       # 라인 차트 (1D/1W/1M/3M/1Y 탭)
│   │   ├── LogicBadge.jsx      # 로직 지표 타일
│   │   ├── TargetTable.jsx     # 목표가 테이블
│   │   └── ModeTab.jsx         # 스윙/중장기/장기 탭
│   ├── hooks/
│   │   └── useStockData.js     # Yahoo Finance fetch 훅
│   ├── logic/
│   │   └── judgeStock.js       # 판단 로직 (모드별 분기)
│   └── App.jsx
├── package.json
└── vite.config.js              # 프록시 설정 포함
```

---

## ⚙️ 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 스타일 | Tailwind CSS v3 |
| 차트 | recharts |
| 아이콘 | lucide-react |
| 폰트 | Pretendard CDN |
| 주가 API | Yahoo Finance (비공식, 무료, 키 없음) |

---

## 🌐 Yahoo Finance 프록시 서버 (server/proxy.js)

```js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api/yahoo', createProxyMiddleware({
  target: 'https://query1.finance.yahoo.com',
  changeOrigin: true,
  pathRewrite: { '^/api/yahoo': '' },
}));

app.listen(3001, () => console.log('Proxy running on port 3001'));
```

**vite.config.js 프록시 설정:**
```js
export default {
  server: {
    proxy: {
      '/api/yahoo': 'http://localhost:3001'
    }
  }
}
```

**실행:**
```bash
node server/proxy.js   # 터미널 1
npm run dev            # 터미널 2
```

---

## 📡 주가 데이터 fetch (hooks/useStockData.js)

Yahoo Finance에서 가져올 데이터:

| 항목 | API 파라미터 |
|------|-------------|
| 현재가 / 등락 | `/v8/finance/chart/{ticker}?interval=1d&range=1d` |
| 차트 데이터 | range: `5d` / `1mo` / `3mo` / `1y` |
| 지표 (RSI, OBV 등) | `/v11/finance/quoteSummary/{ticker}?modules=defaultKeyStatistics,financialData` |

**훅 반환값:**
```js
{
  price: number,
  change: number,
  changePct: number,
  chart: { '1D': [...], '1W': [...], '1M': [...], '3M': [...], '1Y': [...] },
  indicators: {
    rsi: number,        // 14일 RSI
    mfi: number,        // MFI
    obv: number,        // OBV ratio
    vix: number,        // ^VIX 별도 fetch
    adv20: number,      // 20일 평균 거래대금
    atrPct: number,     // ATR%
  },
  structure: {
    trend: 'up' | 'down' | 'sideways',
    consecutiveUp: number,
  }
}
```

---

## 🧠 판단 로직 (logic/judgeStock.js)

### 모드 탭
카드 상단에 `스윙 | 중장기 | 장기` 탭 → 선택된 모드에 따라 판단 기준 변경

---

### 스윙 모드 (7~14일)

**가중치:**
| 항목 | 가중치 |
|------|--------|
| 구조 점수 | 40% |
| 실행 점수 | 30% |
| 수급/모멘텀 | 30% |

**판단 기준:**
```
ENTRY 조건 (모두 충족):
  - 구조 점수 >= 70
  - 실행 점수 >= 50
  - RSI 30 ~ 70 구간
  - VIX < 25

WATCH_ONLY 조건:
  - 구조 점수 >= 70
  - 실행 점수 < 50 OR RSI 70~80

REJECT 강제 조건 (하나라도):
  - 구조 점수 < 70
  - RSI >= 80
  - VIX >= 25

Final Grade:
  A: 구조 80↑ + 실행 60↑ + RSI 정상
  B: 구조 70↑ + 실행 50↑
  C: 구조 60↑ or 실행 애매
  D: 구조 60↓
  F: REJECT 강제 조건 2개 이상
```

**목표가 기준:** 7D 달성 확률 우선 표시

---

### 중장기 모드 (1~3개월)

**가중치:**
| 항목 | 가중치 |
|------|--------|
| 구조/추세 | 45% |
| 섹터 모멘텀 | 30% |
| 수급 | 25% |

**판단 기준:**
```
ENTRY 조건 (모두 충족):
  - 구조 점수 >= 65
  - 실행 점수 >= 40
  - 추세 방향 = 'up'
  - RSI < 85
  - VIX < 30

WATCH_ONLY 조건:
  - 구조 점수 >= 65
  - RSI 80~85 or VIX 25~30

REJECT 강제 조건 (하나라도):
  - 구조 점수 < 65
  - RSI >= 85
  - VIX >= 30
  - 추세 = 'down'

Final Grade:
  A: 구조 80↑ + 추세 up + RSI < 75
  B: 구조 70↑ + 추세 up
  C: 구조 65↑ or 추세 sideways
  D: 구조 65↓
  F: REJECT 강제 2개 이상

스윙보다 RSI/VIX 기준 완화 (단기 노이즈 무시)
```

**목표가 기준:** 1M(21D) 달성 확률 우선 표시

---

### 장기 모드 (3개월+)

**가중치:**
| 항목 | 가중치 |
|------|--------|
| 구조/추세 | 50% |
| 펀더멘탈 | 30% |
| 수급 | 20% |

**판단 기준:**
```
ENTRY 조건 (모두 충족):
  - 구조 점수 >= 60
  - 추세 방향 = 'up'
  - VIX < 35 (장기는 VIX 기준 매우 관대)
  - RSI 제한 없음 (단기 노이즈)

WATCH_ONLY 조건:
  - 구조 점수 >= 60
  - 추세 sideways

REJECT 강제 조건 (하나라도):
  - 구조 점수 < 60
  - 추세 = 'down' (장기 하락추세)
  - VIX >= 35 (시장 패닉)

Final Grade:
  A: 구조 80↑ + 추세 강한 up
  B: 구조 70↑ + 추세 up
  C: 구조 60↑ or 추세 sideways
  D: 구조 60↓
  F: REJECT 강제 2개 이상

RSI/단기 지표 비중 최소화, 추세/구조 중심
```

**목표가 기준:** 3M(63D) 달성 확률 우선 표시

---

### judgeStock.js 구조

```js
export function judgeStock(indicators, mode = 'swing') {
  const rules = {
    swing: swingRules,
    mid: midRules,
    long: longRules,
  };

  const rule = rules[mode];
  const entryStage = calcEntryStage(indicators, rule);
  const finalGrade = calcGrade(indicators, rule);
  const strategy = entryStage === 'ENTRY' ? 'BUY' : 
                   entryStage === 'WATCH_ONLY' ? 'WATCH_ONLY' : 'REJECT';
  const reason = buildReason(indicators, rule, entryStage);

  return { entryStage, finalGrade, strategy, reason };
}
```

---

## 🧩 컴포넌트 스펙

### ModeTab.jsx
```
[ 스윙 | 중장기 | 장기 ]
```
- 선택된 탭 → `bg-blue-500 text-white`
- 비선택 → `bg-gray-100 text-gray-500`
- 탭 변경 시 judgeStock() 재실행 → 카드 전체 업데이트

### StockCard.jsx
- `ticker` prop 받아서 `useStockData(ticker)` 호출
- `mode` state로 ModeTab 제어
- `judgeStock(indicators, mode)` 결과로 overview 섹션 렌더링

### MiniChart.jsx
- recharts LineChart + ResponsiveContainer
- 1D/1W/1M/3M/1Y 탭 전환
- 라인: blue-400, dot 없음, smooth

### LogicBadge.jsx
- 아이콘 + 라벨 + 값
- 3열 그리드
- `bg-gray-50` 배경, radius 8px

### TargetTable.jsx
- 모드별 강조 컬럼 다름
  - 스윙: 7D 강조
  - 중장기: 1M 강조
  - 장기: 3M 강조
- 수익률: green, Stop: red

---

## 🎨 디자인 스펙

### 색상
| 역할 | 값 |
|------|-----|
| 상승 | `#22c55e` |
| 하락 | `#ef4444` |
| REJECT | `#fee2e2` bg / `#ef4444` text |
| WATCH_ONLY | `#dbeafe` bg / `#3b82f6` text |
| ENTRY | `#dcfce7` bg / `#16a34a` text |
| Grade A | `#22c55e` |
| Grade B | `#3b82f6` |
| Grade C | `#f97316` |
| Grade D/F | `#ef4444` |

### 폰트
```html
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
```

---

## ✅ Claude Code 프롬프트 (복붙용)

```
stock_card_build_v2.md 기반으로 종목 카드 UI 전체 구현해줘.

요구사항:
1. Yahoo Finance 프록시 서버 (server/proxy.js) 구현
2. useStockData 훅으로 실시간 주가/지표 fetch
3. judgeStock.js — 스윙/중장기/장기 모드별 판단 로직 구현
4. ModeTab 탭 전환 시 판단 결과 + 목표가 강조 컬럼 동적 변경
5. MiniChart recharts, 기간 탭 전환
6. LogicBadge 3열 그리드
7. TargetTable 모드별 강조 컬럼
8. Pretendard 폰트, Tailwind만 사용
9. 티커는 App.jsx에서 props로 넘기는 구조 (예: <StockCard ticker="GOOG" />)
```

---

## 🚧 주의사항

- VIX는 `^VIX` 티커로 별도 fetch 필요
- RSI는 Yahoo Finance 기본 제공 안 함 → 종가 데이터로 직접 계산 (14일 기준)
- MFI, OBV도 직접 계산 필요 → `logic/indicators.js` 별도 파일로 분리 요청
- CORS 문제로 반드시 프록시 서버 경유
- `node server/proxy.js` 먼저 실행 후 `npm run dev`
