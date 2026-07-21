import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="container grid gap-8 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-black uppercase tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Droplets className="h-5 w-5" />
            </span>
            <span className="text-lg">WashCo</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-white/60">
            Book a car wash in Colombo in seconds. Browse top-rated washes, pick a slot, and pay securely.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Customers</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>
              <Link to="/search" className="hover:text-white">
                Find a wash
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white">
                Create an account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Businesses</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>
              <Link to="/register/tenant" className="hover:text-white">
                List your car wash
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                Tenant login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <p className="container text-center text-xs text-white/50">
          © {new Date().getFullYear()} WashCo. Colombo, Sri Lanka.
        </p>
      </div>
    </footer>
  );
}
