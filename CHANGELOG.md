## [1.41.1](https://github.com/nubisco/ui/compare/v1.41.0...v1.41.1) (2026-06-22)


### Bug Fixes

* **styles:** declare unplugin-fonts as an optional peer dependency ([4c4ea26](https://github.com/nubisco/ui/commit/4c4ea269afcea1c0f0dbcfdede7e87d289ef0660))

# [1.41.0](https://github.com/nubisco/ui/compare/v1.40.0...v1.41.0) (2026-06-22)


### Features

* **styles:** self-host default fonts via a configurable fonts() plugin ([a05a2a9](https://github.com/nubisco/ui/commit/a05a2a9e78e32c10de89777455e0a72bc941c21f))

# [1.40.0](https://github.com/nubisco/ui/compare/v1.39.1...v1.40.0) (2026-06-22)


### Features

* **blueprint:** WebGL render-on-demand renderer, controls/minimap, live-data channel ([#3](https://github.com/nubisco/ui/issues/3)) ([161e281](https://github.com/nubisco/ui/commit/161e281bcf2af7d6e3ec89442e973cc6ead0f7a1)), closes [hi#frequency](https://github.com/hi/issues/frequency)

## [1.39.1](https://github.com/nubisco/ui/compare/v1.39.0...v1.39.1) (2026-06-18)


### Bug Fixes

* **theme:** make component theme tokens overridable from :root and system-derived ([daf4c5e](https://github.com/nubisco/ui/commit/daf4c5e80c1c17612bdd536438853ffe33ce7f2c))

# [1.39.0](https://github.com/nubisco/ui/compare/v1.38.5...v1.39.0) (2026-06-17)


### Features

* add labs Spreadsheet, verbose Shell sidebar, icon registry, RouterLink support ([a687126](https://github.com/nubisco/ui/commit/a687126775f5b4c7cd8ff262a2ebea8b8aee72c2))

## [1.38.5](https://github.com/nubisco/ui/compare/v1.38.4...v1.38.5) (2026-05-30)


### Performance Improvements

* **Blueprint:** GPU-promote the canvas during pan/zoom ([1cc3968](https://github.com/nubisco/ui/commit/1cc3968211993923ad1fd6b31e0aaacd7892c798))

## [1.38.4](https://github.com/nubisco/ui/compare/v1.38.3...v1.38.4) (2026-05-30)


### Bug Fixes

* **Blueprint:** export IBlueprintCard/IBlueprintProps and ship interface modules ([c05738c](https://github.com/nubisco/ui/commit/c05738c502d49640673610c5489f60381c6d0fa1)), closes [#card](https://github.com/nubisco/ui/issues/card)

## [1.38.3](https://github.com/nubisco/ui/compare/v1.38.2...v1.38.3) (2026-05-30)


### Performance Improvements

* **Blueprint:** cull off-screen wires and add windowed card rendering ([cc6c3ca](https://github.com/nubisco/ui/commit/cc6c3ca51d5caf6904d9e201382ab20dd5e84a96))

## [1.38.2](https://github.com/nubisco/ui/compare/v1.38.1...v1.38.2) (2026-05-30)


### Bug Fixes

* **ci:** move build-script approval to pnpm-workspace.yaml ([4ba58e5](https://github.com/nubisco/ui/commit/4ba58e5fd3db385693ea680721b66ace02dc5fa1))
* **tooltip:** dismiss orphans, flip across all sides, re-aim arrow ([cf1eb2d](https://github.com/nubisco/ui/commit/cf1eb2d3b36bb76606c889d144c65d77ab73361c))


### Performance Improvements

* **Blueprint:** cache port centre positions, invalidate per-card ([dbc6afb](https://github.com/nubisco/ui/commit/dbc6afbd0942c9d6ae66eeff152f2781d383bb65)), closes [#2](https://github.com/nubisco/ui/issues/2)
* **Blueprint:** cache port DOM lookups + skip wireKey++ on pan ([e13f5a3](https://github.com/nubisco/ui/commit/e13f5a39c531c72af195e40e8e80032c3dca6224))
* **Blueprint:** cache resolveWireColor per port element ([5470549](https://github.com/nubisco/ui/commit/5470549e4d5bc35ae2f3069e70373c5a7f118ef6))
* **Blueprint:** drop per-wire drop-shadow filter ([c278f7f](https://github.com/nubisco/ui/commit/c278f7f3fe000d614b0ff548de1c5a4c46ad52d8))
* **Blueprint:** ignore in-card style mutations in the wire observer ([dc153e6](https://github.com/nubisco/ui/commit/dc153e6e65bbeeb6729cc648fa34a282e54d1505))
* **Blueprint:** position cards via left/top, not transform ([cf356e3](https://github.com/nubisco/ui/commit/cf356e36fcdc04fbfa2921a261660f9290db9bbf))

## [1.38.1](https://github.com/nubisco/ui/compare/v1.38.0...v1.38.1) (2026-05-12)


### Bug Fixes

* **tooltip:** clamp position to viewport so chips don't render offscreen ([f347e59](https://github.com/nubisco/ui/commit/f347e59f4ae1506a599b782bbcf09a8c02ba43ce))

# [1.38.0](https://github.com/nubisco/ui/compare/v1.37.0...v1.38.0) (2026-05-12)


### Features

* **blueprint:** wheel passes through to card-internal controls ([0703caa](https://github.com/nubisco/ui/commit/0703caa6ca2fa803e325b928394681437d23a067))

# [1.37.0](https://github.com/nubisco/ui/compare/v1.36.1...v1.37.0) (2026-05-12)


### Features

* **blueprint:** wire-mouseover / wire-mouseout events for hover tooltips ([75966ee](https://github.com/nubisco/ui/commit/75966ee313ceb5efba6ace361ae8926f72232da6))

## [1.36.1](https://github.com/nubisco/ui/compare/v1.36.0...v1.36.1) (2026-05-09)


### Bug Fixes

* **blueprint:** don't preventDefault Space when a text input is focused ([3ef806d](https://github.com/nubisco/ui/commit/3ef806dd6611727fabbee6b991e1d5a1f94eb2f2))

# [1.36.0](https://github.com/nubisco/ui/compare/v1.35.1...v1.36.0) (2026-05-09)


### Features

* **blueprint:** wheelMode, levels animation, drop-on-wire gesture ([4e845d8](https://github.com/nubisco/ui/commit/4e845d807ad31614a42ff9db8fb83a2a2107d4ee))

## [1.35.1](https://github.com/nubisco/ui/compare/v1.35.0...v1.35.1) (2026-05-06)


### Bug Fixes

* **blueprint-card:** top/bottom gutter on port pin column ([42fc0bc](https://github.com/nubisco/ui/commit/42fc0bc137c5aeb04997077fced1d9a6737c09b6))

# [1.35.0](https://github.com/nubisco/ui/compare/v1.34.0...v1.35.0) (2026-05-06)


### Features

* **blueprint-card:** collapsed cards merge port pins into one combined pin ([9292364](https://github.com/nubisco/ui/commit/9292364fe2ea92cfb3c7e111b418a207aa8b9cd2))

# [1.34.0](https://github.com/nubisco/ui/compare/v1.33.0...v1.34.0) (2026-05-05)


### Features

* **blueprint:** wider wire hit-region + marquee no longer steals wire grabs ([7170265](https://github.com/nubisco/ui/commit/71702650e00fdde86093bf9a3ddb1fecdc86d0c4))

# [1.33.0](https://github.com/nubisco/ui/compare/v1.32.1...v1.33.0) (2026-05-05)


### Features

* **blueprint:** drag wire endpoints to re-attach without delete ([4d2b110](https://github.com/nubisco/ui/commit/4d2b1104faa5f71755e6f1963ec3c9e73cbc4ee5))

## [1.32.1](https://github.com/nubisco/ui/compare/v1.32.0...v1.32.1) (2026-05-04)


### Bug Fixes

* **blueprint:** prevent descendant from moving cards ([f69d3b2](https://github.com/nubisco/ui/commit/f69d3b2854059bd21488421116b30bf8d5d70dc9))

# [1.32.0](https://github.com/nubisco/ui/compare/v1.31.0...v1.32.0) (2026-05-04)


### Bug Fixes

* **blueprint:** tighten MutationObserver to break wire-update feedback loop ([f6d7de5](https://github.com/nubisco/ui/commit/f6d7de5d7e835a8c13370b2df73b9bd1ec34833f))


### Features

* **blueprint-card:** always-rendered channel pins and inline port labels ([575f30d](https://github.com/nubisco/ui/commit/575f30da9dc59ba59072dc9d80ea58c5cd3c8500))
* **blueprint:** re-land per-wire + per-pin signal-activity indicators ([ecc58a8](https://github.com/nubisco/ui/commit/ecc58a8305b6f3608d2710bc2fc28c3997f8a3a1))
* **blueprint:** self-wiring drag-to-connect + right-click wire menu ([721eb09](https://github.com/nubisco/ui/commit/721eb098aa49f4625651c12840d307656dd34280))
* **blueprint:** wire + pin signal-activity visualisation ([e209a75](https://github.com/nubisco/ui/commit/e209a75f0bc543ebdc97c5625472b01a5ad77a60))


### Reverts

* Revert "feat(blueprint): wire + pin signal-activity visualisation" ([ac0b8f0](https://github.com/nubisco/ui/commit/ac0b8f0e7f045fecd97e8a1a0363788ff2f4b10d))

# [1.31.0](https://github.com/nubisco/ui/compare/v1.30.0...v1.31.0) (2026-05-02)


### Features

* add multi I/O to blueprint card ([621429c](https://github.com/nubisco/ui/commit/621429cd2b339db2e26df844ffed1242c1dde599))

# [1.30.0](https://github.com/nubisco/ui/compare/v1.29.0...v1.30.0) (2026-04-30)


### Features

* add NbCalendar and NbDatePicker components ([0dca105](https://github.com/nubisco/ui/commit/0dca10503462894df8c98acec025fa7463bbb8bd))

# [1.29.0](https://github.com/nubisco/ui/compare/v1.28.1...v1.29.0) (2026-04-29)


### Features

* add creatable option to NbSelect for user-defined entries ([9e38976](https://github.com/nubisco/ui/commit/9e38976eb3b7f4c1ee3d80fb6c35cd056203ab08))
* add NbBoard kanban component with drag-and-drop and swim lanes ([4bb1220](https://github.com/nubisco/ui/commit/4bb1220ddc7c96b48e6596ca0eaebf125df5dbab))

## [1.28.1](https://github.com/nubisco/ui/compare/v1.28.0...v1.28.1) (2026-04-29)


### Bug Fixes

* use input step as minimum gap between neighbor points in InterpolationChart ([c2205d5](https://github.com/nubisco/ui/commit/c2205d5b532fecadc28466973b4ed44e7188c1ff))

# [1.28.0](https://github.com/nubisco/ui/compare/v1.27.1...v1.28.0) (2026-04-29)


### Features

* add NbInterpolationChart component ([bc490c3](https://github.com/nubisco/ui/commit/bc490c3324474700ad398fd8ed2df7878967d0a5))

## [1.27.1](https://github.com/nubisco/ui/compare/v1.27.0...v1.27.1) (2026-04-26)


### Bug Fixes

* sort command palette groups and items alphabetically for consistent arrow-key navigation ([65274f2](https://github.com/nubisco/ui/commit/65274f29bf91c5cff007c7ce3ad810271800ae3c))

# [1.27.0](https://github.com/nubisco/ui/compare/v1.26.2...v1.27.0) (2026-04-26)


### Features

* persistent marching-ants selection box, cards expand only on focus ([e71ae46](https://github.com/nubisco/ui/commit/e71ae46f3d6935006dce594c712c39747e79a39a))

## [1.26.2](https://github.com/nubisco/ui/compare/v1.26.1...v1.26.2) (2026-04-26)


### Bug Fixes

* accent bar via background gradient, inward semicircle ports, selected hover border ([bbf0997](https://github.com/nubisco/ui/commit/bbf09976119d01a6753129bc750d9580ed532a0f))

## [1.26.1](https://github.com/nubisco/ui/compare/v1.26.0...v1.26.1) (2026-04-26)


### Bug Fixes

* clip accent bar with inner wrapper, semicircle ports, selected+hover border ([f944d22](https://github.com/nubisco/ui/commit/f944d2277b23b2b11b723b022ebae44082556309))

# [1.26.0](https://github.com/nubisco/ui/compare/v1.25.0...v1.26.0) (2026-04-26)


### Bug Fixes

* clip accent bar to card radius, drive selection via prop not DOM ([f87b767](https://github.com/nubisco/ui/commit/f87b767df55e4841e443ed5c97958c30ae0239e7))


### Features

* split two-finger scroll (pan) from pinch-to-zoom ([60c9854](https://github.com/nubisco/ui/commit/60c9854dc8c58688c5d5402d8f3745fe9d922b7c))

# [1.25.0](https://github.com/nubisco/ui/compare/v1.24.0...v1.25.0) (2026-04-26)


### Bug Fixes

* card dragging works with Vue reactive re-renders, unclip ports ([eb36db2](https://github.com/nubisco/ui/commit/eb36db2707c97811d8793e9ee7611308614350e1))


### Features

* distinguish focus vs selection, themeable marquee, cleaner selected state ([5ccd0ab](https://github.com/nubisco/ui/commit/5ccd0abb7fef114423237d230edaa72a0b529642))

# [1.24.0](https://github.com/nubisco/ui/compare/v1.23.0...v1.24.0) (2026-04-26)


### Features

* add card dragging, multi-selection, alignment, distribution, and auto-layout to Blueprint ([ea76c80](https://github.com/nubisco/ui/commit/ea76c80786fbde3a29a940ee25caa530ef299f1d))

# [1.23.0](https://github.com/nubisco/ui/compare/v1.22.1...v1.23.0) (2026-04-26)


### Features

* add fitToView and resetView to Blueprint, make ambient gradients themeable ([65d2e76](https://github.com/nubisco/ui/commit/65d2e76c4b76bc709ed317f61715752a6271a73b))

## [1.22.1](https://github.com/nubisco/ui/compare/v1.22.0...v1.22.1) (2026-04-26)


### Bug Fixes

* install NbCommandPalettePlugin automatically from the main plugin ([8c8d6b8](https://github.com/nubisco/ui/commit/8c8d6b82c1ed40b32ea1732d64de3ef8ba948651))

# [1.22.0](https://github.com/nubisco/ui/compare/v1.21.1...v1.22.0) (2026-04-26)


### Features

* redesign Blueprint cards with top accent, structured rows, animated wires ([b9e9aec](https://github.com/nubisco/ui/commit/b9e9aec1cf309c8c8aa18719837d08f20f635f9a))

## [1.21.1](https://github.com/nubisco/ui/compare/v1.21.0...v1.21.1) (2026-04-25)


### Bug Fixes

* add Gantt chart to docs sidebar navigation ([c26bfde](https://github.com/nubisco/ui/commit/c26bfdebe14702694aa5f8039ec2ca9c304a420d))

# [1.21.0](https://github.com/nubisco/ui/compare/v1.20.1...v1.21.0) (2026-04-25)


### Features

* add GanttChart component with dependencies, milestones, and status indicators ([d0af83b](https://github.com/nubisco/ui/commit/d0af83b8cb297e07d633ea34447a739d21e336a7))

## [1.20.1](https://github.com/nubisco/ui/compare/v1.20.0...v1.20.1) (2026-04-25)


### Bug Fixes

* remove inline pin labels, use color-coded dots with tooltips ([0747e39](https://github.com/nubisco/ui/commit/0747e39f5568c3715a5c056abeb240cbafaab6e3))

# [1.20.0](https://github.com/nubisco/ui/compare/v1.19.0...v1.20.0) (2026-04-25)


### Features

* evolve BlueprintCard with typed pins, collapse, status indicator ([d66f2b0](https://github.com/nubisco/ui/commit/d66f2b0dffdec2ee94149f1eb755f584ce86dc80))

# [1.19.0](https://github.com/nubisco/ui/compare/v1.18.0...v1.19.0) (2026-04-25)


### Features

* render command palette shortcuts as individual keycaps, remove namespace pills ([05ca427](https://github.com/nubisco/ui/commit/05ca427717717108efc3404cc7844b8dc842ea28))

# [1.18.0](https://github.com/nubisco/ui/compare/v1.17.0...v1.18.0) (2026-04-23)


### Features

* add NbShellPanel component, shell docs for menu slots, fix MenuBar toggle and Slider validation ([52e2db4](https://github.com/nubisco/ui/commit/52e2db4db1c3690cd402df8234e58673975765d2)), closes [#bottom](https://github.com/nubisco/ui/issues/bottom)

# [1.17.0](https://github.com/nubisco/ui/compare/v1.16.1...v1.17.0) (2026-04-23)


### Features

* NbShell layout redesign — outer-menu, inner-menu, auto-hide sidebar ([b0a83de](https://github.com/nubisco/ui/commit/b0a83de2946bc231895735ba9e45b49a3c84e964))

## [1.16.1](https://github.com/nubisco/ui/compare/v1.16.0...v1.16.1) (2026-04-23)


### Bug Fixes

* **TreeNode:** toggle expand/collapse on row click, not just chevron ([d0bf506](https://github.com/nubisco/ui/commit/d0bf50612d0f198aff3f590b5d451a95427796d8))

# [1.16.0](https://github.com/nubisco/ui/compare/v1.15.1...v1.16.0) (2026-04-23)


### Features

* **Shell:** add inspectorSize prop with xs, sm, md, lg, xl variants ([afd6d4e](https://github.com/nubisco/ui/commit/afd6d4e3920b639c5cd239c1b584b08ff0bb9df8))

## [1.15.1](https://github.com/nubisco/ui/compare/v1.15.0...v1.15.1) (2026-04-23)


### Bug Fixes

* **Menu:** clamp max-height to available viewport space ([58f4434](https://github.com/nubisco/ui/commit/58f44341c545bbbe9dfa54a9c944d6fbdad08e7b))

# [1.15.0](https://github.com/nubisco/ui/compare/v1.14.0...v1.15.0) (2026-04-22)


### Features

* **components:** add Tree and TreeNode components ([65a727d](https://github.com/nubisco/ui/commit/65a727de4e36aab1298d14fb8e2b7807adda13e3))

# [1.14.0](https://github.com/nubisco/ui/compare/v1.13.1...v1.14.0) (2026-04-22)


### Features

* **components:** add Menu system, MenuBar, and Command Palette ([d370eab](https://github.com/nubisco/ui/commit/d370eab04a294b22291f5255c8fe7484fe6a7225)), closes [#menubar](https://github.com/nubisco/ui/issues/menubar)

## [1.13.1](https://github.com/nubisco/ui/compare/v1.13.0...v1.13.1) (2026-04-22)


### Bug Fixes

* **shell:** maximize the bottom panel over the main area ([3ef265a](https://github.com/nubisco/ui/commit/3ef265a04eefa1869afc1bd4e07920b22a484704))

# [1.13.0](https://github.com/nubisco/ui/compare/v1.12.1...v1.13.0) (2026-04-21)


### Features

* **components:** add NbBottomPanel, NbBlueprint, NbBlueprintCard ([8c8e400](https://github.com/nubisco/ui/commit/8c8e40077f4a153eaebf6d52860d40790da3d3e8)), closes [#bottom](https://github.com/nubisco/ui/issues/bottom) [#bottom](https://github.com/nubisco/ui/issues/bottom)

## [1.12.1](https://github.com/nubisco/ui/compare/v1.12.0...v1.12.1) (2026-04-21)


### Bug Fixes

* **theme:** adapt more components to the layer system ([90c65de](https://github.com/nubisco/ui/commit/90c65de98f8fae98b8a5b7afff9689c6302e573b))

# [1.12.0](https://github.com/nubisco/ui/compare/v1.11.0...v1.12.0) (2026-04-20)


### Features

* **theme:** add layer system for visual depth ([2d5b578](https://github.com/nubisco/ui/commit/2d5b5785421645e98b00bc2e7e01601a91198fb0))

# [1.11.0](https://github.com/nubisco/ui/compare/v1.10.0...v1.11.0) (2026-04-19)


### Features

* **charts:** add NbSparkline component for inline dashboard charts ([85753d0](https://github.com/nubisco/ui/commit/85753d08eec57336dce48a0b27230a04c14f662e))

# [1.10.0](https://github.com/nubisco/ui/compare/v1.9.1...v1.10.0) (2026-04-19)


### Features

* **charts:** add Bar, Line and Pie chart components with documentation ([2fe1cc5](https://github.com/nubisco/ui/commit/2fe1cc5dfd4b4e9d5c3d191f9ac6bbe77391dfed))
* **json-tree:** add NbJsonTree documentation page ([3ff2e8e](https://github.com/nubisco/ui/commit/3ff2e8e60d8b04b8d017141b87896c132080e612))

## [1.9.1](https://github.com/nubisco/ui/compare/v1.9.0...v1.9.1) (2026-04-17)


### Bug Fixes

* **docs:** contain z-index in preview wrapper to prevent NbShell overlap ([a30fcc3](https://github.com/nubisco/ui/commit/a30fcc3199e9294ecaf106333ac3be9a7dfb5313))

# [1.9.0](https://github.com/nubisco/ui/compare/v1.8.2...v1.9.0) (2026-04-17)


### Features

* **shell:** add notification slot and component documentation ([b4da3db](https://github.com/nubisco/ui/commit/b4da3dbbc79d183ced87810047d402ff6b8d207b))

## [1.8.2](https://github.com/nubisco/ui/compare/v1.8.1...v1.8.2) (2026-04-09)


### Bug Fixes

* add missing components to global registration (FileUploader, ImageCropper, AiLabel, Switch, Form) ([4faef00](https://github.com/nubisco/ui/commit/4faef005122151dbdcde34a52e32eb4a47aa84fa))

## [1.8.1](https://github.com/nubisco/ui/compare/v1.8.0...v1.8.1) (2026-04-09)


### Bug Fixes

* register components explicitly to fix global registration in library builds ([f8174e7](https://github.com/nubisco/ui/commit/f8174e78997ac0fb7d86f25ff2b2f4125304d1f7))

# [1.8.0](https://github.com/nubisco/ui/compare/v1.7.2...v1.8.0) (2026-04-08)


### Features

* **shell:** render fixedbar from route slot and hide empty shell bar ([7d635ef](https://github.com/nubisco/ui/commit/7d635ef37aee4521370f75bab3034466b1228374))

## [1.7.2](https://github.com/nubisco/ui/compare/v1.7.1...v1.7.2) (2026-04-07)


### Bug Fixes

* **types:** add NbShell and NbSidebarLink to global component type declarations ([32b78aa](https://github.com/nubisco/ui/commit/32b78aa40aaeac17b790f686b0bbe5210fb137ca))

## [1.7.1](https://github.com/nubisco/ui/compare/v1.7.0...v1.7.1) (2026-04-06)


### Bug Fixes

* build plugins to dist/plugins as JS, fix exports ([26f12da](https://github.com/nubisco/ui/commit/26f12dad963fe7e7a92b65f97949d74f81ae386d))

# [1.7.0](https://github.com/nubisco/ui/compare/v1.6.0...v1.7.0) (2026-04-06)


### Features

* **shell:** add NbShell layout and NbSidebarLink navigation components ([a03ac97](https://github.com/nubisco/ui/commit/a03ac9765d4afb045d514ab015e9dc9eb27d8e5c))

# [1.6.0](https://github.com/nubisco/ui/compare/v1.5.2...v1.6.0) (2026-04-06)


### Features

* **analytics:** remove GA and keep Nubisco Analytics only ([ecee46b](https://github.com/nubisco/ui/commit/ecee46bf3747de05d7446352b1a42040a92ec053))

## [1.5.2](https://github.com/nubisco/ui/compare/v1.5.1...v1.5.2) (2026-04-06)


### Bug Fixes

* point analytics script to self-hosted NAS endpoint ([8c5c853](https://github.com/nubisco/ui/commit/8c5c853c20ffdaffaaace260197bc61278de1116))

## [1.5.1](https://github.com/nubisco/ui/compare/v1.5.0...v1.5.1) (2026-04-05)


### Bug Fixes

* **docs:** resolve design tokens 404 in production by respecting base path ([8c11bf0](https://github.com/nubisco/ui/commit/8c11bf0b100fdb439c48a6c8020743f8fbf09b7b))

# [1.5.0](https://github.com/nubisco/ui/compare/v1.4.1...v1.5.0) (2026-04-05)


### Features

* new nubisco analytics integration ([75d7a50](https://github.com/nubisco/ui/commit/75d7a50fb41c521709bcf8c0162a7d8c99d6b75e))

## [1.4.1](https://github.com/nubisco/ui/compare/v1.4.0...v1.4.1) (2026-04-03)


### Bug Fixes

* **docs:** write tokens.json to docs/public so VitePress copies it to dist ([12f33b0](https://github.com/nubisco/ui/commit/12f33b084ee04c9b0ff8a89ac45e374535df7ef4))

# [1.4.0](https://github.com/nubisco/ui/compare/v1.3.0...v1.4.0) (2026-04-03)


### Features

* **docs:** add design token pipeline and live token reference page ([ef94d9b](https://github.com/nubisco/ui/commit/ef94d9be2c9c3ca0307d6aaa0349fa4c7ed042ff))

# [1.3.0](https://github.com/nubisco/ui/compare/v1.2.2...v1.3.0) (2026-04-03)


### Bug Fixes

* **docs:** reformat Plausible script tag to satisfy Prettier line length ([11a8b13](https://github.com/nubisco/ui/commit/11a8b13f7d398ffce8ef0301eb01c690860b985a))


### Features

* **docs:** add Plausible analytics for docs.nubisco.io ([e48ca04](https://github.com/nubisco/ui/commit/e48ca04df2ecc03c5915af3e576f6b81bfec608d))

## [1.2.2](https://github.com/nubisco/ui/compare/v1.2.1...v1.2.2) (2026-04-03)


### Bug Fixes

* **docs:** move sitemap config to top level so VitePress generates sitemap.xml ([d30851b](https://github.com/nubisco/ui/commit/d30851b207bb8e6a79f998cc312dd8d63cc10b4a))

## [1.2.1](https://github.com/nubisco/ui/compare/v1.2.0...v1.2.1) (2026-04-03)


### Bug Fixes

* **Button:** render to prop as plain <a href> for SSR compatibility ([bfe6060](https://github.com/nubisco/ui/commit/bfe606012fdb7af99f6e3339a9f2c0a22a527b31))

# [1.2.0](https://github.com/nubisco/ui/compare/v1.1.1...v1.2.0) (2026-04-03)


### Features

* **Button:** add `to` prop for Vue Router navigation ([e1f588a](https://github.com/nubisco/ui/commit/e1f588af226cedbfcb5677cb3393ad5b5420f807))

## [1.1.1](https://github.com/nubisco/ui/compare/v1.1.0...v1.1.1) (2026-04-03)


### Bug Fixes

* format config.ts to pass prettier check ([7186e1b](https://github.com/nubisco/ui/commit/7186e1b9593aad5a1f0327da909dbb99a0ac9262))

# [1.1.0](https://github.com/nubisco/ui/compare/v1.0.5...v1.1.0) (2026-04-03)

### Features

- add Google Analytics support via VITE_GA_ID env variable ([f2c513f](https://github.com/nubisco/ui/commit/f2c513f8899cadb54e0344896fa4bb26f0e194ca))

## [1.0.5](https://github.com/nubisco/ui/compare/v1.0.4...v1.0.5) (2026-04-01)

### Bug Fixes

- **file-uploader:** replace all wildcard characters in MIME type check ([f55a569](https://github.com/nubisco/ui/commit/f55a5697c96678c186407095b2c97922724d8ac4))
- make NbIcon clickable/hoverable optional and harden pre-commit hook ([ede827d](https://github.com/nubisco/ui/commit/ede827d780c1691f9a033483b164bd50740e3aac))

## [1.0.4](https://github.com/nubisco/ui/compare/v1.0.3...v1.0.4) (2026-03-31)

### Bug Fixes

- set vitepress base to /ui/ for github pages deployment ([66cd76f](https://github.com/nubisco/ui/commit/66cd76fb5cb712e1600a22ad57114ec3cfcaae6e))

## [1.0.3](https://github.com/nubisco/ui/compare/v1.0.2...v1.0.3) (2026-03-31)

### Bug Fixes

- **docs:** format VitePress config for Prettier compliance ([8b0563f](https://github.com/nubisco/ui/commit/8b0563f3481e370780c9cc2cf6bf160ef15cf3d6))

## [1.0.2](https://github.com/nubisco/ui/compare/v1.0.1...v1.0.2) (2026-03-31)

### Bug Fixes

- ssr bundle vue-i18n for vitepress static build; drop node 20 from ci matrix ([3eecae1](https://github.com/nubisco/ui/commit/3eecae1a19fbd082c955cdccaffa84988b9de7fe))

## [1.0.1](https://github.com/nubisco/ui/compare/v1.0.0...v1.0.1) (2026-03-31)

### Bug Fixes

- **logo:** fix the project logo path in README.md re [#1](https://github.com/nubisco/ui/issues/1) ([7a9caf7](https://github.com/nubisco/ui/commit/7a9caf745b4c482dd4c9a0cbcb2fb9da0ecc2113))

# 1.0.0 (2026-03-31)

### Bug Fixes

- resolve dead README link in quickstart docs ([3eac0d9](https://github.com/nubisco/ui/commit/3eac0d91a80fad0e488c950c12ad3752e518c1f5))

### Features

- initial public release ([8198a0b](https://github.com/nubisco/ui/commit/8198a0bb509d9eb383b5124067e73568433a557b))
