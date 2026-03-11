// ============================================
// MarketShare - 분양몰 특화 카테고리 체계
// 건강기능식품 · 뷰티 · 생활 중심 (대/중/소 3단계)
// ============================================

export interface CategoryNode {
  name: string;
  slug: string;
  children?: CategoryNode[];
}

/**
 * 분양몰 특화 상품 카테고리 (대분류 10 → 중분류 ~40 → 소분류 ~120)
 * 분양몰 핵심 상품군(건강기능식품, 뷰티, 생활) 우선 배치
 */
export const DEFAULT_CATEGORIES: CategoryNode[] = [
  {
    name: '건강기능식품',
    slug: 'health-supplement',
    children: [
      {
        name: '비타민/미네랄',
        slug: 'vitamin-mineral',
        children: [
          { name: '종합비타민', slug: 'multivitamin' },
          { name: '비타민C', slug: 'vitamin-c' },
          { name: '비타민D', slug: 'vitamin-d' },
          { name: '칼슘/마그네슘', slug: 'calcium-magnesium' },
          { name: '아연/철분', slug: 'zinc-iron' },
        ],
      },
      {
        name: '홍삼/인삼',
        slug: 'ginseng',
        children: [
          { name: '홍삼정/농축액', slug: 'red-ginseng-extract' },
          { name: '홍삼스틱', slug: 'red-ginseng-stick' },
          { name: '홍삼캡슐', slug: 'red-ginseng-capsule' },
          { name: '인삼/산삼', slug: 'ginseng-wild' },
        ],
      },
      {
        name: '유산균/장건강',
        slug: 'probiotics',
        children: [
          { name: '프로바이오틱스', slug: 'probiotic' },
          { name: '식이섬유', slug: 'dietary-fiber' },
          { name: '소화효소', slug: 'digestive-enzyme' },
        ],
      },
      {
        name: '관절/뼈건강',
        slug: 'joint-bone',
        children: [
          { name: 'MSM/글루코사민', slug: 'msm-glucosamine' },
          { name: '콘드로이친', slug: 'chondroitin' },
          { name: '칼슘/비타민K', slug: 'calcium-vitamin-k' },
        ],
      },
      {
        name: '다이어트/체중관리',
        slug: 'diet-weight',
        children: [
          { name: '다이어트보조제', slug: 'diet-supplement' },
          { name: '단백질/프로틴', slug: 'protein' },
          { name: '식사대용', slug: 'meal-replacement' },
          { name: '가르시니아/CLA', slug: 'garcinia-cla' },
        ],
      },
      {
        name: '면역/항산화',
        slug: 'immunity-antioxidant',
        children: [
          { name: '오메가3', slug: 'omega3' },
          { name: '코엔자임Q10', slug: 'coenzyme-q10' },
          { name: '프로폴리스', slug: 'propolis' },
          { name: '스피루리나/클로렐라', slug: 'spirulina-chlorella' },
        ],
      },
    ],
  },
  {
    name: '뷰티/화장품',
    slug: 'beauty-cosmetics',
    children: [
      {
        name: '스킨케어',
        slug: 'skincare',
        children: [
          { name: '클렌징', slug: 'cleansing' },
          { name: '토너/스킨', slug: 'toner' },
          { name: '에센스/세럼/앰플', slug: 'serum-ampoule' },
          { name: '크림/로션', slug: 'cream-lotion' },
          { name: '아이케어', slug: 'eye-care' },
          { name: '선케어/자외선차단', slug: 'suncare' },
          { name: '마스크팩/패드', slug: 'mask-pack' },
        ],
      },
      {
        name: '메이크업',
        slug: 'makeup',
        children: [
          { name: '베이스/파운데이션', slug: 'foundation' },
          { name: '아이메이크업', slug: 'eye-makeup' },
          { name: '립메이크업', slug: 'lip-makeup' },
          { name: '치크/하이라이터', slug: 'cheek-highlighter' },
          { name: '네일', slug: 'nail' },
        ],
      },
      {
        name: '남성화장품',
        slug: 'mens-cosmetics',
        children: [
          { name: '올인원/스킨', slug: 'mens-allinone' },
          { name: '클렌징/쉐이빙', slug: 'mens-cleansing' },
          { name: '헤어/스타일링', slug: 'mens-hair' },
        ],
      },
      {
        name: '뷰티소품',
        slug: 'beauty-tools',
        children: [
          { name: '메이크업브러시/퍼프', slug: 'brush-puff' },
          { name: '뷰티디바이스', slug: 'beauty-device' },
          { name: '거울/파우치', slug: 'mirror-pouch' },
        ],
      },
    ],
  },
  {
    name: '헤어/바디케어',
    slug: 'hair-bodycare',
    children: [
      {
        name: '헤어케어',
        slug: 'haircare',
        children: [
          { name: '샴푸', slug: 'shampoo' },
          { name: '린스/컨디셔너', slug: 'conditioner' },
          { name: '트리트먼트/헤어팩', slug: 'hair-treatment' },
          { name: '헤어에센스/오일', slug: 'hair-oil' },
          { name: '염색/펌', slug: 'hair-color' },
          { name: '두피케어', slug: 'scalp-care' },
        ],
      },
      {
        name: '바디케어',
        slug: 'bodycare',
        children: [
          { name: '바디워시/비누', slug: 'body-wash' },
          { name: '바디로션/크림', slug: 'body-lotion' },
          { name: '바디미스트/오일', slug: 'body-mist' },
          { name: '핸드크림/풋케어', slug: 'hand-foot-care' },
        ],
      },
      {
        name: '구강관리',
        slug: 'oral-care',
        children: [
          { name: '치약', slug: 'toothpaste' },
          { name: '칫솔/전동칫솔', slug: 'toothbrush' },
          { name: '가글/구강청결', slug: 'mouthwash' },
        ],
      },
      {
        name: '향수/디퓨저',
        slug: 'fragrance',
        children: [
          { name: '향수/바디미스트', slug: 'perfume' },
          { name: '디퓨저/캔들', slug: 'diffuser-candle' },
          { name: '차량용방향제', slug: 'car-freshener' },
        ],
      },
    ],
  },
  {
    name: '생활용품',
    slug: 'daily-living',
    children: [
      {
        name: '세탁/청소',
        slug: 'laundry-cleaning',
        children: [
          { name: '세탁세제/유연제', slug: 'laundry-detergent' },
          { name: '섬유탈취제', slug: 'fabric-freshener' },
          { name: '주방세제', slug: 'dish-soap' },
          { name: '청소용품', slug: 'cleaning-tools' },
        ],
      },
      {
        name: '주방용품',
        slug: 'kitchen-goods',
        children: [
          { name: '냄비/프라이팬', slug: 'cookware' },
          { name: '식기/컵', slug: 'tableware' },
          { name: '보관용기/밀폐용기', slug: 'container' },
          { name: '키친타올/호일/랩', slug: 'kitchen-wrap' },
        ],
      },
      {
        name: '욕실용품',
        slug: 'bathroom-goods',
        children: [
          { name: '수건/타월', slug: 'towel' },
          { name: '욕실소품', slug: 'bathroom-accessory' },
          { name: '화장지/물티슈', slug: 'tissue-wipe' },
        ],
      },
      {
        name: '위생/건강관리',
        slug: 'hygiene-health',
        children: [
          { name: '마스크', slug: 'mask' },
          { name: '손소독제/위생용품', slug: 'sanitizer' },
          { name: '체온계/혈압계', slug: 'health-device' },
          { name: '안마기/찜질', slug: 'massager' },
        ],
      },
    ],
  },
  {
    name: '식품/음료',
    slug: 'food-beverage',
    children: [
      {
        name: '건강음료/차',
        slug: 'health-drink',
        children: [
          { name: '곡물차/한방차', slug: 'grain-tea' },
          { name: '과일차/허브티', slug: 'fruit-herb-tea' },
          { name: '건강즙/진액', slug: 'health-juice' },
          { name: '콤부차/효소음료', slug: 'kombucha-enzyme' },
        ],
      },
      {
        name: '간편식/밀키트',
        slug: 'convenience-food',
        children: [
          { name: '밀키트', slug: 'meal-kit' },
          { name: '냉동식품', slug: 'frozen-food' },
          { name: '즉석밥/죽', slug: 'instant-rice' },
          { name: '라면/면류', slug: 'noodle' },
        ],
      },
      {
        name: '커피/음료',
        slug: 'coffee-beverage',
        children: [
          { name: '원두/드립커피', slug: 'drip-coffee' },
          { name: '커피믹스/캡슐', slug: 'coffee-mix' },
          { name: '생수/탄산수', slug: 'water' },
          { name: '주스/과즙', slug: 'juice' },
        ],
      },
      {
        name: '간식/견과',
        slug: 'snack-nuts',
        children: [
          { name: '견과/건과', slug: 'nuts' },
          { name: '과자/쿠키', slug: 'cookie' },
          { name: '초콜릿/캔디', slug: 'chocolate' },
          { name: '떡/한과', slug: 'rice-cake' },
        ],
      },
      {
        name: '신선/가공식품',
        slug: 'fresh-processed',
        children: [
          { name: '과일/채소', slug: 'fruit-vegetable' },
          { name: '정육/계란', slug: 'meat-egg' },
          { name: '수산물/건어물', slug: 'seafood' },
          { name: '소스/양념/오일', slug: 'sauce-oil' },
          { name: '유기농/자연식품', slug: 'organic' },
        ],
      },
    ],
  },
  {
    name: '홈/가전',
    slug: 'home-appliance',
    children: [
      {
        name: '주방가전',
        slug: 'kitchen-appliance',
        children: [
          { name: '에어프라이어/오븐', slug: 'air-fryer-oven' },
          { name: '커피머신/포트', slug: 'coffee-machine' },
          { name: '믹서/블렌더', slug: 'blender' },
          { name: '전기밥솥', slug: 'rice-cooker' },
        ],
      },
      {
        name: '생활가전',
        slug: 'home-electronics',
        children: [
          { name: '청소기/로봇청소기', slug: 'vacuum' },
          { name: '공기청정기', slug: 'air-purifier' },
          { name: '가습기/제습기', slug: 'humidifier' },
          { name: '세탁기/건조기', slug: 'washer-dryer' },
        ],
      },
      {
        name: '미용가전',
        slug: 'beauty-appliance',
        children: [
          { name: '헤어드라이기/고데기', slug: 'hair-dryer' },
          { name: '피부관리기', slug: 'skin-device' },
          { name: '전동칫솔/구강관리기', slug: 'oral-device' },
        ],
      },
      {
        name: '건강가전',
        slug: 'health-appliance',
        children: [
          { name: '안마의자/안마기', slug: 'massage-chair' },
          { name: '체중계/체성분', slug: 'scale' },
          { name: '정수기/비데', slug: 'water-purifier' },
        ],
      },
    ],
  },
  {
    name: '패션/잡화',
    slug: 'fashion-goods',
    children: [
      {
        name: '여성의류',
        slug: 'women-clothing',
        children: [
          { name: '원피스/스커트', slug: 'dress-skirt' },
          { name: '블라우스/셔츠', slug: 'blouse' },
          { name: '니트/가디건', slug: 'women-knit' },
          { name: '바지/팬츠', slug: 'women-pants' },
          { name: '코트/자켓', slug: 'women-outer' },
        ],
      },
      {
        name: '남성의류',
        slug: 'men-clothing',
        children: [
          { name: '셔츠/티셔츠', slug: 'men-shirt' },
          { name: '바지/슬랙스', slug: 'men-pants' },
          { name: '자켓/코트', slug: 'men-outer' },
          { name: '정장/수트', slug: 'suit' },
        ],
      },
      {
        name: '속옷/양말',
        slug: 'innerwear',
        children: [
          { name: '여성속옷', slug: 'women-inner' },
          { name: '남성속옷', slug: 'men-inner' },
          { name: '양말/스타킹', slug: 'socks' },
          { name: '잠옷/홈웨어', slug: 'pajama' },
        ],
      },
      {
        name: '가방/지갑',
        slug: 'bags-wallet',
        children: [
          { name: '크로스백/숄더백', slug: 'crossbag' },
          { name: '토트백/에코백', slug: 'tote' },
          { name: '백팩', slug: 'backpack' },
          { name: '지갑/카드지갑', slug: 'wallet' },
        ],
      },
      {
        name: '신발',
        slug: 'shoes',
        children: [
          { name: '운동화/스니커즈', slug: 'sneakers' },
          { name: '구두/로퍼', slug: 'loafer' },
          { name: '샌들/슬리퍼', slug: 'sandal' },
          { name: '부츠', slug: 'boots' },
        ],
      },
      {
        name: '악세서리',
        slug: 'accessory',
        children: [
          { name: '시계', slug: 'watch' },
          { name: '주얼리/귀걸이', slug: 'jewelry' },
          { name: '모자/머플러', slug: 'hat-scarf' },
          { name: '선글라스/안경', slug: 'glasses' },
        ],
      },
    ],
  },
  {
    name: '유아/키즈',
    slug: 'baby-kids',
    children: [
      {
        name: '유아용품',
        slug: 'baby-essentials',
        children: [
          { name: '기저귀/물티슈', slug: 'diaper-wipe' },
          { name: '분유/이유식', slug: 'baby-food' },
          { name: '젖병/식기', slug: 'baby-bottle' },
          { name: '유모차/카시트', slug: 'stroller' },
          { name: '유아위생용품', slug: 'baby-hygiene' },
        ],
      },
      {
        name: '아동의류',
        slug: 'kids-clothing',
        children: [
          { name: '유아의류', slug: 'baby-clothing' },
          { name: '아동상의', slug: 'kids-top' },
          { name: '아동하의', slug: 'kids-bottom' },
          { name: '아동아우터', slug: 'kids-outer' },
        ],
      },
      {
        name: '장난감/교구',
        slug: 'toys-edu',
        children: [
          { name: '블록/퍼즐', slug: 'blocks-puzzle' },
          { name: '교육완구', slug: 'edu-toy' },
          { name: '인형/피규어', slug: 'dolls' },
          { name: '유아교구', slug: 'baby-edu' },
        ],
      },
    ],
  },
  {
    name: '반려동물',
    slug: 'pets',
    children: [
      {
        name: '강아지',
        slug: 'dog',
        children: [
          { name: '사료/간식', slug: 'dog-food' },
          { name: '건강관리', slug: 'dog-health' },
          { name: '산책/외출용품', slug: 'dog-walk' },
          { name: '장난감/의류', slug: 'dog-toy-clothes' },
        ],
      },
      {
        name: '고양이',
        slug: 'cat',
        children: [
          { name: '사료/간식', slug: 'cat-food' },
          { name: '모래/화장실', slug: 'cat-litter' },
          { name: '건강관리', slug: 'cat-health' },
          { name: '장난감/캣타워', slug: 'cat-toy' },
        ],
      },
      {
        name: '기타반려동물',
        slug: 'other-pets',
        children: [
          { name: '소동물용품', slug: 'small-animal' },
          { name: '관상어/수족관', slug: 'aquarium' },
        ],
      },
    ],
  },
  {
    name: '홈인테리어/침구',
    slug: 'home-interior',
    children: [
      {
        name: '침구/수면',
        slug: 'bedding',
        children: [
          { name: '이불/이불솜', slug: 'blanket' },
          { name: '베개/쿠션', slug: 'pillow' },
          { name: '침대커버/패드', slug: 'bed-cover' },
          { name: '매트리스', slug: 'mattress' },
        ],
      },
      {
        name: '커튼/패브릭',
        slug: 'curtain-fabric',
        children: [
          { name: '커튼/블라인드', slug: 'curtain' },
          { name: '러그/카펫', slug: 'rug' },
          { name: '쿠션/방석', slug: 'cushion' },
        ],
      },
      {
        name: '인테리어소품',
        slug: 'interior-deco',
        children: [
          { name: '조명', slug: 'lighting' },
          { name: '액자/시계', slug: 'frame-clock' },
          { name: '수납/정리', slug: 'storage' },
          { name: '화분/조화', slug: 'plant-pot' },
        ],
      },
    ],
  },
];
