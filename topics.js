/* topics.js — 주제별 카드(돈·연애·일·컨디션) + 모순 검사. 순수 계산, DOM 없음.
   새 점술 없음: saju.js 의 세운 점수(올해 운)에 그해 들어오는 십성·지지 관계를 한 칸까지만 더해요.
   Browser: window.Topics (saju.js 다음에 로드). Node: require('./topics.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./saju.js'));
  else root.Topics = factory(root.Saju);
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  // ── 한 점수 → 한 낱말. 화면의 10년 흐름·올해·다음 해 낱말은 모두 이 함수 하나에서 나와요 (app.js TEN_W·YEAR_W·NEXT_W) ──
  const tone = x => x >= 1 ? 'g' : x >= 0 ? 'n' : 'b';
  const LV = { b: 0, n: 1, g: 2 }, TONES = ['b', 'n', 'g'];
  const WORD = { ten: { g: '좋음', n: '보통', b: '버거움' }, year: { g: '좋음', n: '무난', b: '엇갈림' }, topic: { g: '좋음', n: '보통', b: '조심' } };

  const KEYS = ['money', 'love', 'work', 'health'];
  const NAME = { money: '돈', love: '연애·관계', work: '일·진로', health: '컨디션' };
  // 쉬운 말만. 돈은 습관만(시점·종목 없음), 컨디션은 생활 습관만(진단 없음)
  const TEXT = {
    money: {
      g: ['돈이 붙기 좋은 해예요', ['수입·지출을 한 장에 정리하고 늘릴 곳 찾기', '작은 부수입을 시험해 보기'], ['한 번에 큰돈 옮기기·빚 늘리기']],
      n: ['돈은 꾸준히 가면 돼요', ['비상금부터 채우기', '고정비를 한 번 훑어보기'], ['남 따라 사고팔기']],
      b: ['돈은 지킬수록 이득이에요', ['지출 기록부터 하기', '돈 거래는 글로 남기기'], ['돈 빌려주기·공동 투자', '급한 마음에 하는 큰 결제']]
    },
    love: {
      g: ['마음이 잘 통하는 해예요', ['함께 정할 일을 올해 정하기', '고마운 점을 자주 말로 하기'], ['좋을 때 큰 약속을 서둘러 하기']],
      n: ['관계는 잔잔하게 흘러가요', ['둘만의 시간을 달력에 먼저 넣기', '상대 이야기를 끝까지 듣기'], ['바쁘다고 연락 줄이기']],
      b: ['말에 서운하기 쉬운 해예요', ['서운한 일은 다음 날 차분히 말하기', '작은 약속부터 꼭 지키기'], ['피곤할 때 중요한 대화하기', '주변 말로 상대를 판단하기']]
    },
    work: {
      g: ['일을 넓히기 좋은 해예요', ['새 목표나 자격을 하나 더 붙이기', '내 성과를 글로 정리해 보이기'], ['일을 한꺼번에 너무 많이 벌이기']],
      n: ['하던 일을 다지는 해예요', ['하던 일 하나를 끝까지 마무리하기', '배울 것 하나를 꾸준히 이어 가기'], ['남의 속도와 나를 비교하기']],
      b: ['일은 무리 말고 버텨요', ['마감·규칙부터 먼저 챙기기', '실력을 쌓는 시간으로 쓰기'], ['홧김에 그만두는 결정', '규칙을 건너뛰는 지름길']]
    },
    health: {
      g: ['몸이 가벼운 해예요', ['걷기·운동을 새 습관으로 붙이기', '잠드는 시간을 일정하게 지키기'], ['컨디션만 믿고 무리한 일정 잡기']],
      n: ['생활 리듬만 지키면 돼요', ['하루 20분 걷기', '잠드는 시간을 일정하게 지키기'], ['늦은 밤 휴대폰 오래 보기']],
      b: ['쉬는 시간이 먼저인 해예요', ['쉬는 날을 달력에 먼저 비워 두기', '가볍게 걷는 시간 만들기'], ['피곤한 날 큰 결정하기', '불편한 몸을 참고 넘기기']]
    }
  };
  const SAFE = {
    money: '사고팔 시점이나 종목은 다루지 않아요. 돈 습관만 봐요.',
    health: '사주는 몸 상태를 진단하지 않아요. 몸이 계속 불편하면 병원·전문가와 상의해요.'
  };

  /** 그해 들어오는 글자에서 주제별 신호(+1/−1)를 찾음 — 모두 saju.js 가 이미 계산한 값 */
  function signals(x, k, gender) {
    const out = [], add = (s, t) => out.push({ s, t }), has = f => x.gods.some(f);
    const at = (p, good) => x.rels.some(r => r.palace === p && (good ? r.s > 0 : r.type === '충' || r.type === '형'));
    if (k === 'money') {
      if (has(g => g.group === '재성')) add(1, '돈을 다루는 기운(재성)이 들어와요');
      if (has(g => g.group === '비겁')) add(-1, '돈이 나뉘기 쉬운 기운(비견·겁재)이 들어와요');
    } else if (k === 'love') {
      const m = gender === 'F' ? '관성' : '재성';
      if (has(g => g.group === m)) add(1, `인연이 붙는 기운(${m})이 들어와요`);
      if (at('일', true)) add(1, '배우자 자리와 손잡는 글자(합)가 들어와요');
      if (at('일', false)) add(-1, '배우자 자리와 부딪히는 글자(충·형)가 들어와요');
    } else if (k === 'work') {
      if (has(g => g.name === '정관' || g.group === '인성')) add(1, '자리·배움 기운(정관·인성)이 들어와요');
      if (has(g => g.name === '편관')) add(-1, '책임·압박 기운(편관)이 커져요');
      if (at('월', false)) add(-1, '일터 자리와 부딪히는 글자(충·형)가 들어와요');
    } else {
      if (x.notes.some(n => n.k === 'need')) add(1, '나에게 모자란 기운이 채워져요');
      if (x.notes.some(n => n.k === 'avoid')) add(-1, '이미 많은 기운이 더 들어와 한쪽으로 치우치기 쉬워요');
      if (at('일', false)) add(-1, '나 자리와 부딪히는 글자(충·형)가 있어 피로가 쌓이기 쉬워요');
    }
    return out;
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /** 한 해의 주제 하나. 기준 = 그해 세운 점수(화면의 '올해' 낱말). 주제 신호는 한 칸까지만 → 그해 전체와 정반대가 될 수 없음 */
  function topicYear(c, Y, k, gender) {
    const x = S.yearView(c, Y).Y, base = tone(x.total), sig = signals(x, k, gender);
    const raw = sig.reduce((a, s) => a + s.s, 0), step = clamp(raw, -1, 1);
    const t = TONES[clamp(LV[base] + step, 0, 2)];
    return { k, Y, base, sig, raw, step, held: raw !== step, tone: t };
  }
  function topics(c, Y, gender) {
    return KEYS.map(k => {
      const a = topicYear(c, Y, k, gender), b = topicYear(c, Y + 1, k, gender), [head, dos, cares] = TEXT[k][a.tone];
      return { ...a, name: NAME[k], head, dos, cares, safe: SAFE[k] || '', next: b.tone, nextBase: b.base, trend: Math.sign(LV[b.tone] - LV[a.tone]) };
    });
  }

  // ── 모순 검사: 화면 곳곳의 판단을 같은 기간끼리 모아 서로 맞는지 봄 ──
  // 키: D간지(10년) · Y연도(그해 운) · Y연도:주제 · C연도(그해 분류) · M세운간지월운간지(그달 분류)
  const POS = /좋|잘 맞|붙기|가벼운|통하는|넓히기/, NEG = /조심|까다|엇갈|버거|지킬수록|버티|버텨|서운/;
  function claims(c, date, o = {}, gender) {
    const out = [], add = (key, src, val, text) => out.push({ key, src, val, text });
    const v = S.now(c, date, o), Y0 = v.year;
    add(`M${v.Y.gz}${v.M.gz}`, '나침반 이번 달', v.cls);
    for (const m of S.months(c, date, 12, o)) add(`M${m.Y.gz}${m.gz}`, '앞으로 12개월', m.cls);
    if (v.D) add('D' + v.D.gz, '나침반 10년 흐름', tone(v.D.total), WORD.ten[tone(v.D.total)]);
    for (const d of c.daeun.list.slice(0, 8)) { const t = tone(S.component(c, d.gz, 'daeun').total); add('D' + d.gz, '흐름 10년 목록', t, WORD.ten[t]); }
    add('Y' + Y0, '나침반 올해', tone(v.Y.total), WORD.year[tone(v.Y.total)]);
    add('Y' + (Y0 + 1), '나침반 다음 해', tone(v.nextY.total), WORD.year[tone(v.nextY.total)]);
    add('C' + Y0, '올해 흐름 카드', S.yearView(c, Y0).cls);
    for (let Y = 2024; Y <= 2040; Y++) {
      const y = S.yearView(c, Y);
      add('Y' + Y, '흐름 해마다', tone(y.Y.total), WORD.year[tone(y.Y.total)]);
      add('Y' + (Y + 1), '해 시트 다음 해', tone(y.nextY.total));
      add('C' + Y, '흐름 해 분류', y.cls);
      if (y.D) add('D' + y.D.gz, '해 시트 10년 흐름', tone(y.D.total));
    }
    for (const t of topics(c, Y0, gender)) {
      add('Y' + Y0, `주제 ${t.name} 기준`, t.base);
      add(`Y${Y0}:${t.k}`, `주제 ${t.name}`, t.tone, t.head);
      add(`Y${Y0 + 1}`, `주제 ${t.name} 내년 기준`, t.nextBase);
      add(`Y${Y0 + 1}:${t.k}`, `주제 ${t.name} 내년`, t.next);
    }
    for (const t of topics(c, Y0 + 1, gender)) add(`Y${Y0 + 1}:${t.k}`, `주제 ${t.name}(내년 계산)`, t.tone, t.head);
    return out;
  }
  /** 모순 목록. 같은 키 = 같은 판단이어야 함 · 주제는 그해 전체와 정반대(좋음↔엇갈림) 금지 · 글의 말투가 판단과 반대면 안 됨 */
  function check(cl) {
    const by = new Map(), bad = [];
    for (const x of cl) { if (!by.has(x.key)) by.set(x.key, []); by.get(x.key).push(x); }
    for (const [key, xs] of by) {
      if (new Set(xs.map(x => x.val)).size > 1) bad.push({ key, why: '같은 기간에 다른 판단', xs });
      const base = key.includes(':') && by.get(key.split(':')[0]);
      if (base && xs.some(x => base.some(b => Math.abs(LV[x.val] - LV[b.val]) > 1))) bad.push({ key, why: '그해 전체와 정반대', xs });
      for (const x of xs) {
        const p = POS.test(x.text || ''), q = NEG.test(x.text || '');
        if (x.val === 'g' ? q : x.val === 'b' ? p : x.val === 'n' && (p || q)) bad.push({ key, why: '글과 판단이 반대', xs: [x] });
      }
    }
    return bad;
  }
  function verify(c, date, o, gender) { const cl = claims(c, date, o, gender); return { n: cl.length, keys: new Set(cl.map(x => x.key)).size, bad: check(cl) }; }

  return { tone, LV, WORD, KEYS, NAME, TEXT, topics, topicYear, claims, check, verify };
});
