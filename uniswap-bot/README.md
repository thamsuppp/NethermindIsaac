# UniswapV3 Swap Detection Agent

## Description

This agent detects Swap events from Uniswap V3 Pool

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- UNISWAP-1
  - Fired when a Swap event is emitted rom a Uniswap V3 Pool contract
  - Severity is always set to "info" 
  - Type is always set to "info" 
  - Metadata fields: sender, recipient, amount0, amount1

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x6ea8d7f00998b6fc076c3bd16b7abdb60d52014054e32f89208265b1e2bd367f (Swap on the WBTC/USDC 0.3% contract)
