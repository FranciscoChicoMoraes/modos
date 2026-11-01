# ESPECIFICAÇÃO COMPLETA - MODOS OPERANDI (Recruta SaaS)

## 1. VISÃO GERAL DO PROJETO

**Nome:** Modos Operandi / Recruta SaaS  
**Objetivo:** Plataforma de gerenciamento de demandas, tarefas e processo seletivo para empresas de recrutamento  
**Tipo:** Web Application (SaaS)  
**Stack Principal:** Next.js 16.2.6, React, TypeScript, Tailwind CSS, Supabase

---

## 2. AUTENTICAÇÃO & USUÁRIOS

### 2.1 Sistema de Autenticação
- **Tipo:** Email + Senha
- **Persistência:** localStorage com session management
- **Provider:** Supabase Auth
- **Fluxo:**
  - Login com email/senha
  - Criação de conta
  - Recuperação de senha

### 2.2 Dados do Usuário
```typescript
User {
  id: string (UUID)
  email: string
  name: string
  avatar_url?: string
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 3. ESTRUTURA DE BANCO DE DADOS (Supabase)

### 3.1 Tabela: `empresas` (Demandas)

**Campos:**
```typescript
{
  id: string (UUID, PK)
  nome: string (nome da empresa/cliente)
  cor: string (enum: 'red' | 'gray' | 'green') // para identificação visual
  avatar?: string (URL de imagem do Supabase Storage)
  instagram?: string (handle)
  agendamentos?: string (link ou info)
  pagina?: string (URL)
  tiktok?: string (handle)
  google?: string (URL)
  loginssenhas?: string (info privada)
  created_at: timestamp
  updated_at: timestamp
  user_id: string (FK para users)
}
```

**Índices:**
- `user_id` (para filtrar por usuário)
- `created_at` (para ordenação)

---

### 3.2 Tabela: `tarefas` (Tasks/Demandas)

**Campos:**
```typescript
{
  id: string (UUID, PK)
  empresa_id: string (FK para empresas)
  descricao: string (descrição da tarefa)
  data: string (formato DD/MM/YYYY)
  periodo: string (enum: 'manha' | 'tarde')
  concluida: boolean (default: false)
  aguardando?: boolean (opcional, para status)
  created_at: timestamp
  updated_at: timestamp
}
```

**Índices:**
- `empresa_id` (para listar tarefas por empresa)
- `data` (para filtrar por data)
- `concluida` (para filtrar completas/pendentes)

---

### 3.3 Tabela: `candidatos` (Recruitment)

**Campos:**
```typescript
{
  id: string (UUID, PK)
  platform_id: string (ex: REC-001)
  name: string
  email: string
  phone: string
  whatsapp: string
  experience_years: number
  skills: string[] (array de habilidades)
  areas: string[] (array de áreas)
  avatar_url: string (URL)
  stage: string (enum: 'curriculum' | 'interview' | 'test' | 'hired')
  created_at: timestamp
  age?: number
  gender?: string (enum: 'male' | 'female' | 'other')
  resume: string (texto)
  social_media: {
    instagram?: string
    linkedin?: string
  }
  archived: boolean (default: false)
  archive_reason?: string (enum: 'gave_up' | 'other')
}
```

---

### 3.4 Storage (Supabase Storage)

**Bucket: `avatars`** (público)
- Armazena fotos de perfil de empresas
- Acesso público
- Formato: `{uuid}.jpg`
- Limite: 5MB por arquivo

---

## 4. PÁGINAS E FUNCIONALIDADES

### 4.1 Dashboard (`/dashboard`)

**Componentes:**
- Header com título "Dashboard"
- Grid de 4 cards com estatísticas:
  - Currículo (blue)
  - Entrevista (purple)
  - Teste (amber)
  - Contratada (green)

**Funcionalidades:**
- Filtro por nome/email (search)
- Filtro por faixa etária (18-25, 26-35, 36-50, 50+)
- Filtro por gênero (M/F/Outro)
- Grid responsivo de candidatos (1-4 colunas)
- Modal de detalhes do candidato
- Modal de arquivamento com motivo

**Data Flow:**
- Fetch `GET /api/candidatos`
- Atualização a cada 10 segundos
- Real-time filtering com useMemo

**Estatísticas de Demandas:**
- Tarefas por dia (últimos 7 dias)
- Tarefas por período (manhã/tarde)
- Tarefas por empresa (com progresso em %)
- Cards mostrando: feitas (verde), a fazer (vermelho), percentual

---

### 4.2 Demandas (`/demandas`)

**Estrutura Geral:**
- Sidebar com empresas listadas
- Área central com detalhes da empresa
- Painel direito com preview do Instagram

**4.2.1 Gerenciamento de Empresas**

**Botões Principais:**
- "+ Nova Empresa" → Abre modal
- "+ Nova Tarefa" → Abre modal (dentro de empresa selecionada)
- "Tarefas em Lote" → Abre modal para upload em massa

**Modal: Nova Empresa**
```
Campos:
- Nome da empresa (obrigatório)
- Selecionar cor (red/gray/green)
- Upload de avatar (foto do perfil)
- Instagram (@)
- Agendamentos (link)
- Página (URL)
- TikTok (@)
- Google (URL)
- Logins e Senhas (campo privado)

