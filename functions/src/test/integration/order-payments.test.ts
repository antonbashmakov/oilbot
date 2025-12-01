import db from "../setup";
import { Order, Payment } from "../../models";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";

describe("Order Payments Endpoint Integration Test", () => {
  let orderService: OrderService;
  let paymentService: PaymentService;

  let mainOrder: Order;
  let conciliationOrder: Order;
  let mainOrderPayment1: Payment;
  let mainOrderPayment2: Payment;
  let conciliationOrderPayment: Payment;

  beforeEach(async () => {
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);

    // Create main order
    mainOrder = {
      id: "test-main-order-id",
      name: "Test Main Order",
      created_at: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "Test Item 1",
          price: 100,
          quantity: 1,
          item_id: "item-1",
          fraction: 1,
          price_for_unit: 100,
          group: "TEST_GROUP",
          owner: { id: "test-customer-id" },
        },
      ],
      status: "PAID",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 100,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    // Create conciliation order
    conciliationOrder = {
      id: "test-conciliation-order-id",
      name: "Test Conciliation Order",
      created_at: new Date(),
      items: [
        {
          id: "test-item-2",
          name: "Test Item 2",
          price: 50,
          quantity: 1,
          item_id: "item-2",
          fraction: 0.5,
          price_for_unit: 100,
          group: "TEST_GROUP",
          owner: { id: "test-customer-id" },
        },
      ],
      status: "CONCILIATED",
      type: "CONCILIATION",
      reconciliated_order_id: "test-main-order-id",
      numberOfItems: 1,
      total: 50,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    // Create payments for main order
    mainOrderPayment1 = {
      id: "test-payment-1",
      external_payment_id: 111111,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com/1",
      order_id: "test-main-order-id",
      amount: 10000,
      success: true,
      status: "CONFIRMED",
      created_at: new Date(),
    } as any;

    mainOrderPayment2 = {
      id: "test-payment-2",
      external_payment_id: 222222,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com/2",
      order_id: "test-main-order-id",
      amount: 5000,
      success: false,
      status: "FAILED",
      created_at: new Date(),
    } as any;

    // Create payment for conciliation order
    conciliationOrderPayment = {
      id: "test-payment-3",
      external_payment_id: 333333,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com/3",
      order_id: "test-conciliation-order-id",
      amount: 5000,
      success: true,
      status: "CONFIRMED",
      created_at: new Date(),
    } as any;

    // Create test data in Firestore
    await orderService.set(mainOrder);
    await orderService.set(conciliationOrder);
    await paymentService.set(mainOrderPayment1);
    await paymentService.set(mainOrderPayment2);
    await paymentService.set(conciliationOrderPayment);
  });

  it("should return all payments for an order including conciliation order payments", async () => {
    // Test the PaymentService method directly
    const mainOrderPayments = await paymentService.findByOrderId(mainOrder.id);
    const conciliationOrderPayments = await paymentService.findByOrderId(conciliationOrder.id);

    expect(mainOrderPayments).toHaveLength(2);
    expect(conciliationOrderPayments).toHaveLength(1);

    // Verify main order payments
    expect(mainOrderPayments[0].id).toBe("test-payment-1");
    expect(mainOrderPayments[0].order_id).toBe("test-main-order-id");
    expect(mainOrderPayments[1].id).toBe("test-payment-2");
    expect(mainOrderPayments[1].order_id).toBe("test-main-order-id");

    // Verify conciliation order payment
    expect(conciliationOrderPayments[0].id).toBe("test-payment-3");
    expect(conciliationOrderPayments[0].order_id).toBe("test-conciliation-order-id");
  });

  it("should find conciliation order by reconciliated_order_id", async () => {
    const foundConciliationOrder = await orderService.findConciliationOrder(mainOrder.id);
    
    expect(foundConciliationOrder).not.toBeNull();
    expect(foundConciliationOrder?.id).toBe("test-conciliation-order-id");
    expect(foundConciliationOrder?.reconciliated_order_id).toBe("test-main-order-id");
  });

  it("should return empty array when no payments exist for an order", async () => {
    // Create a new order without payments
    const newOrder = {
      id: "new-order-without-payments",
      name: "New Order Without Payments",
      created_at: new Date(),
      items: [],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 0,
      total: 0,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    await orderService.set(newOrder);

    const payments = await paymentService.findByOrderId(newOrder.id);
    expect(payments).toHaveLength(0);
  });

  it("should return null when no conciliation order exists", async () => {
    // Create an order without a conciliation order
    const orderWithoutConciliation = {
      id: "order-without-conciliation",
      name: "Order Without Conciliation",
      created_at: new Date(),
      items: [],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 0,
      total: 0,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    await orderService.set(orderWithoutConciliation);

    const conciliationOrder = await orderService.findConciliationOrder(orderWithoutConciliation.id);
    expect(conciliationOrder).toBeNull();
  });
});
