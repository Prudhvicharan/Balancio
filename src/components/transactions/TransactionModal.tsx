'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/stores/useStore';
import { useToast } from '@/components/ui/Toast';
import { getTodayISO, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';

const PAYMENT_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const schema = z.object({
  type: z.enum(['lent', 'received']),
  amount: z
    .string()
    .min(1, 'Amount required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be positive number'),
  date: z.string().min(1, 'Date required'),
  paymentMethod: z.enum(['cash', 'venmo', 'bank', 'amex', 'zelle', 'paypal', 'other']),
  note: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  friendId: string;
  transaction?: Transaction; // edit mode
  defaultType?: 'lent' | 'received';
}

export function TransactionModal({
  open,
  onClose,
  friendId,
  transaction,
  defaultType = 'lent',
}: TransactionModalProps) {
  const { addTransaction, updateTransaction } = useStore();
  const { toast } = useToast();
  const isEdit = !!transaction;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: transaction?.type ?? defaultType,
      amount: transaction?.amount?.toString() ?? '',
      date: transaction?.date ?? getTodayISO(),
      paymentMethod: transaction?.paymentMethod ?? 'cash',
      note: transaction?.note ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: transaction?.type ?? defaultType,
        amount: transaction?.amount?.toString() ?? '',
        date: transaction?.date ?? getTodayISO(),
        paymentMethod: transaction?.paymentMethod ?? 'cash',
        note: transaction?.note ?? '',
      });
    }
  }, [open, transaction, defaultType, reset]);

  const currentType = watch('type');

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateTransaction(transaction.id, {
        type: data.type,
        amount: Number(data.amount),
        date: data.date,
        paymentMethod: data.paymentMethod,
        note: data.note || undefined,
      });
      toast('Transaction updated');
    } else {
      addTransaction({
        friendId,
        type: data.type,
        amount: Number(data.amount),
        date: data.date,
        paymentMethod: data.paymentMethod,
        note: data.note || undefined,
      });
      toast(data.type === 'lent' ? 'Money lent recorded' : 'Payment received recorded');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2 p-1 bg-[var(--bg-input)] rounded-[var(--radius)]">
          <button
            type="button"
            onClick={() => setValue('type', 'lent')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-all duration-150',
              currentType === 'lent'
                ? 'bg-[var(--red-dim)] text-[var(--red)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            Money Lent
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'received')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-all duration-150',
              currentType === 'received'
                ? 'bg-[var(--green-dim)] text-[var(--green)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Received
          </button>
        </div>
        <input type="hidden" {...register('type')} />

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          leftIcon={<span className="text-sm font-medium">$</span>}
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        {/* Payment Method */}
        <Select
          label="Payment Method"
          options={PAYMENT_OPTIONS}
          {...register('paymentMethod')}
        />

        {/* Note */}
        <Input
          label="Note (optional)"
          placeholder="e.g. Dinner, rent split..."
          {...register('note')}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={currentType === 'lent' ? 'danger' : 'success'}
            type="submit"
            className="flex-1"
            loading={isSubmitting}
          >
            {isEdit ? 'Save' : currentType === 'lent' ? 'Record Lent' : 'Record Received'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
