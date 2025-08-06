import React from 'react';
import BaseEventDateTimePicker from '../ui/EventDateTimePicker';

interface EventDateTimePickerProps {
  label: string;
  startTime: Date;
  endTime: Date;
  onStartTimeChange: (date: Date) => void;
  onEndTimeChange: (date: Date) => void;
  disabled?: boolean;
  error?: boolean;
}

export const EventDateTimePicker: React.FC<EventDateTimePickerProps> = ({
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  error = false,
}) => {
  return (
    <BaseEventDateTimePicker
      label={label}
      startTime={startTime}
      endTime={endTime}
      onStartTimeChange={onStartTimeChange}
      onEndTimeChange={onEndTimeChange}
      disabled={disabled}
      error={error}
    />
  );
};

export default EventDateTimePicker; 