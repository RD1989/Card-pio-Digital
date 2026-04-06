import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import foodBurger from '@/assets/food-burger.png';
import foodPizza from '@/assets/food-pizza.png';
import foodSalad from '@/assets/food-salad.png';
import foodSoda from '@/assets/food-soda.png';
import foodDessert from '@/assets/food-dessert.png';

const menuItems = [
  { name: 'Classic Burger', desc: 'Pão brioche, cheddar, alface', price: 'R$ 28,90', img: foodBurger, tag: 'Popular' },
  { name: 'Pizza Pepperoni', desc: 'Mozzarella, pepperoni, manjericão', price: 'R$ 42,90', img: foodPizza, tag: '' },
  { name: 'Caesar Salad', desc: 'Alface, croutons, parmesão', price: 'R$ 22,90', img: foodSalad, tag: 'Saudável' },
  { name: 'Refrigerante', desc: 'Coca-Cola 350ml gelada', price: 'R$ 8,90', img: foodSoda, tag: '' },
  { name: 'Petit Gâteau', desc: 'Chocolate belga, sorvete', price: 'R$ 32,90', img: foodDessert, tag: 'Chef' },
];

const cartItems = [
  { name: 'Classic Burger', qty: 2, price: 'R$ 57,80', img: foodBurger },
  { name: 'Pizza Pepperoni', qty: 1, price: 'R$ 42,90', img: foodPizza },
  { name: 'Refrigerante', qty: 2, price: 'R$ 17,80', img: foodSoda },
];

type Screen = 'menu' | 'cart' | 'whatsapp';

