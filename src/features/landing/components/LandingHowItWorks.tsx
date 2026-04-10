import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import phoneDashboard from '@/assets/phone-dashboard.png';

interface Step {
  num: string;
  title: string;
  desc: string;
}

interface HowItWorksProps {
  steps: Step[];
}

export function LandingHowItWorks({ steps }: HowItWorksProps) {
  return (
    <section id="how" className="py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex-1 flex justify-center relative"
        >
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <img
            src={phoneDashboard}
            alt="Dashboard do Menu Pro no celular"
            width={300}
            height={600}
            loading="lazy"
            className="relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-700"
          />
        </motion.div>

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Comece a vender{' '}
              <span className="font-display italic text-gradient">em 3 passos.</span>
            </h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
              Simples como mandar uma mensagem. Cadastre seus produtos, personalize e comece a receber pedidos — tudo em minutos.
            </p>
          </motion.div>

          <div className="mt-10 space-y-7">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex gap-5"
              >
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all glow-primary"
            >
              CRIAR CONTA GRÁTIS <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
