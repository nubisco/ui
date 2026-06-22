// jsdom does not implement HTMLCanvasElement.getContext and logs a noisy
// "Not implemented" error every time it is called. NbBlueprint's WebGL
// capability probe (and any canvas-touching code) hits this on mount. Stub it
// to return null, which is the correct "no WebGL / no 2d context" signal for
// the test environment and keeps the suite output clean so real warnings show.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as unknown as HTMLCanvasElement['getContext']
