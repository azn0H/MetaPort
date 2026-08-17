import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css' 
import { Terminal as TerminalIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function ConsolePage() {
  usePageTitle('Konzole')
  
  const terminalRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    if (!terminalRef.current) return

    const token = localStorage.getItem('jwt_token')
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

    if (!token) {
      setStatus('disconnected')
      term.write('\r\n\x1b[31m[Chyba] Uživatel není přihlášen (chybí autorizační token).\x1b[0m\r\n')
      return () => {
        term.dispose()
      }
    }
    
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

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = isLocal 
      ? `${window.location.hostname}:8025` 
      : (window.location.hostname.includes('metaport.aznoh.cz') ? 'api-metaport.aznoh.cz' : `${window.location.hostname}:8025`)
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/system/ws/console?token=${token}`

    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(wsUrl)

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
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })
    } catch (err: any) {
      setStatus('disconnected')
      term.write(`\r\n\x1b[31m[Chyba připojení WebSocket]: ${err?.message || err}\x1b[0m\r\n`)
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
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
        
        <div 
          ref={terminalRef} 
          className="flex-1 p-4 w-full h-full overflow-hidden"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
}