Ações:
- Salvar (POST /api/demandas)
- Cancelar com X button
```

**Avatar Upload:**
- Compressão para 500px max
- Upload para Supabase Storage (`avatars` bucket)
- Preview instantâneo
- Atualização automática na listagem

**4.2.2 Gerenciamento de Tarefas**

**Modal: Nova Tarefa**
```
Campos:
- Descrição (text input com autocomplete)
- Data (date picker, formato DD/MM/YYYY)
- Período (botões: Manhã / Tarde, default baseado na hora atual)

Ações:
- Salvar (POST /api/demandas/tarefas)
- Cancelar com X button

Autocomplete:
- Mostra sugestões de tarefas anteriores
- Busca por qualquer parte do nome (substring match)
- Mínimo 3 caracteres para exibir
```

**Modal: Tarefas em Lote**
```
Campos:
- Textarea para listar tarefas (uma por linha)
- Date picker para data inicial
- Checkbox para período

Lógica de Distribuição:
- Distribui tarefas em 7 dias (ciclicamente)
- Alterna períodos: manhã para dias 1-7, tarde para dias 8-14, etc
- Exemplo:
  * Tarefa 1: Dia 1 - Manhã
  * Tarefa 2: Dia 2 - Manhã
  * Tarefa 3: Dia 3 - Manhã
  * ...
  * Tarefa 7: Dia 7 - Manhã
  * Tarefa 8: Dia 1 - Tarde
  * Tarefa 9: Dia 2 - Tarde
  * etc

Ações:
- Criar todas com uma requisição loop
- Mostrar loading
- Atualizar listagem após sucesso
```

**4.2.3 Listagem de Tarefas**

**Por Empresa:**
- Mostrar apenas as próximas tarefas (default 2, expansível)
- Status visual: concluída (verde) ou pendente (vermelho)
- Ordenação por data
- Toggle de conclusão (checkbox)
- Botão de deletar (X)

**Filtro de Tarefas:**
- Search por nome (substring match)
- Autocomplete com sugestões

**4.2.4 Sidebar de Empresas**

- Lista todas as empresas
- Cor da empresa como identificador visual
- Avatar da empresa (se existir)
- Número de tarefas pendentes
- Botão de deletar empresa
- Botão "+ Nova Empresa" no topo

---

### 4.3 Processo Seletivo (`/processo-seletivo`)

**Status:** Página placeholder existente
- Link na sidebar
- Pode ser desenvolvido para gerenciar etapas do recrutamento

---

### 4.4 Vagas (`/vagas`)

**Status:** Página placeholder existente
- Link na sidebar
- Pode ser desenvolvido para CRUD de vagas

---

## 5. COMPONENTES PRINCIPAIS

### 5.1 Sidebar (`components/Sidebar.tsx`)

**Funcionalidades:**
- Navegação entre páginas
- Toggle de sidebar (minimiza para ícones)
- Dark mode toggle (botão na parte inferior)
- Logout (se implementado)
- Responsivo para mobile

**Menu Items:**
- Dashboard
- Processo Seletivo
- Vagas
- Demandas
- Marketing
- VideoFlow
- Conteúdos
- Configurações

---

### 5.2 Dark Mode (`components/LayoutContent.tsx`)

**Sistema:**
- State management via localStorage
- Toggle button na sidebar
- TailwindCSS dark: prefix
- Cores consistentes em light/dark

**Paleta Dark:**
- Background: `bg-gray-900` (main), `bg-gray-800` (secondary)
- Text: `text-white`, `text-gray-400` (muted)
- Borders: `border-gray-700`

---

### 5.3 Componentes de Candidatos

**CandidateCard** - Card individual
- Foto (avatar)
- Nome
- Email
- Skills (badges)
- Stage (badge colorido)
- Botão de arquivamento

**CandidateModal** - Detalhes completo
- Foto grande
- Informações completas
- Botões de ação

**ArchiveModal** - Confirmação de arquivamento
- Motivo do arquivamento
- Botões de confirmação

---

## 6. ROTAS & APIS

### 6.1 Empresas/Demandas

**GET /api/demandas**
```
Query: ?user_id=xxx (opcional)
Response:
[
  {
    id, nome, cor, avatar, instagram, agendamentos, pagina, tiktok, google, loginssenhas,
    tarefas: [
      { id, descricao, data, periodo, concluida }
    ]
  }
]
```

**POST /api/demandas**
```
Body:
{
  nome: string
  cor: string (red|gray|green)
  avatar?: string (base64 ou URL)
  instagram?: string
  agendamentos?: string
  pagina?: string
  tiktok?: string
  google?: string
  loginssenhas?: string
}
Response: { id, ... }
```

**PATCH /api/demandas**
```
Body: { id, nome, cor, avatar, ... }
Response: { id, ... }
```

**DELETE /api/demandas/[id]**
```
Response: { success: boolean }
```

---

### 6.2 Tarefas

**POST /api/demandas/tarefas**
```
Body:
{
  empresa_id: string
  descricao: string
  data: string (DD/MM/YYYY)
  periodo: string (manha|tarde)
}
Response: { id, ... }
```

**PATCH /api/demandas/tarefas**
```
Body: { id, descricao, data, periodo, concluida }
Response: { id, ... }
```

**DELETE /api/demandas/tarefas/[id]**
```
Response: { success: boolean }
```

---

### 6.3 Candidatos

**GET /api/candidatos**
```
Response:
[
  {
    id, platform_id, name, email, phone, whatsapp,
    experience_years, skills[], areas[], avatar_url,
    stage, created_at, age, gender, resume,
    social_media, archived, archive_reason
  }
]
```

---

## 7. UTILITÁRIOS & FUNÇÕES

### 7.1 Tratamento de Datas

**Padrão:** DD/MM/YYYY
```typescript
// Formatar data atual
const hoje = new Date()
const dataStr = `${hoje.getDate()}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`

