import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { qk } from '../db/queryKeys'
import {
  addCategory,
  renameCategory,
  deleteCategory,
} from '../db/repositories/categories'
import { renameItem, moveItemCategory, deleteItem } from '../db/repositories/items'

export function useAddCategory() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (name: string) => addCategory(name),
    onSuccess: (_, name) => {
      void qc.invalidateQueries({ queryKey: qk.categories() })
      toast(t('catalogo.added', { name }))
    },
  })
}

export function useRenameCategory() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (vars: { id: number; name: string }) => renameCategory(vars.id, vars.name),
    onSuccess: (_, vars) => {
      void qc.refetchQueries({ queryKey: qk.categories(), type: 'all' })
      void qc.invalidateQueries({ queryKey: qk.items() })
      void qc.invalidateQueries({ queryKey: qk.stats() })
      toast(t('catalogo.renamed', { name: vars.name }))
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.categories() })
      void qc.invalidateQueries({ queryKey: qk.stats() })
      toast(t('catalogo.deleted'))
    },
    onError: (err: Error) => {
      if (err.message === 'category.hasItems') {
        toast.error(t('catalogo.deleteCategoryHasItems'))
      }
    },
  })
}

export function useRenameItem() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (vars: { id: number; name: string }) => renameItem(vars.id, vars.name),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: qk.items() })
      void qc.invalidateQueries({ queryKey: qk.stats() })
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
      toast(t('catalogo.renamed', { name: vars.name }))
    },
  })
}

export function useMoveItemCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; categoryId: number }) =>
      moveItemCategory(vars.id, vars.categoryId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.items() })
      void qc.invalidateQueries({ queryKey: qk.stats() })
      // refetchQueries con type:'all' forza il refetch anche senza subscriber attivi
      // (la Lista potrebbe non essere montata mentre si è sul Catalogo).
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
    },
  })
}

export function useDeleteItemFromCatalog() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.items() })
      void qc.invalidateQueries({ queryKey: qk.stats() })
      void qc.refetchQueries({ queryKey: qk.listItems(), type: 'all' })
      toast(t('catalogo.deleted'))
    },
  })
}
