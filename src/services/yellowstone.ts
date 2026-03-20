import Client from "@triton-one/yellowstone-grpc";
import { CommitmentLevel } from "@triton-one/yellowstone-grpc";
import bs58 from "bs58";
import { EventEmitter } from "node:events";
import { logger } from "../logger";

type YellowstoneSignatureEvent = {
  signature: string;
  slot: number;
};

export class YellowstoneWalletMonitor extends EventEmitter {
  private stream: Awaited<ReturnType<Client["subscribe"]>> | null = null;

  constructor(
    private readonly endpoint: string,
    private readonly xToken: string,
    private readonly targetWallet: string
  ) {
    super();
  }

  async start(): Promise<void> {
    const client = new Client(this.endpoint, this.xToken, {});
    const subscribeStream = await client.subscribe();

    const request = {
      slots: {},
      accounts: {},
      transactions: {
        walletTxs: {
          vote: false,
          failed: false,
          signature: undefined,
          accountInclude: [this.targetWallet],
          accountExclude: [],
          accountRequired: []
        }
      },
      transactionsStatus: {},
      blocks: {},
      blocksMeta: {},
      accountsDataSlice: [],
      entry: {},
      commitment: CommitmentLevel.CONFIRMED
    };

    subscribeStream.write(request, (error: unknown) => {
      if (error) {
        logger.error({ error }, "Failed to initialize Yellowstone stream");
      }
    });

    subscribeStream.on("data", (update: any) => {
      const tx = update?.transaction?.transaction;
      const signatureBytes = tx?.signature as Uint8Array | undefined;
      const slot = Number(update?.transaction?.slot ?? 0);
      if (!signatureBytes || signatureBytes.length === 0) {
        return;
      }

      const signature = bs58.encode(Buffer.from(signatureBytes));
      const event: YellowstoneSignatureEvent = { signature, slot };
      this.emit("signature", event);
    });

    subscribeStream.on("error", (error: unknown) => {
      logger.error({ error }, "Yellowstone stream error");
      this.emit("error", error);
    });

    subscribeStream.on("end", () => {
      logger.warn("Yellowstone stream closed");
      this.emit("end");
    });

    logger.info({ targetWallet: this.targetWallet }, "Yellowstone monitor started");
    this.stream = subscribeStream;
  }
}
