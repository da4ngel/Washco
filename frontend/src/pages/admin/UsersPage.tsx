import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { getAdminUsers, toggleBanUser } from '@/services/admin.service';
import { getApiErrorMessage } from '@/services/api';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const ROLES = ['', 'user', 'tenant', 'admin'];

export function UsersPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', role, page],
    queryFn: () => getAdminUsers({ role: role || undefined, page }),
  });

  const ban = useMutation({
    mutationFn: toggleBanUser,
    onSuccess: (p) => {
      toast.success(p.is_active ? 'Account reactivated.' : 'Account banned.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const users = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="w-44">
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r ? r : 'All roles'}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3">
                <Avatar src={u.avatar_url} fallback={u.full_name} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{u.full_name}</p>
                    <Badge variant="secondary">{u.role}</Badge>
                    {!u.is_active && <Badge variant="cancelled">Banned</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.phone ?? 'No phone'} · Joined {format(parseISO(u.created_at), 'd MMM yyyy')}
                  </p>
                </div>
                {u.role !== 'admin' && (
                  <Button
                    size="sm"
                    variant={u.is_active ? 'outline' : 'default'}
                    className={u.is_active ? 'text-destructive' : ''}
                    onClick={() => ban.mutate(u.id)}
                  >
                    {u.is_active ? 'Ban' : 'Unban'}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
