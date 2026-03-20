import { Commitment, Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { appConfig } from "./config";
import { createDexExecutors } from "./dex/factory";
import { JupiterClient } from "./execution/jupiter-client";
import { logger } from "./logger";
import { CopyTraderService } from "./services/copytrader";
import { PositionManager } from "./services/position-manager";
import { TargetTransactionParser } from "./services/transaction-parser";
import { YellowstoneWalletMonitor } from "./services/yellowstone";

async function main(): Promise<void> {
  const signer = Keypair.fromSecretKey(bs58.decode(appConfig.PRIVATE_KEY_BASE58));
  const connection = new Connection(appConfig.RPC_URL, appConfig.COMMITMENT as Commitment);
  const targetWallet = new PublicKey(appConfig.TARGET_WALLET);

  const jupiter = new JupiterClient(connection, signer, appConfig.PRIORITY_FEE_LAMPORTS);
  const executors = createDexExecutors(jupiter);
  const positions = new PositionManager();
  const trader = new CopyTraderService(appConfig, executors, positions);
  const parser = new TargetTransactionParser(connection, targetWallet);

  const monitor = new YellowstoneWalletMonitor(
    appConfig.YELLOWSTONE_ENDPOINT,
    appConfig.YELLOWSTONE_X_TOKEN,
    targetWallet.toBase58()
  );

  monitor.on("signature", async (event: { signature: string; slot: number }) => {
    try {
      const signal = await parser.parseFromSignature(event.signature, event.slot);
      if (!signal) {
        return;
      }
      await trader.handleTrade(signal);
    } catch (error) {
      logger.error({ error, signature: event.signature }, "Failed to process target trade");
    }
  });

  monitor.on("error", (error) => {
    logger.error({ error }, "Monitor error");
  });

  await trader.runAutoSellLoop();
  await monitor.start();
}

main().catch((error) => {
  logger.fatal({ error }, "Fatal error in bot");
  process.exit(1);
});
