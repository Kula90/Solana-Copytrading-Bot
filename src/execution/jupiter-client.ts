import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { logger } from "../logger";

interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  routePlan: unknown[];
}

interface JupiterSwapResponse {
  swapTransaction: string;
}

export class JupiterClient {
  private readonly quoteUrl = "https://quote-api.jup.ag/v6/quote";
  private readonly swapUrl = "https://quote-api.jup.ag/v6/swap";

  constructor(
    private readonly connection: Connection,
    private readonly signer: Keypair,
    private readonly priorityFeeLamports: number
  ) {}

  async quote(
    inputMint: string,
    outputMint: string,
    inAmountRaw: bigint,
    slippageBps: number,
    dexes: string[] = []
  ): Promise<JupiterQuoteResponse> {
    const url = new URL(this.quoteUrl);
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", inAmountRaw.toString());
    url.searchParams.set("slippageBps", String(slippageBps));
    if (dexes.length > 0) {
      url.searchParams.set("dexes", dexes.join(","));
    }

    const response = await fetch(url);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Jupiter quote failed: ${response.status} ${message}`);
    }

    return (await response.json()) as JupiterQuoteResponse;
  }

  async swap(quote: JupiterQuoteResponse): Promise<string> {
    const response = await fetch(this.swapUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: this.signer.publicKey.toBase58(),
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: this.priorityFeeLamports
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Jupiter swap build failed: ${response.status} ${message}`);
    }

    const payload = (await response.json()) as JupiterSwapResponse;
    const tx = VersionedTransaction.deserialize(Buffer.from(payload.swapTransaction, "base64"));
    tx.sign([this.signer]);

    const signature = await this.connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3
    });

    logger.info({ signature }, "Sent Jupiter swap transaction");
    return signature;
  }
}
