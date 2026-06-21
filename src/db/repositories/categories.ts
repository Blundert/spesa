import { db } from '../db'
import type { Category } from '../types'

export async function getCategories(): Promise<Category[]> {
  return db.categories.orderBy('sortOrder').toArray()
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  return db.categories.get(id)
}

export async function addCategory(name: string): Promise<number> {
  const all = await db.categories.toArray()
  const maxOrder = all.reduce((m, c) => Math.max(m, c.sortOrder), -1)
  return (await db.categories.add({ name: name.trim(), sortOrder: maxOrder + 1 })) as number
}

export async function renameCategory(id: number, name: string): Promise<void> {
  await db.categories.update(id, { name: name.trim() })
}

export async function deleteCategory(id: number): Promise<void> {
  const count = await db.items.where('categoryId').equals(id).count()
  if (count > 0) throw new Error('category.hasItems')
  await db.categories.delete(id)
}
