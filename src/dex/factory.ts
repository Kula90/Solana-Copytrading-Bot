import { DexName } from "../types";
import { DexExecutor } from "./interface";
import { JupiterClient } from "../execution/jupiter-client";
import { RaydiumExecutor } from "./raydium";
import { MeteoraExecutor } from "./meteora";
import { PumpSwapExecutor } from "./pumpswap";
import { PumpfunExecutor } from "./pumpfun";

export function createDexExecutors(jupiter: JupiterClient): Record<DexName, DexExecutor> {
  return {
    [DexName.RAYDIUM]: new RaydiumExecutor(jupiter),
    [DexName.METEORA]: new MeteoraExecutor(jupiter),
    [DexName.PUMPSWAP]: new PumpSwapExecutor(jupiter),
    [DexName.PUMPFUN]: new PumpfunExecutor(jupiter),
    [DexName.UNKNOWN]: new RaydiumExecutor(jupiter)
  };
}
