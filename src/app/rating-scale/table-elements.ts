export interface TableElement {
  mark: string;
  percent: string;
}

export const ELEMENT_DATA: TableElement[] = [
  { mark: '1', percent: '0-44%' },
  { mark: '2', percent: '45-54%' },
  { mark: '2+', percent: '55-59%' },
  { mark: '3-', percent: '60-63%' },
  { mark: '3', percent: '64-69%' },
  { mark: '3+', percent: '70-74%' },
  { mark: '4-', percent: '75-79%' },
  { mark: '4', percent: '80-84%' },
  { mark: '4+', percent: '85-89%' },
  { mark: '5-', percent: '90-95%' },
  { mark: '5', percent: '96-100%' },
  {
    mark: '6',
    percent: '100%+',
  },
];