export function PhoneSimulator() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [latestAdd, setLatestAdd] = useState<number | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cycle = () => {
      setScreen('menu');
      setAddedItems(new Set());
      setLatestAdd(null);

      timers.push(setTimeout(() => { setAddedItems(new Set([0])); setLatestAdd(0); }, 1800));
      timers.push(setTimeout(() => { setAddedItems(new Set([0, 1])); setLatestAdd(1); }, 2800));
      timers.push(setTimeout(() => { setAddedItems(new Set([0, 1, 3])); setLatestAdd(3); }, 3600));
      timers.push(setTimeout(() => setScreen('cart'), 5000));
      timers.push(setTimeout(() => setScreen('whatsapp'), 7500));
      timers.push(setTimeout(cycle, 11000));
    };

    cycle();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="w-[290px] sm:w-[310px] h-[580px] sm:h-[620px] rounded-[2.8rem] border-[5px] border-foreground/15 bg-card overflow-hidden relative"
        style={{ boxShadow: '0 25px 60px -15px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        
        {/* Status Bar */}
        <div className="h-10 flex items-end justify-between px-7 pb-1 text-[10px] font-semibold text-foreground/60 relative z-10">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <svg width="15" height="10" viewBox="0 0 15 10" className="fill-foreground/50"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
            <svg width="16" height="10" viewBox="0 0 16 10" className="fill-foreground/50"><path d="M1 3.5C3.5 1 6 0 8 0s4.5 1 7 3.5L8 10 1 3.5z"/></svg>
            <div className="w-6 h-3 border border-foreground/40 rounded-sm relative ml-0.5">
              <div className="absolute inset-[1px] right-[2px] bg-foreground/50 rounded-[1px]" style={{ width: '75%' }}/>
              <div className="absolute -right-[3px] top-[3px] w-[2px] h-[4px] bg-foreground/40 rounded-r-sm"/>
            </div>
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-foreground/90 rounded-b-[1rem]" />

        {/* Content */}
        <div className="h-[calc(100%-40px)] flex flex-col">
          <AnimatePresence mode="wait">
            {screen === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Restaurante Gourmet</p>
                      <h3 className="font-bold text-[13px] leading-tight">Cardápio Digital</h3>
                    </div>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground/60"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                      </div>
                      <AnimatePresence>
                        {addedItems.size > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                          >
                            <span className="text-[8px] font-bold text-primary-foreground">{addedItems.size}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {/* Categories */}
                  <div className="flex gap-1.5 overflow-hidden">
                    {['Todos', 'Burgers', 'Pizzas', 'Bebidas', 'Sobremesas'].map((cat, i) => (
                      <div
                        key={cat}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap shrink-0 ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 px-3 pb-1 space-y-2 overflow-hidden">
                  {menuItems.map((item, i) => {
                    const isAdded = addedItems.has(i);
                    const justAdded = latestAdd === i;
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.25 }}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-background border border-border relative overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-[11px] font-bold truncate">{item.name}</p>
                            {item.tag && (
                              <span className="text-[7px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary whitespace-nowrap">{item.tag}</span>
                            )}
                          </div>
                          <p className="text-[8px] text-muted-foreground truncate">{item.desc}</p>
                          <p className="text-[10px] font-bold text-primary mt-0.5">{item.price}</p>
                        </div>
                        <motion.button
                          animate={justAdded ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold transition-colors ${isAdded ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}
                        >
                          {isAdded ? '✓' : '+'}
                        </motion.button>

                        <AnimatePresence>
                          {justAdded && (
                            <motion.div
                              initial={{ scaleX: 0, opacity: 0.5 }}
                              animate={{ scaleX: 1, opacity: 0 }}
                              transition={{ duration: 0.6 }}
                              className="absolute inset-0 bg-primary/10 origin-left rounded-xl pointer-events-none"
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Cart Bar */}
                <AnimatePresence>
                  {addedItems.size > 0 && (
                    <motion.div
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 60, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="mx-3 mb-3 p-3 rounded-2xl bg-primary text-primary-foreground flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[9px] font-medium opacity-70">Seu pedido</p>
                        <p className="text-[11px] font-bold">{addedItems.size} {addedItems.size === 1 ? 'item' : 'itens'} · R$ {addedItems.size === 1 ? '28,90' : addedItems.size === 2 ? '71,80' : '80,70'}</p>
                      </div>
                      <div className="text-[10px] font-bold bg-primary-foreground/20 px-3 py-1.5 rounded-lg">Ver carrinho →</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {screen === 'cart' && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col"
              >
                <div className="px-4 pt-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[10px]">←</span>
                    </div>
                    <h3 className="font-bold text-[13px]">Seu Pedido</h3>
                  </div>
                </div>

                <div className="flex-1 px-4 pt-3 space-y-2.5 overflow-hidden">
                  {cartItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.25 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold truncate">{item.name}</p>
                        <p className="text-[9px] text-muted-foreground">Qtd: {item.qty}</p>
                      </div>
                      <span className="text-[11px] font-bold text-primary shrink-0">{item.price}</span>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="border-t border-border pt-3 mt-2 space-y-1.5"
                  >
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">R$ 118,50</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      <span className="font-semibold">R$ 5,90</span>
                    </div>
                    <div className="flex justify-between text-[12px] pt-2 border-t border-border mt-1">
                      <span className="font-bold">Total</span>
                      <span className="font-extrabold text-primary">R$ 124,40</span>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mx-3 mb-3 mt-2"
                >
                  <div className="p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-[11px] text-card" style={{ background: 'hsl(var(--whatsapp))' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.217A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.69-5.87-1.878l-.42-.25-2.75.722.735-2.686-.274-.436A9.708 9.708 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75S21.75 6.615 21.75 12s-4.365 9.75-9.75 9.75z"/></svg>
                    Enviar no WhatsApp
                  </div>
                </motion.div>
              </motion.div>
            )}

            {screen === 'whatsapp' && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* WA Header */}
                <div className="px-3 py-2.5 flex items-center gap-2.5" style={{ background: 'hsl(var(--whatsapp))' }}>
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-[11px] text-card font-bold">←</span>
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-card/20 flex items-center justify-center">
                    <span className="text-sm">🏪</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-card">Restaurante Gourmet</p>
                    <p className="text-[8px] text-card/70">online</p>
                  </div>
                </div>

                {/* Chat BG */}
                <div className="flex-1 px-3 py-4 space-y-3 overflow-hidden" style={{ background: 'hsl(142 20% 94%)' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="bg-white rounded-xl rounded-tl-sm p-3 max-w-[88%] shadow-sm"
                  >
                    <p className="text-[10px] font-bold mb-1.5 text-gray-900">📋 Novo Pedido #1247</p>
                    <div className="space-y-1 text-[9px] text-gray-600">
                      <p>2x Classic Burger — R$ 57,80</p>
                      <p>1x Pizza Pepperoni — R$ 42,90</p>
                      <p>2x Refrigerante — R$ 17,80</p>
                      <div className="border-t border-gray-200 my-1.5 pt-1.5">
                        <p>Entrega: R$ 5,90</p>
                        <p className="font-bold text-gray-900 text-[10px] mt-0.5">💰 Total: R$ 124,40</p>
                      </div>
                    </div>
                    <p className="text-[8px] text-gray-400 text-right mt-1">10:32 ✓✓</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="rounded-xl rounded-tr-sm p-3 max-w-[75%] ml-auto shadow-sm"
                    style={{ background: 'hsl(142 40% 88%)' }}
                  >
                    <p className="text-[10px] font-semibold text-gray-900">✅ Pedido recebido!</p>
                    <p className="text-[9px] text-gray-700 mt-0.5">Preparo em ~30 minutos</p>
                    <p className="text-[8px] text-gray-400 text-right mt-1">10:33 ✓✓</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.8 }}
                    className="rounded-xl rounded-tr-sm p-3 max-w-[60%] ml-auto shadow-sm"
                    style={{ background: 'hsl(142 40% 88%)' }}
                  >
                    <p className="text-[10px] text-gray-900">🛵 Saiu para entrega!</p>
                    <p className="text-[8px] text-gray-400 text-right mt-1">10:58 ✓✓</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.5, type: 'spring', damping: 10 }}
                    className="flex justify-center pt-2"
                  >
                    <div className="bg-card rounded-full px-4 py-2 shadow-sm flex items-center gap-2">
                      <span className="text-xl">🎉</span>
                      <span className="text-[10px] font-bold text-primary">Pedido confirmado!</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-foreground/15" />
      </div>

      {/* Step indicators */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {(['menu', 'cart', 'whatsapp'] as Screen[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`transition-all duration-500 rounded-full ${screen === s ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-border'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
