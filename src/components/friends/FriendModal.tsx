'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/stores/useStore';
import { useToast } from '@/components/ui/Toast';
import type { Friend } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(50, 'Max 50 chars'),
  notes: z.string().max(200, 'Max 200 chars').optional(),
});

type FormData = z.infer<typeof schema>;

interface FriendModalProps {
  open: boolean;
  onClose: () => void;
  friend?: Friend; // edit mode
}

export function FriendModal({ open, onClose, friend }: FriendModalProps) {
  const { addFriend, updateFriend } = useStore();
  const friends = useStore((s) => s.friends);
  const { toast } = useToast();
  const isEdit = !!friend;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: friend?.name ?? '', notes: friend?.notes ?? '' },
  });

  useEffect(() => {
    if (open) {
      reset({ name: friend?.name ?? '', notes: friend?.notes ?? '' });
    }
  }, [open, friend, reset]);

  const onSubmit = (data: FormData) => {
    // Check for duplicates (case insensitive)
    const duplicate = friends.some(
      (f) =>
        f.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        f.id !== friend?.id
    );

    if (duplicate) {
      setError('name', { type: 'manual', message: 'A contact with this name already exists' });
      return;
    }

    if (isEdit) {
      updateFriend(friend.id, data);
      toast('Contact updated');
    } else {
      addFriend(data);
      toast('Contact added');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Contact' : 'Add Contact'}
      description={isEdit ? 'Update contact details.' : 'Add someone you lend money to.'}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g. John Doe, Jane Smith..."
          error={errors.name?.message}
          {...register('name')}
        />
        <Textarea
          label="Notes (optional)"
          placeholder="e.g. Roommate, trip buddy..."
          error={errors.notes?.message}
          rows={2}
          {...register('notes')}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="flex-1" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
