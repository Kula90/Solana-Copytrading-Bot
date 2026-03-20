import { DexName } from "../types";
import { JupiterDexExecutor } from "./jupiter-dex-executor";

export class PumpfunExecutor extends JupiterDexExecutor {
  constructor(jupiter: ConstructorParameters<typeof JupiterDexExecutor>[1]) {
    super(DexName.PUMPFUN, jupiter);
  }
}
