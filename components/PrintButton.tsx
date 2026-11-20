'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      className="secondary-button icon-button"
      onClick={() => window.print()}
      aria-label="പ്രിന്റ് ചെയ്യുക"
      title="പ്രിന്റ് ചെയ്യുക"
    >
      <Printer aria-hidden="true" size={19} />
    </button>
  );
}
