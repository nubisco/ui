import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MagicString from 'magic-string'
import { parse, babelParse } from 'vue/compiler-sfc'

/**
 * Resolves icon and flag artwork at compile time.
 *
 * `<NbIcon name="github-logo" />` is a constant: there is no reason for the
 * bundle to carry a 1,500-entry catalogue so that one glyph can be looked up
 * at runtime. This plugin rewrites the literal into a static import of
 * `@nubisco/ui/icons/github-logo` and binds the module instead, so the bundler
 * links exactly that icon and nothing else.
 *
 * What it rewrites:
 *
 *   <NbIcon name="check" />                       →  :name="<one weight>"
 *   <NbIcon name="check" weight="bold" />         →  :name="<bold only>"
 *   <NbFlag name="pt" />                          →  :name="<that flag>"
 *   <NbButton icon="plus" />                      →  :icon="<all weights>"
 *   <NbIcon :name="open ? 'caret-up' : 'caret-down'" />  both literals
 *
 * What it cannot rewrite is a name only known at runtime, which is a real and
 * legitimate case: an icon picker, or a value that arrives from an API. Those
 * are covered by, in order of preference: registering the bounded set the app
 * can actually receive (`registerIcons` / `registerFlags`), or loading the
 * whole catalogue (`@nubisco/ui/icons/all`). With `catalog: 'auto'` this plugin
 * injects that catalogue into the file that needs it, and only that file, and
 * logs when it does, so the cost is never invisible.
 */

const ICON_TAGS = new Set(['NbIcon', 'nb-icon'])
const FLAG_TAGS = new Set(['NbFlag', 'nb-flag'])
const WEIGHTS = new Set(['thin', 'light', 'regular', 'bold', 'fill', 'duotone'])

const NODE_ELEMENT = 1
const NODE_ATTRIBUTE = 6
const NODE_DIRECTIVE = 7
const EXPR_SIMPLE = 4

export type TGlyphCatalogMode = 'auto' | 'off'

export interface IGlyphOptions {
  /**
   * What to do when `NbIcon` or `NbFlag` is given a name the plugin cannot see
   * through. `'auto'` (the default) injects `@nubisco/ui/icons/all` (or
   * `flags/all`) into that file and logs it. `'off'` leaves it alone, and the
   * component raises an actionable error on first render instead.
   */
  catalog?: TGlyphCatalogMode
  /** Rewrite icon names. Defaults to true. */
  icons?: boolean
  /** Rewrite flag names. Defaults to true. */
  flags?: boolean
  /**
   * Where the generated glyph name lists live. Only the library's own build
   * sets this; consumers get the published `dist/icons` and `dist/flags`.
   */
  glyphRoot?: string
  /** Import specifier prefix. Only the library's own build overrides this. */
  packageName?: string
  /** Log every rewrite. Useful when auditing what a page actually links. */
  verbose?: boolean
  /**
   * Warn when a glyph forwarded through another component (`<NbButton
   * :icon="…">`) is a value this plugin cannot see through, so no artwork was
   * linked for it. On by default, once per file, because the alternative is
   * the silence that lets an icon reach `NbIcon` with nothing to resolve it
   * against. Turn it off in a codebase where those bindings are deliberate
   * pass-through props, resolved by whoever passes them in.
   */
  warnUnresolved?: boolean
}

type TKind = 'icon' | 'flag'

interface IEdit {
  start: number
  end: number
  replacement: string
}

/** One import per (glyph, weight) pair a file actually references. */
interface IGlyphImport {
  kind: TKind
  name: string
  /** `undefined` means "the whole module", i.e. every weight. */
  weight?: string
}

const identifierFor = ({ kind, name, weight }: IGlyphImport) =>
  `__nb_${kind}_${name.replace(/[^a-zA-Z0-9]/g, '_')}${weight ? `_${weight}` : ''}`

