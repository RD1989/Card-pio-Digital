import { motion } from 'framer-motion';
import authorPhoto from '@/assets/author-rodrigo.png';

export function LandingAuthor() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center bg-card border border-border rounded-3xl p-8 sm:p-12"
        >
          <img
            src={authorPhoto}
            alt="Rodrigo Gomes — Desenvolvedor do Menu Pro"
            loading="lazy"
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl object-cover border-2 border-primary/20 shadow-lg mb-8 grayscale hover:grayscale-0 transition-all duration-700"
          />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Quem criou o Menu Pro</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">
            Rodrigo Gomes
          </h2>
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed mt-4 max-w-2xl">
            <p>
              Eu vi de perto a dor de centenas de donos de delivery: <strong className="text-foreground">taxas abusivas de grandes plataformas</strong> que consumiam até 30% do faturamento. Muitos desistiam de ter qualquer ferramenta digital — e perdiam vendas todos os dias por não estarem online.
            </p>
            <p>
              Foi aí que nasceu o <span className="text-primary font-semibold">Menu Pro</span>. Desenvolvi um sistema completo, profissional e acessível para que <strong className="text-foreground">qualquer empreendedor</strong> consiga ter seu cardápio digital, receber pedidos via WhatsApp e crescer — <strong className="text-foreground">sem pagar fortunas</strong> para plataformas que não entendem a realidade do pequeno negócio.
            </p>
            <p>
              Minha missão é simples: <span className="text-primary font-semibold">democratizar a tecnologia para o food service</span>. Se você vende comida, merece uma ferramenta que trabalhe por você — não contra o seu bolso.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
