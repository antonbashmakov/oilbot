import AbstractService from "./AbstractService";
import { COLLECTIONS } from "../constants";
import { BalanceChangeEvent, CustomerBalance } from "../models";
import { CONSTANTS } from "../controllers/admin/imports";

class CustomerBalanceService extends AbstractService<CustomerBalance> {
  async obtainForCustomer(customerId: string): Promise<CustomerBalance> {
    const existingBalance = await this.find(customerId);
    if (existingBalance) {
      return existingBalance;
    }

    const balanceRef = this.getCollection().doc(`${customerId}`); // make sure it is a string
    const balance: CustomerBalance = {
      id: customerId,
      owner: {
        id: customerId,
      },
      value: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await balanceRef.set(balance);
    return balance;
  }


  async updateBalance(customerId: string, change: number, reason: BalanceChangeEvent["reason"]): Promise<CustomerBalance> {

      const eventsCollectionRef = this.getCollectionByName(CONSTANTS.COLLECTIONS.CUSTOMER_BALANCES_CHANGE_EVENTS);
      
      const balance = await this.obtainForCustomer(customerId);

      await this.incrementField(balance, "value", change);
      await this.update(balance, { updated_at: new Date() });

      const changeEvent: BalanceChangeEvent = {
        id: "",
        created_at : new Date(),
        change,
        reason,
      }

      await eventsCollectionRef.add(changeEvent);

      balance.value += change; 

      return balance;

  }

  toPOJO(id: any, o: any): CustomerBalance | undefined {
    if (!o) return undefined;
    return { ...o, id, created_at: o.created_at.toDate(), updated_at: o.updated_at.toDate() };
  }

  getCollectionName(): string {
    return COLLECTIONS.CUSTOMER_BALANCES;
  }
  getExcludedFields(): string[] {
    return ["created_at", "updated_at"];
  }
}

export default CustomerBalanceService;
