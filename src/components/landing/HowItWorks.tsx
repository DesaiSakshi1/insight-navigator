import { Upload, Cpu, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { num: '01', icon: Upload, title: 'Upload Dataset', desc: 'Drag & drop your CSV or Excel file into the upload zone.' },
  { num: '02', icon: Cpu, title: 'Auto Analysis Runs', desc: 'AutoEDA processes your data through 9 analysis modules.' },
  { num: '03', icon: Download, title: 'View & Download Report', desc: 'Explore interactive charts and download a full PDF report.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-accent font-semibold text-sm tracking-widest uppercase mb-3">Process</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-primary/30" />
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 relative z-10">
                <span className="text-gradient text-2xl font-extrabold">{s.num}</span>
              </div>
              <s.icon className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
