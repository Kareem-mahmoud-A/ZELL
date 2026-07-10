export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  create(id: string, data: any): Promise<T>;
  update(id: string, data: any): Promise<void>;
  delete(id: string): Promise<void>;
  query(filters?: any): Promise<T[]>;
}
