import { config } from '@vue/test-utils'

// The library registers its components globally (app.use), so any component's
// template can reference presentational siblings (NbGrid, NbLabel, NbMessage,
// NbIcon) by their global name. A test that mounts a single component in
// isolation never installs the library, so Vue cannot resolve those siblings
// and both warns ("Failed to resolve component") and renders broken
// <nbgrid>/<nbicon> custom elements. Register slot-passing stubs for the
// ubiquitous presentational siblings once here so every mount resolves them.
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
    props: ['name', 'weight', 'color', 'size'],
    template:
      '<i class="nb-icon" data-testid="nb-icon" :data-name="name" :data-weight="weight" :data-color="color"></i>',
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
