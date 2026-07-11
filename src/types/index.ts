import { type Role, type OrderStatus } from '@prisma/client';

export type { Role, OrderStatus };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];
