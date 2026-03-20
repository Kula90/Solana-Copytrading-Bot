# Solana Copytrading Bot (Yellowstone + Multi-DEX)

Production-style TypeScript starter for a Solana copytrading bot that:

- Monitors a target wallet using Yellowstone gRPC stream.
- Detects target BUY/SELL actions from parsed transactions.
- Copies BUY on the same detected DEX (Pumpfun, PumpSwap, Raydium, Meteora; extendable).
- Supports 2 sell modes:
  - `AUTO_SELL=true`: local sell logic with take-profit and stop-loss.
  - `AUTO_SELL=false`: mirror target wallet sells.

## Features

- Yellowstone transaction subscription for low-latency wallet monitoring.
- DEX adapter architecture for multi-DEX support.
- Jupiter-backed execution layer with DEX label restrictions.
- Position tracking and periodic auto-sell evaluation.
- Config-first behavior via environment variables.

## Project Structure

```text
src/
  config.ts
  constants.ts
  index.ts
  logger.ts
  types.ts
  dex/
    factory.ts
    interface.ts
    jupiter-dex-executor.ts
    meteora.ts
    pumpfun.ts
    pumpswap.ts
    raydium.ts
  execution/
    jupiter-client.ts
  services/
    copytrader.ts
    position-manager.ts
    transaction-parser.ts
    yellowstone.ts
  utils/
    amount.ts
```

## Setup

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Copy environment template and fill real values:

```bash
cp .env.example .env
```

4. Start in development mode:

```bash
npm run dev
```

5. Build and run production mode:

```bash
npm run build
npm start
```

## Environment Variables

See `.env.example`.

Important values:

- `YELLOWSTONE_ENDPOINT`, `YELLOWSTONE_X_TOKEN`: your Yellowstone gRPC credentials.
- `TARGET_WALLET`: wallet to copy.
- `PRIVATE_KEY_BASE58`: bot signer key (never commit this).
- `COPY_AMOUNT_MODE`:
  - `FIXED_QUOTE`: always use `FIXED_BUY_AMOUNT`.
  - `TARGET_QUOTE`: use target buy size.
- `AUTO_SELL`:
  - `true`: bot exits by `TAKE_PROFIT_PCT` / `STOP_LOSS_PCT`.
  - `false`: bot exits only after target wallet sell signal.

## How It Works

1. Yellowstone emits target wallet transaction updates.
2. Bot fetches parsed transaction from RPC by signature.
3. Parser infers:
   - Buy or sell side
   - Token in/out
   - DEX by program IDs
4. Copy engine executes trade through matching DEX adapter.
5. Position manager handles optional auto-sell checks.

## Extending DEX Support

- Add program IDs in `src/constants.ts`.
- Add DEX labels in `src/constants.ts` for Jupiter routing.
- Create a new executor in `src/dex/` implementing `DexExecutor`.
- Register in `src/dex/factory.ts`.

## Risk Notes

- This is a starter architecture, not guaranteed profitable or complete for every edge-case.
- Mainnet trading is risky; use small size first.
- Some pools/tokens can be illiquid, taxed, or blocked.
- Add safeguards: max open positions, allowlist/denylist tokens, cooldowns, and advanced simulation checks.

## Recommended Next Improvements

- Token decimals cache (for accurate PnL and sizing beyond 9 decimals).
- Persistent storage (SQLite/Redis) for open positions and replay protection.
- Better transaction decoding per DEX instruction format.
- Direct non-Jupiter execution where exact pool routing is mandatory.
- Telegram/Discord alerts and metrics dashboards.
