import { JUPITER_DEX_LABELS } from "../constants";
import { JupiterClient } from "../execution/jupiter-client";
import { BuyRequest, DexName, ExecutionResult, SellRequest } from "../types";
import { DexExecutor } from "./interface";

export class JupiterDexExecutor implements DexExecutor {
  constructor(
    public readonly dex: DexName,
    private readonly jupiter: JupiterClient
  ) {}

  async buy(request: BuyRequest): Promise<ExecutionResult> {
    const quote = await this.jupiter.quote(
      request.quoteMint,
      request.tokenMint,
      request.quoteAmountRaw,
      request.slippageBps,
      JUPITER_DEX_LABELS[this.dex]
    );
    const signature = await this.jupiter.swap(quote);
    return { signature, expectedOutRaw: BigInt(quote.outAmount) };
  }

  async sell(request: SellRequest): Promise<ExecutionResult> {
    const quote = await this.jupiter.quote(
      request.tokenMint,
      request.quoteMint,
      request.tokenAmountRaw,
      request.slippageBps,
      JUPITER_DEX_LABELS[this.dex]
    );
    const signature = await this.jupiter.swap(quote);
    return { signature, expectedOutRaw: BigInt(quote.outAmount) };
  }

  async quoteSell(tokenMint: string, quoteMint: string, tokenAmountRaw: bigint): Promise<bigint> {
    const quote = await this.jupiter.quote(
      tokenMint,
      quoteMint,
      tokenAmountRaw,
      100,
      JUPITER_DEX_LABELS[this.dex]
    );
    return BigInt(quote.outAmount);
  }
}
