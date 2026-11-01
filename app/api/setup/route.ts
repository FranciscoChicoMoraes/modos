import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando setup...')

    // Tentar criar bucket de avatares
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const avatarBucketExists = buckets?.some(b => b.name === 'avatares')

      if (!avatarBucketExists) {
        await supabase.storage.createBucket('avatares', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        })
        console.log('✅ Bucket "avatares" criado')
      } else {
        console.log('✅ Bucket "avatares" já existe')
      }
    } catch (err: any) {
      console.log('⚠️ Bucket info:', err.message)
    }

    // Verificar se coluna existe
    try {
      const { data } = await supabase.from('empresas').select('avatar_url').limit(1)
      console.log('✅ Coluna "avatar_url" já existe')
    } catch (err: any) {
      console.log('⚠️ Coluna não existe - execute o SQL: ALTER TABLE empresas ADD COLUMN avatar_url TEXT;')
    }

    return NextResponse.json({
      success: true,
      message: 'Setup iniciado. Verifique o console do servidor.'
    })
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
