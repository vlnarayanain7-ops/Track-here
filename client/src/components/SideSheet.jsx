import { useEffect, useRef } from 'react';

export function SideSheet({ open, isOpen, title, onClose, children }) {
  const ref = useRef(null);
  const isSheetOpen = Boolean(open ?? isOpen);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isSheetOpen && !d.open) {
      d.showModal();
    } else if (!isSheetOpen && d.open) {
      d.close();
    }
  }, [isSheetOpen]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="sheet-title"
    >
      <div className="sheet-body">
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default SideSheet;
