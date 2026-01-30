
import db from "../setup";
import { BroadcastTask, Customer } from "../../models";
import BroadcastService from "../../services/BroadcastService";
import CustomerService from "../../services/CustomerService";
import BroadcastTaskService from "../../services/BroadcastTaskService";
import BroadcastResultService from "../../services/BroadcastResultService";

describe("BroadcastService Integration Test", () => {
  let broadcastService: BroadcastService;
  let customerService: CustomerService;
  let broadcastTaskService: BroadcastTaskService;
  let broadcastResultService: BroadcastResultService;

  beforeEach(async () => {
    broadcastService = new BroadcastService(db as any);
    customerService = new CustomerService(db as any);
    broadcastTaskService = new BroadcastTaskService(db as any);
    broadcastResultService = new BroadcastResultService(db as any);
  });

  const createCustomer = async (id: string, username?: string, first_name?: string, last_name?: string) => {
    const customer: Customer = {
      id,
      username,
      first_name,
      last_name,
    };
    await customerService.set(customer);
    return customer;
  };

  const createBroadcastTask = async (task: Partial<BroadcastTask>): Promise<BroadcastTask> => {
    const broadcastTask: BroadcastTask = {
      id: `task-${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date(),
      finished: false,
      last_id: "",
      message: "Test broadcast message",
      ...task,
    };
    await broadcastTaskService.set(broadcastTask);
    return broadcastTask;
  };

  it("should process customers in batches of 3", async () => {
    // Create 5 customers
    const customerIds = ["cust1", "cust2", "cust3", "cust4", "cust5"];
    for (const id of customerIds) {
      await createCustomer(id, `user_${id}`, `First${id}`, `Last${id}`);
    }

    const task = await createBroadcastTask({ last_id: "" });

    // Process first batch
    const results1 = await broadcastService.process(task);
    expect(results1).toHaveLength(3); // batch size 3
    expect(results1.map(r => r.customer.id)).toEqual(["cust1", "cust2", "cust3"]);

    // Verify task last_id updated to last customer
    const updatedTask1 = await broadcastTaskService.find(task.id);
    expect(updatedTask1?.last_id).toBe("cust3");
    expect(updatedTask1?.finished).toBe(false);

    // Process second batch
    const results2 = await broadcastService.process(updatedTask1!);
    expect(results2).toHaveLength(2); // remaining 2
    expect(results2.map(r => r.customer.id)).toEqual(["cust4", "cust5"]);

    // Verify task last_id updated
    const updatedTask2 = await broadcastTaskService.find(task.id);
    expect(updatedTask2?.last_id).toBe("cust5");
    expect(updatedTask2?.finished).toBe(false);

    // Process third batch (no more customers)
    const results3 = await broadcastService.process(updatedTask2!);
    expect(results3).toHaveLength(0);
    const updatedTask3 = await broadcastTaskService.find(task.id);
    expect(updatedTask3?.finished).toBe(true);

    const savedResults = await broadcastResultService.findAll();
    expect(savedResults).toHaveLength(5);
    let exists = savedResults.find(r => r.customer.id === "cust1");
    expect(exists).toBeDefined();
    exists = savedResults.find(r => r.customer.id === "cust2");
    expect(exists).toBeDefined();
    exists = savedResults.find(r => r.customer.id === "cust3");
    expect(exists).toBeDefined();
    exists = savedResults.find(r => r.customer.id === "cust4");
    expect(exists).toBeDefined();
    exists = savedResults.find(r => r.customer.id === "cust5");
    expect(exists).toBeDefined();

  });

  it("should handle telegram failures for customers with FAIL_CHAT_ID prefix", async () => {
    // Create 2 normal customers and 2 failure customers
    await createCustomer("cust_success1", "success1");
    await createCustomer("FAIL_CHAT_ID_1", "fail1");
    await createCustomer("cust_success2", "success2");
    await createCustomer("FAIL_CHAT_ID_2", "fail2");

    const task = await createBroadcastTask({ last_id: "" });

    const results = await broadcastService.process(task);

    console.log(results);

    expect(results).toHaveLength(3);

    expect(results[0].customer.id).toBe("FAIL_CHAT_ID_1");
    expect(results[0].success).toBe(false);
    expect(results[0].message).toBe("Failed to send message");
    expect(results[0].error).toBeDefined();

    expect(results[1].customer.id).toBe("FAIL_CHAT_ID_2");
    expect(results[1].success).toBe(false);
    expect(results[1].message).toBe("Failed to send message");
    expect(results[1].error).toBeDefined();

    expect(results[2].customer.id).toBe("cust_success1");
    expect(results[2].success).toBe(true);
    expect(results[2].message).toBe("Message sent successfully");


    // Verify results are saved in DB
    const savedResults = await broadcastResultService.findAll();
    expect(savedResults).toHaveLength(3);
    const missing = savedResults.find(r => r.customer.id === "cust_success2");
    expect(missing).toBeUndefined()

  });

  it("should mark task as finished when no customers", async () => {
    const task = await createBroadcastTask({ last_id: "" });

    const results = await broadcastService.process(task);
    expect(results).toHaveLength(0);

    const updatedTask = await broadcastTaskService.find(task.id);
    expect(updatedTask?.finished).toBe(true);
  });

  it("should not process if task already finished", async () => {
    const task = await createBroadcastTask({ finished: true });
    await createCustomer("cust1", "user1");

    const results = await broadcastService.process(task);
    expect(results).toHaveLength(0);
  });
});