import { Sparkles, UploadCloud, MessageCircle, Award, Tag, LineChart } from 'lucide-react';

export const LANDING_FEATURES = [
  { 
    icon: Sparkles, 
    title: 'I.A. Integrada', 
    desc: 'Descrições inteligentes e persuasivas. Nossa IA cria os textos dos seus pratos de forma automática.' 
  },
  { 
    icon: UploadCloud, 
    title: 'Importação Automática', 
    desc: 'Pare de cadastrar um por um. Importe seu cardápio inteiro do iFood com alguns cliques e ganhe tempo.' 
  },
  { 
    icon: MessageCircle, 
    title: 'Pedidos via WhatsApp', 
    desc: 'Receba seus pedidos de forma clara e padronizada direto no seu zap. Zero taxas.' 
  },
  { 
    icon: Award, 
    title: 'Aplicativo Próprio', 
    desc: 'Seu sistema rodando em link exclusivo. Personalize com a sua logo e a cor principal da sua marca e crie o seu ativo.' 
  },
  { 
    icon: Tag, 
    title: 'QR Code de Mesa', 
    desc: 'Atenda nos salões espalhando QR Codes nas mesas usando nosso gerador 1 clique de etiquetas PDF.' 
  },
  { 
    icon: LineChart, 
    title: 'Painel de Gestão', 
    desc: 'Histórico de vendas, produtos mais pedidos, cadastro de categorias e relatórios detalhados.' 
  },
];

export const LANDING_STEPS = [
  { num: '1', title: 'Crie sua Conta Grátis', desc: 'Em 2 minutos você faz seu cadastro básico. Comece direto no teste gratuito.' },
  { num: '2', title: 'Importe seu Cardápio', desc: 'Importe listas de produtos instantaneamente ou crie-os com descrição automática via IA.' },
  { num: '3', title: 'Sua Própria Ferramenta', desc: 'Pronto! Sem mensalidades absurdas e com vendas fluindo para seu WhatsApp.' },
];

export const DEFAULT_TESTIMONIALS = [
  { 
    name: 'Lucas Freitas', 
    role: 'Hamburgueria Cowpizza', 
    quote: 'Troquei meu app obsoleto de delivery. Mudei pro Menu Pro Cardápio, melhor a pagar pro meus clientes.' 
  },
  { 
    name: 'Marlene Silva', 
    role: 'Cozinha da Marlene', 
    quote: 'A impressão de etiquetas é fantástica. Economizo horas na montagem e minha divulgação é incrível.' 
  },
  { 
    name: 'Roberto Almeida', 
    role: 'Pizzaria di Napoli', 
    quote: 'O cliente clica, monta e pede pelo celular. Funciona perfeitamente e é meu melhor investimento.' 
  },
];

export const DEFAULT_FAQS = [
  { q: 'Existe taxa em cada venda?', a: 'Não! O Menu Pro não cobra taxa por venda. Você paga apenas o plano mensal escolhido.' },
  { q: 'Como recebo os pedidos no WhatsApp?', a: 'Ao criar seu cardápio, você configura seu número de WhatsApp. Os clientes enviam o pedido diretamente para você.' },
  { q: 'Como funciona o gerador de etiquetas?', a: 'Basta acessar o painel, escolher o layout e imprimir. As etiquetas já vêm com QR Code do seu cardápio.' },
];
