import { config as loadDotenv } from "dotenv";
import { z } from "zod";
import { DexName } from "./types";
import { NATIVE_SOL_MINT } from "./constants";

loadDotenv();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;
  return value.toLowerCase() === "true";
}, z.boolean());

const schema = z.object({
  RPC_URL: z.string().url(),
  PRIVATE_KEY_BASE58: z.string().min(32),
  TARGET_WALLET: z.string().min(32),
  COMMITMENT: z.enum(["processed", "confirmed", "finalized"]).default("confirmed"),
  YELLOWSTONE_ENDPOINT: z.string().url(),
  YELLOWSTONE_X_TOKEN: z.string().min(1),
  QUOTE_MINT: z.string().default(NATIVE_SOL_MINT),
  COPY_AMOUNT_MODE: z.enum(["FIXED_QUOTE", "TARGET_QUOTE"]).default("FIXED_QUOTE"),
  FIXED_BUY_AMOUNT: z.coerce.number().positive().default(0.1),
  SLIPPAGE_BPS: z.coerce.number().int().min(10).max(5000).default(300),
  PRIORITY_FEE_LAMPORTS: z.coerce.number().int().min(0).default(10_000),
  AUTO_SELL: booleanFromEnv.default(true),
  TAKE_PROFIT_PCT: z.coerce.number().min(1).max(500).default(40),
  STOP_LOSS_PCT: z.coerce.number().min(1).max(99).default(20),
  POLL_INTERVAL_MS: z.coerce.number().int().min(1000).default(7000),
  DEX_ALLOWLIST: z.string().default("RAYDIUM,METEORA,PUMPSWAP,PUMPFUN"),
  MIN_TARGET_BUY_AMOUNT: z.coerce.number().min(0).default(0)
});

const parsed = schema.parse(process.env);

const dexAllowlist = parsed.DEX_ALLOWLIST.split(",")
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean)
  .map((value) => DexName[value as keyof typeof DexName] ?? DexName.UNKNOWN)
  .filter((dex) => dex !== DexName.UNKNOWN);

export const appConfig = {
  ...parsed,
  dexAllowlist,
  minTargetBuyAmountRaw: BigInt(Math.floor(parsed.MIN_TARGET_BUY_AMOUNT * 1_000_000_000)),
  fixedBuyAmountRaw: BigInt(Math.floor(parsed.FIXED_BUY_AMOUNT * 1_000_000_000))
};

export type AppConfig = typeof appConfig;
