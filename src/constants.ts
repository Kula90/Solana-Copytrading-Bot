import { DexName } from "./types";

export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2t7fQmQf1jR8fQ4xJ9Q4wWf2";

export const QUOTE_MINTS = new Set([NATIVE_SOL_MINT, USDC_MINT, USDT_MINT]);

export const DEX_PROGRAMS: Record<DexName, string[]> = {
  [DexName.PUMPFUN]: [
    "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
  ],
  [DexName.PUMPSWAP]: [
    "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"
  ],
  [DexName.RAYDIUM]: [
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "CAMMCzo5YL8w4VFF8KVHrK22GGUQfB2UVVhA1VQwQk1"
  ],
  [DexName.METEORA]: [
    "LBUZKhRxPF3XUpBCjpYzTKgLcc8in6Lw7JkT7M7T4x7",
    "Eo7WjKq67rjJQSx7CG3F14c4sQnUnxE27XGrZCcsMEtA"
  ],
  [DexName.UNKNOWN]: []
};

export const JUPITER_DEX_LABELS: Record<DexName, string[]> = {
  [DexName.PUMPFUN]: ["Pump.fun AMM"],
  [DexName.PUMPSWAP]: ["PumpSwap"],
  [DexName.RAYDIUM]: ["Raydium", "Raydium CLMM"],
  [DexName.METEORA]: ["Meteora DLMM", "Meteora DAMM v2"],
  [DexName.UNKNOWN]: []
};
