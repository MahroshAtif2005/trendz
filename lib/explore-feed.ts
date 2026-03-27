export const EXPLORE_CATEGORIES = [
  'All',
  'Streetwear',
  'Baggy / Oversized',
  'Casual',
  'Airport Style',
  'Sporty Chic',
  'Minimal / Clean Girl',
  'Old Money / Quiet Luxury',
  'Modest / Elegant',
  'Eid / Eastern Glam',
  'Wedding / Festive',
  'Party / Evening',
  'Formal',
  'Office',
  'Neutral / Luxe',
  'Travel',
  'Date Night',
  'Summer',
  'Winter',
  'Soft Feminine',
] as const;

export type ExploreCategory = (typeof EXPLORE_CATEGORIES)[number];
export type ExploreTag = Exclude<ExploreCategory, 'All'>;

export type ExploreInspirationItem = {
  id: string;
  title: string;
  vibe: string;
  imageUrl: string;
  fallbackImageUrls?: string[];
  height: number;
  categories: ExploreTag[];
};

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const CATEGORY_FALLBACK_IMAGE_URLS: Record<ExploreTag, string[]> = {
  'Streetwear': [photo('1529139574466-a303027c1d8b'), photo('1721637686340-de9f8cebda5a')],
  'Baggy / Oversized': [photo('1721111260570-456f3306f8d4'), photo('1763696069136-23a95e615c81')],
  'Casual': [photo('1502163140606-888448ae8adb'), photo('1488426862026-3ee34a7d66df')],
  'Airport Style': [photo('1693614076723-f96c711cbc4f'), photo('1754746804782-fcf470a9b5e7')],
  'Sporty Chic': [photo('1551488831-00ddcb6c6bd3'), photo('1617137968427-85924c800a22')],
  'Minimal / Clean Girl': [photo('1521572267360-ee0c2909d518'), photo('1559963110-6d2b8523b6d1')],
  'Old Money / Quiet Luxury': [photo('1552902865-b72c031ac5ea'), photo('1483985988355-763728e1935b')],
  'Modest / Elegant': [photo('1503342217505-b0a15ec3261c'), photo('1541099649105-f69ad21f3246')],
  'Eid / Eastern Glam': [photo('1571513800374-df1bbe650e56'), photo('1668028554553-f83cac89ce0f')],
  'Wedding / Festive': [photo('1496747611176-843222e1e57c'), photo('1512436991641-6745cdb1723f')],
  'Party / Evening': [photo('1608245449230-4ac19066d2d0'), photo('1492633423870-43d1cd2775eb')],
  'Formal': [photo('1515886657613-9f3515b0c78f'), photo('1485230895905-ef0cd7768e98')],
  'Office': [photo('1696451203186-6eb38b06fbbc'), photo('1543163521-1bf539c55dd2')],
  'Neutral / Luxe': [photo('1483985988355-763728e1935b'), photo('1617042375876-a13e36732a04')],
  'Travel': [photo('1578632767115-351597cf2477'), photo('1605497788044-5a32c7078486')],
  'Date Night': [photo('1500917293891-ef795e70e1f6'), photo('1551232864-3f0890e580d9')],
  'Summer': [photo('1568251188392-ae32f898cb3b'), photo('1604361859295-df8a8b715a28')],
  'Winter': [photo('1539008835657-9e8e9680c956'), photo('1499951360447-b19be8fe80f5')],
  'Soft Feminine': [photo('1560243563-062bfc001d68'), photo('1594633312681-425c7b97ccd1')],
};

const DEFAULT_FALLBACK_IMAGE_URLS = [
  photo('1483985988355-763728e1935b'),
  photo('1503342217505-b0a15ec3261c'),
  photo('1515886657613-9f3515b0c78f'),
  photo('1521572267360-ee0c2909d518'),
];

