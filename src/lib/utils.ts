import { type ClassValue, clsx } from 'clsx'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import updateLocale from 'dayjs/plugin/updateLocale'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(updateLocale)
dayjs.locale('es')

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(date: string | Date, format: string = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format)
}

export function formatDateRelative(date: string | Date): string {
  return dayjs(date).fromNow()
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CO').format(num)
}

export function getDaysDifference(date1: string | Date, date2?: string | Date): number {
  const d1 = dayjs(date1)
  const d2 = date2 ? dayjs(date2) : dayjs()
  return d1.diff(d2, 'day')
}

export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'PAGADA':
    case 'APROBADO':
      return 'bg-green-100 text-green-800'
    case 'PENDIENTE':
      return 'bg-gray-100 text-gray-800'
    case 'VENCIDA':
    case 'RECHAZADO':
      return 'bg-red-100 text-red-800'
    case 'EN_REVISION':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 75) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  if (percentage >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

export function getVencimientoColor(proximoVencimiento: string | null, diasMora: number): {
  color: string
  text: string
} {
  if (diasMora > 0) {
    return {
      color: 'bg-red-100 text-red-800',
      text: `${diasMora} días de mora`
    }
  }

  if (proximoVencimiento) {
    const diasHastaVencimiento = getDaysDifference(proximoVencimiento)
    
    if (diasHastaVencimiento <= 0) {
      return {
        color: 'bg-red-100 text-red-800',
        text: 'Vencido'
      }
    } else if (diasHastaVencimiento <= 5) {
      return {
        color: 'bg-yellow-100 text-yellow-800',
        text: `Vence en ${diasHastaVencimiento} días`
      }
    } else {
      return {
        color: 'bg-green-100 text-green-800',
        text: `Vence ${formatDate(proximoVencimiento)}`
      }
    }
  }

  return {
    color: 'bg-gray-100 text-gray-800',
    text: 'Sin información'
  }
}

export function validateCedula(cedula: string): boolean {
  // Colombian cedula validation - simple format check
  const cleaned = cedula.replace(/\D/g, '')
  return cleaned.length >= 5 && cleaned.length <= 15
}

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

export function formatCedula(cedula: string): string {
  return cedula.replace(/\D/g, '').substring(0, 15)
}

export function formatPin(pin: string): string {
  return pin.replace(/\D/g, '').substring(0, 4)
}