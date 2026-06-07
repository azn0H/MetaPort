import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
// TENTO IMPORT JE KRITICKÝ - bez něj by terminál neměl správný font a rozložení
import 'xterm/css/xterm.css' 
import { Terminal as TerminalIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function ConsolePage() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!terminalRef.current) return

    const token = localStorage.getItem('jwt_token')
    if (!token) {
      setStatus('disconnected')
      return
    }

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#06b6d4',
        selectionBackground: '#334155',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      rows: 30,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    
    term.open(terminalRef.current)
    
    // Ochrana proti padání Xterm.js kvůli rychlému překreslování Reactu
    const timeoutId = setTimeout(() => {
      try {
        fitAddon.fit()
      } catch (e) {}
    }, 50)

    const handleResize = () => {
      try {
        fitAddon.fit()
      } catch (e) {}
    }
    window.addEventListener('resize', handleResize)

    const wsUrl = `wss://api-metaport.aznoh.cz/api/v1/system/ws/console?token=${token}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setStatus('connected')
      term.focus()
    }

    ws.onmessage = (event) => {
      term.write(event.data)
    }

    ws.onclose = () => {
      setStatus('disconnected')
      term.write('\r\n\x1b[31m[Spojení s terminálem bylo ukončeno]\x1b[0m\r\n')
    }

    ws.onerror = () => {
      setStatus('disconnected')
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      // Zavřeme WebSocket jen tehdy, pokud je reálně otevřený nebo se právě připojuje
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
      term.dispose()
    }
  }, [])

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">SSH Konzole</h1>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm shadow-lg">
          {status === 'connecting' && (
            <>
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              <span className="text-amber-500 font-medium text-sm">Připojování...</span>
            </>
          )}
          {status === 'connected' && (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-500 font-medium text-sm">Připojeno</span>
            </>
          )}
          {status === 'disconnected' && (
            <>
              <XCircle className="w-5 h-5 text-rose-500" />
              <span className="text-rose-500 font-medium text-sm">Odpojeno</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col relative">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm font-mono">root@metaport:~#</span>
        </div>
        
        {/* Zde se vykreslí samotný Xterm.js terminál */}
        <div 
          ref={terminalRef} 
          className="flex-1 p-4 w-full h-full overflow-hidden"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
}