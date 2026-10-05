/* saju.js — pure calculation module for the 사주 나침반 app (달수 방식).
   Browser: needs lunar-javascript globals (Solar, Lunar) loaded first → window.Saju.
   Node: module.exports, requires 'lunar-javascript'. No DOM, no storage. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('lunar-javascript'));
  else root.Saju = factory(root);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  const { Solar, Lunar } = L;

  // ── 기본 글자 ──────────────────────────────────────────────
  const STEMS = '甲乙丙丁戊己庚辛壬癸', BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const STEM_KO = '갑을병정무기경신임계', BRANCH_KO = '자축인묘진사오미신유술해';
  const EL = ['목', '화', '토', '금', '수'], EL_HANJA = ['木', '火', '土', '金', '水'];
  const BR_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  const BR_MAIN = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];          // 지지 본기(천간 인덱스)
  const ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
  const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];          // 천간별 장생 지지
  const PALACE = ['년', '월', '일', '시'];
  const PALACE_AREA = { 년: '사회·윗사람', 월: '직장·부모', 일: '배우자·나', 시: '자녀·말년' };
  const ANCHOR_W = [1.0, 0.8, 0.8, 0.5];                          // 년지(띠) 1.0 · 월지 0.8 · 일지 0.8 · 시지 0.5
  const W = { daeun: 0.55, seun: 0.35, wolun: 0.10 };

  const si = c => STEMS.indexOf(c), bi = c => BRANCHES.indexOf(c);
  const stemEl = i => Math.floor(i / 2);
  const ko = gz => STEM_KO[si(gz[0])] + BRANCH_KO[bi(gz[1])];
  const gzEls = gz => [stemEl(si(gz[0])), BR_EL[bi(gz[1])]];
  const yearGz = Y => STEMS[((Y - 4) % 10 + 10) % 10] + BRANCHES[((Y - 4) % 12 + 12) % 12];

  // ── 십성 ──────────────────────────────────────────────────
  const GOD_GROUP = ['비겁', '식상', '재성', '관성', '인성'];
  const GODS = [['비견', '겁재'], ['식신', '상관'], ['편재', '정재'], ['편관', '정관'], ['편인', '정인']];
  function tenGod(dayStem, stemIdx) {
    const d = si(dayStem), g = (stemEl(stemIdx) - stemEl(d) + 5) % 5;
    return { name: GODS[g][(stemIdx % 2) === (d % 2) ? 0 : 1], group: GOD_GROUP[g], g };
  }
  const godOfStem = (day, c) => tenGod(day, si(c));
  const godOfBranch = (day, c) => tenGod(day, BR_MAIN[bi(c)]);

  function stage12(dayStem, br) {
    const d = si(dayStem), b = bi(br), s = STAGE_START[d];
    return STAGES[d % 2 === 0 ? (b - s + 12) % 12 : (s - b + 12) % 12];
  }

  // ── 지지 관계 ─────────────────────────────────────────────
  const YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  const SAMHAP = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
  const BANGHAP = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];
  const HYUNG = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
  const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
  const has = (list, a, b) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const grp = (groups, a, b) => groups.find(g => a !== b && g.includes(a) && g.includes(b));

  /** relations between two branches. others = the rest of the natal branches (for 삼합·방합 완성). */
  function branchRelations(A, B, others = []) {
    const a = bi(A), b = bi(B), o = others.map(bi), out = [], nm = A + B;
    const sh = grp(SAMHAP, a, b), bh = grp(BANGHAP, a, b);
    if (has(YUKHAP, a, b)) out.push({ type: '육합', name: nm + ' 육합', s: 1 });
    if (sh) { const full = o.includes(sh.find(x => x !== a && x !== b)); out.push({ type: full ? '삼합' : '반합', name: (full ? sh.map(x => BRANCHES[x]).join('') + ' 삼합' : nm + ' 반합'), s: full ? 2 : 1 }); }
    if (bh) { const full = o.includes(bh.find(x => x !== a && x !== b)); out.push({ type: full ? '방합 완성' : '방합', name: (full ? bh.map(x => BRANCHES[x]).join('') + ' 방합' : nm + ' 방합'), s: full ? 2 : 1 }); }
    if (a !== b && Math.abs(a - b) === 6) out.push({ type: '충', name: nm + ' 충', s: -2 });
    if (has(HYUNG, a, b)) out.push({ type: '형', name: nm + ' 형', s: -2 });
    if (has(HAE, a, b)) out.push({ type: '해', name: nm + ' 해', s: -0.5 });
    if (a === b) out.push({ type: '같은 글자', name: nm + ' 같은 글자', s: 0 });
    return out;
  }
  // 한 쌍의 점수 = 가장 좋은 합 + 가장 나쁜 충·형·해 (寅申처럼 충과 형이 겹쳐도 두 번 깎지 않음)
  const pairScore = rels => Math.max(0, ...rels.map(r => r.s)) + Math.min(0, ...rels.map(r => r.s));
  const isGood = r => r.s > 0, isBad = r => r.s < 0;

  // ── 신살(가볍게) ──────────────────────────────────────────
  const gIdx = b => SAMHAP.findIndex(g => g.includes(bi(b)));        // 0 申子辰 1 寅午戌 2 巳酉丑 3 亥卯未
  const SAMJAE = [[2, 3, 4], [8, 9, 10], [11, 0, 1], [5, 6, 7]];
  const YEOKMA = [2, 8, 11, 5], DOHWA = [9, 3, 6, 0], HWAGAE = [4, 10, 1, 7], GEOPSAL = [5, 11, 2, 8];
  const BAEKHO = ['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑'];
  const samjaeBranches = yb => SAMJAE[gIdx(yb)].map(x => BRANCHES[x]);
  function shinsal(chart) {
    const out = [], brs = chart.pillars.map(p => p && p[1]);
    const bases = [['년지', brs[0]], ['일지', brs[2]]];
    for (const [base, b] of bases) {
      const g = gIdx(b);
      for (const [name, tbl, note] of [['역마', YEOKMA, '움직임·이동이 많은 기운으로 봐요'], ['도화', DOHWA, '사람의 눈길을 끄는 매력으로 봐요'], ['화개', HWAGAE, '공부·몰입·혼자만의 시간이 잘 맞는 기운으로 봐요'], ['겁살', GEOPSAL, '갑자기 바뀌는 일에 대비하라는 표시로 봐요']]) {
        brs.forEach((x, i) => { if (x && bi(x) === tbl[g]) out.push({ name, base, at: PALACE[i] + '지 ' + x, note }); });
      }
    }
    if (BAEKHO.includes(chart.pillars[2])) out.push({ name: '백호', base: '일주', at: '일주 ' + chart.pillars[2], note: '추진력·결단력이 강한 일주로 많이 풀어요' });
    const seen = new Set();
    return out.filter(s => { const k = s.name + s.at; if (seen.has(k)) return false; seen.add(k); return true; });
  }

  // ── 시간 보정 ─────────────────────────────────────────────
  const DST = [['1987-05-10T02:00', '1987-10-11T03:00'], ['1988-05-08T02:00', '1988-10-09T03:00']];
  // ponytail: 1948–51·1955–60 서머타임은 빠짐(1987–88만), 필요한 출생연도가 생기면 DST 표에 추가
  function correction(ymd, hm, lng) {
    const stamp = ymd + 'T' + hm;
    const std = ymd >= '1954-03-21' && ymd < '1961-08-10' ? 127.5 : 135;     // 1954–61 한국 표준시 127.5°E
    const dst = DST.some(([a, b]) => stamp >= a && stamp < b);
    // minutes: 시계 → 지방평균시(일주·시주), toBeijing: 시계 → UTC+8 (lunar-javascript의 절기 시각 기준 → 연주·월주·대운)
    return { minutes: Math.round((std - lng) * 4) + (dst ? 60 : 0), toBeijing: Math.round((std - 120) * 4) + (dst ? 60 : 0), dst, std };
  }
  const pad = n => String(n).padStart(2, '0');
  function shift(ymd, hm, minutes) {      // KST 시각 − minutes → [y,m,d,h,mi]
    const [y, m, d] = ymd.split('-').map(Number), [h, mi] = hm.split(':').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d, h, mi) - minutes * 60000);
    return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes()];
  }
  const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  const fromMin = n => pad(Math.floor(((n % 1440) + 1440) % 1440 / 60)) + ':' + pad(((n % 60) + 60) % 60);

  function solarDate(p) {
    const [y, m, d] = p.date.split('-').map(Number);
    if (p.cal !== 'lunar') return p.date;
    const s = Lunar.fromYmd(y, p.leap ? -m : m, d).getSolar(), back = s.getLunar();      // 없는 윤달은 여기서 throw
    if (back.getYear() !== y || Math.abs(back.getMonth()) !== m || (back.getMonth() < 0) !== !!p.leap || back.getDay() !== d) throw new Error('없는 음력 날짜');
    return s.getYear() + '-' + pad(s.getMonth()) + '-' + pad(s.getDay());
  }

  function eightChar(ymd, hm, lng, sect) {
    const c = correction(ymd, hm, lng), [y, m, d, h, mi] = shift(ymd, hm, c.minutes), B = shift(ymd, hm, c.toBeijing);
    const ec = Solar.fromYmdHms(y, m, d, h, mi, 0).getLunar().getEightChar();          // 일주·시주: 지방평균시
    ec.setSect(sect || 1);
    const lunarB = Solar.fromYmdHms(B[0], B[1], B[2], B[3], B[4], 0).getLunar(), ecB = lunarB.getEightChar();   // 연주·월주·대운: UTC+8
    return { ec, ecB, lunarB, corr: c, local: `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(mi)}` };
  }

  // ── 원국 계산 ─────────────────────────────────────────────
  /** profile: {gender:'M'|'F', cal, leap, date, time:{mode:'exact',at}|{mode:'range',from,to}|{mode:'unknown'}, lng}
      opts: {yearBoundary:'ipchun'|'seol', sect:1|2, hour:'己亥' (pick among candidates)} */
  function computeChart(p, opts = {}) {
    const ymd = solarDate(p), t = p.time || { mode: 'unknown' }, lng = +p.lng || 127.5;
    let candidates = [], base;
    if (t.mode === 'exact') base = eightChar(ymd, t.at, lng, opts.sect);
    else if (t.mode === 'range') {
      const a = toMin(t.from), b = toMin(t.to) <= a ? toMin(t.to) + 1440 : toMin(t.to);
      for (let n = a; n < b; n++) {
        const hm = fromMin(n), day = n >= 1440 ? nextDay(ymd) : ymd, r = eightChar(day, hm, lng, opts.sect);
        const key = r.ec.getTime() + r.ec.getDay();
        let c = candidates.find(x => x.key === key);
        if (!c) candidates.push(c = { key, gz: r.ec.getTime(), day: r.ec.getDay(), from: hm, minutes: 0, r });
        c.minutes++; c.to = fromMin(n + 1);
      }
      candidates.sort((x, y) => y.minutes - x.minutes);
      if (candidates[1] && candidates[0].minutes - candidates[1].minutes <= 10) candidates.forEach(c => { c.tie = true; });
      base = (candidates.find(c => c.gz === opts.hour) || candidates[0]).r;
    } else base = eightChar(ymd, '12:00', 135, opts.sect);       // 시간 모름: 3주만, 정오 기준
    const { ec, ecB, lunarB } = base, hourKnown = t.mode !== 'unknown';
    // 설 옵션은 연주만 바꿈(월주·대운은 절기 그대로) — 설정 화면에 명시
    const yearP = opts.yearBoundary === 'seol' ? lunarB.getYearInGanZhi() : ecB.getYear();
    const pillars = [yearP, ecB.getMonth(), ec.getDay(), hourKnown ? ec.getTime() : null];
    const yun = ecB.getYun(p.gender === 'F' ? 0 : 1), list = yun.getDaYun(10).slice(1);
    const ss = yun.getStartSolar();
    const daeun = {
      forward: yun.isForward(), y: yun.getStartYear(), m: yun.getStartMonth(), d: yun.getStartDay(),
      su: Math.round(yun.getStartYear() + yun.getStartMonth() / 12),
      start: ss.getYear() + '-' + pad(ss.getMonth()) + '-' + pad(ss.getDay()),
      list: list.map(x => ({ gz: x.getGanZhi(), startYear: x.getStartYear(), endYear: x.getEndYear(), startAge: x.getStartAge(), endAge: x.getEndAge() }))
    };
    const chart = { pillars, hourKnown, daeun, solar: ymd, local: base.local, corr: base.corr, candidates: candidates.map(({ r, key, ...c }) => c), birthYear: +ymd.slice(0, 4) };
    chart.analysis = analyze(chart);
    return chart;
  }
  function nextDay(ymd) { const [y, m, d] = ymd.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d + 1)); return t.toISOString().slice(0, 10); }

  // ── 분석: 오행 · 필요한 기운 · 원국 관계 ──────────────────
  function analyze(chart) {
    const ps = chart.pillars.filter(Boolean), dayStem = chart.pillars[2][0];
    const count = [0, 0, 0, 0, 0];
    for (const gz of ps) for (const e of gzEls(gz)) count[e]++;
    const total = ps.length * 2, mb = bi(chart.pillars[1][1]);
    const season = [2, 3, 4].includes(mb) ? '봄' : [5, 6, 7].includes(mb) ? '여름' : [8, 9, 10].includes(mb) ? '가을' : '겨울';
    const bias = [5, 6, 7].includes(mb) ? 2 : [11, 0, 1].includes(mb) ? -2 : mb === 8 ? 1 : mb === 2 ? -1 : 0;
    const temp = count[1] - count[4] + bias;
    const needed = [], avoid = [], reasons = [];
    const add = (arr, e, why) => { if (!arr.includes(e)) arr.push(e); reasons.push({ e, kind: arr === needed ? 'need' : 'avoid', why }); };
    const monthTxt = chart.pillars[1][1] + '월(' + season + ')';
    if (temp >= 2) {
      add(needed, 4, `${monthTxt}에 태어났고 불(火)이 ${count[1]}개라 사주가 더운 편이에요. 식혀 줄 물(水)이 먼저 필요해요 (조후).`);
      add(needed, 3, '쇠(金)는 물을 만들어 주는 기운이라 함께 도움이 돼요 (조후 보조).');
      add(avoid, 1, '이미 많은 불(火)이 더 들어오면 과열되기 쉬워요.');
    } else if (temp <= -2) {
      add(needed, 1, `${monthTxt}에 태어났고 물(水)이 ${count[4]}개라 사주가 찬 편이에요. 따뜻하게 해 줄 불(火)이 먼저 필요해요 (조후).`);
      add(needed, 0, '나무(木)는 불을 살려 주는 기운이라 함께 도움이 돼요 (조후 보조).');
      add(avoid, 4, '이미 차가운 사주에 물(水)이 더 들어오면 움츠러들기 쉬워요.');
    }
    count.forEach((c, e) => { if (c === 0 && !avoid.includes(e)) add(needed, e, `${EL[e]}(${EL_HANJA[e]})이 여덟 글자 중 하나도 없어요. 빠진 기운은 채워 주면 좋다고 봐요 (결핍).`); });
    count.forEach((c, e) => {
      if (c >= 4 && !needed.includes(e)) {
        add(avoid, e, `${EL[e]}(${EL_HANJA[e]})이 ${c}개로 많아요. 더 들어오면 한쪽으로 치우쳐요 (과다).`);
        const gen = (e + 4) % 5; if (!needed.includes(gen)) add(avoid, gen, `${EL[gen]}(${EL_HANJA[gen]})은 많은 ${EL[e]}을 더 키우는 기운이에요.`);
      }
    });
    // 원국 안의 지지 관계
    const brs = chart.pillars.map(p => p && p[1]), natalRel = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      if (!brs[i] || !brs[j]) continue;
      const others = brs.filter((x, k) => x && k !== i && k !== j);
      for (const r of branchRelations(brs[i], brs[j], others)) if (r.type !== '같은 글자') natalRel.push({ ...r, a: PALACE[i], b: PALACE[j] });
    }
    const harmony = natalRel.filter(isGood).length;
    return {
      count, total, season, temp, needed, avoid, reasons, natalRel, harmony,
      metalWater: (count[3] + count[4]) / total,
      dominant: count.indexOf(Math.max(...count)),
      stages: chart.pillars.map(p => p && stage12(dayStem, p[1])),
      gods: chart.pillars.map((p, i) => p && { stem: i === 2 ? { name: '일간(나)', group: '나' } : godOfStem(dayStem, p[0]), branch: godOfBranch(dayStem, p[1]) }),
      shinsal: shinsal(chart),
      samjae: samjaeBranches(chart.pillars[0][1]),
      yeokma: BRANCHES[YEOKMA[gIdx(chart.pillars[0][1])]]
    };
  }

  // ── 기간 점수 (대운·세운·월운 한 간지) ───────────────────
  /** kind: 'daeun' | 'seun' | 'wolun' | 'day' */
  function component(chart, gz, kind) {
    const A = chart.analysis, dayStem = chart.pillars[2][0], parts = { element: 0, relations: 0, tenGod: 0, shinsal: 0, stage: 0 }, notes = [];
    for (const e of gzEls(gz)) {
      if (A.needed.includes(e)) { parts.element += 2; notes.push({ k: 'need', t: `필요한 ${EL[e]}(${EL_HANJA[e]})` }); }
      if (A.avoid.includes(e)) { parts.element -= 2; notes.push({ k: 'avoid', t: `넘치는 ${EL[e]}(${EL_HANJA[e]})` }); }
    }
    const brs = chart.pillars.map(p => p && p[1]), rels = [];
    brs.forEach((nb, i) => {
      if (!nb) return;
      const rs = branchRelations(gz[1], nb, brs.filter((x, k) => x && k !== i)).filter(r => r.type !== '같은 글자');
      if (!rs.length) return;
      const s = pairScore(rs) * ANCHOR_W[i];
      parts.relations += s;
      for (const r of rs) rels.push({ ...r, palace: PALACE[i], w: ANCHOR_W[i] });
    });
    const gods = [godOfStem(dayStem, gz[0]), godOfBranch(dayStem, gz[1])];
    gods.forEach((g, i) => {
      const e = i === 0 ? stemEl(si(gz[0])) : BR_EL[bi(gz[1])];
      if (g.group === '재성') parts.tenGod += A.needed.includes(e) ? 2 : 1;
      if (g.name === '편관') parts.tenGod -= 2;
      if (g.group === '비겁') parts.tenGod -= 1;
    });
    const bokeum = gz === chart.pillars[2];
    if (bokeum) parts.tenGod -= 2;
    const samjae = kind === 'seun' && A.samjae.includes(gz[1]);
    if (samjae) parts.shinsal -= brs.filter(b => b === chart.pillars[0][1]).length >= 2 ? 2 : 1;
    const geopsal = bi(gz[1]) === GEOPSAL[gIdx(chart.pillars[0][1])];
    if (geopsal) parts.shinsal -= 0.5;
    const stage = stage12(dayStem, gz[1]);
    if (stage === '묘') parts.stage -= 0.5;
    const total = round(Object.values(parts).reduce((a, b) => a + b, 0));
    const clash = rels.some(r => r.type === '충' || r.type === '형');
    return {
      gz, ko: ko(gz), kind, total, parts: mapVals(parts, round), notes, rels, gods, stage, bokeum, samjae, geopsal,
      els: gzEls(gz),
      pyeongwan: gods.some(g => g.name === '편관'),
      bigyeon: gods.some(g => g.group === '비겁'),
      halfPeak: parts.element > 0 && rels.some(r => r.type === '충'),        // R6 반쪽 전성기
      clash, yeokma: gz[1] === A.yeokma
    };
  }
  const round = x => Math.round(x * 100) / 100;
  const mapVals = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]));

  // ── 행동 분류 ─────────────────────────────────────────────
  const CLASSES = {
    push: { key: 'push', name: '밀고 갈 때', short: '밀고 갈 때' },
    guard: { key: 'guard', name: '지킬 때', short: '지킬 때' },
    prep: { key: 'prep', name: '준비할 때', short: '준비할 때' },
    rest: { key: 'rest', name: '쉬어갈 때', short: '쉬어갈 때' }
  };
  /** 스펙 actionMap: 밀고 = 대운 ≥ 1 & 세운 ≥ 1 · 지킬 = 대운 ≥ 1 & 세운 < 0 · 준비 = 대운 < 0 & (세운 ≥ 1 | 3년 안 좋은 대운) | preWarning · 쉬어 = 대운 < 0 & 세운 < 0.
      스펙에 없는 칸(설정 '계산 방식'에 적어 둠): 대운 ≥ 1 & 0 ≤ 세운 < 1 → 지킬 · 0 ≤ 대운 < 1 → 세운 ≥ 1 밀고 / ≥ 0 준비 / < 0 지킬 ·
      대운 < 0 & 0 ≤ 세운 < 1 → 준비 · 대운 < 0 & 세운 < 0 인데 좋은 대운이 3년 안 → 준비(앞을 보는 쪽).  o = { nextGood, pre } */
  function classify(D, Y, o = {}) {
    if (typeof o === 'boolean') o = { nextGood: o };
    if (o.pre) return 'prep';
    return baseClass(D, Y, o.nextGood);
  }
  function baseClass(D, Y, nextGood) {
    if (D >= 1) return Y >= 1 ? 'push' : 'guard';
    if (D >= 0) return Y >= 1 ? 'push' : Y >= 0 ? 'prep' : 'guard';
    if (Y >= 1 || nextGood) return 'prep';
    return Y < 0 ? 'rest' : 'prep';
  }
  const score = (D, Y, M = 0) => round(W.daeun * D + W.seun * Y + W.wolun * M);

  function daeunAt(chart, Y) {
    const l = chart.daeun.list; let cur = null;
    for (const d of l) if (d.startYear <= Y) cur = d;
    return cur;
  }
  function daeunOnDate(chart, ymd) {       // 실제 대운 교체일(생일 + 대운 시작 기간) 기준
    const l = chart.daeun.list, [sy, sm, sd] = chart.daeun.start.split('-');
    let cur = null;
    l.forEach((d, i) => { const at = (+sy + 10 * i) + '-' + sm + '-' + sd; if (at <= ymd) cur = d; });
    return cur;
  }
  function nextGoodSoon(chart, Y, cur = daeunAt(chart, Y)) {
    const l = chart.daeun.list, nx = cur && l[l.indexOf(cur) + 1];
    return !!nx && nx.startYear - Y <= 3 && component(chart, nx.gz, 'daeun').total >= 1;
  }

  function hasAttack(chart, yc) {      // 공격 타이밍: 세운이 원국과 충·형 + 원국(과 세운) 합 ≥ 2
    const hits = yc.rels.filter(r => r.type === '충' || r.type === '형');
    const harm = chart.analysis.harmony + yc.rels.filter(isGood).length;
    return hits.length > 0 && harm >= 2;
  }

  /** 한 해(세운): 대운은 실제 교체일 기준으로 그 세운 해의 한가운데(8월 5일)에 걸린 대운 */
  function yearView(chart, Y) {
    const d = daeunOnDate(chart, Y + '-08-05'), D = d ? component(chart, d.gz, 'daeun') : null, yc = component(chart, yearGz(Y), 'seun');
    const Dt = D ? D.total : 0, next = component(chart, yearGz(Y + 1), 'seun'), ng = nextGoodSoon(chart, Y, d), pre = next.total < -2;
    return {
      year: Y, daeun: d, D, Y: yc, S: score(Dt, yc.total), cls: classify(Dt, yc.total, { nextGood: ng, pre }), base: baseClass(Dt, yc.total, ng),
      prepBadge: pre, attack: hasAttack(chart, yc), samjae: yc.samjae, nextY: next
    };
  }

  // lunar-javascript의 절기는 UTC+8 기준 → 지금 순간을 UTC+8 벽시계로 바꿔서 물어봄 (기기 시간대와 무관)
  const BJ = 8 * 3600e3;
  const lunarAt = dt => { const t = new Date(dt.getTime() + BJ); return Solar.fromYmdHms(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes(), 0).getLunar(); };
  const ymdOf = dt => { const t = new Date(dt.getTime() + 9 * 3600e3); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); };   // KST 날짜
  const jieDate = j => { const s = j.getSolar ? j.getSolar() : j; return new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond()) - BJ); };
  function seunAt(dt, opts = {}) {
    const l = lunarAt(dt), gz = opts.yearBoundary === 'seol' ? l.getYearInGanZhi() : l.getYearInGanZhiByLiChun();
    let Y = l.getSolar().getYear(); while (yearGz(Y) !== gz) Y--;
    return { gz, Y };
  }
  /** 다음 세운이 시작하는 순간 (입춘 또는 설) */
  function nextSeunStart(Y, opts = {}) {
    if (opts.yearBoundary === 'seol') { const s = Lunar.fromYmd(Y + 1, 1, 1).getSolar(); return new Date(Date.UTC(s.getYear(), s.getMonth() - 1, s.getDay()) - 9 * 3600e3); }
    return jieDate(Solar.fromYmd(Y + 1, 2, 15).getLunar().getJieQiTable()['立春']);
  }
  /** 지금: 대운은 실제 교체일, 세운은 입춘(또는 설), 월운은 오늘이 속한 절기 월 */
  function now(chart, date, opts = {}) {
    const ymd = ymdOf(date), d = daeunOnDate(chart, ymd), s = seunAt(date, opts), l = lunarAt(date);
    const mgz = l.getMonthInGanZhiExact();
    const D = d ? component(chart, d.gz, 'daeun') : null, Yc = component(chart, s.gz, 'seun'), M = component(chart, mgz, 'wolun');
    const Dt = D ? D.total : 0, near = (W.seun * Yc.total + W.wolun * M.total) / (W.seun + W.wolun);
    const next = component(chart, yearGz(s.Y + 1), 'seun'), lst = chart.daeun.list, nd = d && lst[lst.indexOf(d) + 1];
    const pre = next.total < -2 && ymd >= s.Y + '-07-01', ng = nextGoodSoon(chart, s.Y, d);
    return {
      date: ymd, daeun: d, nextDaeun: nd || null, D, Y: Yc, M, year: s.Y, S: score(Dt, Yc.total, M.total), near: round(near),
      cls: classify(Dt, near, { nextGood: ng, pre }), base: baseClass(Dt, near, ng),
      monthStart: jieDate(l.getPrevJie()), monthEnd: jieDate(l.getNextJie()), nextSeunStart: nextSeunStart(s.Y, opts),
      prepBadge: pre, nextY: next, attack: hasAttack(chart, Yc)
    };
  }
  /** 오늘이 속한 절기 월부터 n개 절기 월 */
  function months(chart, date, n = 12, opts = {}) {
    const out = []; let t = date;
    for (let k = 0; k < n; k++) {
      const v = now(chart, t, opts), st = k ? t : v.monthStart, lt = new Date(st.getTime() + 9 * 3600e3);
      out.push({ y: lt.getUTCFullYear(), m: lt.getUTCMonth() + 1, d: lt.getUTCDate(), start: st, gz: v.M.gz, S: v.S, near: v.near, cls: v.cls, base: v.base, pre: v.prepBadge, M: v.M, Y: v.Y });
      t = new Date(v.monthEnd.getTime() + 60e3);
    }
    return out;
  }

  // ── 궁합 ──────────────────────────────────────────────────
  const STEM_HAP = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]], STEM_CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9]];
  function match(A, B) {
    const a = A.pillars[2][0], b = B.pillars[2][0], ea = stemEl(si(a)), eb = stemEl(si(b));
    const rel = (eb - ea + 5) % 5;    // 0 같음 1 A가 B를 생 2 A가 B를 극 3 B가 A를 극 4 B가 A를 생
    const stemHap = has(STEM_HAP, si(a), si(b)), stemChung = has(STEM_CHUNG, si(a), si(b));
    const fillAB = A.analysis.needed.map(e => ({ e, has: B.analysis.count[e] })).filter(x => x.has > 0);
    const fillBA = B.analysis.needed.map(e => ({ e, has: A.analysis.count[e] })).filter(x => x.has > 0);
    const cross = [];
    A.pillars.forEach((pa, i) => pa && B.pillars.forEach((pb, j) => {
      if (!pb) return;
      for (const r of branchRelations(pa[1], pb[1])) cross.push({ ...r, a: PALACE[i], b: PALACE[j], A: pa[1], B: pb[1] });
    }));
    const spouse = cross.filter(r => r.a === '일' && r.b === '일');
    return { a, b, ea, eb, rel, stemHap, stemChung, fillAB, fillBA, cross, spouse, gangHwi: (a === '丙' && b === '壬') || (a === '壬' && b === '丙') };
  }

  /** 날짜 점검: 그 해(세운)·그 달(월운)·그 날(일진)을 각자 원국에 대 봄 */
  function checkDate(chart, ymd) {
    const [y, m, d] = ymd.split('-').map(Number), l = Solar.fromYmd(y, m, d).getLunar();
    const Yg = l.getYearInGanZhiByLiChun(), Mg = l.getMonthInGanZhiExact(), Dg = l.getDayInGanZhiExact();
    const Y = component(chart, Yg, 'seun'), M = component(chart, Mg, 'wolun'), Dy = component(chart, Dg, 'day');
    const spouseRel = branchRelations(Dg[1], chart.pillars[2][1]).filter(r => r.type !== '같은 글자');
    const s = round(0.2 * Y.total + 0.3 * M.total + 0.5 * Dy.total);
    return { ymd, Yg, Mg, Dg, Y, M, D: Dy, spouseRel, S: s, verdict: s >= 1 ? 'good' : s >= -1 ? 'ok' : 'care' };
  }

  // ── 오늘의 일진 ───────────────────────────────────────────
  const DAY_LABEL = s => s >= 1 ? 'good' : s >= -1 ? 'ok' : 'care';
  /** 그 날(한국 시계 날짜)의 일진과 점수. 자시 설정 1(기본)이면 밤 11시 30분부터 다음 날 일진 */
  function dayView(chart, date, opts = {}) {
    // 자시: 한국 시계 23:30부터 다음 날 일진 (한국 관례, 127.5° 기준 子시 23:30–01:30). 야자시(sect 2)는 자정에 바뀜
    const t = new Date(date.getTime() + 9 * 3600e3), roll = (opts.sect || 1) === 1 && t.getUTCHours() * 60 + t.getUTCMinutes() >= 23 * 60 + 30;
    const k = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + (roll ? 1 : 0)));
    const y = k.getUTCFullYear(), m = k.getUTCMonth() + 1, d = k.getUTCDate();
    const gz = Solar.fromYmd(y, m, d).getLunar().getDayInGanZhi(), D = component(chart, gz, 'day');
    return { ymd: y + '-' + pad(m) + '-' + pad(d), gz, D, label: DAY_LABEL(D.total), hours: hourBlocks(chart, gz) };
  }
  /** 잘 맞는 2시간 블록: 원국 지지와 합(무게 적용) + 오늘 일지와의 관계(×0.5) + 필요한 오행, 오늘 일지와 충인 시는 뺌. 시각은 한국 관례(子시 23:30–01:30) */
  function hourBlocks(chart, dayGz, n = 2) {
    const A = chart.analysis, brs = chart.pillars.map(p => p && p[1]), out = [];
    for (let i = 0; i < 12; i++) {
      const hb = BRANCHES[i];
      if (Math.abs(i - bi(dayGz[1])) === 6) continue;
      let sc = 0, why = null;
      brs.forEach((nb, j) => {
        if (!nb) return;
        const rs = branchRelations(hb, nb, brs.filter((x, q) => x && q !== j)).filter(r => r.type !== '같은 글자');
        if (!rs.length) return;
        sc += pairScore(rs) * ANCHOR_W[j];
        const g = rs.filter(isGood).sort((a, b) => b.s - a.s)[0];
        if (g && pairScore(rs) > 0 && !why) why = g;
      });
      const dr = branchRelations(hb, dayGz[1]).filter(r => r.type !== '같은 글자');
      if (dr.length) sc += pairScore(dr) * 0.5;                     // 오늘 일지와의 관계도 반영 → 날마다 조금씩 달라짐
      const e = BR_EL[i];
      if (A.needed.includes(e)) sc += 1;
      if (A.avoid.includes(e)) sc -= 1;
      const st = (i * 120 - 30 + 1440) % 1440, en = (st + 120) % 1440;
      if (sc > 0) out.push({ branch: hb, score: round(sc), from: fromMin(st), to: fromMin(en), rel: why, need: A.needed.includes(e) ? e : null });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, n);
  }

  // ── 가져오기 링크 ─────────────────────────────────────────
  const b64e = s => (typeof Buffer !== 'undefined' ? Buffer.from(s, 'utf8').toString('base64') : btoa(String.fromCharCode(...new TextEncoder().encode(s)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); return typeof Buffer !== 'undefined' ? Buffer.from(s, 'base64').toString('utf8') : new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); };
  const encodeImport = data => b64e(JSON.stringify(data));
  const str = (v, n = 40) => typeof v === 'string' ? v.slice(0, n) : '';
  /** 믿을 수 없는 입력 → 아는 필드만 남김. 형식이 틀리면 throw */
  function decodeImport(hash) {
    const m = /(?:^|#|&)import=([A-Za-z0-9_-]+)/.exec(hash || '');
    if (!m) return null;
    const raw = JSON.parse(b64d(m[1]));
    if (!raw || !Array.isArray(raw.profiles) || !raw.profiles.length) throw new Error('profiles 없음');
    return { profiles: raw.profiles.slice(0, 10).map(cleanProfile), settings: cleanSettings(raw.settings || {}) };
  }
  function cleanProfile(p, i) {
    const date = str(p.date, 10), t = p.time || {}, [y, mo, d] = date.split('-').map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > (p.cal === 'lunar' ? 30 : 31)) throw new Error('날짜 형식');
    if (p.cal !== 'lunar' && new Date(Date.UTC(y, mo - 1, d)).getUTCDate() !== d) throw new Error('없는 날짜');
    const hm = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null;
    const time = t.mode === 'exact' && hm(t.at) ? { mode: 'exact', at: t.at } : t.mode === 'range' && hm(t.from) && hm(t.to) ? { mode: 'range', from: t.from, to: t.to } : { mode: 'unknown' };
    const lng = Number(p.lng);
    return {
      id: str(p.id, 24).replace(/[^\w-]/g, '') || 'p' + i, role: p.role === 'partner' ? 'partner' : p.role === 'me' ? 'me' : 'other',
      name: str(p.name, 20) || '이름 없음', gender: p.gender === 'F' ? 'F' : 'M',
      cal: p.cal === 'lunar' ? 'lunar' : 'solar', leap: !!p.leap, date, time, city: str(p.city, 20), lng: lng >= 120 && lng <= 135 ? lng : 127.5
    };
  }
  function cleanSettings(s) {
    const o = {};
    if (/^\d{4}-\d{2}-\d{2}$/.test(s.wedding || '')) o.wedding = s.wedding;
    for (const f of ['areas', 'focus']) if (s[f] && typeof s[f] === 'object') { o[f] = {}; for (const k of ['move', 'career', 'money', 'family']) if (str(s[f][k])) o[f][k] = str(s[f][k]); }
    if (s.yearBoundary === 'seol' || s.yearBoundary === 'ipchun') o.yearBoundary = s.yearBoundary;
    return o;
  }

  const CITIES = [['서울', 126.98], ['인천', 126.71], ['수원', 127.03], ['춘천', 127.73], ['강릉', 128.90], ['청주', 127.49], ['대전', 127.38], ['전주', 127.15], ['광주', 126.85], ['목포', 126.39], ['여수', 127.66], ['대구', 128.60], ['안동', 128.73], ['영양', 129.11], ['포항', 129.37], ['울산', 129.31], ['부산', 129.08], ['창원', 128.68], ['제주', 126.53]];

  return {
    STEMS, BRANCHES, STEM_KO, BRANCH_KO, EL, EL_HANJA, BR_EL, ANIMAL, PALACE, PALACE_AREA, CLASSES, CITIES, W,
    ko, gzEls, stemEl, si, bi, yearGz, tenGod, godOfStem, godOfBranch, stage12, branchRelations, pairScore, samjaeBranches,
    correction, computeChart, analyze, component, classify, baseClass, score, nextSeunStart, dayView, hourBlocks, DAY_LABEL, daeunAt, daeunOnDate, yearView, now, months, match, checkDate,
    encodeImport, decodeImport
  };
});
