import Dialog from './Dialog';
import Button from './Button';

export default function ConfirmDialog({
  open,
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  description,
  confirmLabel,
  confirmText = 'Confirm',
  cancelLabel,
  cancelText = 'Cancel',
  variant = 'destructive',
  loading = false,
}) {
  const isShown = open ?? isOpen ?? false;
  const bodyText = description || message || 'This action cannot be undone.';
  const confirmBtnText = confirmText || confirmLabel || 'Confirm';
  const cancelBtnText = cancelText || cancelLabel || 'Cancel';

  return (
    <Dialog open={isShown} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">{bodyText}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelBtnText}
        </Button>
        <Button
          variant={variant}
          onClick={() => {
            onConfirm?.();
          }}
          loading={loading}
        >
          {confirmBtnText}
        </Button>
      </div>
    </Dialog>
  );
}
