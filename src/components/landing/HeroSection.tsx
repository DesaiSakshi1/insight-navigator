import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center grid-bg overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-accent font-semibold text-sm tracking-widest uppercase mb-6">Automated Exploratory Data Analysis</p>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-gradient">Transform Raw Data</span>
              <br />
              <span className="text-foreground">Into Instant Insights</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              AutoEDA automatically analyzes any dataset and generates comprehensive EDA reports in seconds. No code required.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:scale-105 active:scale-95 transition-transform glow-blue">
              Start Analysis <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-secondary/50 transition-colors">
              <Play className="w-5 h-5" /> View Demo
            </a>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-sm text-muted-foreground">
            Developed at <span className="text-accent">NexGen Analytix</span> · Data Science Internship 2025–26
          </motion.p>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="glass-card p-1 glow-blue rounded-2xl">
            <div className="bg-card rounded-xl p-4 md:p-8">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Rows', value: '510', color: 'border-primary' },
                  { label: 'Columns', value: '10', color: 'border-accent' },
                  { label: 'Missing %', value: '3.2%', color: 'border-warning' },
                  { label: 'Outliers', value: '5', color: 'border-destructive' },
                ].map(k => (
                  <div key={k.label} className={`bg-secondary/50 rounded-lg p-3 border-l-2 ${k.color}`}>
                    <p className="text-2xl font-bold text-foreground">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-secondary/30 rounded-lg h-24 flex items-end p-2 gap-1">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex-1 bg-primary/40 rounded-sm" style={{ height: `${20 + Math.random() * 60}%` }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
