export interface ProductRepository {
  getAllProducts(): Promise<{ id: string; name: string; description: string; category: string }[]>;
}