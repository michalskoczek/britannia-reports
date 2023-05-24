import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ELEMENT_DATA, TableElement } from './rating-scale/table-elements';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'britannia-reports';

  public form!: FormGroup;

  public readonly classes: string[] = [
    'Klasa 2 szkoły podstawowej',
    'Klasa 3 szkoły podstawowej',
    'Klasa 4 szkoły podstawowej',
    'Klasa 5 szkoły podstawowej',
    'Klasa 6 szkoły podstawowej',
    'Klasa 7 szkoły podstawowej',
    'Klasa 8 szkoły podstawowej',
    'Klasa 1 szkoły średniej',
    'Klasa 2 szkoły średniej',
    'Klasa 3 szkoły średniej',
    'Klasa 4 szkoły średniej',
    'osoba dorosła',
  ];

  public readonly teachers: string[] = [
    'Regina Raczyńska',
    'Adam Sikorski',
    'Dorota Kot',
    'Aleksandra Mierzejewska',
    'Jolanta Rybak',
  ];

  public readonly books: string[] = [
    'Kid’s Box 1, wydawnictwo Cambridge',
    'Kid’s Box 2, wydawnictwo Cambridge',
    'Kid’s Box 3, wydawnictwo Cambridge',
    'Kid’s Box 4, wydawnictwo Cambridge',
    'Kid’s Box 5, wydawnictwo Cambridge',
    'Kid’s Box 6, wydawnictwo Cambridge',
    'Team Together 5, wydawnictwo Pearson',
    'Team Together 6, wydawnictwo Pearson',
  ];

  public readonly courses: string[] = [
    'English Pearls 2 / Pre-A1.1',
    'English Pearls 3 / Pre-A1.2',
    'English Amethysts 4 / A1.1',
    'English Amethysts 5 / A1.2',
    'English Emeralds 6 / A2.1',
    'English Emeralds 7 / A2.2',
    'English Rubies / B1.1',
    'English Rubies / B1.2',
    'English Saphires / B2.1',
    'English Saphires / B2.2',
    'English Diamonds / C1.1',
    'English Diamonds / C1.2',
  ];

  public readonly displayedColumns: string[] = ['percent', 'mark'];
  public readonly dataSource: TableElement[] = ELEMENT_DATA;

  public readonly marks: { viewValue: string; value: string }[] = [
    { viewValue: '1', value: '1' },
    { viewValue: '2', value: '2' },
    { viewValue: '2+', value: '2+' },
    { viewValue: '3-', value: '3-' },
    { viewValue: '3', value: '3' },
    { viewValue: '3+', value: '3+' },
    { viewValue: '4-', value: '4-' },
    { viewValue: '4', value: '4' },
    { viewValue: '4+', value: '4+' },
    { viewValue: '5-', value: '5-' },
    { viewValue: '5', value: '5' },
    { viewValue: '6', value: '6' },
  ];

  private readonly additionalExamInformations: string[] = [
    'BRITANNIA jest autoryzowanym Cambridge Preparation Centre, więc nasi uczniowie co roku zdają egzaminy na miejscu w szkole. Uczniowie mogą zdawać u nas egzaminy na wszystkich poziomach zaawansowania.',
    'Egzaminy organizowane są w czerwcu. W tym roku data egzaminów przypada na 16 czerwca.',
    'Do egzaminu Movers dzieci podchodzą zazwyczaj w 5 klasie, ale dzieci osiągające wysokie wyniki mogą podejść do tego egzaminu już w klasie 4.',
    'Samo doświadczenie przystąpienia do prawdziwego egzaminu i jego atmosfery jest ogromnie cenne. Przygotowuje dzieci mentalnie do zdawania kolejnych ważnych egzaminów, uodparnia je na stres i podnosi samoocenę. Daje dzieciom dużo motywacji do nauki, a po otrzymaniu certyfikatu z Anglii na naszej doniosłej uroczystości także wielką dozę satysfakcji i chęci do dalszego podnoszenia swoich umiejętności. Dzieci czują się naprawdę wyróżnione.',
    'Przede wszystkim jest to także najbardziej wiarygodne potwierdzenie uzyskanych umiejętności językowych. Wyniki i certyfikaty przysyłane są z Anglii. Co ważne, testy dla dzieci nie są oceniane jako: zdany/niezdany. Na certyfikacie widnieje liczba tarcz z każdej części testu. Można otrzymać maksymalnie 5 tarcz z każdej części, w sumie maksymalnie 15 tarcz za cały egzamin.',
    'Rekomendujemy zdawanie egzaminu po otrzymaniu co najmniej 80% z testów próbnych. Podejście do egzaminu ma być dla dziecka nagrodą i motywacją. Uczestnictwo nie jest obowiązkowe.',
    'Informacyjnie dodam, że koszt egzaminu w tym roku to 310zł - płatność jest na konto ośrodka egzaminacyjnego, nie do nas. My jesteśmy przewodnikami w drodze do sukcesu Państwa dziecka.',
  ];

  private readonly kindOfCourses: string[] = [
    'BFT czyli BRITANNIA Fast Track – dla uczniów celujących i wzorowych, którzy mają wyniki od 90% wzwyż, wyróżniają się swobodą w komunikacji i aktywnie wykorzystują poznane treści, są otwarci i maksymalnie zaangażowani w naukę, regularnie i w szybszym tempie podchodzą do kolejnych egzaminów Cambridge. Często w tej grupie znajdują się dzieci, które w kolejnych latach startują w konkursach językowych lub wybierają dwujęzyczne profile w liceum. Grupy BFT zazwyczaj nie są grupami dowożonymi, są złożone z dzieci z różnych klas i szkół',
    'BRT czyli BRITANNIA Regular Track – dla uczniów, którzy opanowali materiał bardzo dobrze i dobrze, są zawsze przygotowani, oraz chętni i zmotywowani, by posługiwać się angielskim i osiągać jak najlepsze rezultaty; zależy im, by jak najlepiej poznać angielski. Uczniowie z tej grupy zazwyczaj regularnie podchodzą do kolejnych egzaminów Cambridge.',
    'BST czyli BRITANNIA Support Track – dla uczniów osiągających wyniki poniżej 65% oraz tych, którzy potrzebują więcej wsparcia w opanowaniu materiału i z nieśmiałością podchodzą do aktywizacji mówienia i muszą bardziej otworzyć się na naukę.',
  ];

  ngOnInit(): void {
    this.form = this.createForm();
  }

  get comments(): FormArray {
    return this.form.get('comments') as FormArray;
  }

  public addNextComment(): void {
    this.comments.push(new FormControl(null));
  }

  get recommendations(): FormArray {
    return this.form.get('recommendations') as FormArray;
  }

  public addNextRecommendation(): void {
    this.recommendations.push(new FormControl(null));
  }

  public generatePDF(form: FormGroup): any {
    let date = new Date(form.value.date).toLocaleDateString();

    let commentsArray: string[] = [];
    form.value.comments.forEach((comment: string) =>
      commentsArray.push(comment)
    );

    let recommendationsArray: string[] = [];
    form.value.comments.forEach((comment: string) =>
      recommendationsArray.push(comment)
    );

    let docDefinition = {
      header: 'PODSUMOWANIE NAUKI i DALSZE REKOMENDACJE',
      content: [
        `Imię i Nazwisko ucznia: ${form.value.studentName}`,
        {
          style: 'tableExample',
          table: {
            body: [
              [
                { text: 'Data', style: 'tableHeader' },
                { text: `${date}` },
                { text: 'Klasa', style: 'tableHeader' },
                { text: `${form.value.class}` },
              ],
              [
                { text: 'Lektor', style: 'tableHeader' },
                { text: `${form.value.teacher}` },
                { text: 'Tytuł podręcznika', style: 'tableHeader' },
                { text: `${form.value.studentBookTitle}` },
              ],
              [
                { text: 'Kurs', style: 'tableHeader' },
                { text: `${form.value.course}` },
                { text: 'Zrealizowany materiał', style: 'tableHeader' },
                { text: `${form.value.realizedMaterial}` },
              ],
            ],
          },
        },
        {
          style: 'tableExample',
          table: {
            body: [
              [
                {
                  rowSpan: 11,
                  text: 'Nasza skala ocen',
                  style: 'tableHeader',
                },
                {
                  text: '96-100%',
                },
                {
                  text: '5',
                },
                {
                  rowSpan: 11,
                  text:
                    'OCENA 6' +
                    'Ocena celująca przyznawana jest za osiągnięcia specjalne, w szczególności za wyróżniające się odpowiedzi ustne lub pisemne.',
                },
                {
                  rowSpan: 9,
                  text: 'Uzyskane oceny',
                  style: 'tableHeader',
                },
                {
                  rowSpan: 9,
                  text: `${form.value.marks}`,
                  style: 'tableHeader',
                },
              ],
              [
                '',
                {
                  text: '90-95%',
                },
                {
                  text: '5-',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '85-89%',
                },
                {
                  text: '4+',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '80-84%',
                },
                {
                  text: '4',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '75-79%',
                },
                {
                  text: '4-',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '70-74%',
                },
                {
                  text: '3+',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '64-69%',
                },
                {
                  text: '3',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '60-63%',
                },
                {
                  text: '3-',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '55-59%',
                },
                {
                  text: '2+',
                },
                '',
                '',
                '',
              ],
              [
                '',
                {
                  text: '45-54%',
                },
                {
                  text: '2',
                },
                '',
                {
                  text: 'Bieżące postępy',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.avgMark}`,
                },
              ],
              [
                '',
                {
                  text: '0-44%',
                },
                {
                  text: '1',
                },
                '',
                {
                  text: 'Frekwencja',
                  style: 'tableHeader',
                },
                {
                  text: `${form.value.frequency}`,
                },
              ],
            ],
          },
          layout: {
            defaultBorder: true,
          },
        },
        {
          style: 'tableExample',
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Zaangażowanie i udział w lekcjach' },
                { text: `${form.value.involvement}` },
              ],
              [
                { text: 'Prowadzenie zeszytu, notatek' },
                { text: `${form.value.lead}` },
              ],
              [
                { text: 'Szacunek do nauczyciela i innych kursantów z grupy' },
                { text: `${form.value.respect}` },
              ],
              [
                { text: 'Skupienie uwagi na lekcjach' },
                { text: `${form.value.focus}` },
              ],
              [{ text: 'Zachowanie' }, { text: `${form.value.behaviour}` }],
            ],
          },
        },
        { text: 'Komentarz', style: 'header' },
        {
          ul: commentsArray,
        },
        { text: 'Rekomendacja egzaminacyjna', style: 'header' },
        { text: `${form.value.examRecommendation}` },
        { text: 'Dodatkowe informacje egzaminacyjne', style: 'header' },
        { ul: this.additionalExamInformations },
        { text: 'Organizacja kolejnego roku nauki', style: 'header' },
        'Całoroczna praca ucznia, jego zaangażowanie i stopień opanowania materiału, wyniki testów bieżących oraz próbnych egzaminów diagnozujących są dla nas ważne i stanowią podstawę do kwalifikacji do grup o zbliżonych kompetencjach językowych w kolejnym roku szkolnym. Bierzemy też pod uwagę indywidualne zdolności oraz stopień motywacji ucznia w trakcie całego roku szkolnego.',
        'Staramy się maksymalnie wspierać potencjał językowy uczniów i łączyć dzieci według umiejętności. Gdy tylko jest to możliwe, tworzymy trzy rodzaje kursów',
        { ol: this.kindOfCourses },
        { text: 'Rekomendacje', style: 'header' },
        { ul: recommendationsArray },
        { text: form.value.signature },
      ],
      styles: {
        tableHeader: {
          fontSize: 14,
          bold: true,
        },
        tableExample: {
          margin: [0, 5, 0, 15],
        },
        header: {
          bold: true,
          fontSize: 15,
        },
        defaultStyle: {
          fontSize: 12,
        },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      studentName: new FormControl(null, Validators.required),
      date: new FormControl(null, Validators.required),
      class: new FormControl(null, Validators.required),
      teacher: new FormControl(null, Validators.required),
      studentBookTitle: new FormControl(null, Validators.required),
      course: new FormControl(null, Validators.required),
      realizedMaterial: new FormControl(null, Validators.required),

      marks: new FormControl(null, Validators.required),
      avgMark: new FormControl(null, Validators.required),
      frequency: new FormControl(null, Validators.required),
      involvement: new FormControl(null, Validators.required),
      lead: new FormControl(null, Validators.required),
      respect: new FormControl(null, Validators.required),
      focus: new FormControl(null, Validators.required),
      behaviour: new FormControl(null, Validators.required),

      comments: new FormArray([]),

      examRecommendation: new FormControl(null, Validators.required),
      recommendations: new FormArray([]),

      signature: new FormControl(null, Validators.required),
    });
  }
}
