/* tarot.js — 78-card Rider–Waite–Smith deck: our own Korean meanings, 오행 mapping, data-driven spreads, pluggable reading rules.
   Browser → window.Tarot, Node → module.exports. No DOM, no storage. Images: tarot/{id}.webp (Pamela Colman Smith, 1909, public domain). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Tarot = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const EL = ['목', '화', '토', '금', '수'], EL_HANJA = ['木', '火', '土', '金', '水'];
  // 수트 → 오행: 완드=불(화), 컵=물(수), 소드=공기·칼날(금: 쇠로 벼린 칼, 가르고 결단하는 기운), 펜타클=흙(토)
  const SUITS = {
    w: { name: '완드', en: 'Wands', el: 1, nature: '불', theme: '열정과 행동(불)이 중심이에요' },
    c: { name: '컵', en: 'Cups', el: 4, nature: '물', theme: '마음과 관계(물)가 중심이에요' },
    s: { name: '소드', en: 'Swords', el: 3, nature: '쇠·공기', theme: '생각과 결단(쇠)이 중심이에요' },
    p: { name: '펜타클', en: 'Pentacles', el: 2, nature: '흙', theme: '돈·일·몸(흙)의 현실이 중심이에요' }
  };
  const RANK = ['', '에이스', '2', '3', '4', '5', '6', '7', '8', '9', '10', '시종', '기사', '여왕', '왕'];
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  // 메이저 → 전통 대응(골든 던) → 오행. 원소: 공기→금, 물→수, 불→화, 흙→토. 별자리는 그 원소로, 행성은 동양 이름 그대로(수성→수, 금성→금, 화성·태양→화, 목성→목, 토성→토, 달→수).
  const MAJOR = [
    ['바보', 'The Fool', '공기', 3, '시작·자유·순수', '두려움보다 호기심으로 첫발을 내딛는 때예요. 계획이 다 서지 않아도 가볍게 출발해 봐요.', '무모함·망설임', '설렘이 앞서 준비가 빠질 수 있어요. 출발 전에 꼭 필요한 것만 챙겨요.'],
    ['마법사', 'The Magician', '수성', 4, '실행·재능·집중', '가진 도구로 충분히 해낼 수 있어요. 생각을 바로 손으로 옮겨 보세요.', '흩어짐·말뿐', '재주가 여러 곳에 흩어져 있어요. 한 가지에만 힘을 모아 봐요.'],
    ['여사제', 'The High Priestess', '달', 4, '직관·고요·배움', '서두르지 말고 안을 들여다볼 때예요. 조용히 공부하고 관찰하면 답이 보여요.', '닫힘·의심', '마음의 소리를 지나치고 있어요. 혼자 끙끙대기보다 믿을 만한 사람과 나눠 봐요.'],
    ['여황제', 'The Empress', '금성', 3, '풍요·돌봄·성장', '정성을 들인 것이 자라나는 때예요. 나와 가까운 사람을 넉넉히 돌봐요.', '지나친 돌봄·정체', '남을 챙기느라 나를 놓치고 있어요. 나를 위한 시간도 꼭 넣어요.'],
    ['황제', 'The Emperor', '양자리(불)', 1, '질서·책임·기반', '규칙과 구조를 세우면 일이 단단해져요. 맡은 자리에서 중심을 잡아 봐요.', '고집·통제', '모든 걸 쥐려 하면 지쳐요. 맡길 수 있는 건 맡겨 봐요.'],
    ['교황', 'The Hierophant', '황소자리(흙)', 2, '배움·전통·조언', '검증된 방법과 선배의 조언이 힘이 돼요. 정식 과정·자격을 밟기에 좋아요.', '틀 깨기·의문', '정해진 방식이 맞지 않을 수 있어요. 나에게 맞는 길을 찾아도 괜찮아요.'],
    ['연인', 'The Lovers', '쌍둥이자리(공기)', 3, '선택·관계·조화', '마음이 가는 쪽과 내 가치가 맞는지 살펴 고르는 때예요. 관계에서는 서로 맞춰 가는 기쁨이 커요.', '엇갈림·망설임', '선택을 미루거나 마음이 엇갈려요. 무엇이 중요한지 먼저 정리해요.'],
    ['전차', 'The Chariot', '게자리(물)', 4, '추진·의지·이동', '방향을 정하고 밀고 나가면 앞으로 나아가요. 이동·출발과도 인연이 있어요.', '방향 잃음·과속', '힘은 있는데 방향이 흔들려요. 속도를 줄이고 목표를 다시 봐요.'],
    ['힘', 'Strength', '사자자리(불)', 1, '부드러운 힘·인내', '억누르기보다 다독이는 힘이 이겨요. 꾸준함과 따뜻함으로 버텨요.', '자신감 저하·조급함', '마음이 지쳐 있어요. 스스로를 탓하기보다 쉬어 가며 힘을 모아요.'],
    ['은둔자', 'The Hermit', '처녀자리(흙)', 2, '성찰·혼자만의 시간', '한 걸음 물러나 생각을 정리할 때예요. 혼자 깊이 파고드는 공부와 잘 맞아요.', '고립·외로움', '너무 혼자 있으면 생각이 맴돌아요. 가까운 사람과 이야기를 나눠 봐요.'],
    ['운명의 수레바퀴', 'Wheel of Fortune', '목성', 0, '전환점·흐름·기회', '흐름이 바뀌는 시점이에요. 찾아온 기회를 가볍게 잡아 봐요.', '엇박자·기다림', '타이밍이 조금 어긋나요. 억지로 돌리기보다 흐름을 기다려요.'],
    ['정의', 'Justice', '천칭자리(공기)', 3, '균형·공정·결정', '사실과 기준으로 판단하면 맞는 답이 나와요. 서류와 약속을 분명히 해요.', '불균형·미룬 결정', '한쪽으로 기운 판단이 있을 수 있어요. 다른 쪽 이야기도 들어 봐요.'],
    ['매달린 사람', 'The Hanged Man', '물', 4, '멈춤·다른 시선', '잠시 멈추면 새로운 관점이 보여요. 지금의 기다림에도 의미가 있어요.', '헛된 기다림·답답함', '기다리기만 해서는 바뀌지 않아요. 작은 것부터 움직여 봐요.'],
    ['죽음', 'Death', '전갈자리(물)', 4, '정리·끝과 시작', '하나를 매듭짓고 새로 시작하는 변화의 카드예요. 낡은 것을 정리하면 새 자리가 생겨요.', '변화 미루기', '끝내야 할 것을 붙잡고 있어요. 조금씩 정리하면 마음이 가벼워져요.'],
    ['절제', 'Temperance', '궁수자리(불)', 1, '조화·균형·조절', '서로 다른 것을 알맞게 섞는 때예요. 속도와 양을 조절하면 잘 풀려요.', '지나침·불균형', '한쪽으로 치우쳐 있어요. 일과 쉼의 비율부터 맞춰 봐요.'],
    ['악마', 'The Devil', '염소자리(흙)', 2, '집착·유혹·습관', '끊기 어려운 습관이나 유혹을 비춰 주는 카드예요. 무엇에 묶여 있는지 알아차리는 것만으로도 시작이에요.', '벗어남·알아차림', '묶여 있던 것에서 풀려나는 중이에요. 그 흐름을 이어 가요.'],
    ['탑', 'The Tower', '화성', 1, '갑작스런 변화·깨달음', '예상 밖의 일이 낡은 틀을 흔들어요. 흔들림 뒤에 더 단단한 기초를 놓을 기회가 와요.', '변화의 예고·작은 흔들림', '큰 변화를 미리 알아차릴 수 있어요. 미리 정리하면 흔들림이 작아져요.'],
    ['별', 'The Star', '물병자리(공기)', 3, '희망·회복·영감', '지친 마음이 다시 채워지는 때예요. 먼 목표를 그려 봐도 좋아요.', '실망·자신감 저하', '기대가 꺾여 있어요. 작은 성공 하나로 다시 불을 켜 봐요.'],
    ['달', 'The Moon', '물고기자리(물)', 4, '불확실·상상·직감', '아직 다 보이지 않는 상황이에요. 확인되지 않은 것은 확인한 뒤 움직여요.', '안개 걷힘·오해 풀림', '헷갈리던 것이 조금씩 분명해져요. 사실을 하나씩 확인해요.'],
    ['태양', 'The Sun', '태양', 1, '밝음·성공·자신감', '밝고 분명한 기운이에요. 드러내고 나서면 좋은 반응이 와요.', '잠깐 흐림·과신', '좋은 기운이 잠시 가려졌어요. 자신감은 지키되 너무 앞서가지는 않기.'],
    ['심판', 'Judgement', '불', 1, '부름·재도약·결산', '지난 일을 돌아보고 다시 일어서는 때예요. 미뤄 둔 결정에 답할 시간이에요.', '자기 의심·미루기', '스스로를 너무 엄하게 보고 있어요. 지난 일을 받아들이고 한 걸음 나아가요.'],
    ['세계', 'The World', '토성', 2, '완성·성취·확장', '한 단계를 마무리하고 더 넓은 곳으로 나아가요. 먼 곳·해외와도 인연이 있어요.', '마무리 부족·지연', '거의 다 왔는데 마지막 한 끗이 남았어요. 끝맺음을 챙겨요.']
  ];
  const MINOR = {
    w: [
      ['새 열정·시작', '하고 싶은 일이 불붙는 때예요. 아이디어를 바로 시작해 봐요.', '시작 지연·의욕 저하', '불씨는 있는데 잘 붙지 않아요. 작은 첫 단계를 정해 봐요.'],
      ['계획·멀리 보기', '더 넓은 곳을 바라보며 계획을 세우는 때예요.', '망설임·좁은 시야', '익숙한 곳에 머물고 싶어져요. 선택지를 하나만 더 알아봐요.'],
      ['확장·결실의 시작', '보낸 노력이 돌아오기 시작해요. 멀리 있는 기회와도 인연이 있어요.', '지연·준비 부족', '기대한 것이 늦어져요. 준비를 다시 점검해요.'],
      ['축하·안정·귀환', '작은 축하와 안정의 기운이에요. 가족·집과 관련된 기쁨이 있어요.', '어수선함·미뤄진 축하', '마무리가 덜 되어 편히 쉬지 못해요. 하나씩 정리해요.'],
      ['경쟁·부딪힘', '의견이 부딪히지만 그만큼 실력이 늘어요. 승부보다 연습으로 봐요.', '소모전·갈등 피하기', '쓸데없는 다툼에 힘을 빼고 있어요. 꼭 필요한 일만 골라요.'],
      ['인정·승리', '노력이 인정받는 때예요. 성과를 조금 드러내도 좋아요.', '인정 지연·자만', '박수가 늦게 와요. 남의 평가보다 내 기준을 봐요.'],
      ['버티기·내 자리 지키기', '내 자리를 지킬 힘이 있어요. 원칙을 지키며 버텨요.', '지침·물러섬', '혼자 다 막으려니 지쳐요. 도움을 청해도 괜찮아요.'],
      ['빠른 진행·소식', '일이 빠르게 움직이고 소식이 와요. 연락에 바로 답해요.', '지연·엇갈린 연락', '일이 생각보다 느려요. 서두르기보다 순서를 지켜요.'],
      ['끈기·마지막 고비', '여기까지 버틴 힘이 있어요. 마지막 한 고비만 넘으면 돼요.', '긴장 피로·의심', '너무 오래 긴장했어요. 쉬어 가며 힘을 아껴요.'],
      ['짐·과부하', '혼자 너무 많이 지고 있어요. 내려놓을 것을 골라요.', '짐 내려놓기', '무거운 것을 나누기 시작했어요. 계속 덜어 내요.'],
      ['호기심·새 소식', '배우고 싶은 것이 생겨요. 가볍게 시도해 봐요.', '산만함·조급함', '관심이 여기저기 튀어요. 하나만 골라 끝까지 해 봐요.'],
      ['열정·모험·이동', '과감하게 움직이는 기운이에요. 이동·출발과 잘 맞아요.', '성급함·충동', '열정이 앞서 실수가 생기기 쉬워요. 한 번 더 확인하고 출발해요.'],
      ['자신감·따뜻한 리더십', '밝고 당당하게 주변을 이끌어요. 내 매력을 믿어요.', '비교·지침', '남과 비교하며 힘이 빠져요. 내 속도를 지켜요.'],
      ['비전·결단·리더십', '큰 그림을 그리고 이끌 때예요. 결정을 내려 봐요.', '독단·성급한 결정', '혼자 정하면 반발이 생겨요. 의견을 듣고 정해요.']
    ],
    c: [
      ['새 감정·마음 열림', '마음이 열리고 정이 생기는 때예요. 고마운 마음을 표현해요.', '감정 막힘', '마음을 닫고 있어요. 작은 표현부터 해 봐요.'],
      ['연결·동반자', '서로 마음이 통하는 관계가 생겨요. 함께하는 약속에 좋아요.', '엇갈린 마음', '서로 기대가 달라요. 솔직하게 맞춰 봐요.'],
      ['축하·우정', '함께 웃고 축하할 일이 있어요. 사람들과 기쁨을 나눠요.', '모임 피로·소외감', '모임에 지치거나 소외감이 들어요. 편한 사람과만 만나요.'],
      ['권태·무관심', '좋은 제안이 와도 눈에 잘 안 들어와요. 놓친 기회가 없는지 둘러봐요.', '다시 관심', '흥미가 돌아오고 있어요. 새로 들어온 제안을 살펴봐요.'],
      ['아쉬움·상실감', '잃은 것에 마음이 머물러 있어요. 남아 있는 것도 함께 봐요.', '회복·받아들임', '아쉬움을 정리하고 다시 일어서는 중이에요.'],
      ['추억·순수한 마음', '옛사람·옛 기억에서 위로를 받아요. 오래된 인연이 다시 닿을 수 있어요.', '과거에 머묾', '지난 일에 너무 기대고 있어요. 지금의 나를 봐요.'],
      ['선택지·상상', '고를 것이 많아 헷갈려요. 현실적인 것부터 추려요.', '선택 정리', '무엇이 진짜인지 보이기 시작해요. 하나를 골라 집중해요.'],
      ['떠남·더 깊은 것 찾기', '익숙한 것을 두고 더 의미 있는 것을 찾아 떠나요. 이동과도 인연이 있어요.', '머뭇거림', '떠날지 남을지 망설여요. 이유를 적어 보면 답이 보여요.'],
      ['만족·소원', '바라던 것이 이뤄지는 기분 좋은 카드예요. 지금을 즐겨요.', '채워지지 않는 기대', '만족이 잘 안 돼요. 이미 가진 것을 세어 봐요.'],
      ['가정의 행복·화목', '가족과 함께하는 행복이 커요. 관계에 정성을 들여요.', '가족 간 엇박자', '가까운 사이일수록 말을 아끼다 서운해져요. 먼저 표현해요.'],
      ['다정한 소식·감성', '설레는 소식이나 새로운 감정이 와요. 마음을 가볍게 열어요.', '감정 기복', '기분이 쉽게 출렁여요. 하루쯤 지나 판단해요.'],
      ['고백·제안', '마음이 담긴 제안이 오거나 내가 전해요. 부드럽게 다가가요.', '분위기에 휩쓸림', '분위기에 휩쓸리기 쉬워요. 약속은 지킬 수 있을 만큼만.'],
      ['공감·보살핌', '상대의 마음을 잘 읽어 줘요. 따뜻한 말이 힘이 돼요.', '감정 소모', '남의 감정까지 떠안아 지쳤어요. 내 경계를 지켜요.'],
      ['감정의 균형·너그러움', '흔들려도 중심을 잡는 어른스러움이 있어요. 차분하게 이끌어요.', '속마음 숨기기', '속마음을 너무 눌러 두었어요. 믿는 사람에게 털어놔요.']
    ],
    s: [
      ['명확함·결단', '생각이 또렷해지고 결론이 나요. 할 말을 분명하게 해요.', '혼란·날 선 말', '생각이 엉키거나 말이 날카로워요. 잠시 정리한 뒤 말해요.'],
      ['고민·보류', '두 선택 사이에서 멈춰 있어요. 정보를 더 모아요.', '결정의 때', '더 미루기 어려워요. 기준을 정하고 하나를 골라요.'],
      ['마음 아픔·실망', '마음이 아픈 일을 비추는 카드예요. 아픔을 인정하면 회복이 시작돼요.', '회복 중', '상처가 아물고 있어요. 천천히 다시 마음을 열어요.'],
      ['휴식·재충전', '멈춰서 쉬어야 다시 갈 수 있어요. 오늘은 충전을 먼저 해요.', '쉬지 못함', '몸은 쉬어도 머리는 바빠요. 일정에서 하나를 빼요.'],
      ['이겨도 남는 씁쓸함', '이기는 것보다 관계가 중요할 때가 있어요. 말다툼은 피해요.', '화해·정리', '다툼을 마무리할 기회예요. 먼저 손 내밀어 봐요.'],
      ['이동·나아짐', '어려운 곳을 지나 더 나은 곳으로 옮겨 가요. 이동·이사와 인연이 있어요.', '이동 지연', '옮기려는 일이 늦어져요. 필요한 준비를 마저 해요.'],
      ['전략·영리한 방법', '정면보다 영리한 방법이 필요해요. 다만 정직함은 지켜요.', '드러남·정직하게', '감추던 것이 드러나요. 솔직하게 정리하는 게 나아요.'],
      ['갇힌 느낌·생각의 틀', '길이 막힌 것 같지만 생각보다 출구가 있어요. 생각의 틀부터 풀어요.', '벗어남', '스스로 묶던 생각에서 풀려나요. 작은 행동으로 이어 가요.'],
      ['걱정·잠 못 듦', '걱정이 실제보다 크게 느껴져요. 종이에 적어 보면 줄어들어요.', '걱정 덜기', '가장 무거운 걱정이 풀려 가요. 도움을 청해도 좋아요.'],
      ['끝까지 옴·바닥', '힘든 일이 끝까지 왔다는 뜻이에요. 이제부터는 올라갈 일만 남았어요.', '회복 시작', '가장 힘든 고비를 넘었어요. 천천히 다시 일어나요.'],
      ['관찰·호기심', '알아보는 힘이 좋아요. 정보를 꼼꼼히 모아요.', '성급한 말', '말이 앞서기 쉬워요. 확인되지 않은 말은 옮기지 않아요.'],
      ['빠른 행동·직진', '생각을 바로 행동으로 옮겨요. 다만 주변 속도도 살펴요.', '무리한 돌진', '너무 급하게 밀어붙여요. 한 박자 쉬어요.'],
      ['분명함·독립', '감정에 휘둘리지 않고 핵심을 봐요. 경계를 분명히 해요.', '차가운 말투', '말이 차갑게 들릴 수 있어요. 부드러운 한마디를 더해요.'],
      ['판단력·원칙', '논리와 원칙으로 결정하는 때예요. 전문가의 의견도 좋아요.', '고집·냉정함', '옳은 말도 상처가 될 수 있어요. 상대 입장을 함께 봐요.']
    ],
    p: [
      ['새 기회·씨앗', '돈·일·몸의 새 씨앗이 생겨요. 작게 시작해 꾸준히 키워요.', '기회 그냥 두기', '좋은 씨앗을 그냥 두고 있어요. 지금 할 수 있는 한 가지를 해요.'],
      ['균형 잡기·여러 일', '여러 일을 동시에 굴리는 때예요. 우선순위를 정하면 수월해요.', '과부하', '한꺼번에 너무 많이 잡았어요. 하나를 내려놓아요.'],
      ['협업·기술', '함께 일하며 실력이 인정받아요. 배운 기술을 실전에 써 봐요.', '손발 안 맞음', '역할이 엉켜 있어요. 누가 무엇을 할지 다시 정해요.'],
      ['지키기·저축', '가진 것을 지키는 힘이 좋아요. 아끼되 너무 움켜쥐지는 않기.', '지나친 움켜쥠·새는 돈', '너무 꽉 쥐거나 반대로 새어 나가요. 돈 흐름을 기록해요.'],
      ['어려움·도움 요청', '힘든 시기를 지나고 있어요. 혼자 버티지 말고 도움을 청해요.', '회복·도움 받음', '어려움이 풀려 가요. 받은 도움을 기억해요.'],
      ['나눔·주고받기', '주고받는 균형이 맞는 때예요. 도움을 주거나 받기 좋아요.', '한쪽으로 기운 주고받기', '주기만 하거나 받기만 해요. 균형을 맞춰요.'],
      ['기다림·중간 점검', '심은 것이 자라는 중이에요. 중간 점검하며 기다려요.', '조급함', '결과가 안 보여 답답해요. 방향이 맞는지만 확인해요.'],
      ['숙련·성실', '한 가지 기술을 꾸준히 갈고닦는 때예요. 반복 연습이 실력이 돼요.', '느슨함·지루함', '반복이 지루해 손이 느슨해져요. 작은 목표를 다시 세워요.'],
      ['자립·여유', '스스로 일군 것을 누리는 때예요. 나를 위한 작은 선물도 좋아요.', '불안한 자립', '혼자 해낸다는 압박이 커요. 기댈 곳을 하나 만들어요.'],
      ['가족·오래가는 안정', '오래가는 안정과 가족의 기반이 커져요. 길게 보는 계획에 좋아요.', '집안 돈·약속 엉킴', '집안의 돈·약속이 엉킬 수 있어요. 글로 분명히 해요.'],
      ['배움·성실한 시작', '새로 배우는 일에 성실하게 임해요. 기초부터 차근차근.', '미루기', '배우려던 것을 미루고 있어요. 오늘 10분만 해 봐요.'],
      ['꾸준함·책임', '느려도 확실하게 해내는 기운이에요. 루틴을 지켜요.', '정체·지루함', '너무 조심해서 멈춰 있어요. 작은 변화를 줘 봐요.'],
      ['살림·실속·돌봄', '현실적인 돌봄과 살림 감각이 빛나요. 생활을 단정히 해요.', '일과 생활 불균형', '챙길 게 많아 지쳐요. 나를 돌보는 시간을 넣어요.'],
      ['풍요·안정된 성공', '노력이 안정된 결과로 쌓여요. 길게 보는 결정이 좋아요.', '욕심·무리한 확장', '더 갖고 싶은 마음이 앞서요. 지금의 기반을 지켜요.']
    ]
  };

  const CARDS = MAJOR.map((m, i) => ({ id: 'm' + String(i).padStart(2, '0'), major: true, num: i, numeral: ROMAN[i], name: m[0], en: m[1], attr: m[2], el: m[3], up: { k: m[4], t: m[5] }, rev: { k: m[6], t: m[7] } }));
  for (const [s, list] of Object.entries(MINOR)) list.forEach((m, i) => CARDS.push({
    id: s + String(i + 1).padStart(2, '0'), major: false, suit: s, num: i + 1, court: i >= 10, numeral: i === 0 ? 'A' : i < 10 ? String(i + 1) : RANK[i + 1][0],
    name: `${SUITS[s].name} ${RANK[i + 1]}`, en: `${['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'][i]} of ${SUITS[s].en}`,
    attr: SUITS[s].nature, el: SUITS[s].el, up: { k: m[0], t: m[1] }, rev: { k: m[2], t: m[3] }
  }));
  const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
  // 받침 따라 조사 (숫자는 읽는 소리: 일·삼·육·칠·팔·십은 받침)
  const jong = w => { const c = String(w).replace(/\([^)]*\)$/, '').slice(-1), k = c.charCodeAt(0); if (k >= 0xAC00 && k <= 0xD7A3) return (k - 0xAC00) % 28 > 0; return /[013678]$/.test(String(w)); };
  const j = (w, a, b) => w + (jong(w) ? a : b);

  // ── 그림 한 줄 (조언 카드 말투: 그림 → 키워드 → 예시 → 행동 → 선택) ──
  const PIC_MAJ = ['낭떠러지 앞에서 하늘을 보며 가볍게 걷는 여행자', '한 손은 하늘, 한 손은 땅을 가리키며 도구를 늘어놓은 사람', '두 기둥 사이에서 두루마리를 품고 조용히 앉은 여사제', '밀밭 가운데 편히 앉아 있는 여황제', '돌 왕좌에 단단히 앉은 황제', '두 사람에게 가르침을 전하는 교황', '천사 아래 마주 선 두 사람', '두 스핑크스를 이끌고 나아가는 전차', '사자를 부드럽게 쓰다듬는 여인', '등불을 들고 홀로 산길에 선 노인', '하늘에서 도는 커다란 바퀴', '저울과 칼을 든 정의의 여신', '나무에 거꾸로 매달려 평온한 얼굴을 한 사람', '흰 말을 탄 해골 기사와 떠오르는 해', '두 잔 사이로 물을 옮겨 붓는 천사', '사슬에 묶인 두 사람과 그 위의 악마', '번개에 맞아 무너지는 탑', '별빛 아래 물을 붓는 사람', '달 아래 길을 따라 걷는 개와 늑대', '해 아래 흰 말을 탄 아이', '나팔 소리에 일어나는 사람들', '월계관 고리 안에서 춤추는 사람'];
  const PIC_RANK = { w: ['구름 속 손이 내민 싹 튼 지팡이', '지구본을 들고 멀리 보는 사람', '언덕에서 떠나는 배를 지켜보는 사람', '꽃으로 엮은 문 아래의 축하', '지팡이를 휘두르며 겨루는 다섯 사람', '월계관을 쓰고 행진하는 기수', '언덕 위에서 지팡이로 막아서는 사람', '하늘을 가르며 날아가는 여덟 지팡이', '붕대를 감고 지팡이를 지키는 사람', '열 개의 지팡이를 끌어안고 걷는 사람', '지팡이를 바라보는 젊은 시종', '말을 달려 나가는 기사', '해바라기와 검은 고양이 곁의 여왕', '도마뱀 무늬 옷을 입은 왕'],
    c: ['구름 속 손이 든 넘치는 잔', '잔을 나누며 마주 선 두 사람', '잔을 들고 함께 춤추는 세 사람', '팔짱 낀 사람 앞에 내밀어진 잔', '쓰러진 세 잔을 내려다보는 사람', '꽃 담긴 잔을 건네는 아이', '구름 위에 떠 있는 일곱 잔', '쌓아 둔 잔을 두고 떠나는 사람', '아홉 잔 앞에서 흐뭇하게 앉은 사람', '무지개 아래 손잡은 가족', '잔 속 물고기를 바라보는 시종', '잔을 들고 천천히 다가오는 기사', '뚜껑 덮인 잔을 들여다보는 여왕', '바다 위 왕좌에 앉은 왕'],
    s: ['구름 속 손이 든 왕관 쓴 칼', '눈을 가리고 칼 두 자루를 교차한 사람', '칼 세 자루가 꽂힌 하트', '칼 아래 누워 쉬는 기사', '칼을 거둬 가는 사람과 돌아서는 두 사람', '배를 타고 건너편으로 가는 사람들', '칼을 몰래 들고 가는 사람', '칼에 둘러싸여 눈을 가린 사람', '침대에서 얼굴을 감싼 사람', '열 칼 아래 엎드린 사람과 밝아 오는 하늘', '칼을 들고 바람 속에 선 시종', '칼을 들고 질주하는 기사', '칼을 높이 든 여왕', '칼을 바로 세운 왕'],
    p: ['구름 속 손이 든 금화와 정원', '두 금화를 고리로 저글링하는 사람', '성당에서 함께 일하는 장인', '금화를 꽉 끌어안은 사람', '눈길 위를 지나는 두 사람과 불 켜진 창', '저울을 들고 금화를 나누는 사람', '자라는 금화 덩굴을 바라보는 농부', '금화를 하나씩 새기는 장인', '포도밭에서 매를 든 사람', '가족과 개가 함께한 큰 집', '금화를 두 손으로 받쳐 든 시종', '멈춰 선 말 위의 기사', '꽃과 토끼 곁에서 금화를 품은 여왕', '포도 장식 왕좌의 왕'] };
  CARDS.forEach(c => { c.pic = c.major ? PIC_MAJ[c.num] : PIC_RANK[c.suit][c.num - 1]; });

  // ── 카드 점수 (스펙 card_score) · 양극 카드 · 조심할 점 ──
  const POS = ['m03', 'm17', 'm19', 'm21', 'c10', 'c09', 'w06', 'w04', 'p10', 'c12'], NEG = ['s03', 'p05', 's09', 's10', 'c05', 's08'];
  const baseScore = id => (POS.includes(id) || /^[wcsp]01$/.test(id)) ? 1 : NEG.includes(id) ? -1 : 0;
  const POLAR = {
    m13: ['끝내고 새로 시작하는 정리예요. 낡은 것을 보내면 새 자리가 생겨요.', '일이나 관계 하나가 끝나는 흐름이에요. 붙잡기보다 정리할 것을 고르세요.'],
    m16: ['낡은 틀이 깨지며 새로 짓는 계기예요. 흔들림을 기회로 쓰세요.', '예상 밖의 흔들림이에요. 큰 결정은 미루고 기반부터 점검하세요.'],
    m15: ['강한 끌림과 몰입이에요. 열정을 한곳에 쏟되 선을 정해 두세요.', '집착이나 나쁜 습관에 묶여 있어요. 무엇에 묶였는지 적어 보세요.'],
    m18: ['직감과 상상력이 커지는 때예요. 떠오르는 생각을 기록해 두세요.', '불확실하고 오해가 생기기 쉬워요. 확인되지 않은 것은 확인한 뒤 움직이세요.'],
    m10: ['흐름이 좋은 쪽으로 도는 전환점이에요.', '흐름이 돌며 잠시 엇박자가 나요. 버티면 다시 돌아와요.'],
    m12: ['멈춤 속에서 다른 시선을 얻는 때예요.', '답답한 정체예요. 작은 것부터 움직여 보세요.']
  };
  const CAUTION = { s03: '혼자 상처를 키우는 것', p05: '도움을 청하지 않고 혼자 버티는 것', s09: '밤새 걱정을 키우는 것', s10: '끝났다고 단정하는 것', c05: '잃은 것만 바라보는 것', s08: '스스로 정한 틀에 갇히는 것', m13: '끝난 것을 억지로 붙잡는 것', m16: '흔들릴 때 큰 결정을 하는 것', m15: '끌리는 대로만 움직이는 것', m18: '확인 안 된 말로 판단하는 것', m10: '흐름 탓만 하고 기다리기만 하는 것', m12: '마냥 기다리기만 하는 것' };
  /** 한 장의 점수: 역방향이면 좋은 카드는 0, 어려운 카드는 0(회복), 보통 카드는 −0.5 */
  const cardScore = d => { const b = baseScore(d.id); return d.rev ? (b === 0 ? -0.5 : 0) : b; };

  // ── 스프레드 (데이터): 자리 이름 · 슬롯 · 입력 ──
  const SPREADS = {
    daily: { name: '오늘의 카드', positions: ['오늘의 답'] },
    flow3: { name: '흐름 3장', positions: ['지금의 흐름', '바뀌는 계기', '가까운 결과'], advice: true },
    monthly: { name: '이달의 운세', positions: ['이달 운의 흐름', '이달에 있을 좋은 일'], advice: true },
    ab: { name: '둘 중 하나', positions: ['A를 고르면', 'B를 고르면'], inputs: ['A', 'B'], clarifier: true, advice: true },
    donot: { name: '할까 말까', positions: ['할 때 ①', '할 때 ②', '안 할 때 ①', '안 할 때 ②'], advice: true },
    timing: { name: '언제쯤?', positions: ['지금', '운이 바뀌는 카드', '그때의 모습'], slots: 'speed', advice: true },
    relation: { name: '그 사람과 앞으로', positions: ['지금 관계', '관계의 계기', '앞으로의 모습'], slots: [1, 2, 3, 4], advice: true }
  };

  /** 뽑기: rng() ∈ [0,1). reversed=false면 모두 정방향. exclude: 이미 나온 카드 */
  function draw(n, { rng = Math.random, reversed = true, revChance = 0.3, exclude = [] } = {}) {
    const deck = CARDS.map(c => c.id).filter(id => !exclude.includes(id));
    for (let i = deck.length - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); [deck[i], deck[k]] = [deck[k], deck[i]]; }
    return deck.slice(0, n).map(id => ({ id, rev: reversed && rng() < revChance }));
  }
  const face = d => { const c = byId[d.id]; return { ...c, m: d.rev ? c.rev : c.up, isRev: !!d.rev, score: cardScore(d) }; };
  const kws = f => f.m.k.split('·');

  /** 양극 카드: 이웃(같은 스프레드의 다른 카드) 점수 합 ≥ +1 → 밝은 쪽, ≤ −1 → 어두운 쪽, 그 사이 → 둘 다 */
  function polarity(id, neighbourScore) {
    const p = POLAR[id]; if (!p) return null;
    return neighbourScore >= 1 ? { pole: 'pos', t: p[0] } : neighbourScore <= -1 ? { pole: 'neg', t: p[1] } : { pole: 'both', t: `좋게 풀리면 — ${p[0]} 어렵게 풀리면 — ${p[1]}` };
  }

  // ── 조합 규칙 (끼워 넣는 함수들) — (faces, ctx) → { t, title? } | null ──
  const NUM_TITLE = { 1: '시작 — 운이 들어와요', 3: '제3자·제3안이 변수예요', 9: '완성 직전이에요', 10: '한 사이클의 완성이에요' };
  const NUM_THEME = { 2: '선택과 균형', 4: '안정과 멈춤', 5: '흔들림(지나가는 과정)', 6: '주고받음과 회복', 7: '점검과 전략', 8: '움직임과 숙련' };
  const SUIT_TXT = { w: '일과 행동이 중심인 흐름이에요. 움직일수록 풀려요.', c: '마음과 관계가 중심이에요. 감정이 결정을 이끌고 있어요.', s: '생각과 말이 많아진 상태예요. 지금 보는 길 말고 다른 길(제3안)도 한 번 적어 보세요.', p: '돈과 현실 조건이 중심이에요. 숫자로 따져 보면 답이 빨라요.' };
  const RANK_EL = { 11: '흙', 12: '불', 13: '물', 14: '공기' }, SUIT_NAT = { w: '불', c: '물', s: '공기', p: '흙' };
  const PERSON = { 11: '배우는 사람·새 소식', 12: '움직이는 사람·제안', 13: '돌보는 사람·감정의 중심', 14: '결정하는 사람·책임자' };
  const minors = fs => fs.filter(f => !f.major);
  const RULES = {
    suitDominance: (fs, ctx) => {
      const mn = minors(fs); if (!mn.length) return null;
      const cnt = {}; mn.forEach(f => { cnt[f.suit] = (cnt[f.suit] || 0) + 1; });
      const need = fs.length === 3 ? 2 : Math.max(2, Math.ceil(mn.length / 2));
      const top = Object.entries(cnt).filter(([, v]) => v >= need && (fs.length === 3 || mn.length >= 3)).sort((a, b) => b[1] - a[1])[0];
      return top ? { t: `${SUITS[top[0]].name} ${top[1]}장 — ${SUIT_TXT[top[0]]}` } : null;
    },
    fireWater: fs => { const w = fs.filter(f => f.suit === 'w').length, c = fs.filter(f => f.suit === 'c').length; return w >= 2 && c >= 2 ? { t: '불(완드)과 물(컵)이 함께 강해요 — 좋을 땐 아주 좋고 부딪힐 땐 크게 부딪히는 조합이에요.' } : null; },
    noPentacles: (fs, ctx) => ctx.spread === 'relation' && !fs.some(f => f.suit === 'p') ? { t: '펜타클(현실·돈)이 없어요 — 현실 문제보다 감정·말의 문제라, 풀리면 뒤끝이 적은 편이에요.' } : null,
    majorTiers: fs => {
      const n = fs.filter(f => f.major).length, run = fs.some((f, i) => i && f.major && fs[i - 1].major);
      if (run) return { t: '메이저가 연달아 나왔어요 — 한 단계가 끝나고 다음이 시작되는 큰 전환이에요.' };
      if (n === 0) return { t: '메이저 없이 일상 범위의 흐름이에요. 내 선택이 결과를 많이 바꿔요.' };
      if (n / fs.length >= 0.5) return { t: '메이저가 절반 이상이에요 — 큰 전환기의 신호라, 서두르기보다 방향을 먼저 정하세요.' };
      return { t: `메이저 카드 한 장(${fs.find(f => f.major).name})이 이번 이야기의 핵심이에요.` };
    },
    numberTitle: fs => {
      const cnt = {}; minors(fs).filter(f => !f.court).forEach(f => { cnt[f.num] = (cnt[f.num] || 0) + 1; });
      const top = Object.entries(cnt).find(([, v]) => v >= 2); if (!top) return null;
      const n = +top[0];
      return NUM_TITLE[n] ? { title: NUM_TITLE[n], t: `같은 숫자 ${j(String(n), '이', '가')} ${top[1]}장 — "${NUM_TITLE[n]}"가 이번 읽기의 제목이에요.` } : { t: `같은 숫자 ${j(String(n), '이', '가')} 겹쳐 "${NUM_THEME[n]}"의 뜻이 커져요.` };
    },
    nineToTen: fs => fs.some((f, i) => i && !fs[i - 1].major && fs[i - 1].num === 9 && !f.major && (f.num === 10 || f.num === 1)) ? { t: '9 다음에 10이나 에이스 — 마지막 한 조각이 채워지는 흐름이에요.' } : null,
    courtPeople: fs => {
      const cs = fs.filter(f => f.court); if (!cs.length) return null;
      const t = cs.map(f => { const re = RANK_EL[f.num], se = SUIT_NAT[f.suit]; return `${j(f.name, '은', '는')} ${PERSON[f.num]}(${re}의 ${se}${re === se ? ', 기운이 겹쳐 강해요' : ''})`; }).join(' · ');
      const up = cs.length >= 2 && cs.every((f, i) => !i || f.num > cs[i - 1].num);
      return { t: `인물 카드: ${t}.${up ? ' 흐름 속에서 계급이 올라가요 — 한 단계 성장이에요.' : ''}` };
    },
    reversedRatio: fs => { const n = fs.filter(f => f.isRev).length; return n >= 2 ? { t: `역방향이 ${n}장 — 막힌 곳을 먼저 풀고 가라는 뜻으로 읽어요.` } : null; }
  };

  // ── 읽는 방식 ──
  const BASE_RULES = ['suitDominance', 'fireWater', 'noPentacles', 'majorTiers', 'numberTitle', 'nineToTen', 'courtPeople'];
  const METHODS = {
    rws: { name: '기본 (정·역방향)', reversed: true, polar: false, rules: [...BASE_RULES, 'reversedRatio'] },
    jhd: { name: '정회도 방식 (역방향 없이 조합으로)', reversed: false, polar: true, rules: BASE_RULES, credit: '특정인 공식 서비스가 아니에요 · 이 리더의 읽는 방식을 참고했어요' }
  };
  const AREA_NAME = { move: '이주·정착', career: '진로·공부', money: '돈·지출', family: '가정·관계', free: '질문' };
  const CLS_NAME = { push: '밀고 갈 때', guard: '지킬 때', prep: '준비할 때', rest: '쉬어갈 때' };
  const CLS_FLOW = { push: '망설이기보다 한 걸음 내딛는 신호로 읽어요.', guard: '새로 벌이기보다 지키는 쪽으로 읽어요.', prep: '서두르기보다 준비한 것을 다지는 쪽으로 읽어요.', rest: '무리하지 말고 쉬어 가라는 신호로 읽어요.' };

  // ── 안전: 위기 표현 → 중단, 건강 → 전문가 안내 ──
  // 위기는 넓게 잡음("사업을 끝내고 싶어"에 109가 떠도 괜찮음), 건강·돈은 흔한 오탐을 피해 좁게
  const CRISIS = /자살|죽고\s*싶|죽어\s*버리|자해|극단적(인)?\s*선택|사라지고\s*싶|살기\s*싫|목숨을\s*끊|끝내고\s*싶|살고\s*싶지|없어지고\s*싶|뛰어내리|죽을까|죽었으면/;
  const HEALTH = /건강(?!한\s*(관계|연애|사이|대화))|병원|질병|병이|아프(?!리카)|아픈|통증|수술|진단|암(\s|$)|암이|(^|\s)약을|복용|임신|우울증|공황|치료|증상/;
  const MONEY = /주식|코인|비트|종목|매수|매도|살까|팔까|오를까|내릴까|투자|ETF|상장/i;
  const isMoney = (q, area) => area === 'money' || MONEY.test(String(q || ''));
  /** 위기 → 'crisis'(중단+상담 전화) · 건강 → 'health'(전문가 안내) · 돈 질문의 '언제쯤?' → 'money'(시점은 보지 않음) */
  function guard(q, ctx = {}) { const s = String(q || ''); return CRISIS.test(s) ? 'crisis' : HEALTH.test(s) ? 'health' : (ctx.spread === 'timing' && isMoney(s, ctx.area)) ? 'money' : null; }
  /** 같은 질문 열쇠: 프로필 + 스프레드 + 질문(띄어쓰기·문장부호 무시, 영역은 무시) */
  const qKey = (pid, spread, q) => [pid || '', spread, String(q || '').replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase()].join('|');
  /** 같은 질문 다시 뽑기: 24시간 안에 처음 + 다시 1번까지. log는 기록 삭제와 따로 두는 뽑기 기록 */
  function canDraw(log, key, now = Date.now()) { return log.filter(h => h.key === key && now - Date.parse(h.at) < 864e5).length < 2; }

  // ── 시점 슬롯 ──
  const isFast = f => f.suit === 'w' || (f.court && f.num === 12) || f.num === 1 && !f.major || ['m07', 'm10'].includes(f.id);
  const isSlow = f => f.suit === 'p' || (!f.major && f.num === 4) || ['m09', 'm12'].includes(f.id);
  function slotUnits(turn, fixed) { if (Array.isArray(fixed)) return fixed; return isFast(turn) ? [1, 2, 3, 4] : isSlow(turn) ? [3, 6, 9, 12] : [1, 3, 6]; }
  /** 슬롯 점수 = 카드 점수 + 메이저 +1 + 에이스 +1 + 계기 카드와 수트·숫자가 같으면 +1. 처음으로 ≥ 2인 슬롯이 답 */
  function timing(turnF, slotFs, units) {
    const sc = slotFs.map(f => f.score + (f.major ? 1 : 0) + (!f.major && f.num === 1 ? 1 : 0) + ((!f.major && !turnF.major && (f.suit === turnF.suit || f.num === turnF.num)) || (f.major && turnF.major) ? 1 : 0));
    const i = sc.findIndex(x => x >= 2);
    if (i < 0) return { units, scores: sc, hit: null, t: '조금 더 시간이 필요한 흐름이에요. 지금 슬롯 안에서는 뚜렷한 때가 보이지 않아요.' };
    const a = units[i], b = units[i + 1] || units[i] + (units[i] - (units[i - 1] || 0));
    let t = `지금부터 빠르면 ${a}개월, 늦어도 ${b}개월 사이에 흐름이 바뀔 가능성이 커요.`;
    if (slotFs[i + 1] && slotFs[i + 1].score < 0) t += ' 이 시기를 놓치면 다시 오기까지 오래 걸릴 수 있어요.';
    return { units, scores: sc, hit: i, t };
  }

  /** 조언 카드 문장: 그림 → 키워드 → 예시 2 → 행동 한 줄 → 선택은 사용자에게 */
  function adviceText(d, name = '나') {
    const f = face(d), k = kws(f), act = f.m.t.split(/(?<=요\.)\s*/).filter(Boolean).pop();
    const neg = f.score < 0 || (POLAR[f.id] && !d.rev && f.id !== 'm10');
    if (neg) return `${f.pic} — ${j(f.name + (d.rev ? '(역방향)' : ''), '은', '는')} 지금 조심할 점을 알려 줘요. ${CAUTION[f.id] || '서두르는 것'}만 피하면 결과는 충분히 달라질 수 있어요. 선택은 ${name}에게 있어요.`;
    return `${f.pic} — ${f.name}${d.rev ? '(역방향)' : ''}. 핵심은 "${k.join('·')}"이에요. 예를 들어 일에서는 오늘의 할 일 목록에서, 관계에서는 오늘 나누는 대화에서 이 말을 떠올려 보세요. ${act} 선택은 ${name}에게 있어요.`;
  }

  /** 읽기. drawn = 자리 카드 + (슬롯 카드들) + (애매할 때 한 장) + 조언 카드 순서로 저장된 목록.
      ctx: { spread, area, q, cls, method, name, a, b } */
  function reading(drawn, ctx = {}) {
    const M = METHODS[ctx.method] || METHODS.rws, sp = SPREADS[ctx.spread] || SPREADS.flow3, area = ctx.area || 'free', name = ctx.name || '나';
    const n = sp.positions.length, main = drawn.slice(0, n).map(face);
    const total = main.reduce((a, f) => a + f.score, 0);
    const lines = main.map((f, i) => {
      const pol = M.polar ? polarity(f.id, total - f.score) : null;
      const neg = pol ? pol.pole === 'neg' : f.score < 0;
      let t = pol ? pol.t : f.m.t;
      if (neg) t += ` ${CAUTION[f.id] ? `${CAUTION[f.id]}만 피하면 달라질 수 있어요.` : '이것만 조심하면 달라질 수 있어요.'}`;
      return { pos: sp.positions[i], id: f.id, name: f.name, rev: f.isRev, k: f.m.k, t, pole: pol && pol.pole, score: f.score };
    });
    const res = M.rules.map(r => RULES[r](main, { ...ctx, spread: ctx.spread })).filter(Boolean);
    const title = (res.find(x => x.title) || {}).title || '';
    let rest = drawn.slice(n), verdict = '', slots = null, clar = null;
    if (sp.slots) {
      const units = slotUnits(main[1], sp.slots), pool = rest.slice(0, 8).map(face); rest = rest.slice(8);
      const k = units.length;
      slots = { ...timing(main[1], pool.slice(0, k), units), cards: pool.slice(0, k).map(f => ({ id: f.id, name: f.name })) };
      if (slots.hit == null && units[3] !== 12) {               // 못 찾으면 한 번만 더 긴 단위로
        const ext = timing(main[1], pool.slice(k, k + 4), [3, 6, 9, 12]);
        slots = { ...ext, cards: pool.slice(k, k + 4).map(f => ({ id: f.id, name: f.name })), extended: true };
        if (ext.hit == null) slots.t = '조금 더 시간이 필요한 흐름이에요. 1년 안쪽에는 뚜렷한 때가 보이지 않아, 지금은 준비에 힘을 두세요.';
      }
      verdict = slots.t;
    }
    const money = isMoney(ctx.q, area);
    const MONEY_V = '돈 질문이라 사고팔 신호나 시점은 보지 않아요. 어느 쪽이든 미리 정한 계획(얼마까지, 언제 멈출지)과 한도를 지키고, 한 번에 다 넣지 말고 나눠서 — 판단은 직접 해요.';
    if (ctx.spread === 'ab') {
      let [sa, sb] = [main[0].score, main[1].score];
      if (!main[0].major && !main[1].major && main[0].suit === main[1].suit) { if (main[0].num > main[1].num) sa += 0.5; else if (main[1].num > main[0].num) sb += 0.5; res.push({ t: '두 카드가 같은 수트라 숫자가 큰 쪽에 조금 더 힘이 실려요.' }); }
      const A = ctx.a || 'A', B = ctx.b || 'B';
      if (Math.abs(sa - sb) >= 1) verdict = `${sa > sb ? A : B} 쪽 카드가 더 밝아요. 다만 ${sa > sb ? B : A} 쪽 카드의 조심할 점도 함께 보세요.`;
      else { clar = rest[0] ? face(rest[0]) : null; rest = rest.slice(1); verdict = `두 쪽이 비슷해요. 애매할 때 한 장 더 — ${clar ? `${clar.name}: ${clar.m.t}` : ''}`; }
      if (money) verdict = MONEY_V;
      if (main.filter(f => f.suit === 's').length >= 2) res.push({ t: '두 길만 보고 있으면 시야가 좁아져요. 세 번째 선택지를 한 줄만 적어 보세요.' });
    }
    if (ctx.spread === 'donot') {
      const d = main[0].score + main[1].score, nn = main[2].score + main[3].score;
      verdict = money ? MONEY_V : d - nn >= 1 ? '할 때 쪽 카드가 더 밝아요. 한다면 조언 카드를 행동 기준으로 삼아 보세요.' : nn - d >= 1 ? '안 할 때 쪽 카드가 더 편안해요. 지금은 미루거나 작게 시험해 보는 것도 방법이에요.' : '두 쪽이 비슷해요. 무엇을 더 중요하게 여기는지가 답을 정해요.';
    }
    const advD = sp.advice ? rest[rest.length - 1] : null;
    const flow = ctx.cls ? `큰 흐름(사주)으로는 지금 ${CLS_NAME[ctx.cls]}라서, '${sp.positions[n - 1]}' 카드는 ${CLS_FLOW[ctx.cls]}` : '';
    const moneyNote = money ? '타로는 사고팔 종목·시점·금액을 알려 주지 않아요. 습관과 마음가짐만 비춰 봐요.' : '';
    return { spread: ctx.spread || 'flow3', spreadName: sp.name, area, areaName: AREA_NAME[area], q: ctx.q || '', title, lines, notes: res.map(x => x.t), verdict, slots, clar: clar && { id: clar.id, name: clar.name },
      advice: advD ? { id: advD.id, rev: advD.rev, t: adviceText(advD, name) } : null, flow, money: moneyNote, credit: M.credit || '', closing: `카드는 지금의 흐름을 보여 줄 뿐, 문을 여는 건 ${name}의 선택이에요.` };
  }
  /** 스프레드에 필요한 장 수: 자리 + 슬롯(4 + 한 번 늘린 4) + 애매할 때 1 + 조언 1 */
  const cardsNeeded = id => { const sp = SPREADS[id]; return sp.positions.length + (sp.slots ? 8 : 0) + (sp.clarifier ? 1 : 0) + (sp.advice ? 1 : 0); };

  // ── 수비학 (뽑지 않는 카드): 타고난 카드 · 올해의 카드 ──
  const digits = s => String(s).replace(/\D/g, '').split('').reduce((a, c) => a + +c, 0);
  /** 타고난 카드: 양력 생년월일 숫자 합 → 한 자리(1~9) → 메이저 */
  function soulCard(ymd) { let n = digits(ymd); while (n > 9) n = digits(n); return byId['m' + String(n).padStart(2, '0')]; }
  /** 올해의 카드: 양력 생일(월·일) 숫자 + 올해 숫자 → 1~21 그대로, 22 = 0(바보), 23 이상은 다시 합산 */
  function yearCard(ymd, year) { let n = digits(ymd.slice(5)) + digits(year); while (n > 22) n = digits(n); if (n === 22) n = 0; return byId['m' + String(n).padStart(2, '0')]; }

  /** 오늘의 카드 + 사주(앱이 더한 연결): 카드 오행이 필요한 기운인지, 넘치는 기운인지, 오늘 일진·이번 달 분류까지 */
  const GOOD = ['새로 배우고 키우는 일이 잘 풀려요', '표현하고 나서는 일이 잘 풀려요', '차분히 쌓는 일이 잘 풀려요', '정리하고 결단하는 일이 잘 풀려요', '마음을 나누는 대화가 잘 풀려요'];
  const SLOW = ['일을 너무 벌이지 않는 게 좋아요', '속도 조절이 필요해요', '고집을 내려놓으면 편해요', '말을 날카롭게 하지 않는 게 좋아요', '감정에 휩쓸리지 않게 해요'];
  const DAY_W = { good: '기운이 좋은 날', ok: '무난한 날', care: '조심할 날' };
  function withSaju(d, { name = '나', needed = [], avoid = [], day, cls } = {}) {
    const f = face(d), e = f.el, src = f.major ? `${f.name}(${f.attr} → ${EL[e]})` : `${SUITS[f.suit].name}(${SUITS[f.suit].nature})`;
    let s = needed.includes(e) ? `${src} 카드 — ${name}에게 필요한 ${EL[e]} 기운이라 오늘 ${GOOD[e]}.`
      : avoid.includes(e) ? `${src} 카드 — 이미 ${EL[e]} 기운이 많은 사주라 오늘은 ${SLOW[e]}.`
      : `${src} 카드 — ${name}에게는 무난한 기운이라 카드 뜻을 그대로 참고하세요.`;
    if (day && cls) s += ` 오늘은 ${DAY_W[day]}이고 이번 달은 ${CLS_NAME[cls]}예요.`;
    return s;
  }

  return { EL, SUITS, CARDS, byId, SPREADS, RULES, METHODS, POLAR, draw, face, cardScore, polarity, timing, slotUnits, reading, adviceText, cardsNeeded, withSaju, guard, isMoney, qKey, canDraw, soulCard, yearCard, AREA_NAME };
});
