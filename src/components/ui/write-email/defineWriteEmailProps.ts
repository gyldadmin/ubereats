import { WriteEmailProps } from './WriteEmail';

/**
 * Helper factory that returns a fully-typed props object for the WriteEmail component.
 *   Call this from your screen/component to get strong autocomplete and default values.
 *
 * Example:
 * const props = defineWriteEmailProps({
 *   type: 'user-defined_recipients',
 *   recipientOptions: userList,
 *   onSubmit: handleSubmit,
 * });
 */
export const defineWriteEmailProps = (
  props: Partial<WriteEmailProps> & Pick<WriteEmailProps, 'type' | 'onSubmit'>,
): WriteEmailProps => {
  return {
    // Required
    type: props.type,
    onSubmit: props.onSubmit,

    // Optional with sensible defaults
    recipientLabel: props.recipientLabel ?? '',
    defaultRecipients: props.defaultRecipients ?? [],
    recipientOptions: props.recipientOptions ?? [],
    defaultRecipientIds: props.defaultRecipientIds ?? [],
    templateType: props.templateType ?? 'basic',
    buttonText: props.buttonText ?? 'Open',
    defaultSubject: props.defaultSubject ?? '',
    subjectCharLimit: props.subjectCharLimit ?? 600,
    defaultBody: props.defaultBody ?? '',
    bodyCharLimit: props.bodyCharLimit ?? 600,
    maxRecipients: props.maxRecipients ?? 40,
    onCancel: props.onCancel,
  } as WriteEmailProps;
}; 