const techs = ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'React', 'Tailwind CSS', 'TypeScript'];

export default function TechStack() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-6 text-center">
        <p className="text-accent font-semibold text-sm tracking-widest uppercase mb-3">Technology</p>
        <h2 className="text-2xl font-bold text-foreground mb-8">Built With</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {techs.map(t => (
            <span key={t} className="px-5 py-2.5 rounded-full bg-secondary/60 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:glow-blue transition-all cursor-default">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
