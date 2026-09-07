import { config } from '@vue/test-utils'

// Library components now import their presentational siblings (NbGrid,
// NbLabel, NbMessage, NbIcon) directly, so a test that mounts one in isolation
// resolves them without any global registration. These stubs are kept because
// specs assert against them: they keep a mount focused on the component under
// test and give it stable hooks (`data-testid`, `data-name`) instead of the
// sibling's full markup. A spec that needs the real sibling overrides the stub
// via its own `global.stubs`.
//
// These are the exact stubs individual specs were already duplicating; keeping
// them global means new specs get resolution for free, and any spec that needs
// richer behaviour still overrides a stub via its own `global.stubs` (per-mount
// stubs win over these defaults). Only pure presentational wrappers/leaves go
// here: interactive siblings (NbSelect, NbCheckbox, NbNumberInput, ...) are
// left to resolve to the real component a spec imports/registers, so contract
// assertions and findComponent() keep working.
// Each stub carries both the real component's base class (so class selectors
// like `.nb-label` keep matching for specs that don't override the stub, e.g.
// components that import the sibling directly) and a data-testid (the hook the
// pre-existing per-spec stubs were written against).
config.global.stubs = {
  NbLabel: {
    name: 'NbLabel',
    template:
      '<label class="nb-label" data-testid="nb-label" v-bind="$attrs"><slot /></label>',
  },
  NbMessage: {
    name: 'NbMessage',
    props: ['variant'],
    template:
      '<span class="nb-message" data-testid="nb-message" :data-variant="variant"><slot /></span>',
  },
  NbIcon: {
    name: 'NbIcon',
    props: ['name', 'icon', 'weight', 'color', 'size'],
    // `name` may arrive as a glyph module rather than a string: the
    // compile-time plugin rewrites a literal name into a static import, and
    // every generated glyph carries its own `glyphName` so the identity is
    // still readable. Mirror what the real NbIcon does so `data-name`
    // assertions keep meaning the same thing.
    computed: {
      resolvedName(this: { name: unknown; icon: unknown }) {
        const source = this.icon ?? this.name
        if (typeof source === 'string') return source
        const glyph = source as
          | { glyphName?: string; regular?: { glyphName?: string } }
          | undefined
        return glyph?.glyphName ?? glyph?.regular?.glyphName
      },
    },
    template:
      '<i class="nb-icon" data-testid="nb-icon" :data-name="resolvedName" :data-weight="weight" :data-color="color"></i>',
  },
  NbGrid: {
    name: 'NbGrid',
    props: ['is', 'id', 'style', 'disabled'],
    template:
      '<component :is="is || \'div\'" class="nb-grid" :id="id" :style="style" :disabled="disabled" v-bind="$attrs" @click="$emit(\'click\')"><slot /></component>',
  },
}

// jsdom does not implement HTMLCanvasElement.getContext and logs a noisy
// "Not implemented" error every time it is called. NbBlueprint's WebGL
// capability probe (and any canvas-touching code) hits this on mount. Stub it
// to return null, which is the correct "no WebGL / no 2d context" signal for
// the test environment and keeps the suite output clean so real warnings show.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as HTMLCanvasElement['getContext']
