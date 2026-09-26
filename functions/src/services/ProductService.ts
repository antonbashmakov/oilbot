import {FieldPath} from "firebase-admin/firestore";
import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Product} from "../models";

class ProductService extends AbstractService<Product> {
  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    const result = await this.getCollection()
      .where(FieldPath.documentId(), "in", ids)
      .get();

    return result.docs.map((doc) => this.toPOJO(doc.id, doc.data()) as Product);
  }

  getCollectionName(): string {
    return COLLECTIONS.PRODUCTS;
  }
  getExcludedFields(): string[] {
    return [];
  }
}

export default ProductService;
