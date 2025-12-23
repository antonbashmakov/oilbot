import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Comment} from "../models";

class CommentService extends AbstractService<Comment> {
  async findByEntityAndClass(entityId: string, commentClass: string): Promise<Comment[]> {
    const result = await this.getCollection()
      .where("entity_id", "==", entityId)
      .where("class", "==", commentClass)
      .orderBy("created_at", "desc")
      .get();

    return result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Comment);
  }

  async findByEntity(entityId: string): Promise<Comment[]> {
    const result = await this.getCollection()
      .where("entity_id", "==", entityId)
      .orderBy("created_at", "desc")
      .get();

    return result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Comment);
  }

  async findByClass(commentClass: string): Promise<Comment[]> {
    const result = await this.getCollection()
      .where("class", "==", commentClass)
      .orderBy("created_at", "desc")
      .get();

    return result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Comment);
  }

  getCollectionName(): string {
    return COLLECTIONS.COMMENTS;
  }

  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default CommentService;
