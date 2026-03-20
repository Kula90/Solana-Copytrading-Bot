export enum DexName {
  PUMPFUN = "PUMPFUN",
  PUMPSWAP = "PUMPSWAP",
  RAYDIUM = "RAYDIUM",
  METEORA = "METEORA",
  UNKNOWN = "UNKNOWN"
}

export enum TradeSide {
  BUY = "BUY",
  SELL = "SELL"
}

export interface TradeSignal {
  signature: string;
  slot: number;
  trader: string;
  dex: DexName;
  side: TradeSide;
  inputMint: string;
  outputMint: string;
  amountInRaw: bigint;
  amountOutRaw: bigint;
  timestampMs: number;
}

export interface BuyRequest {
  tokenMint: string;
  quoteMint: string;
  quoteAmountRaw: bigint;
  slippageBps: number;
}

export interface SellRequest {
  tokenMint: string;
  quoteMint: string;
  tokenAmountRaw: bigint;
  slippageBps: number;
}

export interface ExecutionResult {
  signature: string;
  expectedOutRaw?: bigint;
}

export interface Position {
  tokenMint: string;
  dex: DexName;
  amountRaw: bigint;
  quoteSpentRaw: bigint;
  averageEntryPriceQuotePerToken: number;
  openedAtMs: number;
}
