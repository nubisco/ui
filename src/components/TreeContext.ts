import type { InjectionKey } from 'vue'
import type { ITreeContext } from './Tree.d'

export const NB_TREE_KEY = Symbol('nb-tree') as InjectionKey<ITreeContext>
export const NB_TREE_DEPTH_KEY = Symbol('nb-tree-depth') as InjectionKey<number>
