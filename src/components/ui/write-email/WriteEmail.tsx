import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { theme } from '../../../styles/theme';

// Input primitives
import SingleLineInput from '../inputs/SingleLineInput';
import MultiLineInput from '../inputs/MultiLineInput';
import { MultiSelect } from '../AdvancedMultiSelect';

export interface WriteEmailRecipient {
  id: string;
  email: string;
  name: string;
}

export interface WriteEmailProps {
  /** Determines the type of recipient row */
  type: 'pre-defined_recipients' | 'user-defined_recipients';

  /** Visible label when type === 'pre-defined_recipients' */
  recipientLabel?: string;
  /** Pre-filled recipients when type === 'pre-defined_recipients' */
  defaultRecipients?: WriteEmailRecipient[];

  /** All available recipients when type === 'user-defined_recipients' */
  recipientOptions?: WriteEmailRecipient[];
  /** Initially selected recipients IDs when type === 'user-defined_recipients' */
  defaultRecipientIds?: string[];

  /* Email template & button row */
  templateType?: 'basic' | 'basic_with_button' | string;
  buttonText?: string;

  /** Subject field defaults */
  defaultSubject?: string;
  subjectCharLimit?: number;

  /** Body field defaults */
  defaultBody?: string;
  bodyCharLimit?: number;

  /** Recipient limit (defaults to 40) */
  maxRecipients?: number;

  /** Callback triggered when user presses “Send”. */
  onSubmit: (payload: {
    recipients: WriteEmailRecipient[];
    subject: string;
    body: string;
  }) => void;

  /** Optional cancel handler */
  onCancel?: () => void;
}

export const WriteEmail: React.FC<WriteEmailProps> = ({
  type,
  recipientLabel = '',
  defaultRecipients = [],
  recipientOptions = [],
  defaultRecipientIds = [],
  templateType = 'basic',
  buttonText = 'Open',
  defaultSubject = '',
  subjectCharLimit = 600,
  defaultBody = '',
  bodyCharLimit = 600,
  maxRecipients = 40,
  onSubmit,
  onCancel,
}) => {
  /* ---------------------------- Local state ---------------------------- */
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  /** Selected recipient IDs when user-defined mode */
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultRecipientIds);

  /* --------------------------- Derived values -------------------------- */
  const selectedRecipients: WriteEmailRecipient[] = useMemo(() => {
    if (type === 'pre-defined_recipients') {
      return defaultRecipients;
    }
    const map = new Map<string, WriteEmailRecipient>();
    recipientOptions.forEach(r => map.set(r.id, r));
    return selectedIds.map(id => map.get(id)).filter(Boolean) as WriteEmailRecipient[];
  }, [type, defaultRecipients, recipientOptions, selectedIds]);

  /** Validation */
  const isSubjectValid = subject.trim().length > 0;
  const isBodyValid = body.trim().length > 0;
  const hasRecipients = selectedRecipients.length > 0;
  const formValid = isSubjectValid && isBodyValid && hasRecipients;

  /* ----------------------------- Handlers ------------------------------ */
  const handleSend = () => {
    if (!formValid) return; // Early guard
    onSubmit({ recipients: selectedRecipients, subject: subject.trim(), body: body.trim() });
  };

  /* ------------------------------ Render ------------------------------- */
  return (
    <View style={styles.container}>
      {/* Recipient row */}
      {type === 'pre-defined_recipients' ? (
        <View style={styles.recipientRow}>
          <Text variant="bodyMedium" style={styles.recipientLabel}>
            {`To: ${recipientLabel}`}
          </Text>
        </View>
      ) : (
        <View style={styles.recipientRow}>
          <MultiSelect
            label="Recipients"
            options={recipientOptions.map(r => ({ value: r.id, label: r.name }))}
            selectedValues={selectedIds}
            onSelectionChange={(ids) => setSelectedIds(ids as string[])}
            maxSelections={maxRecipients}
            title="Select Recipients"
          />
        </View>
      )}

      {/* Subject */}
      <SingleLineInput
        label="Subject"
        value={subject}
        onValueChange={setSubject}
        maxLength={subjectCharLimit}
        placeholder="Email subject"
      />
      <View style={styles.charCounterRow}>
        <Text style={styles.charCounter}>{`${subject.length}/${subjectCharLimit}`}</Text>
      </View>

      {/* Body */}
      <MultiLineInput
        label="Body"
        value={body}
        onValueChange={setBody}
        minHeight={24 * 6}
        numberOfLines={6}
        maxLength={bodyCharLimit}
        showCharacterCount
        placeholder="Email body..."
      />

      {/* Button row for template */}
      {templateType === 'basic_with_button' && (
        <View style={styles.buttonRowInfo}>
          <Text style={styles.buttonRowText}>{`[${buttonText}] → button will be added automatically`}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {onCancel && (
          <Button mode="text" onPress={onCancel} style={styles.actionButton}>
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSend}
          disabled={!formValid}
          style={styles.actionButton}
        >
          Send
        </Button>
      </View>
    </View>
  );
};

/* -------------------------------- Styles ------------------------------- */
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  recipientRow: {
    marginBottom: theme.spacing.md,
  },
  recipientLabel: {
    color: theme.colors.text.primary,
  },
  charCounterRow: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  charCounter: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  buttonRowInfo: {
    marginVertical: theme.spacing.md,
  },
  buttonRowText: {
    color: theme.colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    marginLeft: theme.spacing.sm,
  },
}); 