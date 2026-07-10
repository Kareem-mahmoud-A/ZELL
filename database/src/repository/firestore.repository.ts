import { BaseRepository } from "./base.repository";
import { getDb } from "../config/firebase";
import * as admin from "firebase-admin";

export class FirestoreRepository<T> implements BaseRepository<T> {
  protected db: admin.firestore.Firestore;
  protected collectionRef: admin.firestore.CollectionReference;

  constructor(
    protected readonly collectionPath: string,
    protected readonly mapper?: { toDomain(raw: any): T; toPersistence(domain: T): any }
  ) {
    this.db = getDb();
    this.collectionRef = this.db.collection(collectionPath);
  }

  public async findById(id: string): Promise<T | null> {
    const doc = await this.collectionRef.doc(id).get();
    if (!doc.exists) return null;
    const rawData = { id: doc.id, ...doc.data() };
    return this.mapper ? this.mapper.toDomain(rawData) : (rawData as unknown as T);
  }

  public async create(id: string, data: any): Promise<T> {
    const docRef = this.collectionRef.doc(id);
    const persistenceData = this.mapper ? this.mapper.toPersistence(data) : data;
    const finalData = { ...persistenceData, id };
    await docRef.set(finalData);
    return this.mapper ? this.mapper.toDomain(finalData) : (finalData as unknown as T);
  }

  public async update(id: string, data: any): Promise<void> {
    const docRef = this.collectionRef.doc(id);
    const persistenceData = this.mapper ? this.mapper.toPersistence(data) : data;
    await docRef.update(persistenceData);
  }

  public async delete(id: string): Promise<void> {
    await this.collectionRef.doc(id).delete();
  }

  public async query(filters?: any): Promise<T[]> {
    let queryRef: admin.firestore.Query = this.collectionRef;
    if (filters) {
      Object.keys(filters).forEach((key) => {
        queryRef = queryRef.where(key, "==", filters[key]);
      });
    }
    const snapshot = await queryRef.get();
    return snapshot.docs.map((doc) => {
      const rawData = { id: doc.id, ...doc.data() };
      return this.mapper ? this.mapper.toDomain(rawData) : (rawData as unknown as T);
    });
  }
}
