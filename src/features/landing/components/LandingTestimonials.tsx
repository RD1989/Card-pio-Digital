import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LandingTestimonials({ testimonials }: TestimonialsProps) {
  return (
    <section id="testimonials" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Quem usa,{' '}
            <span className="font-display italic text-gradient underline decoration-primary/30 underline-offset-4">recomenda</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Descubra por que centenas de lojistas escolheram nossa plataforma.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-card border border-border rounded-2xl p-7"
            >
              <Quote className="w-7 h-7 text-primary/30 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
