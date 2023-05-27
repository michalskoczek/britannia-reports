export interface Marks {
  viewValue: string;
  value: string;
}

export const marks: Marks[] = [
  { viewValue: '6', value: '6' },
  { viewValue: '5', value: '5' },
  { viewValue: '5-', value: '5-' },
  { viewValue: '4+', value: '4+' },
  { viewValue: '4', value: '4' },
  { viewValue: '4-', value: '4-' },
  { viewValue: '3+', value: '3+' },
  { viewValue: '3', value: '3' },
  { viewValue: '3-', value: '3-' },
  { viewValue: '2+', value: '2+' },
  { viewValue: '2', value: '2' },
  { viewValue: '1', value: '1' },
];

export const pronunciationMarks: Marks[] = [
  {
    viewValue: '5 - X ma nienaganną wymowę',
    value: 'X ma nienaganną wymowę',
  },
  {
    viewValue:
      '4 - X ma bardzo dobrą wymowę, a okazjonalne błędy nie zakłócają komunikacji.',
    value:
      'X ma bardzo dobrą wymowę, a okazjonalne błędy nie zakłócają komunikacji.',
  },
  {
    viewValue:
      '3 - X ma poprawną wymowę, ale należy popracować nad wymową niektórych głosek.',
    value:
      'X ma poprawną wymowę, ale należy popracować nad wymową niektórych głosek.',
  },
  {
    viewValue:
      '2 - X w większości przypadków wymawia słowa poprawnie, ale błędy czasem mogą zakłócać komunikację. Należy popracować nad wymową niektórych głosek.',
    value:
      'X w większości przypadków wymawia słowa poprawnie, ale błędy czasem mogą zakłócać komunikację. Należy popracować nad wymową niektórych głosek.',
  },
];

export const vocabularyMarks: Marks[] = [
  {
    viewValue:
      '5 - X ma bogaty zasób słownictwa i chętnie używa go w trakcie zajęć.',
    value: 'X ma bogaty zasób słownictwa i chętnie używa go w trakcie zajęć.',
  },
  {
    viewValue:
      '4 - X ma zadowalający zasób słownictwa i chętnie wykorzystuje go w trakcie zajęć.',
    value:
      'X ma zadowalający zasób słownictwa i chętnie wykorzystuje go w trakcie zajęć.',
  },
  {
    viewValue:
      '3 - X musi bardziej pracować w domu nad pamięciowym opanowaniem słownictwa, które pojawia się na zajęciach.',
    value:
      'X musi bardziej pracować w domu nad pamięciowym opanowaniem słownictwa, które pojawia się na zajęciach.',
  },
  {
    viewValue:
      '2 - X musi dużo bardziej popracować nad opanowaniem słownictwa, które pojawia się na zajęciach. Opanowanie słownictwa to jeden z najistotniejszych punktów w nauce języka obcego, bez którego trudno jest z sukcesem kontynuować naukę.',
    value:
      'X musi dużo bardziej popracować nad opanowaniem słownictwa, które pojawia się na zajęciach. Opanowanie słownictwa to jeden z najistotniejszych punktów w nauce języka obcego, bez którego trudno jest z sukcesem kontynuować naukę.',
  },
];

export const prepareToLectureMarks: Marks[] = [
  {
    viewValue: '5 - X zawsze w pełni przygotowuje się do zajęć.',
    value: 'X zawsze w pełni przygotowuje się do zajęć.',
  },
  {
    viewValue: '4 - X zwykle dobrze przygotowuje się do zajęć.',
    value: 'X zwykle dobrze przygotowuje się do zajęć.',
  },
  {
    viewValue: '3 - X dość często nie przygotowuje się w pełni do zajęć.',
    value: 'X dość często nie przygotowuje się w pełni do zajęć.',
  },
  {
    viewValue: '2 - X rzadko przygotowuje się do zajęć.',
    value: 'X rzadko przygotowuje się do zajęć.',
  },
];

