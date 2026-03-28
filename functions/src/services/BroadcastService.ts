
import {
  CustomerService,
  BroadcastResultService,
  BroadcastTaskService,
  Firestore,
  BroadcastTask,
  BroadcastResult,
  Customer,
} from "./BroadcastService.import";
import MessagingService from "./MessagingService";


class BroadcastService {
  private customerService: CustomerService;
  private messagingService: MessagingService;
  private broadcastResultService: BroadcastResultService;
  private broadcastTaskService: BroadcastTaskService;

  constructor(firestore: Firestore) {
    this.customerService = new CustomerService(firestore);
    this.messagingService = new MessagingService(firestore);
    this.broadcastResultService = new BroadcastResultService(firestore);
    this.broadcastTaskService = new BroadcastTaskService(firestore);
  }

  async process(task: BroadcastTask): Promise<BroadcastResult[]> {
    // Only process if task is not finished
    if (task.finished) {
      return [];
    }

    const customers = await this.fetchCustomers(task.last_id, task.batch_size);

    if (customers.length === 0) {
      await this.broadcastTaskService.update(task, {finished: true, updated_at: new Date()});
      return [];
    }

    // Process each customer
    const results: BroadcastResult[] = [];
    for (const customer of customers) {
      const result = await this.processCustomer(task, customer);
      results.push(result);
    }

    // Update task last_id to the last customer id
    const lastCustomer = customers[customers.length - 1];
    await this.broadcastTaskService.update(task, {
      last_id: `${lastCustomer.id}`,
      updated_at: new Date(),
      number_of_runs: (task.number_of_runs || 0) + 1,
    });

    return results;
  }

  private async fetchCustomers(startAfterId: string | undefined, limit: number): Promise<Customer[]> {
    let query = this.customerService.getCollection().orderBy("id").limit(limit);

    if (startAfterId) {
      // Fetch the document to use as startAfter
      const startAfterDoc = await this.customerService.getCollection().doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
      } as Customer;
    });
  }

  private async processCustomer(task: BroadcastTask, customer: Customer): Promise<BroadcastResult> {
    let success = false;
    let message = "";
    let error: any = null;

    try {
      // Send message via Telegram


      const telegramMessage = await this.messagingService.sendMessage(customer, task.message.replace(/\\n/g, "\n"), {thread_id: task.id, format: task.format} );
      //const telegramMessage = await this.messagingService.sendMessage({id : '270053857', external_id: '270053857', origin: "TELEGRAM"} as any, task.message.replace(/\\n/g, "\n"), {thread_id: task.id, format: task.format} );
      success = true;
      message = "Message sent successfully";
      if (telegramMessage) {
        // Optionally save conversation message if needed
      }
    } catch (err) {
      success = false;
      message = "Failed to send message";
      // error must be Record<string, never> or null, we'll set to null
      error = err;
    }

    // Create broadcast result
    const broadcastResult: BroadcastResult = {
      id: "", // Will be set in add()
      broadcast_task_id: task.id,
      customer: {
        id: customer.id,
        username: customer.username,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },

      success,
      message,
      error,
      created_at: new Date(),
    };

    // Save result to DB
    await this.broadcastResultService.add(broadcastResult);

    return broadcastResult;
  }
}

export default BroadcastService;