/** Read the names the package actually ships, once per process. */
async function loadNames(
  glyphRoot: string,
): Promise<{ icon: Set<string>; flag: Set<string> }> {
  const read = async (kind: string) => {
    const file = path.join(glyphRoot, `${kind}s`, 'names.json')
    // Missing names mean every literal name silently stops being rewritten,
    // which shows up much later as a component that renders nothing. Say so
    // here instead: in this repo the fix is `pnpm run generate`, and in a
    // consumer it means the installed package is incomplete.
    if (!existsSync(file))
      throw new Error(
        `[nubisco-ui] no ${kind} catalogue at ${file}. The glyph modules have ` +
          `not been generated (run \`pnpm run generate\`), or \`glyphRoot\` ` +
          `points somewhere that does not ship them.`,
      )
    return new Set<string>(JSON.parse(await readFile(file, 'utf8')))
  }
  return { icon: await read('icon'), flag: await read('flag') }
}

function defaultGlyphRoot() {
  // dist/plugins/vite/glyphs.js → dist
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}

/** Walk the raw template AST, visiting every element node. */
function walk(node: any, visit: (node: any) => void) {
  if (!node) return
  if (node.type === NODE_ELEMENT) visit(node)
  for (const child of node.children ?? []) walk(child, visit)
  for (const branch of node.branches ?? []) walk(branch, visit)
}

/** The statically known weight of an `<NbIcon>`, if it has one. */
function staticWeight(element: any): string | undefined {
  for (const prop of element.props ?? []) {
    if (prop.type === NODE_ATTRIBUTE && prop.name === 'weight') {
      return WEIGHTS.has(prop.value?.content) ? prop.value.content : undefined
    }
    if (
      prop.type === NODE_DIRECTIVE &&
      prop.name === 'bind' &&
      prop.arg?.content === 'weight'
    ) {
      // Bound weight: keep every weight available.
      return undefined
    }
  }
  return 'regular'
}

/**
 * Parse one template expression on its own. `babelParse` wants a program, so
 * the expression is wrapped; a binding Vue accepts but Babel cannot read is
 * simply unknown, which the caller treats as unresolved.
 */
function parseExpression(expression: string): any {
  try {
    const { program } = babelParse(`(${expression})`, {
      sourceType: 'module',
      plugins: ['typescript'],
    })
    const statement: any = program.body[0]
    return statement?.type === 'ExpressionStatement'
      ? statement.expression
      : undefined
  } catch {
    return undefined
  }
}

/**
 * Whether every value this expression can hand to the component is artwork the
 * bundle already links: a literal this plugin just rewrote, or a glyph module
 * the file imported itself.
 *
 * The point is what it refuses. `open ? 'caret-up' : 'caret-down'` produces one
 * of two rewritten literals and nothing else, so it is resolved. `block?.icon
 * || 'cube'` also contains a rewritten literal, but it can just as easily
 * produce `block.icon`, which is a runtime value and needs the catalogue.
 * Judging by "a rewritten literal appears and no quoted string survives" called
 * that second one resolved, which meant adding a literal fallback silently
 * removed the coverage the same expression had without one.
 */
function producesOnlyLinkedGlyphs(
  node: any,
  isLinked: (name: string) => boolean,
): boolean {
  if (!node) return false
  const recurse = (child: any) => producesOnlyLinkedGlyphs(child, isLinked)
  switch (node.type) {
    case 'Identifier':
      return isLinked(node.name)
    // The test is not a value the prop receives; the two arms are.
    case 'ConditionalExpression':
      return recurse(node.consequent) && recurse(node.alternate)
    // `a || b`, `a ?? b` and `a && b` can all produce either side.
    case 'LogicalExpression':
      return recurse(node.left) && recurse(node.right)
    case 'SequenceExpression':
      return recurse(node.expressions[node.expressions.length - 1])
    case 'TSAsExpression':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
    case 'ParenthesizedExpression':
      return recurse(node.expression)
    default:
      return false
  }
}

/**
 * Local names bound to glyph modules by the file's own imports, so that
 * `<NbIcon :name="GithubLogo" />` is understood as already-linked artwork
 * rather than as a runtime name needing the whole catalogue.
 */
function glyphImportLocals(script: string, packageName: string): Set<string> {
  const locals = new Set<string>()
  const from = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `import\\s+([^;'"\n]+?)\\s+from\\s*['"]${from}/(?:icons|flags)/[^'"]+['"]`,
    'g',
  )
  for (const match of script.matchAll(pattern)) {
    const clause = match[1]
    const namespace = clause.match(/\*\s+as\s+(\w+)/)
    if (namespace) locals.add(namespace[1])
    const defaultImport = clause.match(/^\s*(\w+)/)
    if (defaultImport) locals.add(defaultImport[1])
    const named = clause.match(/\{([^}]*)\}/)
    if (named) {
      for (const part of named[1].split(',')) {
        const local = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim()
        if (local) locals.add(local)
      }
    }
  }
  return locals
}

