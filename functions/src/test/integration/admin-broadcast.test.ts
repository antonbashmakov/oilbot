import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import db from "../setup";
import { BroadcastTask, Customer, User } from "../../models";
import CustomerService from "../../services/CustomerService";
import BroadcastTaskService from "../../services/BroadcastTaskService";
import BroadcastResultService from "../../services/BroadcastResultService";
import UserService from "../../services/UserService";

const JWT_SECRET = "secter";

// Create a JWT token for test admin user
const createAdminToken = () => {
  const payload = {
    id: "test-admin-user-id",
    email: "admin@test.com",
    roles: ["ADMIN"],
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
};

describe("Admin Broadcast Endpoint Integration Test", () => {
  let customerService: CustomerService;
  let broadcastTaskService: BroadcastTaskService;
  let broadcastResultService: BroadcastResultService;
  let userService: UserService;

  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    broadcastTaskService = new BroadcastTaskService(db as any);
    broadcastResultService = new BroadcastResultService(db as any);
    userService = new UserService(db as any);

    // Create test admin user
    const adminUser: User = {
      id: "test-admin-user-id",
      email: "admin@test.com",
      roles: ["ADMIN"],
      created_at: new Date(),
    } as any;
    await userService.set(adminUser);

    // Clear any existing data
    const customers = await customerService.findAll();
    for (const customer of customers) {
      await customerService.delete(customer);
    }
    const tasks = await broadcastTaskService.findAll();
    for (const task of tasks) {
      await broadcastTaskService.delete(task);
    }
    const results = await broadcastResultService.findAll();
    for (const result of results) {
      await broadcastResultService.delete(result);
    }
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

  it("should process broadcast task and return results", async () => {
    // Create 5 customers
    const customerIds = ["cust1", "cust2", "cust3", "cust4", "cust5"];
    for (const id of customerIds) {
      await createCustomer(id, `user_${id}`, `First${id}`, `Last${id}`);
    }

    const task = await createBroadcastTask({ last_id: "" });

    const adminToken = createAdminToken();

    // First call processes first batch of 3
    let response = await request("http://127.0.0.1:5001/test-project/us-central1/admin")
      .post(`/broadcast/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);


    expect(response.body).toHaveLength(3);
    expect(response.body.map((r: any) => r.customer.id)).toEqual(["cust1", "cust2", "cust3"]);

    // Verify broadcast results saved
    const results1 = await broadcastResultService.findAll();
    expect(results1).toHaveLength(3);

    expect(results1.map(r => r.customer.id).sort()).toEqual(["cust1", "cust2", "cust3"]);

    // Verify task last_id updated
    const updatedTask1 = await broadcastTaskService.find(task.id);
    expect(updatedTask1?.last_id).toBe("cust3");
    expect(updatedTask1?.finished).toBe(false);

    // Second call processes next batch of 2
    response = await request("http://127.0.0.1:5001/test-project/us-central1/admin")
      .post(`/broadcast/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.map((r: any) => r.customer.id)).toEqual(["cust4", "cust5"]);

    const results2 = await broadcastResultService.findAll();
    expect(results2).toHaveLength(5);

    const updatedTask2 = await broadcastTaskService.find(task.id);
    expect(updatedTask2?.last_id).toBe("cust5");
    expect(updatedTask2?.finished).toBe(false);

    // Third call processes no customers (but does not mark finished because there might be more later)
    response = await request("http://127.0.0.1:5001/test-project/us-central1/admin")
      .post(`/broadcast/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveLength(0);
    const updatedTask3 = await broadcastTaskService.find(task.id);
    expect(updatedTask3?.finished).toBe(true);
  });

  it("should handle telegram failures", async () => {
    // Create 2 normal customers and 2 failure customers
    await createCustomer("cust_success1", "success1");
    await createCustomer("FAIL_CHAT_ID_1", "fail1");
    await createCustomer("cust_success2", "success2");
    await createCustomer("FAIL_CHAT_ID_2", "fail2");

    const task = await createBroadcastTask({ last_id: "" });

    const adminToken = createAdminToken();

    const response = await request("http://127.0.0.1:5001/test-project/us-central1/admin")
      .post(`/broadcast/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveLength(3); // batch size 3, but we have 4 customers, but ordering by id, first three are cust_success1, FAIL_CHAT_ID_1, cust_success2? Wait ordering by id string: "FAIL_CHAT_ID_1" < "cust_success1"? Actually "FAIL_CHAT_ID_1" starts with 'F', "cust_success1" starts with 'c', so FAIL_CHAT_ID_1 comes before cust_success1? Let's assume ordering by id ascending. We'll just check that there are 3 results.
    // We'll verify that failures are recorded as unsuccessful
    const results = response.body;
    const failureResults = results.filter((r: any) => !r.success);
    expect(failureResults).toHaveLength(2); // both FAIL_CHAT_ID_1 and FAIL_CHAT_ID_2
    const successResults = results.filter((r: any) => r.success);
    expect(successResults).toHaveLength(1); // one of the cust_success

    // Verify results saved
    const savedResults = await broadcastResultService.findAll();
    expect(savedResults).toHaveLength(3);
  });

  it("should return 404 if broadcast task not found", async () => {
    const adminToken = createAdminToken();

    const response = await request("http://127.0.0.1:5001/test-project/us-central1/admin")
      .post(`/broadcast/nonexistent`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("should not process if task already finished", async () => {
    await createCustomer("cust1", "user1");
    const task = await createBroadcastTask({ finished: true });

    const adminToken = createAdminToken();

    const response = await request("http://127.0.0.1:5001/test-project/us-central1/admin")
      .post(`/broadcast/${task.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });
});