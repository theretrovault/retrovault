export type EditableGameItem = {
  id: string
  title: string
  platform: string
  status: string
  notes?: string | null
  [key: string]: unknown
}

export type EditableCopy = {
  id: string
  condition: string
  hasBox: boolean
  hasManual: boolean
  priceAcquired: string
  purchaseDate?: string | null
  source?: string | null
  [key: string]: unknown
}

type CopyLike = Partial<EditableCopy> & { id?: string }

export type EditInventoryPayload = Omit<EditableGameItem, 'notes'> & {
  notes: string
  copies: Array<CopyLike>
}

/**
 * Build the JSON body for a PUT/POST to /api/inventory from the edit modal.
 *
 * Notes live on the top-level game record (not on a copy). An empty or
 * missing value must normalize to an empty string, never undefined or null,
 * or the API would overwrite an existing note with a blank value, or drop the
 * field entirely, when the user saves any other field.
 */
export function buildEditPayload(
  item: Partial<EditableGameItem>,
  copies: Array<CopyLike>,
): EditInventoryPayload {
  return {
    ...item,
    notes: item.notes ?? '',
    copies: copies.map((copy) => ({ ...copy })),
  }
}
