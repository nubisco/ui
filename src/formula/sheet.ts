import { evaluateFormula } from './evaluator'
import { collectReferences, parseFormula } from './parser'
import { formatRef, parseRef } from './refs'
import type {
  IEvalContext,
  IFormulaSheet,
  TAstNode,
  TFormulaCellValue,
  TFormulaCells,
  TFormulaValue,
  TScalar,
} from './types'
import { formulaError, isFormula } from './values'

// Cells are looked up by a number rather than an 'A1' string, because a
// range walk would otherwise build a string for every cell it reads. The
// stride is above the widest column three letters can name (ZZZ).
const STRIDE = 20000
const keyOf = (row: number, col: number) => row * STRIDE + col

interface IParsed {
  tree: TAstNode
  /** The references and ranges the formula reads, collected once. */
  reads: TAstNode[]
}

interface IFormulaCell {
  key: number
  ref: string
  row: number
  col: number
  parsed: IParsed
}

const circular = () => formulaError('#REF!', 'Circular reference')

function literal(value: TFormulaCellValue | undefined): TScalar {
  if (value === undefined || value === '') return null
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return formulaError('#NUM!', 'The value is not a finite number')
  }
  return value
}

function parse(text: string): IParsed {
  const tree = parseFormula(text)
  return { tree, reads: collectReferences(tree) }
}

/**
 * Evaluates the formulas of a sheet. Each compute() builds the dependency
 * graph from the references the formulas read, finds the cycles in it, and
 * evaluates the cells in dependency order. Evaluating in that order means a
 * cell never waits on another through the call stack, so a chain of
 * thousands of cells is as safe as a short one.
 */
export function createFormulaSheet(): IFormulaSheet {
  // Parsed formulas by text. A sheet filled down a column repeats the same
  // text rarely (references differ), but recomputing after one edit reuses
  // every other cell's tree.
  let cache = new Map<string, IParsed>()
  const ruleCache = new Map<string, IParsed>()
  let values = new Map<number, TFormulaCellValue>()
  let results = new Map<number, TScalar>()
  let extent = { rows: 0, cols: 0 }

  const context = (at?: { row: number; col: number }): IEvalContext => ({
    cell(row, col) {
      const key = keyOf(row, col)
      const raw = values.get(key)
      if (isFormula(raw)) return results.get(key) ?? circular()
      return literal(raw)
    },
    extent,
    at,
  })

  function compute(cells: TFormulaCells): Map<string, TFormulaValue> {
    const nextCache = new Map<string, IParsed>()
    values = new Map()
    results = new Map()
    extent = { rows: 0, cols: 0 }
    const formulas: IFormulaCell[] = []
    const indexByKey = new Map<number, number>()

    for (const ref of Object.keys(cells)) {
      const position = parseRef(ref)
      if (!position) continue
      const value = cells[ref]
      if (value === null || value === undefined || value === '') continue
      const key = keyOf(position.row, position.col)
      values.set(key, value)
      extent.rows = Math.max(extent.rows, position.row + 1)
      extent.cols = Math.max(extent.cols, position.col + 1)
      if (isFormula(value)) {
        const parsed = nextCache.get(value) ?? cache.get(value) ?? parse(value)
        nextCache.set(value, parsed)
        indexByKey.set(key, formulas.length)
        formulas.push({
          key,
          ref: formatRef(position.row, position.col),
          ...position,
          parsed,
        })
      }
    }
    // Only the formulas still on the sheet stay cached, so edits over a long
    // session do not grow the cache without end.
    cache = nextCache

    // Each formula's edges point at the formula cells it reads.
    const edges: number[][] = formulas.map((cell) => {
      const out: number[] = []
      for (const read of cell.parsed.reads) {
        if (read.type === 'ref') {
          const index = indexByKey.get(keyOf(read.row, read.col))
          if (index !== undefined) out.push(index)
        } else if (read.type === 'range') {
          const r2 = Math.min(read.range.r2, extent.rows - 1)
          const c2 = Math.min(read.range.c2, extent.cols - 1)
          const { r1, c1 } = read.range
          const area = Math.max(0, r2 - r1 + 1) * Math.max(0, c2 - c1 + 1)
          // Walk whichever is smaller: the cells of the range, or the list of formulas.
          if (area <= formulas.length) {
            for (let r = r1; r <= r2; r++) {
              for (let c = c1; c <= c2; c++) {
                const index = indexByKey.get(keyOf(r, c))
                if (index !== undefined) out.push(index)
              }
            }
          } else {
            formulas.forEach((other, index) => {
              if (
                other.row >= r1 &&
                other.row <= r2 &&
                other.col >= c1 &&
                other.col <= c2
              ) {
                out.push(index)
              }
            })
          }
        }
      }
      return out
    })

    for (const component of stronglyConnected(edges)) {
      const first = component[0]
      const cyclic = component.length > 1 || edges[first].includes(first)
      if (cyclic) {
        for (const index of component)
          results.set(formulas[index].key, circular())
        continue
      }
      const cell = formulas[first]
      results.set(
        cell.key,
        evaluateFormula(
          cell.parsed.tree,
          context({ row: cell.row, col: cell.col }),
        ),
      )
    }

    const output = new Map<string, TFormulaValue>()
    for (const cell of formulas)
      output.set(cell.ref, results.get(cell.key) ?? circular())
    return output
  }

  function evaluate(formula: string): TFormulaValue {
    let parsed = ruleCache.get(formula)
    if (!parsed) {
      // Rules are few and rarely change. The cap only guards against a
      // caller that builds a new rule text on every call.
      if (ruleCache.size > 500) ruleCache.clear()
      parsed = parse(formula)
      ruleCache.set(formula, parsed)
    }
    return evaluateFormula(parsed.tree, context())
  }

  return {
    compute,
    evaluate,
    get cacheSize() {
      return cache.size
    },
  }
}

/**
 * Tarjan's strongly connected components, without recursion so that a long
 * chain cannot overflow the stack. Components come out dependencies first,
 * which is the order to evaluate them in.
 */
function stronglyConnected(edges: number[][]): number[][] {
  const count = edges.length
  const index = new Int32Array(count).fill(-1)
  const low = new Int32Array(count)
  const onStack = new Uint8Array(count)
  const stack: number[] = []
  const components: number[][] = []
  let counter = 0

  for (let start = 0; start < count; start++) {
    if (index[start] !== -1) continue
    const work: number[] = [start]
    const cursor: number[] = [0]
    index[start] = low[start] = counter++
    stack.push(start)
    onStack[start] = 1

    while (work.length > 0) {
      const top = work.length - 1
      const node = work[top]
      const next = edges[node][cursor[top]]
      if (next !== undefined) {
        cursor[top]++
        if (index[next] === -1) {
          index[next] = low[next] = counter++
          stack.push(next)
          onStack[next] = 1
          work.push(next)
          cursor.push(0)
        } else if (onStack[next]) {
          low[node] = Math.min(low[node], index[next])
        }
        continue
      }
      work.pop()
      cursor.pop()
      if (work.length > 0) {
        const parent = work[work.length - 1]
        low[parent] = Math.min(low[parent], low[node])
      }
      if (low[node] === index[node]) {
        const component: number[] = []
        let member: number
        do {
          member = stack.pop() as number
          onStack[member] = 0
          component.push(member)
        } while (member !== node)
        components.push(component)
      }
    }
  }
  return components
}
