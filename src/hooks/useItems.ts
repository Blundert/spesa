import { useQuery } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { getItems } from '../db/repositories/items'
import { getSupermarkets } from '../db/repositories/supermarkets'
import { getCategories } from '../db/repositories/categories'

export function useItems() {
  return useQuery({ queryKey: qk.items(), queryFn: getItems })
}

export function useSupermarkets() {
  return useQuery({ queryKey: qk.supermarkets(), queryFn: getSupermarkets })
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories(), queryFn: getCategories })
}
