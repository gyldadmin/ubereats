import React from 'react';
import { NativeDateTimePicker as BaseNativeDateTimePicker } from '../ui';

interface NativeDateTimePickerProps {
  label: string;
  value: Date;
  onValueChange: (date: Date) => void;
  mode?: 'datetime' | 'date' | 'time';
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: boolean;
}

export default function NativeDateTimePicker(props: NativeDateTimePickerProps) {
  return <BaseNativeDateTimePicker {...props} />;
} 