const ALL_FEED_MIX_ORDER: ExploreTag[] = [
  'Streetwear',
  'Baggy / Oversized',
  'Airport Style',
  'Sporty Chic',
  'Minimal / Clean Girl',
  'Old Money / Quiet Luxury',
  'Modest / Elegant',
  'Eid / Eastern Glam',
  'Wedding / Festive',
  'Casual',
  'Party / Evening',
  'Office',
  'Neutral / Luxe',
  'Travel',
  'Date Night',
  'Summer',
  'Winter',
  'Soft Feminine',
  'Formal',
];

const RAW_EXPLORE_FEED_ITEMS: ExploreInspirationItem[] = [
  {
    id: '1',
    title: 'Graphite layers and sneakers',
    vibe: 'City edge',
    imageUrl: photo('1529139574466-a303027c1d8b'),
    height: 286,
    categories: ['Streetwear', 'Baggy / Oversized', 'Airport Style'],
  },
  {
    id: '2',
    title: 'Tailored neutrals at golden hour',
    vibe: 'Quiet tailoring',
    imageUrl: photo('1483985988355-763728e1935b'),
    height: 226,
    categories: ['Office', 'Neutral / Luxe', 'Old Money / Quiet Luxury'],
  },
  {
    id: '3',
    title: 'Soft satin RSVP glow',
    vibe: 'Champagne dress code',
    imageUrl: photo('1496747611176-843222e1e57c'),
    height: 322,
    categories: ['Wedding / Festive', 'Soft Feminine', 'Formal'],
  },
  {
    id: '4',
    title: 'Quiet luxury black column',
    vibe: 'After-dark polish',
    imageUrl: photo('1515886657613-9f3515b0c78f'),
    height: 252,
    categories: ['Formal', 'Date Night', 'Old Money / Quiet Luxury'],
  },
  {
    id: '5',
    title: 'Relaxed linen with espresso leather',
    vibe: 'Vacation neutral',
    imageUrl: photo('1502163140606-888448ae8adb'),
    height: 294,
    categories: ['Casual', 'Summer', 'Travel'],
  },
  {
    id: '6',
    title: 'Crisp blazer clean edit',
    vibe: 'Minimal tailoring',
    imageUrl: photo('1543163521-1bf539c55dd2'),
    height: 240,
    categories: ['Minimal / Clean Girl', 'Office', 'Neutral / Luxe'],
  },
  {
    id: '7',
    title: 'Architectural drape and silk scarf',
    vibe: 'Refined layers',
    imageUrl: photo('1524504388940-b1c1722653e1'),
    height: 304,
    categories: ['Modest / Elegant', 'Formal', 'Neutral / Luxe'],
  },
  {
    id: '8',
    title: 'Low-light sequins',
    vibe: 'Studio flash',
    imageUrl: photo('1492633423870-43d1cd2775eb'),
    height: 228,
    categories: ['Party / Evening', 'Date Night'],
  },
  {
    id: '9',
    title: 'White shirt and wide-leg denim',
    vibe: 'Polished ease',
    imageUrl: photo('1488426862026-3ee34a7d66df'),
    height: 276,
    categories: ['Casual', 'Baggy / Oversized', 'Minimal / Clean Girl', 'Summer'],
  },
  {
    id: '10',
    title: 'After-dark tailoring with gold heels',
    vibe: 'City cocktail',
    imageUrl: photo('1485230895905-ef0cd7768e98'),
    height: 334,
    categories: ['Party / Evening', 'Formal', 'Date Night'],
  },
  {
    id: '11',
    title: 'Monochrome commute look',
    vibe: 'Cold-season office',
    imageUrl: photo('1487412720507-e7ab37603c6f'),
    height: 244,
    categories: ['Office', 'Winter', 'Old Money / Quiet Luxury'],
  },
  {
    id: '12',
    title: 'Cream textures and slick bun',
    vibe: 'Soft polish',
    imageUrl: photo('1521572267360-ee0c2909d518'),
    height: 296,
    categories: ['Minimal / Clean Girl', 'Neutral / Luxe', 'Soft Feminine'],
  },
  {
    id: '13',
    title: 'Sculpted black-tie silhouette',
    vibe: 'Evening noir',
    imageUrl: photo('1434389678369-18ae45bc8852'),
    height: 214,
    categories: ['Formal', 'Party / Evening', 'Date Night'],
  },
  {
    id: '14',
    title: 'Elevated denim layering',
    vibe: 'Off-duty cool',
    imageUrl: photo('1550614000-4b95d4662d08'),
    height: 308,
    categories: ['Streetwear', 'Baggy / Oversized', 'Casual'],
  },
  {
    id: '15',
    title: 'Embellished guest look',
    vibe: 'Event shimmer',
    imageUrl: photo('1512436991641-6745cdb1723f'),
    height: 286,
    categories: ['Wedding / Festive', 'Party / Evening', 'Soft Feminine'],
  },
  {
    id: '16',
    title: 'Layered neutrals and elegant drape',
    vibe: 'Soft structure',
    imageUrl: photo('1503342217505-b0a15ec3261c'),
    height: 332,
    categories: ['Modest / Elegant', 'Neutral / Luxe', 'Travel'],
  },
  {
    id: '17',
    title: 'Oversized coat city uniform',
    vibe: 'Sharp winter streetwear',
    imageUrl: photo('1499951360447-b19be8fe80f5'),
    height: 252,
    categories: ['Streetwear', 'Baggy / Oversized', 'Winter', 'Airport Style'],
  },
  {
    id: '18',
    title: 'Pearl satin reception edit',
    vibe: 'Soft glamour',
    imageUrl: photo('1492106087820-71f1a00d2b11'),
    height: 236,
    categories: ['Wedding / Festive', 'Soft Feminine', 'Date Night'],
  },
  {
    id: '19',
    title: 'Soft charcoal dinner drape',
    vibe: 'Monochrome romance',
    imageUrl: photo('1500917293891-ef795e70e1f6'),
    height: 318,
    categories: ['Party / Evening', 'Date Night'],
  },
  {
    id: '20',
    title: 'Structured shirting with gold watch',
    vibe: 'Desk-to-dinner',
    imageUrl: photo('1507679799987-c73779587ccf'),
    height: 266,
    categories: ['Office', 'Old Money / Quiet Luxury', 'Neutral / Luxe'],
  },
  {
    id: '21',
    title: 'Cashmere layers and polished loafers',
    vibe: 'Luxe cold weather',
    imageUrl: photo('1539008835657-9e8e9680c956'),
    height: 298,
    categories: ['Old Money / Quiet Luxury', 'Winter', 'Travel'],
  },
  {
    id: '22',
    title: 'Midnight modest set',
    vibe: 'Sleek volume',
    imageUrl: photo('1541099649105-f69ad21f3246'),
    height: 246,
    categories: ['Modest / Elegant', 'Party / Evening', 'Formal'],
  },
  {
    id: '23',
    title: 'Weekend leather and loafers',
    vibe: 'Easy cool',
    imageUrl: photo('1495385794356-15371f348c31'),
    height: 284,
    categories: ['Casual', 'Travel', 'Streetwear'],
  },
  {
    id: '24',
    title: 'Champagne satin evening set',
    vibe: 'Liquid shine',
    imageUrl: photo('1551232864-3f0890e580d9'),
    height: 228,
    categories: ['Formal', 'Soft Feminine', 'Party / Evening'],
  },
  {
    id: '25',
    title: 'Sport court off-duty set',
    vibe: 'Clean athleisure',
    imageUrl: photo('1551488831-00ddcb6c6bd3'),
    height: 272,
    categories: ['Sporty Chic', 'Casual', 'Airport Style'],
  },
  {
    id: '26',
    title: 'Puffer, leggings, espresso tote',
    vibe: 'Cold airport run',
    imageUrl: photo('1552374196-c4e7ffc6e126'),
    height: 306,
    categories: ['Sporty Chic', 'Winter', 'Travel'],
  },
  {
    id: '27',
    title: 'Editorial camel coat moment',
    vibe: 'Heritage layers',
    imageUrl: photo('1552902865-b72c031ac5ea'),
    height: 238,
    categories: ['Old Money / Quiet Luxury', 'Winter', 'Neutral / Luxe'],
  },
  {
    id: '28',
    title: 'Minimal tailoring and tonal knit',
    vibe: 'Quiet structure',
    imageUrl: photo('1559963110-6d2b8523b6d1'),
    height: 282,
    categories: ['Minimal / Clean Girl', 'Office', 'Winter'],
  },
  {
    id: '29',
    title: 'Flowing ivory layers',
    vibe: 'Soft seasonal light',
    imageUrl: photo('1560243563-062bfc001d68'),
    height: 322,
    categories: ['Modest / Elegant', 'Soft Feminine', 'Summer'],
  },
  {
    id: '30',
    title: 'Sunlit terrace set',
    vibe: 'Resort polish',
    imageUrl: photo('1568251188392-ae32f898cb3b'),
    height: 244,
    categories: ['Summer', 'Travel', 'Neutral / Luxe'],
  },
  {
    id: '31',
    title: 'Emerald festive shimmer',
    vibe: 'Jewel-tone evening',
    imageUrl: photo('1571513722275-4b41940f54b8'),
    height: 304,
    categories: ['Eid / Eastern Glam', 'Party / Evening', 'Wedding / Festive'],
  },
  {
    id: '32',
    title: 'Gold embroidered evening look',
    vibe: 'Festive tailoring',
    imageUrl: photo('1571513800374-df1bbe650e56'),
    height: 258,
    categories: ['Eid / Eastern Glam', 'Wedding / Festive', 'Formal', 'Modest / Elegant'],
  },
  {
    id: '33',
    title: 'Monochrome airport uniform',
    vibe: 'Quiet transit style',
    imageUrl: photo('1578632767115-351597cf2477'),
    height: 292,
    categories: ['Airport Style', 'Baggy / Oversized', 'Minimal / Clean Girl', 'Travel'],
  },
  {
    id: '34',
    title: 'Leather blazer downtown edit',
    vibe: 'Sharp downtown edge',
    imageUrl: photo('1581044777550-4cfa60707c03'),
    height: 232,
    categories: ['Streetwear', 'Date Night', 'Formal'],
  },
  {
    id: '35',
    title: 'Soft knit and pleated skirt',
    vibe: 'Feminine layers',
    imageUrl: photo('1594633312681-425c7b97ccd1'),
    height: 274,
    categories: ['Soft Feminine', 'Casual', 'Winter'],
  },
  {
    id: '36',
    title: 'Clean sneakers and trench',
    vibe: 'Elevated transit uniform',
    imageUrl: photo('1603252109303-2751441dd157'),
    height: 286,
    categories: ['Streetwear', 'Baggy / Oversized', 'Airport Style', 'Sporty Chic'],
  },
  {
    id: '37',
    title: 'Olive tailoring for city summer',
    vibe: 'Warm-weather office',
    imageUrl: photo('1604361859295-df8a8b715a28'),
    height: 246,
    categories: ['Summer', 'Office', 'Casual'],
  },
  {
    id: '38',
    title: 'Chocolate lounge set',
    vibe: 'Soft travel layers',
    imageUrl: photo('1605497788044-5a32c7078486'),
    height: 222,
    categories: ['Travel', 'Casual', 'Sporty Chic'],
  },
  {
    id: '39',
    title: 'Velvet evening edit',
    vibe: 'Moody event glamour',
    imageUrl: photo('1608245449230-4ac19066d2d0'),
    height: 312,
    categories: ['Party / Evening', 'Formal', 'Date Night'],
  },
  {
    id: '40',
    title: 'Modern festive jewel tones',
    vibe: 'Luxury celebration',
    imageUrl: photo('1617019114583-affb34d1b3cd'),
    height: 264,
    categories: ['Eid / Eastern Glam', 'Modest / Elegant', 'Party / Evening', 'Wedding / Festive'],
  },
  {
    id: '41',
    title: 'Polished cream pleats',
    vibe: 'Quiet society chic',
    imageUrl: photo('1617042375876-a13e36732a04'),
    height: 298,
    categories: ['Old Money / Quiet Luxury', 'Minimal / Clean Girl', 'Formal'],
  },
  {
    id: '42',
    title: 'Street-sport monochrome',
    vibe: 'Runway athletic edge',
    imageUrl: photo('1617137968427-85924c800a22'),
    height: 238,
    categories: ['Sporty Chic', 'Streetwear', 'Baggy / Oversized'],
  },
  {
    id: '44',
    title: 'Concrete bench tonal set',
    vibe: 'Downtown off-duty',
    imageUrl: photo('1588117260148-b47818741c74'),
    height: 284,
    categories: ['Streetwear', 'Baggy / Oversized', 'Casual'],
  },
  {
    id: '45',
    title: 'Graphic layers and volume',
    vibe: 'Modern city cool',
    imageUrl: photo('1635650804483-2a77a8c9e728'),
    height: 332,
    categories: ['Streetwear', 'Baggy / Oversized', 'Casual'],
  },
  {
    id: '46',
    title: 'Runway street monochrome',
    vibe: 'Sharp sneaker mood',
    imageUrl: photo('1721637686340-de9f8cebda5a'),
    height: 300,
    categories: ['Streetwear', 'Baggy / Oversized', 'Sporty Chic'],
  },
  {
    id: '47',
    title: 'Chocolate city tailoring',
    vibe: 'Modern power dressing',
    imageUrl: photo('1751399566412-ad1194241c5c'),
    height: 324,
    categories: ['Office', 'Formal', 'Neutral / Luxe'],
  },
  {
    id: '48',
    title: 'Camel blazer desk edit',
    vibe: 'Polished weekday ease',
    imageUrl: photo('1696453423785-727e165462c1'),
    height: 286,
    categories: ['Office', 'Casual'],
  },
  {
    id: '49',
    title: 'Soft tailoring with magazine',
    vibe: 'Workwear editorial',
    imageUrl: photo('1696453423332-e2e75f5c8dfd'),
    height: 248,
    categories: ['Office', 'Minimal / Clean Girl'],
  },
  {
    id: '50',
    title: 'Quiet-luxury lounge look',
    vibe: 'Hotel lobby neutral',
    imageUrl: photo('1720247521744-d58a14636882'),
    height: 304,
    categories: ['Old Money / Quiet Luxury', 'Neutral / Luxe', 'Travel'],
  },
  {
    id: '51',
    title: 'Ivory terrace tailoring',
    vibe: 'Understated wealth',
    imageUrl: photo('1507652313519-d4e9174996dd'),
    height: 294,
    categories: ['Old Money / Quiet Luxury', 'Neutral / Luxe', 'Formal'],
  },
  {
    id: '52',
    title: 'Resort pearl set',
    vibe: 'Soft-spoken opulence',
    imageUrl: photo('1445019980597-93fa8acb246c'),
    height: 336,
    categories: ['Old Money / Quiet Luxury', 'Neutral / Luxe', 'Summer'],
  },
  {
    id: '53',
    title: 'Cream-on-cream minimal layers',
    vibe: 'Gallery clean',
    imageUrl: photo('1618168138573-fb0ca752e4b7'),
    height: 282,
    categories: ['Minimal / Clean Girl', 'Neutral / Luxe', 'Old Money / Quiet Luxury'],
  },
  {
    id: '54',
    title: 'Soft mocha modest drape',
    vibe: 'Refined coverage',
    imageUrl: photo('1627359212239-3d82a215af75'),
    height: 298,
    categories: ['Modest / Elegant', 'Neutral / Luxe'],
  },
  {
    id: '55',
    title: 'Structured veil-inspired layers',
    vibe: 'Elegant modest lines',
    imageUrl: photo('1539109136881-3be0616acf4b'),
    height: 342,
    categories: ['Modest / Elegant', 'Formal'],
  },
  {
    id: '56',
    title: 'Evening modest satin',
    vibe: 'Covered glamour',
    imageUrl: photo('1668028563825-f3b7138db3de'),
    height: 306,
    categories: ['Modest / Elegant', 'Party / Evening', 'Eid / Eastern Glam'],
  },
  {
    id: '57',
    title: 'Desert-tone elegant set',
    vibe: 'Graceful movement',
    imageUrl: photo('1509087859087-a384654eca4d'),
    height: 288,
    categories: ['Modest / Elegant', 'Summer', 'Neutral / Luxe'],
  },
  {
    id: '58',
    title: 'Tonal evening coverage',
    vibe: 'Festive poise',
    imageUrl: photo('1668028554854-245f8ccae15b'),
    height: 322,
    categories: ['Modest / Elegant', 'Formal', 'Party / Evening', 'Eid / Eastern Glam'],
  },
  {
    id: '59',
    title: 'Blue-sky sundress edit',
    vibe: 'Warm-weather polish',
    imageUrl: photo('1613966570650-add3cf83aa83'),
    height: 316,
    categories: ['Summer', 'Casual', 'Soft Feminine'],
  },
  {
    id: '60',
    title: 'Golden-hour floral movement',
    vibe: 'Vacation bloom',
    imageUrl: photo('1593105522065-9a6ecd21aeb2'),
    height: 286,
    categories: ['Summer', 'Travel', 'Soft Feminine'],
  },
  {
    id: '61',
    title: 'Market-day linen dress',
    vibe: 'Breezy chic',
    imageUrl: photo('1532675432006-329c6fed7045'),
    height: 332,
    categories: ['Summer', 'Casual', 'Travel'],
  },
  {
    id: '62',
    title: 'Sunset resort red',
    vibe: 'Holiday statement',
    imageUrl: photo('1604506272685-a999a4d122e7'),
    height: 300,
    categories: ['Summer', 'Party / Evening', 'Travel'],
  },
  {
    id: '63',
    title: 'Coastal basket look',
    vibe: 'Easy luxe getaway',
    imageUrl: photo('1496217590455-aa63a8350eea'),
    height: 274,
    categories: ['Summer', 'Neutral / Luxe', 'Travel'],
  },
  {
    id: '65',
    title: 'Snow-hat statement coat',
    vibe: 'Cold-weather luxe',
    imageUrl: photo('1704967569554-d0f47e76c420'),
    height: 302,
    categories: ['Winter', 'Old Money / Quiet Luxury'],
  },
  {
    id: '66',
    title: 'Frosted city layers',
    vibe: 'Cold-season tailoring',
    imageUrl: photo('1632965551046-052f2d3394ca'),
    height: 336,
    categories: ['Winter', 'Streetwear'],
  },
  {
    id: '67',
    title: 'Leather and knit winter edit',
    vibe: 'Sleek cold-weather edge',
    imageUrl: photo('1612096536102-93f503aa2419'),
    height: 276,
    categories: ['Winter', 'Streetwear'],
  },
  {
    id: '68',
    title: 'Transit sign-off look',
    vibe: 'Minimal airport uniform',
    imageUrl: photo('1693614076723-f96c711cbc4f'),
    height: 308,
    categories: ['Airport Style', 'Baggy / Oversized', 'Travel', 'Minimal / Clean Girl'],
  },
  {
    id: '69',
    title: 'Terminal floral jumpsuit',
    vibe: 'Statement departure look',
    imageUrl: photo('1768803968246-5b8c7d04b722'),
    height: 284,
    categories: ['Airport Style', 'Travel', 'Party / Evening'],
  },
  {
    id: '70',
    title: 'Printed airport set',
    vibe: 'Fashion-week arrival',
    imageUrl: photo('1768803968262-320d4752966f'),
    height: 332,
    categories: ['Airport Style', 'Travel', 'Casual'],
  },
  {
    id: '71',
    title: 'Wide-leg terminal tunic',
    vibe: 'Elegant travel volume',
    imageUrl: photo('1765958317175-230c29d4865a'),
    height: 294,
    categories: ['Airport Style', 'Baggy / Oversized', 'Travel', 'Modest / Elegant'],
  },
  {
    id: '72',
    title: 'Oversized blazer city stride',
    vibe: 'Sharp relaxed tailoring',
    imageUrl: photo('1696451203186-6eb38b06fbbc'),
    height: 312,
    categories: ['Baggy / Oversized', 'Office', 'Streetwear'],
  },
  {
    id: '73',
    title: 'Editorial blazer off-duty pose',
    vibe: 'Runway-off-duty',
    imageUrl: photo('1768943913423-e6dfc55f8237'),
    height: 300,
    categories: ['Baggy / Oversized', 'Formal', 'Office'],
  },
  {
    id: '74',
    title: 'Relaxed ivory blazer set',
    vibe: 'Quiet luxury ease',
    imageUrl: photo('1615348411055-3492a2c76ca2'),
    height: 326,
    categories: ['Old Money / Quiet Luxury', 'Baggy / Oversized', 'Office'],
  },
  {
    id: '75',
    title: 'Grey blazer model-off-duty',
    vibe: 'Terminal tailoring',
    imageUrl: photo('1615349719958-8e6381dd2f3e'),
    height: 282,
    categories: ['Airport Style', 'Office', 'Old Money / Quiet Luxury'],
  },
  {
    id: '76',
    title: 'Neutral wall off-duty edit',
    vibe: 'Pinterest clean cool',
    imageUrl: photo('1726591383658-37fc19442523'),
    height: 292,
    categories: ['Minimal / Clean Girl', 'Neutral / Luxe', 'Old Money / Quiet Luxury'],
  },
  {
    id: '77',
    title: 'Puffer and denim off-duty',
    vibe: 'Model travel layers',
    imageUrl: photo('1754746804782-fcf470a9b5e7'),
    height: 316,
    categories: ['Airport Style', 'Winter', 'Sporty Chic'],
  },
  {
    id: '78',
    title: 'Plaid wide-leg campus look',
    vibe: 'Relaxed Gen Z layering',
    imageUrl: photo('1613950484946-76317fcf8f77'),
    height: 302,
    categories: ['Baggy / Oversized', 'Casual', 'Streetwear'],
  },
  {
    id: '79',
    title: 'Riverfront cargo sunglasses',
    vibe: 'Sporty street uniform',
    imageUrl: photo('1763696069136-23a95e615c81'),
    height: 330,
    categories: ['Baggy / Oversized', 'Streetwear', 'Sporty Chic'],
  },
  {
    id: '80',
    title: 'Moto cargo off-duty pose',
    vibe: 'Relaxed utility edge',
    imageUrl: photo('1763696069598-6e74f9335601'),
    height: 308,
    categories: ['Baggy / Oversized', 'Streetwear', 'Sporty Chic'],
  },
  {
    id: '81',
    title: 'Wide-leg pink utility set',
    vibe: 'Playful oversized ease',
    imageUrl: photo('1600803177171-b9fbcc3018f5'),
    height: 294,
    categories: ['Baggy / Oversized', 'Casual', 'Streetwear'],
  },
  {
    id: '82',
    title: 'Ivory hijab monochrome',
    vibe: 'Refined Eid minimalism',
    imageUrl: photo('1585728748176-455ac5eed962'),
    height: 314,
    categories: ['Eid / Eastern Glam', 'Modest / Elegant', 'Minimal / Clean Girl'],
  },
  {
    id: '83',
    title: 'Soft glam black festive',
    vibe: 'Evening Eid polish',
    imageUrl: photo('1668028554553-f83cac89ce0f'),
    height: 320,
    categories: ['Eid / Eastern Glam', 'Party / Evening', 'Modest / Elegant'],
  },
  {
    id: '84',
    title: 'Blue scarf everyday elegance',
    vibe: 'Polished modest chic',
    imageUrl: photo('1673908869716-abb13b862661'),
    height: 286,
    categories: ['Modest / Elegant', 'Casual', 'Travel'],
  },
  {
    id: '85',
    title: 'Tan oversized essentials',
    vibe: 'Baggy neutral layers',
    imageUrl: photo('1721111260570-456f3306f8d4'),
    height: 324,
    categories: ['Baggy / Oversized', 'Streetwear', 'Casual'],
  },
];

