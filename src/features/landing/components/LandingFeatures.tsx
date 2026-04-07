import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface FeaturesProps {
  features: Feature[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LandingFeatures({ features }: FeaturesProps) {
  return (
    <section id="features" className="py-20 px-6 bg-muted/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Ferramentas que fazem seu delivery{' '}
            <span className="font-display italic text-gradient underline decoration-primary/30 underline-offset-4">decolar</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-sm max-w-lg mx-auto">
            Abandone as ferramentas improvisadas. Tenha uma solução profissional desenvolvida para maximizar sua conversão de vendas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-card border border-border rounded-2xl p-7 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-shadow">
                <feat.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-bold mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
