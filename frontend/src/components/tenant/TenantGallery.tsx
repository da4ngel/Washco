import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
}

export function TenantGallery({ photos, name }: { photos: GalleryPhoto[]; name: string }) {
  const ordered = [...photos].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const [active, setActive] = useState(0);

  if (ordered.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border bg-secondary text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm">No photos yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-secondary">
        <img src={ordered[active].url} alt={ordered[active].caption ?? name} className="h-full w-full object-cover" />
      </div>
      {ordered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {ordered.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={cn(
                'h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img src={p.url} alt={p.caption ?? ''} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
