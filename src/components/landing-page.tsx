'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  UserCheck,
  Zap,
  Brain,
  Heart,
  Star,
  ArrowRight,
  Check,
  Menu,
  X,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface LandingPageProps {
  onGetStarted: () => void;
  onViewDemo: () => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const features = [
  {
    icon: LayoutDashboard,
    title: 'Pipeline Visual',
    description: 'Visualiza clientes en pipeline: Nuevos, Recurrentes, Inactivos',
  },
  {
    icon: Calendar,
    title: 'Calendario Inteligente',
    description: 'Gestión de citas con drag & drop',
  },
  {
    icon: UserCheck,
    title: 'Fichas de Cliente',
    description: 'Historial completo y preferencias',
  },
  {
    icon: Zap,
    title: 'Automatización',
    description: 'Recordatorios y reactivación automática',
  },
  {
    icon: Brain,
    title: 'Contacto Inteligente',
    description: 'Algoritmo que sugiere el mejor momento',
  },
  {
    icon: Heart,
    title: 'Fidelización',
    description: 'Campañas basadas en historial',
  },
];

const pricingPlans = [
  {
    name: 'Básico',
    price: 'Gratis',
    priceDetail: '',
    features: ['50 clientes', 'Calendario básico', '1 usuario'],
    cta: 'Comenzar Gratis',
    highlighted: false,
  },
  {
    name: 'Profesional',
    price: '$29',
    priceDetail: '/mes',
    features: ['Clientes ilimitados', 'Automatizaciones', 'Contacto inteligente', 'Calendario avanzado'],
    cta: 'Prueba Gratis',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$49',
    priceDetail: '/mes',
    features: ['Todo incluido', 'API access', 'Soporte prioritario', 'Integraciones'],
    cta: 'Prueba Gratis',
    highlighted: false,
  },
];

export default function LandingPage({ onGetStarted, onViewDemo }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF8F0' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#B76E79]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image
                src="/glamcrm-logo.png"
                alt="MayeNailsArt Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-xl font-bold" style={{ color: '#2D2D2D' }}>
                Maye<span style={{ color: '#B76E79' }}>NailsArt</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium hover:text-[#B76E79] transition-colors"
                style={{ color: '#2D2D2D' }}
              >
                Características
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium hover:text-[#B76E79] transition-colors"
                style={{ color: '#2D2D2D' }}
              >
                Precios
              </a>
              <a
                href="#contact"
                className="text-sm font-medium hover:text-[#B76E79] transition-colors"
                style={{ color: '#2D2D2D' }}
              >
                Contacto
              </a>
              <Button
                onClick={onGetStarted}
                className="text-white border-0 cursor-pointer"
                style={{ background: '#B76E79' }}
              >
                Comenzar
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#B76E79]/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={24} style={{ color: '#2D2D2D' }} />
              ) : (
                <Menu size={24} style={{ color: '#2D2D2D' }} />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4"
            >
              <div className="flex flex-col gap-3">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-2 hover:text-[#B76E79] transition-colors"
                  style={{ color: '#2D2D2D' }}
                >
                  Características
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-2 hover:text-[#B76E79] transition-colors"
                  style={{ color: '#2D2D2D' }}
                >
                  Precios
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-2 hover:text-[#B76E79] transition-colors"
                  style={{ color: '#2D2D2D' }}
                >
                  Contacto
                </a>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStarted();
                  }}
                  className="text-white border-0 w-full cursor-pointer"
                  style={{ background: '#B76E79' }}
                >
                  Comenzar
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeInUp}>
                <Badge
                  className="w-fit text-xs font-medium border-0"
                  style={{ background: '#B76E7915', color: '#B76E79' }}
                >
                  <Scissors className="size-3" />
                  CRM para Nail Art
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
                style={{ color: '#2D2D2D' }}
              >
                Gestiona tu negocio de nail art{' '}
                <span style={{ color: '#B76E79' }}>con estilo</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl max-w-lg"
                style={{ color: '#2D2D2D99' }}
              >
                El CRM todo-en-uno diseñado para estudios de nail art. Gestiona clientes, citas y
                fidelización desde un solo lugar.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="text-white border-0 text-base cursor-pointer"
                  style={{ background: '#B76E79' }}
                >
                  Prueba Gratis
                  <ArrowRight className="size-4" />
                </Button>
                 <Button
                   size="lg"
                   variant="outline"
                   className="text-base cursor-pointer"
                   style={{ borderColor: '#B76E79', color: '#B76E79' }}
                   onClick={onViewDemo}
                 >
                   Ver Demo
                 </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: i === 1 ? '#B76E79' : i === 2 ? '#D4949E' : i === 3 ? '#9E5560' : '#C4848E' }}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} fill="#B76E79" style={{ color: '#B76E79' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: '#2D2D2D99' }}>
                    +500 estudios de nail art confían en nosotros
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div
                className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl"
                style={{ background: '#B76E79' }}
              />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/salon-hero.png"
                  alt="MayeNailsArt Dashboard"
                  width={700}
                  height={500}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                className="mb-4 border-0"
                style={{ background: '#B76E7915', color: '#B76E79' }}
              >
                Características
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: '#2D2D2D' }}
            >
              Todo lo que necesitas para tu estudio
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg max-w-2xl mx-auto"
              style={{ color: '#2D2D2D99' }}
            >
              Herramientas poderosas diseñadas específicamente para el mundo del nail art
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full border-[#B76E79]/10 hover:border-[#B76E79]/30 hover:shadow-lg transition-all duration-300 group cursor-default">
                  <CardHeader>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300"
                      style={{ background: '#B76E7915' }}
                    >
                      <feature.icon size={24} style={{ color: '#B76E79' }} />
                    </div>
                    <CardTitle className="text-lg" style={{ color: '#2D2D2D' }}>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm" style={{ color: '#2D2D2D99' }}>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20" style={{ background: '#2D2D2D' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-3 gap-8 sm:gap-12"
          >
            {[
              { value: '500+', label: 'Estudios' },
              { value: '50k+', label: 'Citas gestionadas' },
              { value: '98%', label: 'Satisfacción' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <div
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2"
                  style={{ color: '#B76E79' }}
                >
                  {stat.value}
                </div>
                <div className="text-base sm:text-lg font-medium text-white/70">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                className="mb-4 border-0"
                style={{ background: '#B76E7915', color: '#B76E79' }}
              >
                Precios
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ color: '#2D2D2D' }}
            >
              Un plan para cada etapa
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg max-w-2xl mx-auto"
              style={{ color: '#2D2D2D99' }}
            >
              Empieza gratis y crece con tu negocio
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
          >
            {pricingPlans.map((plan) => (
              <motion.div key={plan.name} variants={fadeInUp}>
                <Card
                  className={`h-full relative ${
                    plan.highlighted
                      ? 'border-2 shadow-xl scale-[1.02]'
                      : 'border-[#B76E79]/10 hover:border-[#B76E79]/30'
                  } transition-all duration-300`}
                  style={plan.highlighted ? { borderColor: '#B76E79' } : {}}
                >
                  {plan.highlighted && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ background: '#B76E79' }}
                    >
                      Más Popular
                    </div>
                  )}
                  <CardHeader className="pb-0">
                    <CardTitle
                      className="text-lg font-semibold"
                      style={{ color: '#2D2D2D' }}
                    >
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span
                        className="text-4xl font-bold"
                        style={{ color: plan.highlighted ? '#B76E79' : '#2D2D2D' }}
                      >
                        {plan.price}
                      </span>
                      {plan.priceDetail && (
                        <span className="text-sm" style={{ color: '#2D2D2D99' }}>
                          {plan.priceDetail}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <Separator className="bg-[#B76E79]/10" />
                    <ul className="flex flex-col gap-3 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check
                            size={16}
                            style={{ color: '#B76E79' }}
                            className="shrink-0"
                          />
                          <span style={{ color: '#2D2D2D' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full cursor-pointer"
                      style={
                        plan.highlighted
                          ? { background: '#B76E79', color: 'white', border: 0 }
                          : { borderColor: '#B76E79', color: '#B76E79' }
                      }
                      variant={plan.highlighted ? 'default' : 'outline'}
                      onClick={onGetStarted}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-20 text-center"
            style={{ background: 'linear-gradient(135deg, #B76E79 0%, #9E5560 50%, #2D2D2D 100%)' }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full" style={{ background: 'white', filter: 'blur(80px)' }} />
              <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full" style={{ background: 'white', filter: 'blur(100px)' }} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Transforma tu salón hoy
              </h2>
              <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Únete a cientos de estudios de nail art que ya gestionan sus clientes con estilo.
                Comienza tu prueba gratuita sin compromiso.
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="text-base font-semibold cursor-pointer bg-white hover:bg-white/90"
                style={{ color: '#B76E79' }}
              >
                Comenzar Ahora
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-auto"
        style={{ background: '#2D2D2D' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/glamcrm-logo.png"
                  alt="MayeNailsArt Logo"
                  width={28}
                  height={28}
                  className="rounded-lg"
                />
                <span className="text-lg font-bold text-white">
                  Maye<span style={{ color: '#B76E79' }}>NailsArt</span>
                </span>
              </div>
              <p className="text-sm text-white/60 max-w-xs">
                El CRM diseñado para estudios de nail art. Gestiona, fideliza y crece.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Producto</h3>
              <ul className="flex flex-col gap-2">
                {['Características', 'Precios', 'Integraciones', 'API'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/60 hover:text-[#B76E79] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Empresa</h3>
              <ul className="flex flex-col gap-2">
                {['Sobre nosotros', 'Blog', 'Carreras', 'Contacto'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/60 hover:text-[#B76E79] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Legal</h3>
              <ul className="flex flex-col gap-2">
                {['Privacidad', 'Términos', 'Cookies'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/60 hover:text-[#B76E79] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-white/10" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} MayeNailsArt. Todos los derechos reservados.
            </p>
            <p className="text-sm text-white/40">
              Hecho con <Heart size={12} className="inline" style={{ color: '#B76E79' }} /> para nail art
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