// Adicionar dias
const somarDias = (dataStr: string, dias: number): string => {
  const [d, m, a] = dataStr.split('/').map(Number)
  const data = new Date(a, m - 1, d)
  data.setDate(data.getDate() + dias)
  return `${data.getDate()}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`
}

// Converter para Date
const converterDataParaDate = (data: string): Date => {
  const [dia, mes, ano] = data.split('/')
  return new Date(`${ano}-${mes}-${dia}`)
}
```

### 7.2 Compressão de Imagens

```typescript
const comprimirImagem = async (file: File, maxSize = 500): Promise<{src, b64, name}> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round(h * maxSize / w)
          w = maxSize
        } else {
          w = Math.round(w * maxSize / h)
          h = maxSize
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const b64 = canvas.toDataURL('image/jpeg', 0.72)
      resolve({
        src: b64,
        b64: b64.split(',')[1],
        name: file.name
      })
    }
    img.src = url
  })
}
```

### 7.3 Distribuição de Tarefas em Lote

```typescript
const distribuirTarefas = (
  tarefas: string[],
  dataInicial: string
): Array<{descricao, data, periodo}> => {
  return tarefas.map((desc, i) => {
    const diaOffset = i % 7
    const ciclo = Math.floor(i / 7)
    const periodo = ciclo % 2 === 0 ? 'manha' : 'tarde'
    const data = somarDias(dataInicial, diaOffset)
    return { descricao: desc.trim(), data, periodo }
  })
}
```

---

## 8. FLUXOS DE NEGÓCIO

### 8.1 Fluxo de Demandas

1. Usuário clica "+ Nova Empresa"
2. Preenche formulário (nome, cor, avatar, redes)
3. Upload de avatar para Supabase Storage
4. POST /api/demandas
5. Empresa aparece na sidebar
6. Clica em empresa → abre detalhes
7. "+ Nova Tarefa" → adiciona tarefa individual
8. "Tarefas em Lote" → distribui múltiplas tarefas

### 8.2 Fluxo de Tarefas

1. Tarefa é criada com data e período
2. Aparece na listagem da empresa
3. Usuário marca como concluída (toggle)
4. Dados atualizados no banco
5. Dashboard atualiza estatísticas
6. Tarefa pode ser deletada com botão X

### 8.3 Fluxo de Recrutamento

1. Candidato criado no sistema
2. Listado no Dashboard
3. Filtros aplicados (nome, idade, gênero)
4. Clique abre modal com detalhes
5. Pode mudar stage ou arquivar
6. Arquivados aparecem em aba separada

---

## 9. CONFIGURAÇÕES & CONSTANTES

### 9.1 Cores de Empresas

```typescript
const CORES: Record<string, string> = {
  red: 'bg-red-500',
  gray: 'bg-gray-500',
  green: 'bg-green-500'
}
```

### 9.2 Períodos

```typescript
const PERIODOS = {
  manha: '☀ Manhã',
  tarde: '🌙 Tarde'
}
```

### 9.3 Stages de Recrutamento

```typescript
const STAGES = ['curriculum', 'interview', 'test', 'hired']
```

---

## 10. PERFORMANCE & OTIMIZAÇÕES

- **Polling:** Dashboard atualiza a cada 10 segundos
- **Memoization:** useMemo para filtros complexos
- **Lazy Loading:** Lazy load de imagens
- **Compressão:** Imagens comprimidas antes de upload
- **localStorage:** Dark mode e preferências de UI

---

## 11. INTEGRAÇÃO SUPABASE

### Configuração Necessária

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Buckets Necessários

- `avatars` (público) - para fotos de empresas

### Tabelas Necessárias

- `empresas` com campos conforme 3.1
- `tarefas` com campos conforme 3.2
- `candidatos` com campos conforme 3.3

### Políticas RLS (Row Level Security)

```sql
-- Empresas: usuário só vê suas próprias
CREATE POLICY "users_see_own_empresas" ON empresas
  USING (auth.uid() = user_id);

