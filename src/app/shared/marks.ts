export interface Marks {
  viewValue: string;
  value: string;
  viewValueFemale?: string;
  valueFemale?: string;
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
    viewValue: 'pronunciationMarkFiveViewValue',
    viewValueFemale: 'pronunciationMarkFiveViewValue',
    value:
      'X posługuje się bardzo dobrą, naturalną wymową. Wyraźnie artykułuje słowa, poprawnie realizuje głoski i akcent, a ewentualne drobne potknięcia nie wpływają na zrozumiałość wypowiedzi.',
    valueFemale:
      'X posługuje się bardzo dobrą, naturalną wymową. Wyraźnie artykułuje słowa, poprawnie realizuje głoski i akcent, a ewentualne drobne potknięcia nie wpływają na zrozumiałość wypowiedzi.',
  },
  {
    viewValue: 'pronunciationMarkFourViewValue',
    viewValueFemale: 'pronunciationMarkFourViewValue',
    value:
      'X ma dobrą i wyraźną wymowę. Sporadyczne błędy fonetyczne nie zakłócają komunikacji i nie utrudniają odbioru.',
    valueFemale:
      'X ma dobrą i wyraźną wymowę. Sporadyczne błędy fonetyczne nie zakłócają komunikacji i nie utrudniają odbioru.',
  },
  {
    viewValue: 'pronunciationMarkThreeViewValue',
    viewValueFemale: 'pronunciationMarkThreeViewValue',
    value:
      'X prezentuje wymowę na ogół poprawną. Zdarzają się błędy w trudniejszych głoskach lub intonacji, dlatego wskazana jest dalsza praca nad płynnością i precyzją artykulacji.',
    valueFemale:
      'X prezentuje wymowę na ogół poprawną. Zdarzają się błędy w trudniejszych głoskach lub intonacji, dlatego wskazana jest dalsza praca nad płynnością i precyzją artykulacji.',
  },
  {
    viewValue: 'pronunciationMarkTwoViewValue',
    viewValueFemale: 'pronunciationMarkTwoViewValue',
    value:
      'X w większości sytuacji wymawia słowa poprawnie, ale z wyraźnym obcym akcentem. Błędy fonetyczne mogą czasami utrudniać zrozumienie, co wymaga systematycznego doskonalenia wymowy.',
    valueFemale:
      'X w większości sytuacji wymawia słowa poprawnie, ale z wyraźnym obcym akcentem. Błędy fonetyczne mogą czasami utrudniać zrozumienie, co wymaga systematycznego doskonalenia wymowy.',
  },
];

export const vocabularyMarks: Marks[] = [
  {
    viewValue: 'vocabularyMarkFiveViewValue',
    viewValueFemale: 'vocabularyMarkFiveViewValueFemale',
    value:
      'X dysponuje bardzo bogatym zasobem słownictwa. Swobodnie i trafnie dobiera wyrażenia, a jego wypowiedzi są precyzyjne, zróżnicowane i adekwatne do poziomu.',
    valueFemale:
      'X dysponuje bardzo bogatym zasobem słownictwa. Swobodnie i trafnie dobiera wyrażenia, a jej wypowiedzi są precyzyjne, zróżnicowane i adekwatne do poziomu. ',
  },
  {
    viewValue: 'vocabularyMarkFourViewValue',
    viewValueFemale: 'vocabularyMarkFourViewValue',
    value:
      'X ma szeroki i solidny zasób słownictwa. Chętnie wykorzystuje poznane słowa i zwroty w praktyce; drobne braki nie ograniczają komunikacji.',
    valueFemale:
      'X ma szeroki i solidny zasób słownictwa. Chętnie wykorzystuje poznane słowa i zwroty w praktyce; drobne braki nie ograniczają komunikacji.',
  },
  {
    viewValue: 'vocabularyMarkThreeViewValue',
    viewValueFemale: 'vocabularyMarkThreeViewValueFemale',
    value:
      'X posiada wystarczający zasób słownictwa na danym poziomie. Na ogół radzi sobie w typowych sytuacjach językowych, jednak wskazana jest dalsza praca nad utrwalaniem nowego materiału.',
    valueFemale:
      'X posiada wystarczający zasób słownictwa na danym poziomie. Na ogół radzi sobie w typowych sytuacjach językowych, jednak wskazana jest dalsza praca nad utrwalaniem nowego materiału.',
  },
  {
    viewValue: 'vocabularyMarkTwoViewValue',
    viewValueFemale: 'vocabularyMarkTwoViewValueFemale',
    value:
      'X ma ograniczony zasób słownictwa. Ma trudności z zastosowaniem poznanych słów i często potrzebuje wsparcia w budowaniu wypowiedzi; konieczne jest systematyczne doskonalenie leksyki.',
    valueFemale:
      'X ma ograniczony zasób słownictwa. Ma trudności z zastosowaniem poznanych słów i często potrzebuje wsparcia w budowaniu wypowiedzi; konieczne jest systematyczne doskonalenie leksyki.',
  },
];

