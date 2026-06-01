'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Scissors,
  Sparkles,
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Zap,
  ArrowRight,
  BookOpen,
  Database,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Star,
  Heart,
  UserCheck,
  UserX,
  UserPlus,
  FileText,
   DollarSign,
  Settings,
  Mail,
  MessageSquare,
  Gift,
  Brain,
  CheckCircle2,
  AlertCircle,
  Phone,
} from 'lucide-react';

const STORAGE_KEY = 'glam-onboarding-completed';

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

/* ──────────────────────────── ILLUSTRATIONS ──────────────────────────── */

function WelcomeIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Background glow */}
      <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-[#B76E79]/20 to-[#B76E79]/5 animate-pulse" />
      <div className="absolute w-56 h-56 rounded-full bg-gradient-to-br from-[#B76E79]/10 to-transparent" />
      {/* Scissors */}
      <Scissors className="w-20 h-20 text-[#B76E79] relative z-10" strokeWidth={1.5} />
      {/* Sparkles scattered */}
      <motion.div
        className="absolute top-2 right-8"
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-6 h-6 text-[#B76E79]/70" />
      </motion.div>
      <motion.div
        className="absolute bottom-4 left-6"
        animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.3, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      >
        <Sparkles className="w-5 h-5 text-[#B76E79]/50" />
      </motion.div>
      <motion.div
        className="absolute top-8 left-12"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
      >
        <Star className="w-4 h-4 text-amber-400/60" />
      </motion.div>
      <motion.div
        className="absolute bottom-8 right-12"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }}
      >
        <Star className="w-3 h-3 text-amber-400/50" />
      </motion.div>
      {/* Decorative circles */}
      <div className="absolute top-0 left-16 w-3 h-3 rounded-full bg-[#B76E79]/20" />
      <div className="absolute bottom-2 right-6 w-2 h-2 rounded-full bg-[#B76E79]/30" />
    </div>
  );
}

function DashboardIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Kanban board */}
      <div className="flex gap-2 sm:gap-3 items-start">
        {/* Column: Nuevos */}
        <div className="w-20 sm:w-24 rounded-lg bg-[#B76E79]/8 border border-[#B76E79]/15 overflow-hidden">
          <div className="px-2 py-1.5 bg-[#B76E79]/15 border-b border-[#B76E79]/15">
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#B76E79]">Nuevos</span>
          </div>
          <div className="p-1.5 space-y-1.5">
            <div className="h-6 rounded bg-white shadow-sm border border-gray-100" />
            <div className="h-6 rounded bg-white shadow-sm border border-gray-100" />
            <div className="h-6 rounded bg-white shadow-sm border border-gray-100" />
          </div>
        </div>
        {/* Column: Recurrentes */}
        <div className="w-20 sm:w-24 rounded-lg bg-emerald-50 border border-emerald-100 overflow-hidden">
          <div className="px-2 py-1.5 bg-emerald-100/70 border-b border-emerald-100">
            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-700">Recurrentes</span>
          </div>
          <div className="p-1.5 space-y-1.5">
            <div className="h-6 rounded bg-white shadow-sm border border-gray-100" />
            <div className="h-6 rounded bg-white shadow-sm border border-gray-100" />
          </div>
        </div>
        {/* Column: Inactivos */}
        <div className="w-20 sm:w-24 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
          <div className="px-2 py-1.5 bg-gray-100 border-b border-gray-100">
            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500">Inactivos</span>
          </div>
          <div className="p-1.5 space-y-1.5">
            <div className="h-6 rounded bg-white shadow-sm border border-gray-100" />
          </div>
        </div>
      </div>
      {/* Drag arrow indicator */}
      <motion.div
        className="absolute top-4 right-4"
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowRight className="w-5 h-5 text-[#B76E79]/50" />
      </motion.div>
      {/* Stat cards at top */}
      <div className="absolute top-2 left-4 flex gap-1">
        <div className="w-10 h-5 rounded bg-[#B76E79]/10" />
        <div className="w-10 h-5 rounded bg-emerald-100" />
      </div>
    </div>
  );
}

function CalendarIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Calendar grid */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden w-56 sm:w-64">
        {/* Header */}
        <div className="bg-[#B76E79] px-3 py-2 flex items-center justify-between">
          <ChevronLeft className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs font-semibold text-white">Marzo 2025</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/70" />
        </div>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-0 px-2 pt-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-[8px] text-gray-400 text-center font-medium py-0.5">{d}</div>
          ))}
        </div>
        {/* Date grid */}
        <div className="grid grid-cols-7 gap-0 px-2 pb-2">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 2;
            const isToday = day === 15;
            const hasEvent = [5, 10, 15, 22, 28].includes(day);
            const isValid = day >= 1 && day <= 31;
            return (
              <div
                key={i}
                className={`text-[8px] text-center py-1 relative ${
                  isValid ? (isToday ? 'font-bold' : 'text-gray-600') : 'text-transparent'
                }`}
              >
                {isValid ? day : '.'}
                {isToday && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-[#B76E79] flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">{day}</span>
                    </div>
                  </div>
                )}
                {hasEvent && !isToday && isValid && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#B76E79]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Appointment indicator */}
      <motion.div
        className="absolute bottom-2 right-6 bg-white rounded-lg shadow-md border border-gray-100 px-2 py-1.5 flex items-center gap-1.5"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Clock className="w-3 h-3 text-[#B76E79]" />
        <span className="text-[9px] text-gray-600 font-medium">10:00 - Corte</span>
      </motion.div>
    </div>
  );
}

function ClientsIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Profile card */}
      <div className="w-52 sm:w-60 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
        {/* Card header gradient */}
        <div className="h-14 bg-gradient-to-r from-[#B76E79]/20 to-[#B76E79]/5 relative">
          <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#B76E79]/20">
            <Users className="w-6 h-6 text-[#B76E79]" />
          </div>
        </div>
        {/* Card body */}
        <div className="pt-8 px-4 pb-3">
          <p className="text-sm font-semibold text-[#2D2D2D]">María García</p>
          <p className="text-[10px] text-gray-400 mb-2">Cliente desde Ene 2025</p>
          {/* Stats row */}
          <div className="flex gap-3 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#B76E79]/60" />
              <span className="text-[9px] text-gray-500">12 visitas</span>
            </div>
            <div className="flex items-center gap-1">
               <DollarSign className="w-3 h-3 text-emerald-500/60" />
               <span className="text-[9px] text-gray-500">$480</span>
            </div>
          </div>
          {/* Tags */}
          <div className="flex gap-1 flex-wrap">
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#B76E79]/10 text-[#B76E79] font-medium">Corte</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Coloración</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">Recurrente</span>
          </div>
        </div>
      </div>
      {/* Search indicator */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border border-gray-100 px-2 py-1 flex items-center gap-1">
        <Phone className="w-3 h-3 text-gray-300" />
        <div className="w-12 h-2 rounded bg-gray-100" />
      </div>
    </div>
  );
}

function ServicesIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Price menu card */}
      <div className="w-56 sm:w-64 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#2D2D2D] flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#B76E79]" />
          <span className="text-xs font-semibold text-white">Menú de Servicios</span>
        </div>
        {/* Service items */}
        <div className="divide-y divide-gray-50">
          {[
             { name: 'Corte Mujer', price: '$35', cat: 'Cortes', color: 'bg-[#B76E79]/10 text-[#B76E79]' },
             { name: 'Coloración', price: '$65', cat: 'Color', color: 'bg-amber-50 text-amber-600' },
             { name: 'Peinado Evento', price: '$50', cat: 'Estilismo', color: 'bg-purple-50 text-purple-600' },
             { name: 'Tratamiento Keratina', price: '$80', cat: 'Tratam.', color: 'bg-emerald-50 text-emerald-600' },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${svc.color}`}>{svc.cat}</span>
                <span className="text-[10px] text-gray-700 font-medium">{svc.name}</span>
              </div>
              <span className="text-[10px] font-semibold text-[#2D2D2D]">{svc.price}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Plus badge */}
      <motion.div
        className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-[#B76E79] shadow-lg flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-white text-lg font-light">+</span>
      </motion.div>
    </div>
  );
}

function AutomationsIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Central gear */}
      <motion.div
        className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B76E79] to-[#9a5b64] flex items-center justify-center shadow-lg"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Zap className="w-8 h-8 text-white" />
      </motion.div>
      {/* Orbiting action icons */}
      {[
        { icon: Mail, label: 'Recordatorio', angle: 0, delay: 0 },
        { icon: UserPlus, label: 'Reactivación', angle: 90, delay: 0.5 },
        { icon: Gift, label: 'Lealtad', angle: 180, delay: 1 },
        { icon: Brain, label: 'Inteligente', angle: 270, delay: 1.5 },
      ].map(({ icon: Icon, label, angle, delay }) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 70;
        const y = Math.sin(rad) * 70;
        return (
          <motion.div
            key={label}
            className="absolute z-10 flex flex-col items-center gap-1"
            style={{ left: `calc(50% + ${x}px - 20px)`, top: `calc(50% + ${y}px - 20px)` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#B76E79]" />
            </div>
            <span className="text-[7px] text-gray-400 font-medium whitespace-nowrap">{label}</span>
          </motion.div>
        );
      })}
      {/* Connecting dotted lines (decorative) */}
      <div className="absolute w-36 h-36 rounded-full border-2 border-dashed border-[#B76E79]/15" />
      <div className="absolute w-48 h-48 rounded-full border border-dashed border-[#B76E79]/8" />
    </div>
  );
}

function TableroIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Flow: Nuevo → Recurrente → Inactivo */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Nuevo */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#B76E79]/10 border-2 border-[#B76E79]/30 flex items-center justify-center"
            animate={{ borderColor: ['rgba(183,110,121,0.3)', 'rgba(183,110,121,0.6)', 'rgba(183,110,121,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <UserPlus className="w-7 h-7 text-[#B76E79]" />
          </motion.div>
          <span className="text-[10px] font-semibold text-[#B76E79]">Nuevo</span>
        </div>

        {/* Arrow 1 */}
        <div className="flex flex-col items-center gap-1">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </motion.div>
          <span className="text-[7px] text-gray-400">Visita</span>
        </div>

        {/* Recurrente */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-600">Recurrente</span>
        </div>

        {/* Arrow 2 */}
        <div className="flex flex-col items-center gap-1">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}>
            <ArrowRight className="w-5 h-5 text-gray-300" />
          </motion.div>
          <span className="text-[7px] text-gray-400">Sin visitas</span>
        </div>

        {/* Inactivo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
            <UserX className="w-7 h-7 text-gray-400" />
          </div>
          <span className="text-[10px] font-semibold text-gray-400">Inactivo</span>
        </div>
      </div>

      {/* Reactivation loop arrow */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#B76E79] rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Zap className="w-3 h-3 text-white" />
        <span className="text-[8px] text-white font-medium">¡Reactivar!</span>
      </motion.div>
    </div>
  );
}

function CreateAppointmentIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Booking form mockup */}
      <div className="w-56 sm:w-64 rounded-xl bg-white border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 bg-[#B76E79]/10 border-b border-[#B76E79]/15 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#B76E79]" />
          <span className="text-xs font-semibold text-[#B76E79]">Nueva Cita</span>
        </div>
        {/* Form fields */}
        <div className="p-3 space-y-2.5">
          {/* Cliente */}
          <div>
            <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide">Cliente</span>
            <div className="mt-0.5 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <Users className="w-3 h-3 text-gray-300" />
              <div className="w-20 h-2 rounded bg-gray-200" />
              <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
            </div>
          </div>
          {/* Servicio */}
          <div>
            <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide">Servicio</span>
            <div className="mt-0.5 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <Scissors className="w-3 h-3 text-gray-300" />
              <div className="w-16 h-2 rounded bg-gray-200" />
              <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
            </div>
          </div>
          {/* Fecha y hora */}
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide">Fecha</span>
              <div className="mt-0.5 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <Calendar className="w-3 h-3 text-gray-300" />
                <div className="w-10 h-2 rounded bg-[#B76E79]/20" />
              </div>
            </div>
            <div className="flex-1">
              <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide">Hora</span>
              <div className="mt-0.5 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <Clock className="w-3 h-3 text-gray-300" />
                <div className="w-8 h-2 rounded bg-[#B76E79]/20" />
              </div>
            </div>
          </div>
          {/* Notas */}
          <div>
            <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide">Notas</span>
            <div className="mt-0.5 h-8 rounded-lg bg-gray-50 border border-gray-100 px-2 py-1">
              <div className="w-24 h-1.5 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
      {/* Availability badge */}
      <motion.div
        className="absolute top-6 right-4 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 flex items-center gap-1"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span className="text-[8px] text-emerald-600 font-medium">Disponible</span>
      </motion.div>
    </div>
  );
}

function DemoDataIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Database icon */}
      <div className="relative">
        {/* Stack of database cylinders */}
        <div className="flex flex-col items-center">
          <motion.div
            className="w-24 h-8 rounded-t-2xl bg-gradient-to-b from-[#B76E79] to-[#B76E79]/80 border border-[#B76E79]/50 flex items-center justify-center"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Database className="w-4 h-4 text-white" />
          </motion.div>
          <div className="w-24 h-6 bg-gradient-to-b from-[#B76E79]/70 to-[#B76E79]/50 border-x border-[#B76E79]/30" />
          <div className="w-24 h-6 bg-gradient-to-b from-[#B76E79]/50 to-[#B76E79]/30 border-x border-[#B76E79]/20" />
          <div className="w-24 h-8 rounded-b-2xl bg-gradient-to-b from-[#B76E79]/30 to-[#B76E79]/10 border border-[#B76E79]/15" />
        </div>
        {/* Seed data labels floating */}
        {[
          { label: '14 clientes', x: -60, y: -20, delay: 0 },
          { label: '8 servicios', x: 60, y: -10, delay: 0.3 },
          { label: '21 citas', x: -55, y: 30, delay: 0.6 },
          { label: '4 reglas', x: 58, y: 25, delay: 0.9 },
        ].map(({ label, x, y, delay }) => (
          <motion.div
            key={label}
            className="absolute bg-white rounded-lg shadow-md border border-gray-100 px-2 py-1"
            style={{ left: x, top: y }}
            animate={{ y: [0, -4, 0], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, delay }}
          >
            <span className="text-[8px] text-gray-600 font-medium">{label}</span>
          </motion.div>
        ))}
      </div>
      {/* Settings icon indicator */}
      <div className="absolute top-2 left-6 flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-100 px-2 py-1">
        <Settings className="w-3 h-3 text-gray-400" />
        <span className="text-[8px] text-gray-400">Configuración</span>
      </div>
      {/* Arrow down */}
      <motion.div
        className="absolute bottom-2 right-8"
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="flex items-center gap-1 bg-[#B76E79]/10 rounded-lg px-2 py-1">
          <BookOpen className="w-3 h-3 text-[#B76E79]" />
          <span className="text-[8px] text-[#B76E79] font-medium">Cargar datos</span>
        </div>
      </motion.div>
    </div>
  );
}

function RocketIllustration() {
  return (
    <div className="relative flex items-center justify-center h-52 sm:h-60">
      {/* Rocket body */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex flex-col items-center">
          {/* Nose cone */}
          <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#B76E79]" />
          {/* Body */}
          <div className="w-9 h-16 bg-gradient-to-b from-[#2D2D2D] to-[#4a4a4a] rounded-b-sm relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/90 shadow-inner" />
            {/* Window shine */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-white/40 top-[5px] left-[3px]" />
          </div>
          {/* Fins */}
          <div className="relative -mt-3">
            <div className="absolute -left-5 top-0 w-0 h-0 border-t-[12px] border-t-[#B76E79]/70 border-r-[10px] border-r-transparent border-b-[4px] border-b-transparent" />
            <div className="absolute -right-5 top-0 w-0 h-0 border-t-[12px] border-t-[#B76E79]/70 border-l-[10px] border-l-transparent border-b-[4px] border-b-transparent" />
          </div>
          {/* Flame */}
          <motion.div
            className="flex flex-col items-center -mt-1"
            animate={{ scaleY: [1, 1.3, 0.9, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <div className="w-5 h-6 bg-gradient-to-b from-amber-400 to-orange-500 clip-path-triangle" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            <div className="w-3 h-4 bg-gradient-to-b from-amber-300 to-yellow-400 -mt-3" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Stars background */}
      {[
        { x: '10%', y: '15%', size: 'w-1.5 h-1.5', delay: 0 },
        { x: '85%', y: '20%', size: 'w-1 h-1', delay: 0.5 },
        { x: '75%', y: '70%', size: 'w-2 h-2', delay: 1 },
        { x: '15%', y: '75%', size: 'w-1 h-1', delay: 1.5 },
        { x: '50%', y: '10%', size: 'w-1.5 h-1.5', delay: 0.3 },
        { x: '90%', y: '50%', size: 'w-1 h-1', delay: 0.8 },
        { x: '8%', y: '45%', size: 'w-1.5 h-1.5', delay: 1.2 },
      ].map(({ x, y, size, delay }, i) => (
        <motion.div
          key={i}
          className={`absolute ${size} rounded-full bg-amber-300/70`}
          style={{ left: x, top: y }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay }}
        />
      ))}

      {/* Smoke puffs at bottom */}
      <div className="absolute bottom-4 flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-4 h-4 rounded-full bg-gray-200/50"
            animate={{ scale: [0.5, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────── SLIDE DATA ──────────────────────────── */

interface SlideData {
  illustration: React.FC;
  title: string;
  description: string;
  highlight?: string;
  highlightIcon?: React.FC<{ className?: string }>;
}

const slides: SlideData[] = [
  {
    illustration: WelcomeIllustration,
    title: 'Tu centro de belleza, digitalizado',
    description: 'Gestiona clientes, citas y automatizaciones desde un solo lugar. Comencemos con un recorrido por tu nueva herramienta.',
    highlight: 'Todo en uno',
    highlightIcon: Sparkles,
  },
  {
    illustration: DashboardIllustration,
    title: 'Visualiza el estado de tus clientes',
    description: 'El tablero muestra tus clientes en tres estados: Nuevos, Recurrentes e Inactivos. Arrastra las tarjetas entre columnas para cambiar el estado.',
    highlight: 'Tablero Kanban',
    highlightIcon: LayoutDashboard,
  },
  {
    illustration: CalendarIllustration,
    title: 'Nunca más una cita olvidada',
    description: 'Vista mensual y semanal de tus citas. Crea nuevas citas con un clic, arrastra para reprogramar, y detecta solapamientos automáticamente.',
    highlight: 'Detección de solapamientos',
    highlightIcon: AlertCircle,
  },
  {
    illustration: ClientsIllustration,
    title: 'Perfiles completos de tus clientes',
    description: 'Historial de citas, preferencias, notas y frecuencia de visitas. Busca y filtra por nombre, teléfono o estado.',
    highlight: 'Búsqueda avanzada',
    highlightIcon: FileText,
  },
  {
    illustration: ServicesIllustration,
    title: 'Define tus servicios y precios',
    description: 'Crea servicios con nombre, duración, precio y categoría. Organízalos por tipo: Cortes, Coloración, Estilismo, Tratamientos.',
    highlight: 'Categorías personalizadas',
    highlightIcon: ClipboardList,
  },
  {
    illustration: AutomationsIllustration,
    title: 'Automatiza tareas repetitivas',
    description: '4 tipos de reglas: Recordatorios de cita, Reactivación de clientes inactivos, Programa de lealtad, y Contacto inteligente.',
    highlight: '4 tipos de reglas',
    highlightIcon: Zap,
  },
  {
    illustration: TableroIllustration,
    title: 'Sigue el ciclo de vida de tus clientes',
    description: 'Los clientes pasan por estados: cuando visitan por primera vez son Nuevos, al repetir se vuelven Recurrentes, y si no vuelven en un tiempo pasan a Inactivos. ¡Las automatizaciones te ayudan a reactivarlos!',
    highlight: 'Ciclo automático',
    highlightIcon: Heart,
  },
  {
    illustration: CreateAppointmentIllustration,
    title: 'Agendar es súper fácil',
    description: 'Selecciona cliente, servicio, fecha y hora. El sistema verifica disponibilidad y detecta solapamientos. Puedes añadir notas especiales a cada cita.',
    highlight: 'Verificación en tiempo real',
    highlightIcon: CheckCircle2,
  },
  {
    illustration: DemoDataIllustration,
    title: 'Prueba con datos de ejemplo',
    description: 'Ve a Configuración → Datos y carga datos de demostración para explorar todas las funcionalidades sin ingresar datos reales. ¡Es la mejor forma de aprender!',
    highlight: 'Sin riesgo',
    highlightIcon: BookOpen,
  },
  {
    illustration: RocketIllustration,
    title: 'Tu negocio de nail art, al siguiente nivel',
    description: 'Ya conoces las funciones principales de CrmNailsAgency. Recuerda: puedes volver a ver esta guía desde Configuración en cualquier momento.',
    highlight: '¡Vamos!',
    highlightIcon: Rocket,
  },
];

/* ──────────────────────────── MAIN COMPONENT ──────────────────────────── */

export default function OnboardingTour({ open, onClose, onComplete }: OnboardingTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setCurrentSlide(0);
    onClose();
  }, [onClose]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setCurrentSlide(0);
    onComplete();
  }, [onComplete]);

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const Illustration = slide.illustration;
  const HighlightIcon = slide.highlightIcon;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleSkip}
      />

      {/* Slide container */}
      <motion.div
        className="relative z-10 w-[calc(100%-2rem)] max-w-lg mx-auto"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close / Skip button */}
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saltar</span>
            </button>
          </div>

          {/* Illustration area */}
          <div className="bg-gradient-to-b from-[#B76E79]/5 to-white pt-6 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <Illustration />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content area */}
          <div className="px-6 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Slide number */}
                <div className="flex items-center justify-center mb-3">
                  <span className="text-[10px] font-medium text-[#B76E79]/60 tracking-wider uppercase">
                    Paso {currentSlide + 1} de {slides.length}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] text-center mb-2 leading-tight">
                  {slide.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-500 text-center leading-relaxed mb-4 max-w-sm mx-auto">
                  {slide.description}
                </p>

                {/* Highlight badge */}
                {slide.highlight && HighlightIcon && (
                  <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B76E79]/10 border border-[#B76E79]/15">
                      <HighlightIcon className="w-3.5 h-3.5 text-[#B76E79]" />
                      <span className="text-[11px] font-semibold text-[#B76E79]">{slide.highlight}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 pb-6">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    i === currentSlide
                      ? 'w-6 h-2 bg-[#B76E79]'
                      : i < currentSlide
                        ? 'w-2 h-2 bg-[#B76E79]/40 hover:bg-[#B76E79]/60'
                        : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-label={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  currentSlide === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              {isLastSlide ? (
                <motion.button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B76E79] to-[#9a5b64] text-white text-sm font-semibold shadow-lg shadow-[#B76E79]/25 hover:shadow-xl hover:shadow-[#B76E79]/30 transition-all cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Rocket className="w-4 h-4" />
                  ¡Comenzar!
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#B76E79] text-white text-sm font-semibold hover:bg-[#9a5b64] shadow-md shadow-[#B76E79]/20 transition-all cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
