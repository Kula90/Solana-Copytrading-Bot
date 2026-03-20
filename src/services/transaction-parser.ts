import {
  Connection,
  ParsedTransactionWithMeta,
  PublicKey
} from "@solana/web3.js";
import bs58 from "bs58";
import { DEX_PROGRAMS, NATIVE_SOL_MINT, QUOTE_MINTS } from "../constants";
import { DexName, TradeSide, TradeSignal } from "../types";

type TokenDelta = {
  mint: string;
  deltaRaw: bigint;
};

export class TargetTransactionParser {
  constructor(
    private readonly connection: Connection,
    private readonly targetWallet: PublicKey
  ) {}

  async parseFromSignature(signatureMaybeBase64: string, slot: number): Promise<TradeSignal | null> {
    const signature = this.normalizeSignature(signatureMaybeBase64);

    const tx = await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed"
    });
    if (!tx || !tx.meta) {
      return null;
    }

    const dex = this.detectDex(tx);
    const tokenDeltas = this.computeTokenDeltas(tx, this.targetWallet.toBase58());
    if (tokenDeltas.length === 0) {
      return null;
    }

    const quoteDelta = tokenDeltas.find(
      (entry) => QUOTE_MINTS.has(entry.mint) && entry.deltaRaw !== 0n
    )?.deltaRaw;
    const nonQuoteDeltas = tokenDeltas.filter((entry) => !QUOTE_MINTS.has(entry.mint));

    const largestPositive = nonQuoteDeltas
      .filter((entry) => entry.deltaRaw > 0n)
      .sort((a, b) => (a.deltaRaw > b.deltaRaw ? -1 : 1))[0];
    const largestNegative = nonQuoteDeltas
      .filter((entry) => entry.deltaRaw < 0n)
      .sort((a, b) => (a.deltaRaw < b.deltaRaw ? -1 : 1))[0];

    if (largestPositive && (quoteDelta === undefined || quoteDelta < 0n)) {
      return {
        signature,
        slot,
        trader: this.targetWallet.toBase58(),
        dex,
        side: TradeSide.BUY,
        inputMint: quoteDelta !== undefined ? this.findQuoteMint(tokenDeltas) : NATIVE_SOL_MINT,
        outputMint: largestPositive.mint,
        amountInRaw: quoteDelta !== undefined ? this.abs(quoteDelta) : 0n,
        amountOutRaw: largestPositive.deltaRaw,
        timestampMs: Date.now()
      };
    }

    if (largestNegative && (quoteDelta === undefined || quoteDelta > 0n)) {
      return {
        signature,
        slot,
        trader: this.targetWallet.toBase58(),
        dex,
        side: TradeSide.SELL,
        inputMint: largestNegative.mint,
        outputMint: quoteDelta !== undefined ? this.findQuoteMint(tokenDeltas) : NATIVE_SOL_MINT,
        amountInRaw: this.abs(largestNegative.deltaRaw),
        amountOutRaw: quoteDelta !== undefined ? quoteDelta : 0n,
        timestampMs: Date.now()
      };
    }

    return null;
  }

  private normalizeSignature(signatureMaybeBase64: string): string {
    const looksLikeBase58 = /^[1-9A-HJ-NP-Za-km-z]{60,100}$/.test(signatureMaybeBase64);
    if (looksLikeBase58) {
      return signatureMaybeBase64;
    }

    try {
      return bs58.encode(Buffer.from(signatureMaybeBase64, "base64"));
    } catch {
      return signatureMaybeBase64;
    }
  }

  private detectDex(tx: ParsedTransactionWithMeta): DexName {
    const programIds = new Set<string>();
    for (const ix of tx.transaction.message.instructions) {
      const pid = ix.programId?.toBase58?.();
      if (pid) {
        programIds.add(pid);
      }
    }

    for (const [dex, programList] of Object.entries(DEX_PROGRAMS)) {
      if (programList.some((id) => programIds.has(id))) {
        return dex as DexName;
      }
    }
    return DexName.UNKNOWN;
  }

  private computeTokenDeltas(tx: ParsedTransactionWithMeta, owner: string): TokenDelta[] {
    const pre = tx.meta?.preTokenBalances ?? [];
    const post = tx.meta?.postTokenBalances ?? [];

    const map = new Map<string, bigint>();
    const apply = (mint: string, delta: bigint): void => {
      map.set(mint, (map.get(mint) ?? 0n) + delta);
    };

    for (const balance of pre) {
      if (balance.owner !== owner) continue;
      const amount = BigInt(balance.uiTokenAmount.amount);
      apply(balance.mint, -amount);
    }
    for (const balance of post) {
      if (balance.owner !== owner) continue;
      const amount = BigInt(balance.uiTokenAmount.amount);
      apply(balance.mint, amount);
    }

    return [...map.entries()]
      .filter(([, delta]) => delta !== 0n)
      .map(([mint, deltaRaw]) => ({ mint, deltaRaw }));
  }

  private findQuoteMint(entries: TokenDelta[]): string {
    return entries.find((entry) => QUOTE_MINTS.has(entry.mint))?.mint ?? NATIVE_SOL_MINT;
  }

  private abs(value: bigint): bigint {
    return value < 0n ? -value : value;
  }
}
