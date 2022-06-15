import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent, {
  NETHERMIND_DEPLOYER_ADDRESS,
  FORTA_CONTRACT_ADDRESS,
  CREATE_AGENT_EVENT
} from "./agent";

describe("nethermind deployer", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    
    // Test with no transaction
    it("returns empty findings if there are no created transactions", async () => {

      // Create a mock function 
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);
      const findings = await handleTransaction(mockTxEvent);
      
      // Check that findings is empty and the filterLog function 
      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        CREATE_AGENT_EVENT,
        FORTA_CONTRACT_ADDRESS
      );
    });

    // Test positive result
    it("returns a finding if there is an agent created", async () => {
      const mockCreateAgentEvent = {
        args: {
          agentId: "12345",
          by: NETHERMIND_DEPLOYER_ADDRESS,
        },
      };

      // Create the mock transaction with the mock event
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mockCreateAgentEvent]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([

        Finding.fromObject({
          name: "Bot deployed",
          description: "Bot deployed",
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            agentId: mockCreateAgentEvent.args.agentId.toString(),
            by: mockCreateAgentEvent.args.by
        },
        })
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        CREATE_AGENT_EVENT,
        FORTA_CONTRACT_ADDRESS
      );
    });
  });
});
