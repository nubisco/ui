import { describe, it, expect } from 'vitest'
import {
  ancestorsOf,
  isInvalidTarget,
  moveTargets,
  nestByDepth,
  planTreeMove,
  subtreeOf,
} from '../src/utils/treeMove.helper'

interface IPage {
  id: string
  title: string
  children?: IPage[]
}

/**
 * home
 *   manual
 *     chapter
 *   guide
 * other
 */
const tree = (): IPage[] => [
  {
    id: 'home',
    title: 'Home',
    children: [
      {
        id: 'manual',
        title: 'Manual',
        children: [{ id: 'chapter', title: 'Chapter' }],
      },
      { id: 'guide', title: 'Guide' },
    ],
  },
  { id: 'other', title: 'Other' },
]

/** The tree as indented ids, which is what a move is really judged by. */
function outline(nodes: IPage[], depth = 0): string[] {
  return nodes.flatMap((node) => [
    `${'  '.repeat(depth)}${node.id}`,
    ...outline(node.children ?? [], depth + 1),
  ])
}

describe('tree move: reading the tree', () => {
  it('lists the nodes above one, outermost first', () => {
    expect(ancestorsOf(tree(), 'chapter')).toEqual(['home', 'manual'])
    expect(ancestorsOf(tree(), 'home')).toEqual([])
    expect(ancestorsOf(tree(), 'stranger')).toEqual([])
  })

  it('collects a node and everything under it', () => {
    expect([...subtreeOf(tree(), 'home')]).toEqual([
      'home',
      'manual',
      'chapter',
      'guide',
    ])
    expect([...subtreeOf(tree(), 'other')]).toEqual(['other'])
    expect([...subtreeOf(tree(), 'stranger')]).toEqual([])
  })

  it('refuses a node and its own subtree as targets', () => {
    expect(isInvalidTarget(tree(), 'home', 'chapter')).toBe(true)
    expect(isInvalidTarget(tree(), 'home', 'home')).toBe(true)
    expect(isInvalidTarget(tree(), 'manual', 'other')).toBe(false)
  })

  it('offers every node but the one being moved and its subtree', () => {
    expect(moveTargets(tree(), 'manual').map((t) => [t.id, t.depth])).toEqual([
      ['home', 0],
      ['guide', 1],
      ['other', 0],
    ])
  })

  it('rebuilds a flat depth-ordered list into a tree', () => {
    const rows = [
      { id: 'home', title: 'Home', depth: 0 },
      { id: 'manual', title: 'Manual', depth: 1 },
      { id: 'chapter', title: 'Chapter', depth: 2 },
      { id: 'guide', title: 'Guide', depth: 1 },
      { id: 'other', title: 'Other', depth: 0 },
    ]
    const nested = nestByDepth(rows) as unknown as IPage[]
    expect(outline(nested)).toEqual(outline(tree()))
    expect(nested[0].title).toBe('Home')
  })
})

describe('tree move: planning a move', () => {
  it('puts a node inside another, as its last child', () => {
    const plan = planTreeMove(tree(), 'other', {
      kind: 'inside',
      target: 'manual',
    })!
    expect(outline(plan.tree)).toEqual([
      'home',
      '  manual',
      '    chapter',
      '    other',
      '  guide',
    ])
    expect(plan).toMatchObject({
      parentId: 'manual',
      index: 1,
      afterId: 'chapter',
      beforeId: null,
    })
  })

  it('puts a node before and after a sibling', () => {
    expect(
      outline(
        planTreeMove(tree(), 'other', { kind: 'before', target: 'guide' })!
          .tree,
      ),
    ).toEqual(['home', '  manual', '    chapter', '  other', '  guide'])

    const after = planTreeMove(tree(), 'chapter', {
      kind: 'after',
      target: 'other',
    })!
    expect(outline(after.tree)).toEqual([
      'home',
      '  manual',
      '  guide',
      'other',
      'chapter',
    ])
    expect(after).toMatchObject({
      parentId: null,
      index: 2,
      afterId: 'other',
      beforeId: null,
    })
  })

  it('moves a node to the top level', () => {
    const plan = planTreeMove(tree(), 'manual', { kind: 'root' })!
    expect(outline(plan.tree)).toEqual([
      'home',
      '  guide',
      'other',
      'manual',
      '  chapter',
    ])
    expect(plan.parentId).toBeNull()
  })

  it('leaves the tree it was given alone, and carries every field over', () => {
    const before = tree()
    const plan = planTreeMove(before, 'manual', {
      kind: 'inside',
      target: 'other',
    })!
    expect(outline(before)).toEqual(outline(tree()))
    const moved = plan.tree[1].children![0]
    expect(moved).not.toBe(before[0].children![0])
    expect(moved.title).toBe('Manual')
    // The subtree travels with it.
    expect(moved.children![0].id).toBe('chapter')
  })

  it('refuses a move into its own subtree, or of a node that is not there', () => {
    expect(
      planTreeMove(tree(), 'home', { kind: 'inside', target: 'chapter' }),
    ).toBeNull()
    expect(
      planTreeMove(tree(), 'home', { kind: 'after', target: 'home' }),
    ).toBeNull()
    expect(planTreeMove(tree(), 'stranger', { kind: 'root' })).toBeNull()
    expect(
      planTreeMove(tree(), 'other', { kind: 'inside', target: 'stranger' }),
    ).toBeNull()
  })

  it('refuses a move that would change nothing', () => {
    expect(
      planTreeMove(tree(), 'guide', { kind: 'after', target: 'manual' }),
    ).toBeNull()
    expect(planTreeMove(tree(), 'other', { kind: 'root' })).toBeNull()
  })

  it('moves a node to the end of the parent it is already in', () => {
    const plan = planTreeMove(tree(), 'manual', {
      kind: 'inside',
      target: 'home',
    })!
    expect(outline(plan.tree)).toEqual([
      'home',
      '  guide',
      '  manual',
      '    chapter',
      'other',
    ])
  })

  it('gives a childless target a children list', () => {
    const plan = planTreeMove(tree(), 'guide', {
      kind: 'inside',
      target: 'other',
    })!
    expect(outline(plan.tree)).toEqual([
      'home',
      '  manual',
      '    chapter',
      'other',
      '  guide',
    ])
  })
})
