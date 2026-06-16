import { db } from '../db'
import type { Category } from '../types'

export async function getCategories(): Promise<Category[]> {
  return db.categories.orderBy('sortOrder').toArray()
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  return db.categories.get(id)
}
