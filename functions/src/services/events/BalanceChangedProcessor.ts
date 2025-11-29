import { BalanceChangedEvent } from "../../models";
import CustomerBalanceService from "../CustomerBalanceService";
import IdempotencyGuardService from "../IdempotencyGuardService";
import AbstractProcessor from "./AbstractProcessor";

class BalanceChangedProcessor extends AbstractProcessor {

  async process(event: BalanceChangedEvent): Promise<void> {
    if (!event.idempotent_key) {
      throw new Error(`Idempotent key is missing on BalanceChangedEvent`);
    }

    const customerBalanceService = new CustomerBalanceService(this.db);
    const guard = new IdempotencyGuardService(this.db);

    await guard.runIdempotentRequest(event.idempotent_key, async () => {
      // Update customer balance
      await customerBalanceService.updateBalance(
        event.payload.customer_id, 
        event.payload.change
      );
      
      return {};
    });
  }
}

export default BalanceChangedProcessor;
