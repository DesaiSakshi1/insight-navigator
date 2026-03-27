import { BarChart3 } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-border/50 py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-gradient">AutoEDA</span>
            </div>
            <p className="text-sm text-muted-foreground">Automated Exploratory Data Analysis — turning raw datasets into actionable insights instantly.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#hero" className="hover:text-foreground transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Internship Details</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Developed by <span className="text-foreground">Sakshi Santosh Desai</span></li>
              <li>NexGen Analytix, Wakad Pune</li>
              <li>Guide: <span className="text-foreground">Yash Gawande</span></li>
              <li>MCA — SPPU 2026</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © 2025 AutoEDA — NexGen Analytix. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
