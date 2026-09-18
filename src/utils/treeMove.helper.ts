/**
 * Moving a node around a tree, as data.
 *
 * Dragging a row and a "Move to" picker ask the same questions, and neither of
 * them is about the DOM: where may this node go, and what does the tree look
 * like afterwards. Every product that reorders a tree writes this again, and
 * the one rule that is easy to miss is the one that does real damage: a node
 * dropped into its own subtree detaches that subtree from the root, and
 * everything under it disappears.
 *
 * These work on any tree of `{ id, children }` and never touch the tree they
 * are given: a plan is a new tree of shallow copies, so every field a product
 * carries on its nodes comes through. `NbTree` enforces the same rule for
 * pointer drags, so a product that uses both gets one answer.
 */

/** The shape these read: an id, and children when it has any. */
export interface ITreeMoveNode {
  id: string
  children?: ITreeMoveNode[]
}

/** Where a node goes: next to another node, inside it, or at the top level. */
export type TTreeMovePlacement =
  | { kind: 'inside'; target: string }
  | { kind: 'before'; target: string }
  | { kind: 'after'; target: string }
  | { kind: 'root' }

export interface ITreeMovePlan<T extends ITreeMoveNode> {
  /** The tree after the move, as shallow copies. The original is untouched. */
  tree: T[]
  /** The node's new parent, or null at the top level. */
  parentId: string | null
  /** Its index among its new siblings. */
  index: number
  /** The sibling it now follows, or null when it is first. */
  afterId: string | null
  /** The sibling it now precedes, or null when it is last. */
  beforeId: string | null
}

interface ILocated<T extends ITreeMoveNode> {
  node: T
  siblings: T[]
  parent: T | null
}

function childrenOf<T extends ITreeMoveNode>(node: T): T[] {
  return (node.children ?? []) as T[]
}

function locate<T extends ITreeMoveNode>(
  nodes: T[],
  id: string,
  parent: T | null = null,
): ILocated<T> | null {
  for (const node of nodes) {
    if (node.id === id) return { node, siblings: nodes, parent }
    const found = locate(childrenOf(node), id, node)
    if (found) return found
  }
  return null
}

/** The ids of the nodes above `id`, outermost first. Empty for a root node. */
export function ancestorsOf<T extends ITreeMoveNode>(
  nodes: T[],
  id: string,
): string[] {
  const walk = (list: T[], trail: string[]): string[] | null => {
    for (const node of list) {
      if (node.id === id) return trail
      const found = walk(childrenOf(node), [...trail, node.id])
      if (found) return found
    }
    return null
  }
  return walk(nodes, []) ?? []
}

/** `id` and every node under it. Empty when `id` is not in the tree. */
export function subtreeOf<T extends ITreeMoveNode>(
  nodes: T[],
  id: string,
): Set<string> {
  const out = new Set<string>()
  const found = locate(nodes, id)
  const walk = (node: T) => {
    out.add(node.id)
    childrenOf(node).forEach(walk)
  }
  if (found) walk(found.node)
  return out
}

/**
 * Whether `target` is `source` itself or somewhere under it, which is the one
 * place a node can never go.
 */
export function isInvalidTarget<T extends ITreeMoveNode>(
  nodes: T[],
  source: string,
  target: string,
): boolean {
  return subtreeOf(nodes, source).has(target)
}

/** A node `source` may move to, in reading order, with its nesting depth. */
export interface ITreeMoveTarget<T extends ITreeMoveNode> {
  id: string
  depth: number
  node: T
}

/**
 * Every node `source` may move to: all of them but itself and its own subtree.
 * The list a "Move to" picker offers.
 */
export function moveTargets<T extends ITreeMoveNode>(
  nodes: T[],
  source: string,
): ITreeMoveTarget<T>[] {
  const out: ITreeMoveTarget<T>[] = []
  const walk = (list: T[], depth: number) => {
    for (const node of list) {
      if (node.id === source) continue
      out.push({ id: node.id, depth, node })
      walk(childrenOf(node), depth + 1)
    }
  }
  walk(nodes, 0)
  return out
}

/**
 * The tree after moving `source` to `placement`, or null when the move is
 * refused (into its own subtree, or a node or target that is not there) or
 * would change nothing.
 *
 * "Inside" appends as the last child, so dragging a node onto its own current
 * parent moves it to the end rather than leaving it where it was. The returned
 * `parentId`, `index`, `afterId` and `beforeId` describe the new position, for
 * a product to turn into whatever its own storage records.
 */
export function planTreeMove<T extends ITreeMoveNode>(
  nodes: T[],
  source: string,
  placement: TTreeMovePlacement,
): ITreeMovePlan<T> | null {
  const from = locate(nodes, source)
  if (!from) return null
  if (placement.kind !== 'root') {
    if (isInvalidTarget(nodes, source, placement.target)) return null
    if (!locate(nodes, placement.target)) return null
  }

  const clone = (list: T[]): T[] =>
    list.map((node) =>
      node.children === undefined
        ? ({ ...node } as T)
        : ({ ...node, children: clone(childrenOf(node)) } as T),
    )

  const tree = clone(nodes)
  const moving = locate(tree, source)!
  moving.siblings.splice(moving.siblings.indexOf(moving.node), 1)

  if (placement.kind === 'root' || placement.kind === 'inside') {
    const parent =
      placement.kind === 'root' ? null : locate(tree, placement.target)!.node
    if (parent && parent.children === undefined) parent.children = []
    const list = parent ? childrenOf(parent) : tree
    list.push(moving.node)
  } else {
    const anchor = locate(tree, placement.target)!
    const index = anchor.siblings.indexOf(anchor.node)
    anchor.siblings.splice(
      placement.kind === 'before' ? index : index + 1,
      0,
      moving.node,
    )
  }

  const after = locate(tree, source)!
  const index = after.siblings.indexOf(after.node)
  const unchanged =
    (after.parent?.id ?? null) === (from.parent?.id ?? null) &&
    index === from.siblings.indexOf(from.node)
  if (unchanged) return null

  return {
    tree,
    parentId: after.parent?.id ?? null,
    index,
    afterId: index > 0 ? after.siblings[index - 1].id : null,
    beforeId:
      index < after.siblings.length - 1 ? after.siblings[index + 1].id : null,
  }
}

/**
 * A flat list in reading order, each row carrying its nesting depth, rebuilt
 * into a tree. The shape most APIs return a tree in.
 */
export function nestByDepth<T extends { id: string; depth: number }>(
  rows: T[],
): (Omit<T, 'depth'> & { children: unknown[] })[] {
  type TNested = Omit<T, 'depth'> & { children: TNested[] }
  const roots: TNested[] = []
  const stack: { node: TNested; depth: number }[] = []
  for (const row of rows) {
    const { depth, ...rest } = row
    const node = { ...rest, children: [] } as unknown as TNested
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop()
    }
    if (stack.length === 0) roots.push(node)
    else stack[stack.length - 1].node.children.push(node)
    stack.push({ node, depth })
  }
  return roots
}
