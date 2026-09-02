export function getExistingRecordNotice(ownedCopies: number): string {
  const count = Math.max(0, Math.floor(ownedCopies));
  if (count === 0) {
    return 'Price data exists for this game, but you do not have an owned copy yet. Bought It will add your first copy to the existing record.';
  }
  return `You own ${count} ${count === 1 ? 'copy' : 'copies'} of this game. Bought It will add another copy to the existing record.`;
}
