import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { MapPin, Phone, Star, Building2, Check, X, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminTenants,
  approveTenant,
  rejectTenant,
  suspendTenant,
  reinstateTenant,
  toggleFeatured,
  AdminTenant,
} from '@/services/admin.service';
import { getApiErrorMessage } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

export function TenantApprovalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [rejecting, setRejecting] = useState<AdminTenant | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenants', tab],
    queryFn: () => getAdminTenants({ status: tab }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
  const onErr = (e: unknown) => toast.error(getApiErrorMessage(e));

  const approve = useMutation({ mutationFn: approveTenant, onSuccess: () => { toast.success('Tenant approved.'); invalidate(); }, onError: onErr });
  const suspend = useMutation({ mutationFn: suspendTenant, onSuccess: () => { toast.success('Tenant suspended.'); invalidate(); }, onError: onErr });
  const reinstate = useMutation({ mutationFn: reinstateTenant, onSuccess: () => { toast.success('Tenant reinstated.'); invalidate(); }, onError: onErr });
  const feature = useMutation({ mutationFn: toggleFeatured, onSuccess: () => { toast.success('Featured status updated.'); invalidate(); }, onError: onErr });
  const reject = useMutation({
    mutationFn: (t: AdminTenant) => rejectTenant(t.id, reason || undefined),
    onSuccess: () => {
      toast.success('Tenant rejected.');
      setRejecting(null);
      setReason('');
      invalidate();
    },
    onError: onErr,
  });

  const tenants = data?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tenants</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto no-scrollbar">
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <EmptyState icon={Building2} title={`No ${tab} tenants`} />
          ) : (
            <div className="space-y-4">
              {tenants.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{t.business_name}</h3>
                          {t.is_featured && <Badge variant="accent">Featured</Badge>}
                          <Badge variant={t.status === 'active' ? 'completed' : t.status === 'pending' ? 'pending' : 'cancelled'}>
                            {t.status}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {t.address}, {t.city}
                        </p>
                        <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Owner: {t.owner?.full_name ?? '—'}</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {t.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" /> {Number(t.rating).toFixed(1)}
                          </span>
                        </p>
                        {t.description && <p className="mt-2 line-clamp-2 text-sm">{t.description}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Applied {format(parseISO(t.created_at), 'd MMM yyyy')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {t.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => approve.mutate(t.id)}>
                              <Check className="h-4 w-4" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejecting(t)}>
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </>
                        )}
                        {t.status === 'active' && (
                          <>
                            <Button size="sm" variant={t.is_featured ? 'secondary' : 'outline'} onClick={() => feature.mutate(t.id)}>
                              <Star className="h-4 w-4" /> {t.is_featured ? 'Unfeature' : 'Feature'}
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => suspend.mutate(t.id)}>
                              <Pause className="h-4 w-4" /> Suspend
                            </Button>
                          </>
                        )}
                        {t.status === 'suspended' && (
                          <Button size="sm" onClick={() => reinstate.mutate(t.id)}>
                            <Play className="h-4 w-4" /> Reinstate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={Boolean(rejecting)} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogHeader>
          <DialogTitle>Reject {rejecting?.business_name}?</DialogTitle>
        </DialogHeader>
        <Textarea
          rows={3}
          placeholder="Reason for rejection (sent to the owner)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setRejecting(null)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={reject.isPending} onClick={() => rejecting && reject.mutate(rejecting)}>
            Reject tenant
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
