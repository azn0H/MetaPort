import { useState, useEffect, useRef } from 'react'
import { Folder, File, ArrowUp, HardDrive, Loader2, AlertCircle, Download, UploadCloud } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'

interface FileItem {
  name: string
  is_dir: boolean
  size: number
  permissions: string
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('/home/aznoh')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
    usePageTitle('Správce souborů')

  const fetchFiles = async (path: string) => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/system/files?path=${encodeURIComponent(path)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Nelze načíst složku')
      }
      
      const data = await response.json()
      setFiles(data)
      setCurrentPath(path)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles(currentPath)
  }, [])

  const handleNavigate = (folderName: string) => {
    const newPath = currentPath.replace(/\/$/, '') + '/' + folderName
    fetchFiles(newPath)
  }

  const handleGoUp = () => {
    if (currentPath === '/') return
    const pathParts = currentPath.split('/').filter(Boolean)
    pathParts.pop()
    const newPath = '/' + pathParts.join('/')
    fetchFiles(newPath)
  }

  const handleDownload = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation()
    const filePath = currentPath.replace(/\/$/, '') + '/' + fileName
    const token = localStorage.getItem('jwt_token')
    
    try {
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/system/download?path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Chyba při stahování')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Nepodařilo se stáhnout soubor')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setIsLoading(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const token = localStorage.getItem('jwt_token')
      const response = await fetch(`https://api-metaport.aznoh.cz/api/v1/system/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) throw new Error('Nepodařilo se nahrát soubor')
      
      fetchFiles(currentPath)
    } catch (err) {
      setError('Nepodařilo se nahrát soubor')
      setIsLoading(false)
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Správce souborů</h1>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={handleGoUp}
              disabled={currentPath === '/' || isLoading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
              <HardDrive className="w-4 h-4 text-cyan-500" />
              <span className="text-slate-300 font-mono text-sm">{currentPath}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading && <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
            />
            <button
              onClick={handleUploadClick}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              Nahrát sem
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span className="text-rose-400 text-sm">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-slate-500 text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Název</th>
                <th className="px-6 py-3 font-medium">Velikost</th>
                <th className="px-6 py-3 font-medium">Práva</th>
                <th className="px-6 py-3 font-medium text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {files.map((file) => (
                <tr 
                  key={file.name} 
                  className={`group transition-colors ${file.is_dir ? 'hover:bg-slate-800 cursor-pointer' : 'hover:bg-slate-800/50'}`}
                  onClick={() => file.is_dir ? handleNavigate(file.name) : null}
                >
                  <td className="px-6 py-3 flex items-center gap-3">
                    {file.is_dir ? (
                      <Folder className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                    ) : (
                      <File className="w-5 h-5 text-slate-500" />
                    )}
                    <span className={`font-medium ${file.is_dir ? 'text-white' : 'text-slate-300'}`}>
                      {file.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs">
                    {file.is_dir ? '--' : formatBytes(file.size)}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">
                    {file.permissions}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!file.is_dir && (
                      <button
                        onClick={(e) => handleDownload(e, file.name)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && files.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Složka je prázdná
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}