function staticPropKind(
  name: string,
  isIcon: boolean,
  isFlag: boolean,
): TKind | undefined {
  if (isIcon) return name === 'name' || name === 'icon' ? 'icon' : undefined
  if (isFlag) return name === 'name' || name === 'flag' ? 'flag' : undefined
  // A forwarding component: `icon`/`flag` carry a glyph name, `name` does not
  // (on an input it is the form field name), so `name` is left alone there.
  if (name === 'icon') return 'icon'
  if (name === 'flag') return 'flag'
  return undefined
}

export function nubiscoGlyphs(options: IGlyphOptions = {}) {
  const {
    catalog = 'auto',
    icons = true,
    flags = true,
    packageName = '@nubisco/ui',
    verbose = false,
    warnUnresolved = true,
  } = options

  const glyphRoot = options.glyphRoot ?? defaultGlyphRoot()
  let names: { icon: Set<string>; flag: Set<string> } | undefined

  const enabled = (kind: TKind) => (kind === 'icon' ? icons : flags)
  const known = (kind: TKind, name: string) =>
    enabled(kind) && (names?.[kind].has(name) ?? false)

  return {
    name: 'nubisco-ui:glyphs',
    enforce: 'pre' as const,

    async buildStart() {
      names ??= await loadNames(glyphRoot)
    },

    async transform(code: string, id: string) {
      const file = id.split('?')[0]
      if (!file.endsWith('.vue') || file.includes('/node_modules/')) return
      if (!/\bNb[A-Z]|\bnb-/.test(code)) return
      names ??= await loadNames(glyphRoot)

      const { descriptor, errors } = parse(code, { filename: file })
      if (errors.length || !descriptor.template?.ast) return

      const edits: IEdit[] = []
      const used = new Map<string, IGlyphImport>()
      const catalogsNeeded = new Set<TKind>()
      const unresolvedForwards: { tag: string; prop: string; exp: string }[] =
        []

      // Artwork the file already imports by hand counts as linked: binding an
      // imported module is the documented no-plugin path, and pulling a
      // catalogue in on top of it would be pure waste.
      const glyphLocals = glyphImportLocals(
        `${descriptor.scriptSetup?.content ?? ''}\n${descriptor.script?.content ?? ''}`,
        packageName,
      )

      const use = (glyph: IGlyphImport) => {
        const variable = identifierFor(glyph)
        used.set(variable, glyph)
        if (verbose) {
          console.log(
            `[nubisco-ui] ${path.relative(process.cwd(), file)}: linked ${glyph.kind} "${glyph.name}"${glyph.weight ? ` (${glyph.weight})` : ''}`,
          )
        }
        return variable
      }

      walk(descriptor.template.ast, (element) => {
        const tag: string = element.tag
        const isIcon = ICON_TAGS.has(tag)
        const isFlag = FLAG_TAGS.has(tag)
        if (!isIcon && !isFlag && !/^(Nb[A-Z]|nb-)/.test(tag)) return

        // On NbIcon itself a static `weight` narrows the import to one weight.
        // A forwarding component applies its own weight downstream, so it gets
        // the whole module.
        const weight = isIcon ? staticWeight(element) : undefined

        for (const prop of element.props ?? []) {
          /* ---- static: name="check" / icon="plus" / flag="pt" ---------- */
          if (prop.type === NODE_ATTRIBUTE && prop.value) {
            const kind = staticPropKind(prop.name, isIcon, isFlag)
            if (!kind) continue
            const value: string = prop.value.content
            if (!known(kind, value)) continue
            const variable = use({
              kind,
              name: value,
              weight: kind === 'icon' ? weight : undefined,
            })
            edits.push({
              start: prop.loc.start.offset,
              end: prop.loc.end.offset,
              replacement: `:${prop.name}="${variable}"`,
            })
            continue
          }

          /* ---- bound: :name="…", :icon="…", :flag="…" ------------------ */
          if (
            prop.type === NODE_DIRECTIVE &&
            prop.name === 'bind' &&
            prop.arg?.type === EXPR_SIMPLE &&
            prop.exp?.type === EXPR_SIMPLE
          ) {
            // Same rule as the static branch, so `:icon="a ? 'check' : 'copy'"`
            // links the two icons whether it is written on NbIcon or forwarded
            // through NbButton. Only the tag decides the kind.
            const kind = staticPropKind(prop.arg.content, isIcon, isFlag)
            if (!kind || !enabled(kind)) continue

            const expression: string = prop.exp.content
            const rewritten = expression.replace(
              /(['"])([a-z0-9][a-z0-9-]*)\1/g,
              (match: string, _quote: string, literal: string) =>
                known(kind, literal)
                  ? use({
                      kind,
                      name: literal,
                      weight: kind === 'icon' ? weight : undefined,
                    })
                  : match,
            )

            if (rewritten !== expression) {
              edits.push({
                start: prop.exp.loc.start.offset,
                end: prop.exp.loc.end.offset,
                replacement: rewritten,
              })
            }

            const resolved = producesOnlyLinkedGlyphs(
              parseExpression(rewritten),
              (identifier) =>
                used.has(identifier) || glyphLocals.has(identifier),
            )
            if (resolved) continue

            // On NbIcon or NbFlag an unresolvable name is fatal at first
            // render, so the catalogue is the only thing that can save it. On
            // a forwarding component the same expression may just as well be
            // a module arriving as a prop, and linking 1,500 icons on that
            // guess would make the common wrapper the most expensive file in
            // the bundle. So that case is reported rather than paid for.
            if (isIcon || isFlag) catalogsNeeded.add(kind)
            else
              unresolvedForwards.push({
                tag,
                prop: prop.arg.content,
                exp: expression,
              })
          }
        }
      })

      // One line per file, however many bindings it has: this is a note about
      // the file, and repeating the same advice per expression would train
      // people to skip it.
      if (warnUnresolved && unresolvedForwards.length) {
        const kinds = new Set(unresolvedForwards.map((f) => f.prop))
        const register = kinds.has('flag')
          ? 'registerFlags()'
          : 'registerIcons()'
        const catalogue = `${packageName}/${kinds.has('flag') ? 'flags' : 'icons'}/all`
        console.warn(
          `[nubisco-ui] ${path.relative(process.cwd(), file)}: no artwork ` +
            `linked for ` +
            unresolvedForwards
              .map((f) => `<${f.tag} :${f.prop}="${f.exp}">`)
              .join(', ') +
            `. The value is only known at runtime, so it will throw on first ` +
            `render unless something resolves it: ${register} for a known ` +
            `set, or import '${catalogue}' in this file. Nothing to do if ` +
            `these are pass-through props (set warnUnresolved: false).`,
        )
      }

      if (!used.size && !catalogsNeeded.size) return

      const imports: string[] = []
      for (const [variable, glyph] of used) {
        const from = `${packageName}/${glyph.kind}s/${glyph.name}`
        imports.push(
          glyph.weight
            ? `import { ${glyph.weight} as ${variable} } from '${from}'`
            : `import * as ${variable} from '${from}'`,
        )
      }
      if (catalog === 'auto') {
        for (const kind of catalogsNeeded) {
          imports.push(`import '${packageName}/${kind}s/all'`)
          console.log(
            `[nubisco-ui] ${path.relative(process.cwd(), file)} binds <Nb${
              kind === 'icon' ? 'Icon' : 'Flag'
            }> to a runtime value, so the full ${kind} catalogue is linked ` +
              `into this file. If the set of possible values is known, ` +
              `register${kind === 'icon' ? 'Icons' : 'Flags'}() avoids it.`,
          )
        }
      }
      if (!imports.length) return

      const magic = new MagicString(code)
      // Apply template edits back-to-front so offsets stay valid.
      for (const edit of edits.sort((a, b) => b.start - a.start)) {
        magic.overwrite(edit.start, edit.end, edit.replacement)
      }

      const block = imports.join('\n')
      if (descriptor.scriptSetup) {
        magic.appendLeft(descriptor.scriptSetup.loc.start.offset, `\n${block}`)
      } else {
        magic.append(`\n<script setup>\n${block}\n</script>\n`)
      }

      return {
        code: magic.toString(),
        map: magic.generateMap({ hires: true, source: file }),
      }
    },
  }
}
