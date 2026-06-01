import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('TEST - URL:', url ? '✓' : '✗', 'Key:', key ? '✓' : '✗')

    if (!url || !key) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
    }

    const testData = {
      nome: 'TEST ' + Date.now(),
      cor: 'red'
    }

    console.log('TEST - Insertando:', testData)

    const res = await fetch(`${url}/rest/v1/empresas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('TEST - Erro HTTP:', res.status, data)
      return NextResponse.json({ error: data }, { status: res.status })
    }

    console.log('TEST - Sucesso:', data)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('TEST - Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
