import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | ReactNode
  children: ReactNode
  maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 w-full flex flex-col overflow-hidden ${maxWidth} max-h-[85vh] z-10`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="flex items-center gap-2.5 text-white font-semibold text-base">
              {title}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto bg-[#0d0d10] flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}