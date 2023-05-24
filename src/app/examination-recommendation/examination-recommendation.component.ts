import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
// @ts-ignore
import pdfMake from 'pdfmake/build/pdfmake';
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-examination-recommendation',
  templateUrl: './examination-recommendation.component.html',
  styleUrls: ['./examination-recommendation.component.scss'],
})
export class ExaminationRecommendationComponent implements OnInit {
  public commentsForm!: FormGroup;

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
    this.commentsForm = this.createForm();
  }

  get comments(): FormArray {
    return this.commentsForm.get('comments') as FormArray;
  }

  public addNextComment(): void {
    this.comments.push(new FormControl(null));
  }

  public generatePDF(form: FormGroup): any {
    let recommendationsArray: string[] = [];

    form.value.comments.forEach((comment: string) =>
      recommendationsArray.push(comment)
    );

    let docDefinition = {
      content: [
        { text: 'Rekomendacja egzaminacyjna', style: 'header' },
        { text: `${form.value.recommendation}` },
        { text: 'Dodatkowe informacje egzaminacyjne', style: 'header' },
        { ul: this.additionalExamInformations },
        { text: 'Organizacja kolejnego roku nauki', style: 'header' },
        'Całoroczna praca ucznia, jego zaangażowanie i stopień opanowania materiału, wyniki testów bieżących oraz próbnych egzaminów diagnozujących są dla nas ważne i stanowią podstawę do kwalifikacji do grup o zbliżonych kompetencjach językowych w kolejnym roku szkolnym. Bierzemy też pod uwagę indywidualne zdolności oraz stopień motywacji ucznia w trakcie całego roku szkolnego.',
        'Staramy się maksymalnie wspierać potencjał językowy uczniów i łączyć dzieci według umiejętności. Gdy tylko jest to możliwe, tworzymy trzy rodzaje kursów',
        { ol: this.kindOfCourses },
        { text: 'Rekomendacje', style: 'header' },
        { ul: recommendationsArray },
      ],
      styles: {
        header: {
          bold: true,
          fontSize: 15,
        },
      },
      defaultStyle: {
        fontSize: 12,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  }

  private createForm(): FormGroup {
    return new FormGroup({
      recommendation: new FormControl(null, Validators.required),
      comments: new FormArray([]),
    });
  }
}

{
}
