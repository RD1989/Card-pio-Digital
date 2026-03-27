import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ShoppingBag, ChevronLeft } from 'lucide-react';

export function SmartphoneMockup() {
  const controls = useAnimation();

  useEffect(() => {
    // Sequência de animação contínua simulando um usuário
    const runAnimation = async () => {
      while (true) {
        // Estado 1: Início
        await controls.start("initial");
        // Espera de leitura do cardápio
        await new Promise(r => setTimeout(r, 1500));
        
        // Estado 2: Scroll para baixo
        await controls.start("scrolled");
        await new Promise(r => setTimeout(r, 1000));

        // Estado 3: Clique no Lanche (Cursor se move e clica)
        await controls.start("clickBurger");
        
        // Modal de Lanche abre
        await controls.start("burgerOpened");
        await new Promise(r => setTimeout(r, 1500));
        
        // Clica em "Adicionar"
        await controls.start("clickAdd");
        
        // Volta pro menu com 1 item na sacola
        await controls.start("addedToCart");
        await new Promise(r => setTimeout(r, 800));

        // Clica na Sacola
        await controls.start("clickCart");
        
        // Abre carrinho
        await controls.start("cartOpened");
        await new Promise(r => setTimeout(r, 1500));

        // Resetar para loop (faz um fade rápido do celular)
        await controls.start("fadeReset");
      }
    };
    
    runAnimation();
  }, [controls]);

  // Framer Motion Variants para o "Mouse" (Dedo)
  const cursorVariants = {
    initial: { x: 50, y: 300, opacity: 0 },
    scrolled: { x: 50, y: 300, opacity: 0 },
    clickBurger: { x: 140, y: 150, opacity: 1, scale: 0.9, transition: { duration: 0.6 } },
    burgerOpened: { x: 140, y: 150, opacity: 0 }, //Some
    clickAdd: { x: 150, y: 480, opacity: 1, scale: 0.9, transition: { duration: 0.5 } },
    addedToCart: { opacity: 0 },
    clickCart: { x: 230, y: 35, opacity: 1, scale: 0.9 },
    cartOpened: { opacity: 0 },
    fadeReset: { opacity: 0 }
  };

  // Views Alternantes no Celular
  const screenVariants = {
    initial: { y: 0 },
    scrolled: { y: -100, transition: { duration: 1 } },
    clickBurger: { y: -100 },
    burgerOpened: { y: -100, filter: "brightness(0.5)" },
    clickAdd: { y: -100, filter: "brightness(0.5)" },
    addedToCart: { y: 0, filter: "brightness(1)" }, // volta pro topo
    clickCart: { y: 0 },
    cartOpened: { y: 0 },
    fadeReset: { y: 0 }
  };

  const modalVariants = {
    initial: { y: '100%' },
    scrolled: { y: '100%' },
    clickBurger: { y: '100%' },
    burgerOpened: { y: '0%', transition: { type: 'spring' as const, damping: 25 } },
    clickAdd: { y: '0%' },
    addedToCart: { y: '100%' },
    clickCart: { y: '100%' },
    cartOpened: { y: '100%' },
    fadeReset: { y: '100%' }
  };
  
  const cartViewVariants = {
    initial: { x: '100%' },
    addedToCart: { x: '100%' },
    clickCart: { x: '100%' },
    cartOpened: { x: '0%', transition: { type: 'spring' as const, damping: 25 } },
    fadeReset: { x: '100%', opacity: 0 }
  };

  return (
    <div className="relative w-[300px] h-[600px] mx-auto perspective-[1000px]">
      
      {/* Moldura do iPhone */}
      <div className="absolute inset-0 bg-zinc-900 rounded-[45px] shadow-2xl shadow-amber-500/10 border-[8px] border-zinc-800 flex items-center justify-center overflow-hidden z-20">
        
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50"></div>
        
        {/* Área Escrolável do Cardápio */}
        <motion.div 
          className="w-full h-full bg-[#f8fbfa] relative"
        >
          {/* Header Fixo Interno */}
          <div className="absolute top-0 inset-x-0 h-20 bg-white shadow-sm z-30 px-5 pt-8 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-zinc-900 border-b-2 border-amber-500 inline-block">Burger House</h3>
            </div>
            <motion.div 
              className="relative w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center"
              variants={{
                 initial: { scale: 1 },
                 addedToCart: { scale: [1, 1.2, 1], backgroundColor: ['#f4f4f5', '#fbbf24', '#f4f4f5'] }
              }}
              animate={controls}
            >
              <ShoppingBag className="w-5 h-5 text-zinc-800" />
              {/* Badge da sacola animate */}
              <motion.div 
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] items-center justify-center rounded-full font-bold hidden"
                variants={{
                  addedToCart: { display: "flex", scale: [0, 1] },
                  clickCart: { display: "flex" },
                  cartOpened: { display: "none" }
                }}
                animate={controls}
              >
                1
              </motion.div>
            </motion.div>
          </div>

          <motion.div 
            className="pt-24 px-4 pb-20 w-full"
            variants={screenVariants}
            animate={controls}
          >
            {/* Categorias */}
            <div className="flex gap-2 overflow-hidden mb-6">
              <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">Lanches</span>
              <span className="bg-zinc-200 text-zinc-600 px-4 py-1.5 rounded-full text-sm font-bold">Bebidas</span>
            </div>
            
            {/* Produto 1 */}
            <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 flex gap-3">
               <div className="w-20 h-20 bg-zinc-200 rounded-xl" />
               <div className="flex-1">
                 <h4 className="font-bold text-zinc-800 text-sm">X-Tudo Monstro</h4>
                 <p className="text-zinc-500 text-[10px] leading-tight my-1 line-clamp-2">Pão brioche, 2x blend 180g, cheddar, bacon e salada fresca.</p>
                 <span className="font-black text-amber-500">R$ 35,90</span>
               </div>
            </div>

            {/* Produto 2 (O que será clicado) */}
            <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 flex gap-3 relative border border-transparent">
               <div className="w-20 h-20 bg-zinc-200 rounded-xl" />
               <div className="flex-1">
                 <h4 className="font-bold text-zinc-800 text-sm">Classic Burger</h4>
                 <p className="text-zinc-500 text-[10px] leading-tight my-1 line-clamp-2">Aquele clássico: pão, carne suculenta e queijo prato derretido.</p>
                 <span className="font-black text-amber-500">R$ 22,00</span>
               </div>
               <motion.div 
                 className="absolute inset-0 bg-amber-500/10 rounded-2xl hidden"
                 variants={{ clickBurger: { display: "block", opacity: [0, 1, 0] } }}
                 animate={controls}
               />
            </div>
            
            {/* Produto 3 */}
            <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 flex gap-3">
               <div className="w-20 h-20 bg-zinc-200 rounded-xl" />
               <div className="flex-1">
                 <h4 className="font-bold text-zinc-800 text-sm">Coca-Cola Lata</h4>
                 <span className="font-black text-amber-500 mt-2 block">R$ 6,00</span>
               </div>
            </div>
          </motion.div>

          {/* Modal de Produto simulado */}
          <motion.div 
            className="absolute top-20 bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 px-5 pt-6 flex flex-col"
            variants={modalVariants}
            animate={controls}
          >
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-6"></div>
            <div className="w-full h-40 bg-zinc-100 rounded-2xl mb-4"></div>
            <h3 className="text-xl font-black text-zinc-800 mb-1">Classic Burger</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-4">Aquele clássico: pão, carne suculenta e queijo prato derretido.</p>
            <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100 mb-auto">
              <span className="font-bold text-zinc-800">Valor</span>
              <span className="font-black text-amber-500 text-lg">R$ 22,00</span>
            </div>
            
            <div className="pb-8 pt-4">
              <button className="w-full h-12 bg-amber-500 rounded-xl font-bold text-white relative overflow-hidden">
                Adicionar e Voltar
                <motion.div 
                  className="absolute inset-0 bg-black/10 hidden"
                  variants={{ clickAdd: { display: 'block', opacity: [0, 1, 0] } }}
                  animate={controls}
                />
              </button>
            </div>
          </motion.div>

          {/* Tela do Carrinho e Botão WhatsApp simulado */}
          <motion.div 
            className="absolute inset-0 bg-white z-50 flex flex-col"
            variants={cartViewVariants}
            animate={controls}
          >
            <div className="h-20 bg-white border-b border-zinc-100 px-5 pt-8 flex items-center gap-3">
              <ChevronLeft className="text-zinc-400 w-6 h-6" />
              <h2 className="font-bold text-zinc-800">Sua Sacola</h2>
            </div>
            
            <div className="p-5 flex-1 bg-zinc-50/50">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 mb-4 flex justify-between items-center">
                <div>
                  <span className="font-bold text-zinc-800 text-sm block">1x Classic Burger</span>
                  <span className="text-zinc-400 text-xs">Sem observações</span>
                </div>
                <span className="font-bold text-zinc-800 text-sm">R$ 22,00</span>
              </div>
              
              <div className="bg-zinc-100 p-4 rounded-xl flex justify-between items-center mb-6">
                <span className="font-bold text-zinc-600">Total</span>
                <span className="font-black text-amber-500 text-xl">R$ 22,00</span>
              </div>
            </div>

            <div className="p-5 bg-white border-t border-zinc-100 pb-8">
              <button className="w-full h-14 bg-green-500 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                Enviar no WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Dedo / Mouse Pointer Simulation */}
        <motion.div 
          className="absolute w-10 h-10 bg-white/30 backdrop-blur-sm border-2 border-white rounded-full z-[60] shadow-xl pointer-events-none drop-shadow-2xl flex items-center justify-center text-xs"
          initial="initial"
          variants={cursorVariants}
          animate={controls}
        >
          <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
        </motion.div>
      </div>

      {/* Decorative Glow back */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-500/20 rounded-full blur-[80px] z-10 hidden md:block"></div>
    </div>
  );
}
