import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await prisma.wishlistItem.findMany({
      orderBy: [{ priority: 'asc' }, { addedAt: 'desc' }],
    })
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title || !body.platform) {
      return NextResponse.json({ error: 'title and platform are required' }, { status: 400 })
    }
    const item = await prisma.wishlistItem.create({
      data: {
        title:    body.title,
        platform: body.platform,
        gameId:   body.gameId   ?? null,
        priority: body.priority ?? 2,
        notes:    body.notes    ?? null,
      },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
