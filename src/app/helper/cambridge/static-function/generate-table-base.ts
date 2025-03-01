import { ExamTypes } from '../../../shared/enum/exam-type.enum';
import { GenerateTableA1 } from './generate-table-A1';
import { GenerateTableA2B1 } from './generate-table-A2-B1';
import { GenerateTableB2C1 } from './generate-table-B2-C1';
import { FormGroup } from '@angular/forms';

export class GenerateTableBase {
  static chooseTableOfExam = (form: FormGroup) => {
    if (
      form.value.typeOfExam === ExamTypes.STARTERS ||
      form.value.typeOfExam === ExamTypes.MOVERS ||
      form.value.typeOfExam === ExamTypes.FLYERS
    ) {
      if (
        form.value.listeningA1Array.length === 3 ||
        form.value.writingAndReadingA1Array.length === 3 ||
        form.value.speakingA1Array.length === 3
      ) {
        return GenerateTableA1.generateTableOfA1ExamsThreeTerms(form);
      } else if (
        form.value.listeningA1Array.length === 2 ||
        form.value.writingAndReadingA1Array.length === 2 ||
        form.value.speakingA1Array.length === 2
      ) {
        return GenerateTableA1.generateTableOfA1ExamsTwoTerm(form);
      } else if (
        form.value.listeningA1Array.length === 1 ||
        form.value.writingAndReadingA1Array.length === 1 ||
        form.value.speakingA1Array.length === 1
      ) {
        return GenerateTableA1.generateTableOfA1ExamsOneTerm(form);
      } else return [];
    } else if (
      form.value.typeOfExam === ExamTypes.A2_KEY ||
      form.value.typeOfExam === ExamTypes.B1_PRELIMINARY
    ) {
      if (
        form.value.listeningA2B1Array.length === 3 ||
        form.value.readingA2B1Array.length === 3 ||
        form.value.writingA2B1Array.length === 3 ||
        form.value.speakingA2B1Array.length === 3
      ) {
        return GenerateTableA2B1.generateTableOfA2B1ExamsThreeTerms(form);
      } else if (
        form.value.listeningA2B1Array.length === 2 ||
        form.value.readingA2B1Array.length === 2 ||
        form.value.writingA2B1Array.length === 2 ||
        form.value.speakingA2B1Array.length === 2
      ) {
        return GenerateTableA2B1.generateTableOfA2B1ExamsTwoTerms(form);
      } else if (
        form.value.listeningA2B1Array.length === 1 ||
        form.value.readingA2B1Array.length === 1 ||
        form.value.writingA2B1Array.length === 1 ||
        form.value.speakingA2B1Array.length === 1
      ) {
        return GenerateTableA2B1.generateTableOfA2B1ExamsOneTerm(form);
      } else return [];
    } else if (
      form.value.typeOfExam === ExamTypes.B2_FIRST ||
      form.value.typeOfExam === ExamTypes.C1_ADVANCED
    ) {
      if (
        form.value.listeningB2C1Array.length === 3 ||
        form.value.readingB2C1Array.length === 3 ||
        form.value.useOfEnglishB2C1Array.length === 3 ||
        form.value.writingB2C1Array.length === 3 ||
        form.value.speakingB2C1Array.length === 3
      ) {
        return GenerateTableB2C1.generateTableOfB2C1ExamsThreeTerms(form);
      } else if (
        form.value.listeningB2C1Array.length === 2 ||
        form.value.readingB2C1Array.length === 2 ||
        form.value.useOfEnglishB2C1Array.length === 2 ||
        form.value.writingB2C1Array.length === 2 ||
        form.value.speakingB2C1Array.length === 2
      ) {
        return GenerateTableB2C1.generateTableOfB2C1ExamsTwoTerms(form);
      } else if (
        form.value.listeningB2C1Array.length === 1 ||
        form.value.readingB2C1Array.length === 1 ||
        form.value.useOfEnglishB2C1Array.length === 1 ||
        form.value.writingB2C1Array.length === 1 ||
        form.value.speakingB2C1Array.length === 1
      ) {
        return GenerateTableB2C1.generateTableOfB2C1ExamsOneTerm(form);
      } else return [];
    }
  };
}
