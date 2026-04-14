import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const item = await prisma.wishlistItem.update({
      where: { id },
      data: {
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.notes    !== undefined && { notes: body.notes }),
        ...(body.foundAt  !== undefined && {
          foundAt: body.foundAt ? new Date(body.foundAt) : null,
        }),
        ...(body.title    !== undefined && { title: body.title }),
        ...(body.platform !== undefined && { platform: body.platform }),
      },
    })
    return NextResponse.json({ item })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.wishlistItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
