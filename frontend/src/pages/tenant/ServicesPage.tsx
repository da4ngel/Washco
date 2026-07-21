import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Pencil, Trash2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getMyTenant, createService, updateService, deleteService } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/form-field';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { formatLKR } from '@/lib/utils';
import { Service } from '@/types';

interface ServiceForm {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
}

const EMPTY: ServiceForm = { name: '', description: '', price: '', duration_minutes: '30' };

export function ServicesPage() {
  const qc = useQueryClient();
  const { data: tenant, isLoading } = useQuery({ queryKey: ['tenant', 'me'], queryFn: getMyTenant });
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(EMPTY);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenant', 'me'] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        duration_minutes: Number(form.duration_minutes),
      };
      if (editing) return updateService(editing.id, payload);
      return createService(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Service updated.' : 'Service added.');
      setOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const toggleActive = useMutation({
    mutationFn: (s: Service) => updateService(s.id, { is_active: !s.is_active }),
    onSuccess: invalidate,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (s: Service) => deleteService(s.id),
    onSuccess: () => {
      toast.success('Service removed.');
      setToDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      price: String(s.price),
      duration_minutes: String(s.duration_minutes),
    });
    setOpen(true);
  };

  const services = tenant?.services ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No services yet"
          description="Add your first service so customers can book it."
          action={<Button onClick={openAdd}>Add service</Button>}
        />
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <Card key={s.id} className={s.is_active ? '' : 'opacity-60'}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{s.name}</p>
                    {!s.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  {s.description && <p className="line-clamp-1 text-sm text-muted-foreground">{s.description}</p>}
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {s.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">{formatLKR(Number(s.price))}</span>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate(s)}>
                    {s.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setToDelete(s)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit service' : 'Add service'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Name" htmlFor="name">
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description" htmlFor="desc">
            <Textarea id="desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price (LKR)" htmlFor="price">
              <Input id="price" type="number" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Duration (min)" htmlFor="dur">
              <Input id="dur" type="number" min={10} step={5} required value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Remove this service?"
        description="Customers will no longer be able to book it. Existing bookings are unaffected."
        confirmLabel="Remove"
        destructive
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