export const homeworksMarks: Marks[] = [
  {
    viewValue: '5 - X zawsze odrabia zadaną pracę domową.',
    value: 'X zawsze odrabia zadaną pracę domową.',
  },
  {
    viewValue: '4 - X od czasu do czasu nie odrabia zadanej pracy domowej.',
    value: 'X od czasu do czasu nie odrabia zadanej pracy domowej.',
  },
  {
    viewValue: '3 - X często nie odrabia zadanej pracy domowej.',
    value: 'X często nie odrabia zadanej pracy domowej.',
  },
  {
    viewValue: '2 - X najczęściej nie ma pracy domowej.',
    value: 'X najczęściej nie ma pracy domowej.',
  },
];

export const involvementMarks: Marks[] = [
  {
    viewValue:
      '5 - X z dużym zaangażowaniem bierze udział w zajęciach. Chętnie odpowiada na zadawane pytania i samodzielnie zgłasza się do odpowiedzi. Z motywację bierze udział we wszystkich proponowanych aktywnościach.',
    value:
      'X z dużym zaangażowaniem bierze udział w zajęciach. Chętnie odpowiada na zadawane pytania i samodzielnie zgłasza się do odpowiedzi. Z motywację bierze udział we wszystkich proponowanych aktywnościach.',
  },
  {
    viewValue:
      '4 - X chętnie bierze udział w zajęciach, ale samodzielne odpowiedzi wymagają zachęty ze strony lektora.  Z motywację bierze udział w większości proponowanych aktywności.',
    value:
      'X chętnie bierze udział w zajęciach, ale samodzielne odpowiedzi wymagają zachęty ze strony lektora.  Z motywację bierze udział w większości proponowanych aktywności.',
  },
  {
    viewValue:
      '3 - X zwykle angażuje się w przebieg zajęć. Prawie zawsze potrzebuje zachęty nauczyciela, by samodzielnie odpowiedzieć na pytania, rzadko robi to z własnej inicjatywy.',
    value:
      'X zwykle angażuje się w przebieg zajęć. Prawie zawsze potrzebuje zachęty nauczyciela, by samodzielnie odpowiedzieć na pytania, rzadko robi to z własnej inicjatywy.',
  },
  {
    viewValue:
      '2 - X podchodzi dość do zajęć dość obojętnie. Nie wykazuje inicjatywy, odpowiada na pytania w zasadzie tylko po wskazaniu przez lektora.',
    value:
      'X podchodzi dość do zajęć dość obojętnie. Nie wykazuje inicjatywy, odpowiada na pytania w zasadzie tylko po wskazaniu przez lektora.',
  },
];

export const behaviourMarks: Marks[] = [
  {
    viewValue:
      '5 - X na zajęciach zachowuje się wzorowo i nie sprawia żadnych problemów, które mogłyby zaburzać ich przebieg.',
    value:
      'X na zajęciach zachowuje się wzorowo i nie sprawia żadnych problemów, które mogłyby zaburzać ich przebieg.',
  },
  {
    viewValue:
      '4 - X na zajęciach zachowuje się bardzo dobrze. Odnosi się z szacunkiem do innych uczniów i uważnie słucha lektora.',
    value:
      'X na zajęciach zachowuje się bardzo dobrze. Odnosi się z szacunkiem do innych uczniów i uważnie słucha lektora.',
  },
  {
    viewValue:
      '3 - X na zajęciach zachowuje się w większości dobrze. Okazjonalnie zdarza mu się zachowywać głośno lub nie słuchać poleceń nauczyciela, jednak nie są to zachowania, które budziłyby większy niepokój.',
    value:
      'X na zajęciach zachowuje się w większości dobrze. Okazjonalnie zdarza mu się zachowywać głośno lub nie słuchać poleceń nauczyciela, jednak nie są to zachowania, które budziłyby większy niepokój.',
  },
  {
    viewValue:
      '2 - X na zajęciach zachowuje się zwykle nieodpowiednio. Nie reaguje na uwagi nauczyciela i rozprasza innych uczniów.',
    value:
      'X na zajęciach zachowuje się zwykle nieodpowiednio. Nie reaguje na uwagi nauczyciela i rozprasza innych uczniów.',
  },
];
