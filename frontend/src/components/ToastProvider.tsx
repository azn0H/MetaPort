import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error'

interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const isSuccess = toast.type === 'success'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-md rounded-xl border shadow-2xl transition-all duration-300
      ${isSuccess ? 'bg-slate-900 border-emerald-500/20' : 'bg-slate-900 border-rose-500/20'}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        ${isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
      >
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <p className="flex-1 text-sm font-medium text-slate-200">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}