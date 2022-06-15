import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";

import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";

import {
  provideHandleTransaction
} from "./agent";
  

import {
  UNISWAPV3_FACTORY_ADDRESS,
  POOL_FACTORY_ABI,
  POOL_ABI,
  SWAP_EVENT
} from "./constants";

import { ethers } from "ethers";


// Helper function to create a finding
const createFinding = (sender: string, recipient: string, amount0: string, amount1: string) => Finding.fromObject({
  name: 'Swap detected',
  description: 'A swap has been executed on a UniswapV3 Pool contract',
  alertId: 'UNISWAP-1',
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Uniswapv3',
  metadata: {
    sender: sender,
    recipient: recipient,
    amount0: amount0,
    amount1: amount1
  }
});

describe('Uniswap v3 Swap Agent Test Suite', () => {

  let handler: HandleTransaction;
  let mockCheckUniPool: any;
  let contract: ethers.utils.Interface;

  const FACTORY_ADDRESS = createAddress('0xa1');
  const POOL_ADDRESS = createAddress('0xb1');
  const SENDER_ADDRESS = createAddress('0xc1');
  const RECEIVER_ADDRESS = createAddress('0xd1');

  beforeEach(() => {
    mockCheckUniPool = jest.fn();
    handler = provideHandleTransaction(FACTORY_ADDRESS, mockCheckUniPool);
    contract = new ethers.utils.Interface(POOL_ABI);
  });

  it('Should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('Should not detect swap events that are not emitted by UniPool', async () => {

    // Make the checkUniPool function return False (i.e. pool is not a unipool)
    mockCheckUniPool.mockResolvedValue(false);

    const test_amount0 = ethers.BigNumber.from('10');
    const test_amount1 = ethers.BigNumber.from('20');
    const test_price = ethers.BigNumber.from('1000');
    const test_liquidity = ethers.BigNumber.from('1000');
    const test_tick = 10;


    const POOL_IFACE : ethers.utils.Interface = new ethers.utils.Interface(POOL_ABI);
    const log = POOL_IFACE.encodeEventLog(
      POOL_IFACE.getEvent('Swap'),
      [
        SENDER_ADDRESS, RECEIVER_ADDRESS,
        test_amount0, test_amount1, test_price, test_liquidity, test_tick
      ]
    )

    // Create a test transaction event
    const txEvent : TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(POOL_ADDRESS, log.data, ...log.topics)

    const findings : Finding[] = await handler(txEvent);

    expect(findings).toStrictEqual([]);
  })

  it('Positive: Detect swap events that are emitted by UniPool', async () => {

    // Make the checkUniPool function return True (i.e. pool is a unipool)
    mockCheckUniPool.mockResolvedValue(true);

    const test_amount0 = ethers.BigNumber.from('10');
    const test_amount1 = ethers.BigNumber.from('20');
    const test_price = ethers.BigNumber.from('1000');
    const test_liquidity = ethers.BigNumber.from('1000');
    const test_tick = 10;


    const POOL_IFACE : ethers.utils.Interface = new ethers.utils.Interface(POOL_ABI);
    const log = POOL_IFACE.encodeEventLog(
      POOL_IFACE.getEvent('Swap'),
      [
        SENDER_ADDRESS, RECEIVER_ADDRESS,
        test_amount0, test_amount1, test_price, test_liquidity, test_tick
      ]
    )

    // Create a test transaction event
    const txEvent : TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(POOL_ADDRESS, log.data, ...log.topics)

    const findings : Finding[] = await handler(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        SENDER_ADDRESS,
        RECEIVER_ADDRESS,
        '10',
        '20'
      )
    ]);
  })

  it('Positive: Detect swap events that are emitted by UniPool', async () => {

    // Make the checkUniPool function return True (i.e. pool is a unipool)
    mockCheckUniPool.mockResolvedValue(true);

    const POOL_IFACE : ethers.utils.Interface = new ethers.utils.Interface(POOL_ABI);
    const log1 = POOL_IFACE.encodeEventLog(
      POOL_IFACE.getEvent('Swap'),
      [
        SENDER_ADDRESS, RECEIVER_ADDRESS,
        ethers.BigNumber.from('10'),
        ethers.BigNumber.from('100'),
        ethers.BigNumber.from('1000'),
        ethers.BigNumber.from('1000'),
        10
      ]
    );
    const log2 = POOL_IFACE.encodeEventLog(
      POOL_IFACE.getEvent('Swap'),
      [
        SENDER_ADDRESS, RECEIVER_ADDRESS,
        ethers.BigNumber.from('1234'),
        ethers.BigNumber.from('4321'),
        ethers.BigNumber.from('1000'),
        ethers.BigNumber.from('1000'),
        5
      ]
    )

    // Create a test transaction event
    const txEvent : TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(POOL_ADDRESS, log1.data, ...log1.topics)
      .addAnonymousEventLog(POOL_ADDRESS, log2.data, ...log2.topics)

    const findings : Finding[] = await handler(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        SENDER_ADDRESS,
        RECEIVER_ADDRESS,
        '10',
        '100'
      ),
      createFinding(
        SENDER_ADDRESS,
        RECEIVER_ADDRESS,
        '1234',
        '4321'
      )
    ]);
  })

  
})
