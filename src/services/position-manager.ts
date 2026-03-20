import { DexExecutor } from "../dex/interface";
import { logger } from "../logger";
import { DexName, Position } from "../types";

export class PositionManager {
  private readonly positions = new Map<string, Position>();

  set(position: Position): void {
    this.positions.set(position.tokenMint, position);
  }

  get(tokenMint: string): Position | undefined {
    return this.positions.get(tokenMint);
  }

  remove(tokenMint: string): void {
    this.positions.delete(tokenMint);
  }

  all(): Position[] {
    return [...this.positions.values()];
  }

  async evaluateAutoSell(
    executors: Record<DexName, DexExecutor>,
    takeProfitPct: number,
    stopLossPct: number,
    quoteMint: string
  ): Promise<string[]> {
    const soldTokens: string[] = [];

    for (const position of this.positions.values()) {
      try {
        const executor = executors[position.dex] ?? executors[DexName.RAYDIUM];
        const quoteOut = await executor.quoteSell(position.tokenMint, quoteMint, position.amountRaw);
        const pnlPct = ((Number(quoteOut) - Number(position.quoteSpentRaw)) / Number(position.quoteSpentRaw)) * 100;

        if (pnlPct >= takeProfitPct || pnlPct <= -stopLossPct) {
          await executor.sell({
            tokenMint: position.tokenMint,
            quoteMint,
            tokenAmountRaw: position.amountRaw,
            slippageBps: 300
          });
          soldTokens.push(position.tokenMint);
          logger.info({ tokenMint: position.tokenMint, pnlPct }, "Auto-sell executed");
        }
      } catch (error) {
        logger.error({ error, tokenMint: position.tokenMint }, "Auto-sell check failed");
      }
    }

    for (const tokenMint of soldTokens) {
      this.positions.delete(tokenMint);
    }

    return soldTokens;
  }
}
