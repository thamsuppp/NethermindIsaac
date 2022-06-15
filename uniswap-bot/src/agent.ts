import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

import {
  UNISWAPV3_FACTORY_ADDRESS,
  POOL_FACTORY_ABI,
  POOL_ABI,
  SWAP_EVENT
} from "./constants";

import { ethers } from "ethers";


// Function to check if a given pool address is from Uniswap v3 or not 
export const checkUniswapV3Pool = async (poolContract: string, factoryAddress: string) => {
  let isUniPool;
  try {
    const provider = getEthersProvider();
    // Query the pool contract for tokens and fee
    const poolInterface = new ethers.Contract(poolContract, POOL_ABI, provider);
    const token0 = await poolInterface.token0();
    const token1 = await poolInterface.token1();
    const fee = await poolInterface.fee();
    
    // Query the factory contract for the address of pool
    const factoryInterface = new ethers.Contract(factoryAddress, POOL_FACTORY_ABI, provider);
    const poolAddress = await factoryInterface.getPool(token0, token1, fee);
    
    // Check if returned address matches 'poolContract'
    if (poolAddress.toLowerCase() == poolContract.toLowerCase()) {
      isUniPool = true;
    } else {
      isUniPool = false;
    }
  } catch(error) {
    // if query fails
    isUniPool = false;
  }
  return isUniPool;
}

export const provideHandleTransaction = (
  factoryAddress: string,
  checkUniswapV3Pool: any
): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Store addresses of all contracts that emitted a swap event
    let swapContracts: string[] = [];
    // Filter all transactions for those with swap event
    const swapLogs = tx.filterLog(SWAP_EVENT);

    console.log(tx);
    // Add addresses of transactions if not already in the array
    swapLogs.forEach((swapLog) => {
      if (swapContracts.indexOf(swapLog.address) === -1) {
        swapContracts.push(swapLog.address);
      }
    });

    // For each address, verify if it is a UniPool
    await Promise.all(swapContracts.map(async (swapContract) => {
      const isUniPool = await checkUniswapV3Pool(swapContract, factoryAddress);

      // If from UniPool, then for every swap event, emit a finding
      if(isUniPool) {
        const swapEvents = tx.filterLog(SWAP_EVENT, swapContract);

        await Promise.all(swapEvents.map(async (swapEvent) => {
          const { sender, recipient, amount0, amount1 } = swapEvent.args;
          findings.push(
            Finding.fromObject({
              name: 'Swap detected',
              description: 'A swap has been executed on a UniswapV3 Pool contract',
              alertId: 'UNISWAP-1',
              severity: FindingSeverity.Info,
              type: FindingType.Info,
              protocol: 'Uniswapv3',
              metadata: {
                sender: sender.toLowerCase(),
                recipient: recipient.toLowerCase(),
                amount0: amount0.toString(),
                amount1: amount1.toString()
              }
            })
          );
        }));
      };
    }))
    return findings;
  }
}


export default {
  handleTransaction: provideHandleTransaction(UNISWAPV3_FACTORY_ADDRESS, checkUniswapV3Pool),
};
