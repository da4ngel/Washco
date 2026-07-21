import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/services/user.service';
import { uploadFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { getApiErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-field';
import { Avatar } from '@/components/ui/avatar';

export function ProfilePage() {
  const { profile, setProfile, session } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: () => updateProfile({ full_name: fullName, phone: phone || null }),
    onSuccess: (p) => {
      setProfile(p);
      toast.success('Profile updated.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password changed.');
      setNewPassword('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not change password.')),
  });

  const handleAvatar = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    try {
      const url = await uploadFile('avatars', `${profile.id}/avatar.${file.name.split('.').pop() ?? 'jpg'}`, file);
      const updated = await updateProfile({ avatar_url: url });
      setProfile(updated);
      toast.success('Avatar updated.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="container max-w-2xl py-6">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={profile.avatar_url} fallback={profile.full_name} className="h-16 w-16 text-lg" />
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
                />
                <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Change avatar
                </Button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile.mutate();
              }}
              className="space-y-4"
            >
              <Field label="Full name" htmlFor="fn">
                <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
              <Field label="Phone" htmlFor="ph">
                <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94 77 123 4567" />
              </Field>
              <Field label="Email" htmlFor="em" hint="Email cannot be changed here.">
                <Input id="em" value={session?.user?.email ?? ''} disabled />
              </Field>
              <Button type="submit" disabled={saveProfile.isPending}>
                {saveProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                changePassword.mutate();
              }}
              className="space-y-4"
            >
              <Field label="New password" htmlFor="np">
                <Input
                  id="np"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </Field>
              <Button type="submit" disabled={newPassword.length < 8 || changePassword.isPending}>
                {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
