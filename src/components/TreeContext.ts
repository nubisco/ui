import type { InjectionKey } from 'vue'
import type { ITreeContext } from './Tree.d'

export const NB_TREE_KEY = Symbol('nb-tree') as InjectionKey<ITreeContext>
export const NB_TREE_DEPTH_KEY = Symbol('nb-tree-depth') as InjectionKey<number>
/**
 * The ids of the rows a node sits under, outermost first. A row uses it to
 * refuse a drop that would put a node inside its own subtree.
 */
export const NB_TREE_ANCESTORS_KEY = Symbol(
  'nb-tree-ancestors',
) as InjectionKey<string[]>
