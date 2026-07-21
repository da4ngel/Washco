import { Clock, Check } from 'lucide-react';
import { cn, formatLKR } from '@/lib/utils';
import { Service } from '@/types';

interface ServiceSelectorProps {
  services: Service[];
  selectedId?: string;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({ services, selectedId, onSelect }: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      {services.map((service) => {
        const selected = service.id === selectedId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={cn(
              'flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors',
              selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/40'
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{service.name}</p>
                {selected && <Check className="h-4 w-4 text-primary" />}
              </div>
              {service.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {service.duration_minutes} min
              </p>
            </div>
            <p className="shrink-0 font-bold text-primary">{formatLKR(Number(service.price))}</p>
          </button>
        );
      })}
    </div>
  );
}