function normalizeImageUrl(url: string) {
  return url.trim().toLowerCase().split('?')[0];
}

function dedupeImageUrls(urls: string[]) {
  const seen = new Set<string>();

  return urls.filter((url) => {
    const normalizedUrl = normalizeImageUrl(url);

    if (!normalizedUrl || seen.has(normalizedUrl)) {
      return false;
    }

    seen.add(normalizedUrl);
    return true;
  });
}

function dedupeExploreFeedItems(items: ExploreInspirationItem[]) {
  const seenIds = new Set<string>();
  const seenImages = new Set<string>();

  return items.filter((item) => {
    const normalizedUrl = normalizeImageUrl(item.imageUrl);

    if (!item.imageUrl || seenIds.has(item.id) || seenImages.has(normalizedUrl)) {
      return false;
    }

    seenIds.add(item.id);
    seenImages.add(normalizedUrl);
    return true;
  });
}

function attachFallbackImageUrls(item: ExploreInspirationItem): ExploreInspirationItem {
  const fallbackImageUrls = dedupeImageUrls([
    ...item.categories.flatMap((category) => CATEGORY_FALLBACK_IMAGE_URLS[category] ?? []),
    ...DEFAULT_FALLBACK_IMAGE_URLS,
  ])
    .filter((url) => normalizeImageUrl(url) !== normalizeImageUrl(item.imageUrl))
    .slice(0, 4);

  return {
    ...item,
    fallbackImageUrls,
  };
}