export const prepareToLectureMarks: Marks[] = [
  {
    viewValue: 'preparationForClassesMarkFiveViewValue',
    viewValueFemale: 'preparationForClassesMarkFiveViewValue',
    value:
      'X zawsze w pełni przygotowuje się do zajęć. Regularnie odrabia prace domowe, utrwala materiał i aktywnie korzysta z przygotowanych treści.',
    valueFemale:
      'X zawsze w pełni przygotowuje się do zajęć. Regularnie odrabia prace domowe, utrwala materiał i aktywnie korzysta z przygotowanych treści.',
  },
  {
    viewValue: 'preparationForClassesMarkFourViewValue',
    viewValueFemale: 'preparationForClassesMarkFourViewValueFemale',
    value:
      'X zwykle dobrze przygotowuje się do zajęć. Systematycznie pracuje z materiałem, a ewentualne sporadyczne braki nie wpływają na postępy.',
    valueFemale:
      'X zwykle dobrze przygotowuje się do zajęć. Systematycznie pracuje z materiałem, a ewentualne sporadyczne braki nie wpływają na postępy.',
  },
  {
    viewValue: 'preparationForClassesMarkThreeViewValue',
    viewValueFemale: 'preparationForClassesMarkThreeViewValueFemale',
    value:
      'X wystarczająco przygotowuje się do zajęć, ale dość często nie utrwala materiału w pełnym zakresie, dlatego wskazana jest większa regularność w pracy własnej.',
    valueFemale:
      'X wystarczająco przygotowuje się do zajęć, ale dość często nie utrwala materiału w pełnym zakresie, dlatego wskazana jest większa regularność w pracy własnej.',
  },
  {
    viewValue: 'preparationForClassesMarkTwoViewValue',
    viewValueFemale: 'preparationForClassesMarkTwoViewValue',
    value:
      'X rzadko przygotowuje się do zajęć. Nieregularnie odrabia prace domowe i często przychodzi na lekcje bez znajomości przerabianego materiału.',
    valueFemale:
      'X rzadko przygotowuje się do zajęć. Nieregularnie odrabia prace domowe i często przychodzi na lekcje bez znajomości przerabianego materiału.',
  },
];

export const homeworksMarks: Marks[] = [
  {
    viewValue: 'homeworkMarkFiveViewValue',
    viewValueFemale: 'homeworkMarkFiveViewValueFemale',
    value:
      'X zawsze odrabia zadaną pracę domową. Wykonuje ją starannie i terminowo, co wyraźnie wspiera systematyczne postępy w nauce.',
    valueFemale:
      'X zawsze odrabia zadaną pracę domową. Wykonuje ją starannie i terminowo, co wyraźnie wspiera systematyczne postępy w nauce.',
  },
  {
    viewValue: 'homeworkMarkFourViewValue',
    viewValueFemale: 'homeworkMarkFourViewValueFemale',
    value:
      'X zwykle odrabia pracę domową. Zdarzają się sporadyczne braki lub drobne opóźnienia, jednak na ogół wywiązuje się z powierzonych zadań.',
    valueFemale:
      'X zwykle odrabia pracę domową. Zdarzają się sporadyczne braki lub drobne opóźnienia, jednak na ogół wywiązuje się z powierzonych zadań.',
  },
  {
    viewValue: 'homeworkMarkThreeViewValue',
    viewValueFemale: 'homeworkMarkThreeViewValue',
    value:
      'X odrabia pracę domową nieregularnie. Często nie wykonuje jej w pełnym zakresie, dlatego wskazana jest większa konsekwencja w pracy własnej.',
    valueFemale:
      'X odrabia pracę domową nieregularnie. Często nie wykonuje jej w pełnym zakresie, dlatego wskazana jest większa konsekwencja w pracy własnej.',
  },
  {
    viewValue: 'homeworkMarkTwoViewValue',
    viewValueFemale: 'homeworkMarkTwoViewValue',
    value:
      'X rzadko odrabia zadaną pracę domową. Brak przygotowania utrudnia utrwalanie materiału i ogranicza możliwość pełnego korzystania z zajęć.',
    valueFemale:
      'X rzadko odrabia zadaną pracę domową. Brak przygotowania utrudnia utrwalanie materiału i ogranicza możliwość pełnego korzystania z zajęć.',
  },
];

