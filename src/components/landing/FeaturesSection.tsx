import { Database, AlertTriangle, Calculator, BarChart2, GitBranch, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Database, title: 'Dataset Profiling', desc: 'Instantly understand your data structure, types, and distributions.', color: 'text-primary glow-blue' },
  { icon: AlertTriangle, title: 'Missing Value Detection', desc: 'Identify gaps in your data with actionable fix recommendations.', color: 'text-warning glow-amber' },
  { icon: Calculator, title: 'Statistical Summary', desc: 'Mean, median, std dev, skewness and more for every numeric feature.', color: 'text-accent glow-cyan' },
  { icon: BarChart2, title: 'Auto Visualizations', desc: 'Histograms, bar charts, and box plots generated automatically.', color: 'text-success glow-green' },
  { icon: GitBranch, title: 'Correlation Analysis', desc: 'Discover hidden relationships with an interactive heatmap.', color: 'text-primary glow-blue' },
  { icon: FileText, title: 'Instant Report', desc: 'Download a comprehensive PDF report with one click.', color: 'text-accent glow-cyan' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-accent font-semibold text-sm tracking-widest uppercase mb-3">Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything You Need for Complete EDA</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-6 hover-lift group cursor-default"
            >
              <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:${f.color.split(' ')[1]} transition-shadow`}>
                <f.icon className={`w-6 h-6 ${f.color.split(' ')[0]}`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
