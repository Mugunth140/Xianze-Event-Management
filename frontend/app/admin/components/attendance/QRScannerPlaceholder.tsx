'use client';

import Button from '../ui/Button';
import Card from '../ui/Card';

interface QRScannerPlaceholderProps {
  onScanComplete?: (data: string) => void;
  disabled?: boolean;
}

export default function QRScannerPlaceholder({
  onScanComplete,
  disabled = false,
}: QRScannerPlaceholderProps) {
  // This is a placeholder for future QR scanner integration
  // In production, this would use a library like react-qr-reader or html5-qrcode

  const handleManualEntry = () => {
    const code = prompt('Enter participant code manually:');
    if (code) {
      onScanComplete?.(code);
    }
  };

  return (
    <Card className="p-6 text-center">
      <div className="w-full aspect-square max-w-sm mx-auto mb-6 rounded-xl bg-[rgba(139,92,246,0.1)] border-2 border-dashed border-[var(--admin-border)] flex flex-col items-center justify-center">
        <svg
          className="w-16 h-16 text-[var(--admin-text-muted)] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
        <p className="text-[var(--admin-text-secondary)] text-sm mb-2">QR Scanner Placeholder</p>
        <p className="text-[var(--admin-text-muted)] text-xs">
          Camera integration will be added in production
        </p>
      </div>

      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleManualEntry} disabled={disabled}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Enter Code Manually
        </Button>

        <p className="text-xs text-[var(--admin-text-muted)]">
          Tip: Use keyboard to quickly input codes during live events
        </p>
      </div>
    </Card>
  );
}
