import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";


export const NETHERMIND_DEPLOYER_ADDRESS = "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8";
export const FORTA_CONTRACT_ADDRESS = "0x61447385B019187daa48e91c55c02AF1F1f3F863";
export const CREATE_AGENT_EVENT = "event AgentUpdated(uint256 indexed agentId, address indexed by, string metadata, uint256[] chainIds)"
let findingsCount = 0;


// Handlers - functions that input an event and output Finding
const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {

  // Initialize array of Finding
  const findings: Finding[] = [];

  // filter the transaction logs of nethermind deployer for the create agent event
  const createEvents = txEvent.filterLog(
    CREATE_AGENT_EVENT,
    FORTA_CONTRACT_ADDRESS
  );

//  console.log(createEvents);

  // For each create event, generate a finding if 'by' is the Nethermind deployer
  createEvents.forEach((createEvent) => {
    // extract transfer event arguments
    const { agentId, by } = createEvent.args;

    // Check if the 'by' is Nethermind deployer
    if (by == NETHERMIND_DEPLOYER_ADDRESS) {
      findings.push(
        Finding.fromObject({
          name: "Bot deployed",
          description: "Bot deployed",
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            agentId,
            by
          },
        })
      );
        findingsCount++;
    }
    }
  );

  return findings;
};

export default {
  handleTransaction,
};
