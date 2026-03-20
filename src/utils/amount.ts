export function uiAmountToRaw(amount: number, decimals = 9): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

export function rawToUiAmount(raw: bigint, decimals = 9): number {
  return Number(raw) / 10 ** decimals;
}
