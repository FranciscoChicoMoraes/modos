import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Empresa = {
  id: string
  nome: string
  cor: 'red' | 'gray' | 'green'
  avatar?: string
  instagram?: string
  agendamentos?: string
  pagina?: string
  tiktok?: string
  google?: string
  loginssenhas?: string
  tarefas: Tarefa[]
}

export type Tarefa = {
  id: string
  empresa_id: string
  descricao: string
  data: string
  periodo: 'manha' | 'tarde'
  concluida: boolean
}
