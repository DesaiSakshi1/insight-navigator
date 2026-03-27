import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Home', href: '#hero' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'About', href: '#footer' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50' : ''}`}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-gradient">AutoEDA</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
          ))}
        </div>
        <div className="hidden md:block">
          <Link to="/dashboard" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:scale-105 active:scale-95 transition-transform animate-pulse-glow">
            Launch App
          </Link>
        </div>
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border p-4 space-y-3">
          {links.map(l => (
            <a key={l.label} href={l.href} className="block text-muted-foreground hover:text-foreground py-2" onClick={() => setMobileOpen(false)}>{l.label}</a>
          ))}
          <Link to="/dashboard" className="block w-full text-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm" onClick={() => setMobileOpen(false)}>Launch App</Link>
        </div>
      )}
    </nav>
  );
}