function buildMixedAllFeed(items: ExploreInspirationItem[]) {
  const buckets = new Map<ExploreTag, ExploreInspirationItem[]>();

  ALL_FEED_MIX_ORDER.forEach((category) => {
    buckets.set(category, []);
  });

  items.forEach((item) => {
    const primaryCategory = item.categories[0];
    const bucket = buckets.get(primaryCategory);

    if (bucket) {
      bucket.push(item);
    }
  });

  const mixedItems: ExploreInspirationItem[] = [];
  let hasPendingItems = true;

  while (hasPendingItems) {
    hasPendingItems = false;

    ALL_FEED_MIX_ORDER.forEach((category) => {
      const bucket = buckets.get(category);

      if (!bucket || bucket.length === 0) {
        return;
      }

      mixedItems.push(bucket.shift()!);
      hasPendingItems = true;
    });
  }

  return mixedItems;
}

export function finalizeExploreFeedItems(items: ExploreInspirationItem[]) {
  return dedupeExploreFeedItems(items).map(attachFallbackImageUrls);
}

export function mergeExploreFeedItems(...collections: ExploreInspirationItem[][]) {
  return finalizeExploreFeedItems(collections.flat());
}

export const EXPLORE_FEED_ITEMS = finalizeExploreFeedItems(RAW_EXPLORE_FEED_ITEMS);

export function getExploreItemsByCategory(
  category: ExploreCategory,
  items: ExploreInspirationItem[] = EXPLORE_FEED_ITEMS
) {
  if (category === 'All') {
    return buildMixedAllFeed(items);
  }

  const primaryMatches = items.filter((item) => item.categories[0] === category);
  const secondaryMatches = items.filter(
    (item) => item.categories[0] !== category && item.categories.includes(category)
  );

  return [...primaryMatches, ...secondaryMatches];
}

export function buildBalancedColumns(items: ExploreInspirationItem[]) {
  const leftColumn: ExploreInspirationItem[] = [];
  const rightColumn: ExploreInspirationItem[] = [];
  let leftHeight = 0;
  let rightHeight = 18;

  items.forEach((item) => {
    if (leftHeight <= rightHeight) {
      leftColumn.push(item);
      leftHeight += item.height;
      return;
    }

    rightColumn.push(item);
    rightHeight += item.height;
  });

  return [leftColumn, rightColumn] as const;
}
