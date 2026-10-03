import { forwardRef, useId, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const fieldClass = 'w-full bg-white dark:bg-[#121215] border border-zinc-300 dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all duration-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900'
type FieldLabel = { label: string; helperText?: string }

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldLabel>(
  ({ label, helperText, id, className = '', children, ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id || generatedId
    return <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
      <select ref={ref} id={fieldId} className={`${fieldClass} ${className}`} {...props}>{children}</select>
      {helperText && <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  },
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldLabel>(
  ({ label, helperText, id, className = '', ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id || generatedId
    return <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
      <textarea ref={ref} id={fieldId} className={`${fieldClass} ${className}`} {...props} />
      {helperText && <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  },
)
Textarea.displayName = 'Textarea'

export function Switch({ label, description, checked, onChange, disabled = false }: {
  label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean
}) {
  const id = useId()
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 p-3.5">
    <div><label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">{label}</label>{description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}</div>
    <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative shrink-0 w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${checked ? 'bg-cyan-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  </div>
}
