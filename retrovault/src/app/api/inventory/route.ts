import { NextResponse } from 'next/server';
import fs from 'fs';
import { resolveDataPath } from '@/lib/runtimePaths';

const dataFilePath = resolveDataPath('inventory.json');

function getInventory() {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  const data = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(data);
}

function saveInventory(data: any[]) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const inventory = getInventory();
    return NextResponse.json(inventory, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newItem = await request.json();
    const inventory = getInventory();
    
    // Assign a random ID
    newItem.id = Math.random().toString(36).substring(2, 10);
    
    inventory.push(newItem);
    saveInventory(inventory);
    
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedItem = await request.json();
    const inventory = getInventory();
    
    const index = inventory.findIndex((item: any) => item.id === updatedItem.id);
    if (index === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    // Preserve existing priceHistory and merge today's prices
    const existing = inventory[index];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const existingHistory = existing.priceHistory || {};
    const newHistory = {
      ...existingHistory,
      [today]: {
        loose: updatedItem.marketLoose || null,
        cib: updatedItem.marketCib || null,
        new: updatedItem.marketNew || null,
        graded: updatedItem.marketGraded || null,
        fetchedAt: new Date().toISOString()
      }
    };
    
    inventory[index] = { ...updatedItem, priceHistory: newHistory };
    saveInventory(inventory);
    
    return NextResponse.json(inventory[index]);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    let inventory = getInventory();
    const initialLength = inventory.length;
    inventory = inventory.filter((item: any) => item.id !== id);
    
    if (inventory.length === initialLength) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    saveInventory(inventory);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