-- Tarefas: usuário só vê de suas empresas
CREATE POLICY "users_see_own_tarefas" ON tarefas
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );
```

---

## 12. MOBILE & RESPONSIVIDADE

- Sidebar colapsável em mobile
- Grid responsivo (1-4 colunas)
- Modals fullscreen em mobile
- Touch-friendly buttons
- Tailwind breakpoints: sm, md, lg, xl

---

## 13. DARK MODE

**Implementação:**
- localStorage key: `darkMode`
- Toggle em components/Sidebar.tsx
- Aplicado globalmente via Tailwind

**Cores Dark:**
- Primary: `bg-gray-900`
- Secondary: `bg-gray-800`
- Text: `text-white`
- Muted: `text-gray-400`
- Border: `border-gray-700`

---

## 14. ACESSIBILIDADE

- Semantic HTML (button, input, form)
- ARIA labels em modais
- Focus visible em inputs
- Contraste adequado light/dark
- Alt text em imagens

---

## 15. SEGURANÇA

- Autenticação via Supabase
- RLS policies no banco
- Não armazena senhas em cliente
- CORS configurado corretamente
- Validação de inputs no backend

---

## 16. STACK TÉCNICO RESUMIDO

```
Frontend:
- Next.js 16.2.6 (Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- Lucide React (ícones)

Backend:
- Supabase (PostgreSQL)
- Next.js API Routes

Storage:
- Supabase Storage (avatars)

Estado:
- React hooks (useState, useEffect, useMemo)
- localStorage para preferências

Libs Adicionais:
- uuid (para IDs)
- jszip (para downloads em zip)
```

---

## 17. ESTRUTURA DE PASTAS SUGERIDA

```
app/
├── layout.tsx
├── page.tsx (home)
├── dashboard/
│   └── page.tsx
├── demandas/
│   └── page.tsx
├── processo-seletivo/
│   └── page.tsx
├── vagas/
│   └── page.tsx
├── marketing/
│   └── page.tsx
├── videoflow/
│   └── page.tsx
├── conteudos/
│   └── page.tsx
├── configuracoes/
│   └── page.tsx
└── api/
    ├── demandas/
    │   ├── route.ts (GET, POST, PATCH)
    │   └── tarefas/
    │       └── route.ts (POST, DELETE)
    ├── candidatos/
    │   └── route.ts (GET)
    └── auth/
        └── route.ts (login, logout)

components/
├── Sidebar.tsx
├── LayoutContent.tsx
├── CandidateCard.tsx
├── CandidateModal.tsx
├── ArchiveModal.tsx
└── ...

lib/
├── supabase.ts (client)
└── utils.ts (funções auxiliares)

types/
├── index.ts (interfaces TypeScript)
```

---

## 18. PRÓXIMAS MELHORIAS SUGERIDAS

1. Notifications/Toast para feedback ao usuário
2. Export de relatórios (PDF, Excel)
3. Integração com calendário
4. Webhooks para eventos importantes
5. API pública para integrações externas
6. Sistema de permissões (admin, user, viewer)
7. Histórico de ações (audit log)
8. Real-time updates com WebSocket

---

## 19. TESTES RECOMENDADOS

### Unit Tests
- Funções de formatação de data
- Distribuição de tarefas
- Compressão de imagens

### Integration Tests
- CRUD de empresas
- CRUD de tarefas
- CRUD de candidatos
- Filtros do dashboard

### E2E Tests
- Criar empresa com avatar
- Adicionar tarefas em lote
- Filtrar candidatos
- Arquivar candidato

---

## 20. DEPLOYMENT

**Recomendado:**
- Vercel (Next.js nativo)
- Supabase (hospedagem do banco)

**Variáveis de Ambiente:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_URL (se necessário)
```

---

**FIM DA ESPECIFICAÇÃO**

**Versão:** 1.0  
**Data:** 2024  
**Status:** Completo e funcional
