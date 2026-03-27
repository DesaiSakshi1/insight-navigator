import { useEffect, useState, useRef } from 'react';
import { Layers, BarChart2, PieChart, Clock } from 'lucide-react';

const stats = [
  { icon: Layers, value: 9, label: 'Analysis Modules', suffix: '' },
  { icon: BarChart2, value: 500, label: 'Rows Processed', suffix: '+' },
  { icon: PieChart, value: 6, label: 'Chart Types', suffix: '' },
  { icon: Clock, value: 30, label: 'sec Report Time', suffix: '', prefix: '< ' },
];

function CountUp({ target, prefix, suffix }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1500;
          const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="text-3xl md:text-4xl font-extrabold text-foreground">{prefix}{count}{suffix}</div>;
}

export default function StatsBar() {
  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-6">
        <div className="glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-8 border-t-2 border-accent/30">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <s.icon className="w-8 h-8 text-accent mx-auto mb-3" />
              <CountUp target={s.value} prefix={s.prefix} suffix={s.suffix} />
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
