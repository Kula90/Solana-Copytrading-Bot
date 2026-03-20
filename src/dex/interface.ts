import { BuyRequest, DexName, ExecutionResult, SellRequest } from "../types";

export interface DexExecutor {
  readonly dex: DexName;
  buy(request: BuyRequest): Promise<ExecutionResult>;
  sell(request: SellRequest): Promise<ExecutionResult>;
  quoteSell(tokenMint: string, quoteMint: string, tokenAmountRaw: bigint): Promise<bigint>;
}
