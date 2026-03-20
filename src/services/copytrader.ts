import { AppConfig } from "../config";
import { DexExecutor } from "../dex/interface";
import { logger } from "../logger";
import { DexName, Position, TradeSide, TradeSignal } from "../types";
import { PositionManager } from "./position-manager";

export class CopyTraderService {
  private readonly seenSignatures = new Set<string>();

  constructor(
    private readonly config: AppConfig,
    private readonly executors: Record<DexName, DexExecutor>,
    private readonly positions: PositionManager
  ) {}

  async handleTrade(signal: TradeSignal): Promise<void> {
    if (this.seenSignatures.has(signal.signature)) {
      return;
    }
    this.seenSignatures.add(signal.signature);

    if (signal.dex === DexName.UNKNOWN || !this.config.dexAllowlist.includes(signal.dex)) {
      logger.debug({ dex: signal.dex, signature: signal.signature }, "Skip unsupported dex");
      return;
    }

    if (signal.side === TradeSide.BUY) {
      await this.handleBuy(signal);
      return;
    }

    await this.handleSell(signal);
  }

  async runAutoSellLoop(): Promise<void> {
    if (!this.config.AUTO_SELL) {
      return;
    }

    setInterval(async () => {
      await this.positions.evaluateAutoSell(
        this.executors,
        this.config.TAKE_PROFIT_PCT,
        this.config.STOP_LOSS_PCT,
        this.config.QUOTE_MINT
      );
    }, this.config.POLL_INTERVAL_MS);
  }

  private async handleBuy(signal: TradeSignal): Promise<void> {
    if (signal.amountInRaw < this.config.minTargetBuyAmountRaw) {
      logger.debug({ signature: signal.signature }, "Skip tiny target buy");
      return;
    }

    const quoteAmountRaw =
      this.config.COPY_AMOUNT_MODE === "TARGET_QUOTE" ? signal.amountInRaw : this.config.fixedBuyAmountRaw;
    const executor = this.executors[signal.dex] ?? this.executors[DexName.RAYDIUM];

    const result = await executor.buy({
      tokenMint: signal.outputMint,
      quoteMint: this.config.QUOTE_MINT,
      quoteAmountRaw,
      slippageBps: this.config.SLIPPAGE_BPS
    });

    const expectedOutRaw = result.expectedOutRaw ?? 0n;
    const price = expectedOutRaw > 0n ? Number(quoteAmountRaw) / Number(expectedOutRaw) : 0;

    const position: Position = {
      tokenMint: signal.outputMint,
      dex: signal.dex,
      amountRaw: expectedOutRaw,
      quoteSpentRaw: quoteAmountRaw,
      averageEntryPriceQuotePerToken: price,
      openedAtMs: Date.now()
    };
    this.positions.set(position);

    logger.info(
      { copiedSignature: result.signature, targetSignature: signal.signature, dex: signal.dex, token: signal.outputMint },
      "Copied target BUY"
    );
  }

  private async handleSell(signal: TradeSignal): Promise<void> {
    if (this.config.AUTO_SELL) {
      return;
    }

    const existing = this.positions.get(signal.inputMint);
    if (!existing || existing.amountRaw <= 0n) {
      return;
    }

    const executor = this.executors[existing.dex] ?? this.executors[DexName.RAYDIUM];
    const result = await executor.sell({
      tokenMint: existing.tokenMint,
      quoteMint: this.config.QUOTE_MINT,
      tokenAmountRaw: existing.amountRaw,
      slippageBps: this.config.SLIPPAGE_BPS
    });

    this.positions.remove(existing.tokenMint);
    logger.info(
      { copiedSignature: result.signature, targetSignature: signal.signature, dex: existing.dex, token: existing.tokenMint },
      "Copied target SELL"
    );
  }
}
