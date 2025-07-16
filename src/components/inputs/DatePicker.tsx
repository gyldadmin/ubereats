import DateTimePickerInput from '../ui/inputs/DatePickerInput';

interface DateTimePickerInputProps {
  label: string;
  value: Date | undefined;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'datetime' | 'date' | 'time';
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputMode?: 'outlined' | 'flat';
  dense?: boolean;
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  calendarIcon?: string;
  clearIcon?: string;
  showCalendarIcon?: boolean;
  showClearIcon?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  contentStyle?: any;
  testID?: string;
}

export const DatePicker = (props: DateTimePickerInputProps) => (
  <DateTimePickerInput {...props} />
); 