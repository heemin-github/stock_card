# Stock Card

미국 주식 / ETF 분석 카드. 검색 한 번으로 차트 · 기술적 지표 · 펀더멘탈 · 매매 판단 근거를 한 화면에 모아서 보여줍니다.

> 투자 권유가 아닌 학습/분석용 프로젝트입니다. 모든 판단 로직은 휴리스틱이며, 실제 매매 전에 본인의 검증을 거치세요.

---

## 주요 기능

- **검색 + 인기 종목 + 최근 검색** (localStorage 기반 default 화면)
- **차트** 1D / 1W / 1M / 3M / 1Y · 이동평균(MA5/20/60/200) 점선 오버레이 토글
- **기술적 패널** 정배열, 골든/데드 크로스(MA·MACD), 볼린저밴드 위치, 52주 고저 대비 위치
- **펀더멘탈** P/E · 시총 · 베타 · EPS · 배당률 · ROE · PEG · 순이익률 (Twelve Data `/statistics`)
- **이벤트** 다음 실적 발표 D-N · 배당락
- **지표 그리드 9개** RSI · MFI · OBV · 시장 ATR%(SPY) · RS vs SPY(1M) · 종목 ATR% · Vol spike · 추세 · 연속상승 (각 항목마다 매수 우호=초록 / 부정=빨강 색 자동 표시)
- **모드 탭** 스윙 / 중장기 / 장기 — 모드별 가중치 · 임계값에 맞춰 점수 · 등급 · 목표가 · 색상 동적 변경
- **줄글 Summary** 매수 우호 / 부정 시그널을 한국어 문장으로 정리

---

## 1. Twelve Data API 키 발급

[twelvedata.com/account/api-keys](https://twelvedata.com/account/api-keys) 에서 무료 키 발급
(800 req/day, 8 req/min).

## 2. macOS 키체인에 저장 (1회만)

키 값은 코드/저장소에 절대 들어가지 않습니다. macOS 키체인에 저장 후 실행 스크립트가 런타임에 꺼내 씁니다.

```bash
security add-generic-password -s twelvedata -a "$USER" -w 'YOUR_KEY_HERE'
```

확인 / 삭제:

```bash
security find-generic-password -s twelvedata -a "$USER" -w   # 확인
security delete-generic-password -s twelvedata -a "$USER"     # 삭제
```

## 3. 실행

```bash
npm install
npm run start   # proxy(3001) + vite(5173) 동시 실행
```

`scripts/start-proxy.sh` 가 키체인에서 키를 꺼내 `TWELVEDATA_KEY` 환경변수로 주입하고 프록시를 띄웁니다. 키는 **브라우저 번들에 포함되지 않으며** 프록시 서버에만 존재합니다.

브라우저: <http://localhost:5173>

### 키체인을 쓰지 않을 때

```bash
TWELVEDATA_KEY=your_key node server/proxy.js   # 한 터미널
npm run dev                                     # 다른 터미널
```

---

## 폴더 구조

```
.
├── server/proxy.js                  # Twelve Data 프록시 (apikey 서버 측 주입)
├── scripts/start-proxy.sh           # macOS 키체인에서 키 로드
├── src/
│   ├── App.jsx                      # default 화면 라우팅 + 최근 검색
│   ├── components/
│   │   ├── LandingView.jsx          # default 화면 (인기/최근)
│   │   ├── SearchBar.jsx            # 종목 검색 (자동완성)
│   │   ├── StockCard.jsx            # 메인 카드
│   │   ├── ModeTab.jsx              # 스윙/중장기/장기 탭
│   │   ├── MiniChart.jsx            # 차트 + MA 오버레이 + lazy 인트라데이
│   │   ├── LogicBadge.jsx           # 지표 뱃지 (tone: good/bad/neutral)
│   │   ├── ScorePanel.jsx           # 구조/실행/수급 가중 점수
│   │   ├── TechnicalsPanel.jsx      # MA·MACD·BB·52w
│   │   ├── EventsPanel.jsx          # 실적·배당
│   │   ├── FundamentalsPanel.jsx    # P/E·시총·베타·EPS·배당·ROE
│   │   ├── ReturnsTable.jsx         # 1M/3M/1Y 수익률
│   │   ├── TargetTable.jsx          # 7D/1M/3M 목표가 (모드별 강조)
│   │   └── Tooltip.jsx              # 호버 툴팁
│   ├── hooks/
│   │   ├── useStockData.js          # 메인 데이터 fetch + 캐시 + lazy 인트라데이
│   │   └── useSymbolSearch.js       # 디바운스 심볼 검색
│   └── logic/
│       ├── indicators.js            # RSI/MFI/OBV/ATR%/추세 계산
│       ├── technicals.js            # SMA/EMA/MACD/볼린저/52주
│       ├── judgeStock.js            # 모드별 룰 + 등급 + 목표가
│       ├── indicatorTones.js        # 지표 → good/bad/neutral 매핑
│       ├── criteriaTexts.js         # 모드별 임계값 툴팁 텍스트
│       └── buildSummary.js          # 줄글 매수 우호/부정 시그널 생성
└── stock_card_build_v2.md           # 원본 빌드 스펙
```

---

## 데이터 호출 정책 (무료 티어 보호)

Twelve Data 무료 = 8 req/min · 800 req/day. 다음 정책으로 한도 안에 둠:

| 항목 | TTL |
|---|---|
| SPY (시장 컨텍스트) | 15분 |
| `/statistics` | 6시간 |
| `/profile` | 24시간 |
| `/earnings` · `/dividends` | 1시간 |
| 인트라데이 (5min/30min) | 2분 + **lazy** (탭 클릭 시에만) |

→ 첫 종목 로드 6콜, 같은 종목 재로딩 1콜.

---

## 모드별 판단 기준

| 모드 | 가중치 (구조/실행/수급) | RSI ENTRY | 시장 ATR% ENTRY | 강조 목표가 |
|---|---|---|---|---|
| 스윙 (7~14일) | 40 / 30 / 30 | 30~70 | < 1.5% | 7D |
| 중장기 (1~3개월) | 45 / 30 / 25 | < 85 | < 2.0% | 1M |
| 장기 (3개월+) | 50 / 20 / 30 | 제한 없음 | < 2.5% | 3M |

각 항목 ⓘ 호버에 모드별 정확한 임계값 표시.

---

## 라이선스 / 데이터 출처

- 데이터: [Twelve Data](https://twelvedata.com)
- 폰트: [Pretendard](https://github.com/orioncactus/pretendard)
- 아이콘: [lucide](https://lucide.dev)
- 차트: [recharts](https://recharts.org)
