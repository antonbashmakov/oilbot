import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Order, Customer, CartItem, Delivery} from "../models";

class OrderService extends AbstractService<Order> {
  findOrders(delivery: Delivery): Promise<Order[]> {
    return this.getCollection().where("delivery.id", "==", delivery.id)
      .get().then((result: any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Order));
  }

  async createOrderFromCart(customer: Customer, cartItems: CartItem[]): Promise<Order> {
    const orderRef = this.getCollection().doc();

    const order: Order = {
      id: orderRef.id,
      name: customer.first_name,
      items: cartItems,
      status: "PENDING",
      number_of_Items: cartItems.length,
      total: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      owner: {
        id: customer.id,
      },
    };

    const batch = this.db.batch();
    batch.set(orderRef, order);

    cartItems.forEach((item) => {
      const itemRef = this.getCollectionByName(COLLECTIONS.CART_ITEMS).doc(item.id);
      batch.delete(itemRef);
    });

    await batch.commit();
    return order;
  }

  async findConciliationOrder(orderId: string): Promise<Order | null> {
    const result = await this.getCollection()
      .where("reconciliated_order_id", "==", orderId)
      .limit(1)
      .get();

    if (result.empty) {
      return null;
    }

    const doc = result.docs[0];
    return this.toPOJO(doc.id, doc.data()) as Order;
  }

  getCollectionName(): string {
    return COLLECTIONS.ORDERS;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default OrderService;
