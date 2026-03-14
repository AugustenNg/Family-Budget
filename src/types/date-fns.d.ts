declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string, options?: { locale?: object }): string
  export function formatDistanceToNow(date: Date | number, options?: { locale?: object; addSuffix?: boolean }): string
  export function isToday(date: Date | number): boolean
  export function isYesterday(date: Date | number): boolean
  export function parseISO(dateString: string): Date
  export function startOfMonth(date: Date | number): Date
  export function endOfMonth(date: Date | number): Date
  export function subMonths(date: Date | number, amount: number): Date
  export function addMonths(date: Date | number, amount: number): Date
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean
}

declare module 'date-fns/locale' {
  export const vi: object
}
