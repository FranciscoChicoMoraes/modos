'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function Configuracoes() {
  const [googleConnected, setGoogleConnected] = useState(false)

  const handleConnectGoogle = () => {
    alert('Redirecionando para Google Calendar...')
    // Aqui será implementada a integração com Google Calendar
    setGoogleConnected(true)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold text-black">Configurações</h1>
        <p className="text-sm text-gray-500 mt-2">Gerencie suas integrações e preferências</p>
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Google Calendar</h3>
            <p className="text-sm text-gray-600 mt-2">
              Sincronize sua agenda para agendar entrevistas automaticamente
            </p>
          </div>
          <div className="flex items-center gap-2">
            {googleConnected && <Check size={20} className="text-green-600" />}
            <span className={`text-xs px-2 py-1 rounded ${
              googleConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {googleConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <button
          onClick={handleConnectGoogle}
          className={`mt-6 px-4 py-2 rounded text-sm font-medium transition-colors ${
            googleConnected
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {googleConnected ? 'Desconectar' : 'Conectar Google Calendar'}
        </button>
      </div>

      {/* API Settings */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <h3 className="text-lg font-semibold text-black">Google Meet API</h3>
        <p className="text-sm text-gray-600 mt-2">
          Configure as credenciais para gerar links de reunião automaticamente
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Client ID
            </label>
            <input
              type="text"
              placeholder="Sua Client ID do Google"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Client Secret
            </label>
            <input
              type="password"
              placeholder="Sua Client Secret do Google"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
            />
          </div>

          <button className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded text-sm font-medium transition-colors">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}
