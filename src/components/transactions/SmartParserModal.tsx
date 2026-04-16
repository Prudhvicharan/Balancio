'use client';

import { useState } from 'react';
import { Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useStore } from '@/stores/useStore';
import { useToast } from '@/components/ui/Toast';
import { parseBulkInput } from '@/lib/parser';
import { formatCurrency, getTodayISO, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ICONS } from '@/lib/utils';
import type { ParsedTransaction, PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';

interface SmartParserModalProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
}

const PAYMENT_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function SmartParserModal({ open, onClose, friendId, friendName }: SmartParserModalProps) {
  const { addTransaction } = useStore();
  const { toast } = useToast();

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [rawInput, setRawInput] = useState('');
  const [defaultType, setDefaultType] = useState<'lent' | 'received'>('lent');
  const [sharedDate, setSharedDate] = useState(getTodayISO());
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);

  const handleParse = () => {
    const result = parseBulkInput(rawInput, defaultType);
    if (result.transactions.length === 0) {
      toast('No transactions found. Check your input format.', 'error');
      return;
    }
    setParsed(result.transactions);
    setStep('review');
  };

  const updateParsed = (index: number, updates: Partial<ParsedTransaction>) => {
    setParsed((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)));
  };

  const removeParsed = (index: number) => {
    setParsed((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (parsed.length === 0) return;
    for (const txn of parsed) {
      addTransaction({
        friendId,
        type: txn.type,
        amount: txn.amount,
        date: sharedDate,
        paymentMethod: txn.paymentMethod,
        note: txn.note,
      });
    }
    toast(`${parsed.length} transaction${parsed.length > 1 ? 's' : ''} saved`);
    handleClose();
  };

  const handleClose = () => {
    setStep('input');
    setRawInput('');
    setParsed([]);
    setDefaultType('lent');
    setSharedDate(getTodayISO());
    onClose();
  };

  const totalLent = parsed.filter((t) => t.type === 'lent').reduce((s, t) => s + t.amount, 0);
  const totalReceived = parsed.filter((t) => t.type === 'received').reduce((s, t) => s + t.amount, 0);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Smart Input Parser"
      description={`Paste messy notes for ${friendName} — we'll structure them.`}
      size="md"
    >
      {step === 'input' ? (
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-[var(--bg-input)] rounded-[var(--radius)]">
            {(['lent', 'received'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDefaultType(t)}
                className={cn(
                  'flex-1 py-2 rounded-[calc(var(--radius)-2px)] text-sm font-medium capitalize transition-all',
                  defaultType === t
                    ? t === 'lent'
                      ? 'bg-[var(--red-dim)] text-[var(--red)]'
                      : 'bg-[var(--green-dim)] text-[var(--green)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                )}
              >
                Default: {t}
              </button>
            ))}
          </div>

          <Textarea
            label="Your notes"
            placeholder={`e.g.\n500(online) + 250(Amex) + 100(cash)\n+300 venmo, -200 bank transfer\npaid 500 cash`}
            rows={5}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            hint="Use + for lent, - for received. Mention payment method in parentheses or inline."
          />

          <div className="p-3 rounded-[var(--radius)] bg-[var(--accent-dim)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
            <div className="flex gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-light)] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <p className="font-medium text-[var(--accent-light)]">Supported formats:</p>
                <p>• <code className="text-[var(--text-primary)]">500(online) + 250(Amex)</code></p>
                <p>• <code className="text-[var(--text-primary)]">+500 venmo, -200 bank</code></p>
                <p>• <code className="text-[var(--text-primary)]">paid 300 cash</code></p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleParse}
              disabled={!rawInput.trim()}
            >
              <Sparkles className="w-4 h-4" />
              Parse
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-3">
            {totalLent > 0 && (
              <div className="flex-1 p-3 rounded-[var(--radius)] bg-[var(--red-dim)]">
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Lent</p>
                <p className="text-base font-semibold text-[var(--red)]">{formatCurrency(totalLent)}</p>
              </div>
            )}
            {totalReceived > 0 && (
              <div className="flex-1 p-3 rounded-[var(--radius)] bg-[var(--green-dim)]">
                <p className="text-xs text-[var(--text-muted)] mb-0.5">Received</p>
                <p className="text-base font-semibold text-[var(--green)]">{formatCurrency(totalReceived)}</p>
              </div>
            )}
          </div>

          {/* Shared date */}
          <Input
            label="Date for all transactions"
            type="date"
            value={sharedDate}
            onChange={(e) => setSharedDate(e.target.value)}
          />

          {/* Transaction list */}
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide font-medium">
              {parsed.length} transaction{parsed.length !== 1 ? 's' : ''} — edit or remove
            </p>
            {parsed.map((txn, i) => (
              <div
                key={i}
                className={cn(
                  'p-3 rounded-[var(--radius)] border',
                  txn.type === 'lent'
                    ? 'bg-[var(--red-dim)] border-[color-mix(in_srgb,var(--red)_20%,transparent)]'
                    : 'bg-[var(--green-dim)] border-[color-mix(in_srgb,var(--green)_20%,transparent)]'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{PAYMENT_METHOD_ICONS[txn.paymentMethod]}</span>
                    <span
                      className={cn(
                        'text-base font-semibold',
                        txn.type === 'lent' ? 'text-[var(--red)]' : 'text-[var(--green)]'
                      )}
                    >
                      {txn.type === 'lent' ? '+' : '−'}{formatCurrency(txn.amount)}
                    </span>
                    <Badge variant={txn.type === 'lent' ? 'red' : 'green'}>
                      {txn.type === 'lent' ? 'Lent' : 'Received'}
                    </Badge>
                  </div>
                  <button
                    onClick={() => removeParsed(i)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red-dim)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 min-w-0">
                  <select
                    value={txn.paymentMethod}
                    onChange={(e) => updateParsed(i, { paymentMethod: e.target.value as PaymentMethod })}
                    className="shrink-0 text-xs bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {PAYMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={txn.note ?? ''}
                    onChange={(e) => updateParsed(i, { note: e.target.value || undefined })}
                    placeholder="Add note..."
                    className="flex-1 min-w-0 text-xs bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            ))}
          </div>

          {parsed.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius)] bg-[var(--amber-dim)] border border-[color-mix(in_srgb,var(--amber)_30%,transparent)]">
              <AlertCircle className="w-4 h-4 text-[var(--amber)]" />
              <p className="text-sm text-[var(--amber)]">All transactions removed. Go back to re-parse.</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setStep('input')}>
              Back
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSave}
              disabled={parsed.length === 0}
            >
              <Check className="w-4 h-4" />
              Save {parsed.length > 0 ? parsed.length : ''} Transaction{parsed.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
