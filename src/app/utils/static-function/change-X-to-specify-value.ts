export const changeXToStudentName = (
  textValue: string,
  studentName: string
): string => {
  return textValue.replace(textValue[0], studentName);
};

export const changeXToYValue = (textValue: string, yValue: string): string => {
  return textValue.replace(textValue[0], yValue);
};

export const changeXToEmptyValue = (textValue: string): string => {
  return textValue.replace(textValue[0], '');
};
