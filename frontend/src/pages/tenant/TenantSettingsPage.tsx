import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, Star, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/services/api';
import { getMyTenant, updateMyTenant } from '@/services/dashboard.service';
import { uploadFile, objectPath } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tenant } from '@/types';

export function TenantSettingsPage() {
  const qc = useQueryClient();
  const { data: tenant, isLoading } = useQuery({ queryKey: ['tenant', 'me'], queryFn: getMyTenant });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<Partial<Tenant>>({});
  useEffect(() => {
    if (tenant) {
      setForm({
        business_name: tenant.business_name,
        description: tenant.description,
        address: tenant.address,
        city: tenant.city,
        district: tenant.district,
        phone: tenant.phone,
        email: tenant.email,
      });
    }
  }, [tenant]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenant', 'me'] });

  const save = useMutation({
    mutationFn: () => updateMyTenant(form),
    onSuccess: () => {
      toast.success('Business details saved.');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const handleUpload = async (file: File) => {
    if (!tenant) return;
    setUploading(true);
    try {
      const url = await uploadFile('tenant-photos', objectPath(tenant.id, file), file);
      await api.post('/tenants/photos', { url, is_primary: tenant.photos.length === 0 });
      toast.success('Photo uploaded.');
      invalidate();
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = useMutation({
    mutationFn: (photoId: string) => api.put(`/tenants/photos/${photoId}/primary`),
    onSuccess: invalidate,
  });
  const removePhoto = useMutation({
    mutationFn: (photoId: string) => api.delete(`/tenants/photos/${photoId}`),
    onSuccess: () => {
      toast.success('Photo removed.');
      invalidate();
    },
  });

  if (isLoading || !tenant) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Badge variant={tenant.status === 'active' ? 'completed' : tenant.status === 'pending' ? 'pending' : 'cancelled'}>
          {tenant.status}
        </Badge>
      </div>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gallery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tenant.photos.map((p) => (
              <div key={p.id} className={cn('group relative aspect-video overflow-hidden rounded-lg border', p.is_primary && 'ring-2 ring-primary')}>
                <img src={p.url} alt={p.caption ?? ''} className="h-full w-full object-cover" />
                {p.is_primary && <Badge variant="accent" className="absolute left-1 top-1">Primary</Badge>}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {!p.is_primary && (
                    <Button size="icon" variant="secondary" onClick={() => setPrimary.mutate(p.id)} aria-label="Set primary">
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="destructive" onClick={() => removePhoto.mutate(p.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-secondary"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Business details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <Field label="Business name" htmlFor="bn">
              <Input id="bn" value={form.business_name ?? ''} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="desc">
              <Textarea id="desc" rows={3} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Address" htmlFor="addr">
              <Input id="addr" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city">
                <Input id="city" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="District" htmlFor="dist">
                <Input id="dist" value={form.district ?? ''} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" htmlFor="ph">
                <Input id="ph" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="em">
                <Input id="em" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
