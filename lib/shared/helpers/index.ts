// lib/shared/helpers/index.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ar-EG', { // غيرتها لـ ar-EG
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    PLAYER: '🎮 لاعب',
    OWNER: '🏟️ مالك ملعب',
    EMPLOYEE: '👨‍💼 موظف',
    ADMIN: '🛡️ مدير'
  }
  return roleMap[role] || role
}

export function formatSkillLevel(skillLevel: string): string {
  const skillMap: Record<string, string> = {
    WEAK: 'ضعيف 😅',
    AVERAGE: 'متوسط 😊',
    GOOD: 'جيد 😎',
    EXCELLENT: 'ممتاز 🔥',
    LEGENDARY: 'أسطوري 👑'
  }
  return skillMap[skillLevel] || skillLevel
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  // دعم للرقم المصري والعربي
  const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function getGradientColor(level: string): string {
  const gradientMap: Record<string, string> = {
    WEAK: 'from-gray-400 to-gray-500',
    AVERAGE: 'from-blue-400 to-blue-500',
    GOOD: 'from-green-400 to-green-500',
    EXCELLENT: 'from-purple-400 to-purple-500',
    LEGENDARY: 'from-orange-400 to-orange-500'
  }
  return gradientMap[level] || 'from-gray-400 to-gray-500'
}

export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + ' مليون'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + ' ألف'
  }
  return num.toString()
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-EG') + ' ج.م'
}

export function getTimeAgo(date: Date | string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `قبل ${diffMins} دقيقة`
  if (diffHours < 24) return `قبل ${diffHours} ساعة`
  if (diffDays < 30) return `قبل ${diffDays} يوم`
  if (diffDays < 365) return `قبل ${Math.floor(diffDays / 30)} شهر`
  return `قبل ${Math.floor(diffDays / 365)} سنة`
}

// حذف import cn من الآخر لأنها مكررة