export const involvementMarks: Marks[] = [
  {
    viewValue: 'engagementMarkFiveViewValue',
    viewValueFemale: 'engagementMarkFiveViewValue',
    value:
      'X wykazuje bardzo duże zaangażowanie w trakcie zajęć. Chętnie odpowiada na pytania, samodzielnie zgłasza się do wypowiedzi i z wysoką motywacją bierze udział we wszystkich proponowanych aktywnościach. ',
    valueFemale:
      'X wykazuje bardzo duże zaangażowanie w trakcie zajęć. Chętnie odpowiada na pytania, samodzielnie zgłasza się do wypowiedzi i z wysoką motywacją bierze udział we wszystkich proponowanych aktywnościach. ',
  },
  {
    viewValue: 'engagementMarkFourViewValue',
    viewValueFemale: 'engagementMarkFourViewValueFemale',
    value:
      'X jest wyraźnie zaangażowany w przebieg lekcji. Aktywnie uczestniczy w zajęciach, choć jego samodzielne wypowiedzi czasami wymagają zachęty ze strony nauczyciela. Z motywacją bierze udział w większości aktywności.',
    valueFemale:
      'X jest wyraźnie zaangażowana w przebieg lekcji. Aktywnie uczestniczy w zajęciach, choć jej samodzielne wypowiedzi czasami wymagają zachęty ze strony nauczyciela. Z motywacją bierze udział w większości aktywności.',
  },
  {
    viewValue: 'engagementMarkThreeViewValue',
    viewValueFemale: 'engagementMarkThreeViewValueFemale',
    value:
      'X angażuje się na wystarczającym poziomie. Zwykle uczestniczy w lekcji i odpowiada na pytania, jednak rzadko robi to z własnej inicjatywy.',
    valueFemale:
      'X angażuje się na wystarczającym poziomie. Zwykle uczestniczy w lekcji i odpowiada na pytania, jednak rzadko robi to z własnej inicjatywy.',
  },
  {
    viewValue: 'engagementMarkTwoViewValue',
    viewValueFemale: 'engagementMarkTwoViewValue',
    value:
      'X podchodzi do zajęć dość obojętnie. Nie wykazuje inicjatywy i wypowiada się głównie po bezpośrednim wskazaniu przez lektora; konieczna jest praca nad motywacją do aktywniejszego udziału. ',
    valueFemale:
      'X podchodzi do zajęć dość obojętnie. Nie wykazuje inicjatywy i wypowiada się głównie po bezpośrednim wskazaniu przez lektora; konieczna jest praca nad motywacją do aktywniejszego udziału. ',
  },
];

export const behaviourMarks: Marks[] = [
  {
    viewValue: 'behaviourInClassMarkFiveViewValue',
    viewValueFemale: 'behaviourInClassMarkFiveViewValueFemale',
    value:
      'X zachowuje się na zajęciach wzorowo. Odnosi się z szacunkiem do nauczyciela i innych uczniów, uważnie słucha poleceń oraz aktywnie współpracuje w grupie.',
    valueFemale:
      'X zachowuje się na zajęciach wzorowo. Odnosi się z szacunkiem do nauczyciela i innych uczniów, uważnie słucha poleceń oraz aktywnie współpracuje w grupie.',
  },
  {
    viewValue: 'behaviourInClassMarkFourViewValue',
    viewValueFemale: 'behaviourInClassMarkFourViewValueFemale',
    value:
      'X zachowuje się bardzo dobrze. Przestrzega zasad obowiązujących w klasie i nie sprawia problemów wychowawczych; jego postawa sprzyja spokojnemu przebiegowi lekcji.',
    valueFemale:
      'X zachowuje się bardzo dobrze. Przestrzega zasad obowiązujących w klasie i nie sprawia problemów wychowawczych; jej postawa sprzyja spokojnemu przebiegowi lekcji.',
  },
  {
    viewValue: 'behaviourInClassMarkThreeViewValue',
    viewValueFemale: 'behaviourInClassMarkThreeViewValue',
    value:
      'X zachowuje się na ogół poprawne. Sporadyczny brak koncentracji nie zakłóca w istotny sposób pracy na zajęciach.',
    valueFemale:
      'X zachowuje się na ogół poprawne. Sporadyczny brak koncentracji nie zakłóca w istotny sposób pracy na zajęciach.',
  },
  {
    viewValue: 'behaviourInClassMarkTwoViewValue',
    viewValueFemale: 'behaviourInClassMarkTwoViewValue',
    value:
      'X miewa trudności z odpowiednim zachowaniem. Czasami nie reaguje na uwagi nauczyciela lub rozprasza innych, dlatego wskazana jest praca nad postawą na lekcji.',
    valueFemale:
      'X miewa trudności z odpowiednim zachowaniem. Czasami nie reaguje na uwagi nauczyciela lub rozprasza innych, dlatego wskazana jest praca nad postawą na lekcji.',
  },
];

export const frequencyMarks: Marks[] = [
  {
    viewValue: 'attendanceMarkFiveViewValue',
    value: 'Bardzo dobra',
  },
  {
    viewValue: 'attendanceMarkFourViewValue',
    value: 'Dobra',
  },
  {
    viewValue: 'attendanceMarkThreeViewValue',
    value: 'Dostateczna',
  },
  {
    viewValue: 'attendanceMarkTwoViewValue',
    value: 'Dopuszczająca',
  },
];
