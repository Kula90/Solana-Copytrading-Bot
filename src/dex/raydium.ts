import { DexName } from "../types";
import { JupiterDexExecutor } from "./jupiter-dex-executor";

export class RaydiumExecutor extends JupiterDexExecutor {
  constructor(jupiter: ConstructorParameters<typeof JupiterDexExecutor>[1]) {
    super(DexName.RAYDIUM, jupiter);
  }
}
