# [2.0.0](https://github.com/nubisco/ui/compare/v1.0.0...v2.0.0) (2026-09-05)


* fix(theme)!: rebuild the dark layer ramp for AAA on every surface ([a056fc2](https://github.com/nubisco/ui/commit/a056fc2c5bd55e88d6f91dab7cb885ccaafc3b5a)), closes [#6f6f6f](https://github.com/nubisco/ui/issues/6f6f6f) [#5e5e5e](https://github.com/nubisco/ui/issues/5e5e5e)
* fix(theme)!: rebuild the light layer ramp for AAA on every surface ([28d5dcf](https://github.com/nubisco/ui/commit/28d5dcfb75cbc13e328182aa19460b98fa95e6db))


### Bug Fixes

* accent bar via background gradient, inward semicircle ports, selected hover border ([190aeb8](https://github.com/nubisco/ui/commit/190aeb850fec17f8b32437b947beb46e32c551c5))
* add Gantt chart to docs sidebar navigation ([e6abd31](https://github.com/nubisco/ui/commit/e6abd31da67b1953bf26fd31aad4779015017d51))
* add missing components to global registration (FileUploader, ImageCropper, AiLabel, Switch, Form) ([0854001](https://github.com/nubisco/ui/commit/08540011280e2936d4b4e2b1516691fa3d2326da))
* **banner:** centre the row when it carries action controls ([77e0608](https://github.com/nubisco/ui/commit/77e06081fc81c67ea8e355999665eb6f9cdef0ff))
* **banner:** status bar, filled icons, and a close button that is not purple ([06314f2](https://github.com/nubisco/ui/commit/06314f2843127b9c093016b9308fa01b4900694e))
* **banner:** stop the host's paragraph styles inflating the body ([9d36258](https://github.com/nubisco/ui/commit/9d36258f85616720fb268c60519078166bfbec07))
* **blueprint-card:** top/bottom gutter on port pin column ([95bb07b](https://github.com/nubisco/ui/commit/95bb07b68879417317054aca350c0bb4c0a3f16d))
* **blueprint:** activity gated on real signal; separate levels from activity ([64a56bb](https://github.com/nubisco/ui/commit/64a56bb7c89b970e2f40bb99d4bedd1cdb728ec4))
* **blueprint:** compositor-only port glow (was animating box-shadow) ([466b413](https://github.com/nubisco/ui/commit/466b413328951abf975407b41200869e290b34cf))
* **blueprint:** don't deselect when the mousedown lands on chrome ([5b4f825](https://github.com/nubisco/ui/commit/5b4f825859d0938b64302f9f80e4bcb8fac7c8ea)), closes [#chrome](https://github.com/nubisco/ui/issues/chrome)
* **blueprint:** don't preventDefault Space when a text input is focused ([07c011f](https://github.com/nubisco/ui/commit/07c011fae475245ef87b8894eb65c14c3e3483af))
* **Blueprint:** export IBlueprintCard/IBlueprintProps and ship interface modules ([7840620](https://github.com/nubisco/ui/commit/78406209125f71806c7fa0cd7f8b8fb4f0c29601)), closes [#card](https://github.com/nubisco/ui/issues/card)
* **blueprint:** grow a card to contain its own port column ([cbe741d](https://github.com/nubisco/ui/commit/cbe741d761d7e0662aa68e54e8b1b672319d3310))
* **blueprint:** keep selection box glued to cards during pan/zoom ([0531a2f](https://github.com/nubisco/ui/commit/0531a2f90e3d3e8fd6d11c277a9db02371d0cfea))
* **blueprint:** make live pins readable and stop them erasing the meter ([00eb98e](https://github.com/nubisco/ui/commit/00eb98e7b70b2dd39fb0c23be26e490b39895848))
* **blueprint:** port signal = compositor-only ping (not box-shadow); align >9-port labels ([85580f7](https://github.com/nubisco/ui/commit/85580f79ea0f33515066f133ee7f2114e545d1cc))
* **blueprint:** prevent descendant from moving cards ([63ecd99](https://github.com/nubisco/ui/commit/63ecd99c1ec96f561719b331962100cb5d544fc3))
* **blueprint:** require pixi.js peer + shape the port ping like the pin ([4f84b0b](https://github.com/nubisco/ui/commit/4f84b0b5147d4a80c44d1f8a73e974604bb46b19))
* **blueprint:** run the vibrate wire wave source-to-dest at a fixed wavelength ([1e257ef](https://github.com/nubisco/ui/commit/1e257ef021483b5e14732cf7eafd248a1e1bbd19))
* **blueprint:** stop text/element selection on the canvas ([47b8bc7](https://github.com/nubisco/ui/commit/47b8bc72856dcfa16c750644ad181d53370e290c))
* **blueprint:** tighten MutationObserver to break wire-update feedback loop ([8484dcd](https://github.com/nubisco/ui/commit/8484dcdded81fe37c07be91c3daad4d750c60519))
* **blueprint:** tighter/faster vibrate; reset wire shape on style/mode switch ([4a4a644](https://github.com/nubisco/ui/commit/4a4a644a92a885d8d6db2539bf9a3832e393598b))
* **breadcrumbs:** no separator when the slot renders nothing ([70f18f5](https://github.com/nubisco/ui/commit/70f18f5c3a6bd02b9d950a9c85c25aaac0034dc0))
* build plugins to dist/plugins as JS, fix exports ([6358102](https://github.com/nubisco/ui/commit/63581027720d782cee012ca1e40a26569a975f6f))
* **build:** stop publishing sourcemaps and verify the release is installable ([23eafb2](https://github.com/nubisco/ui/commit/23eafb282f650618ce66f4ce667d49a5da375985))
* **button:** an icon-only button is the same width as a link ([4c09583](https://github.com/nubisco/ui/commit/4c095831ed04178e069fe4c6671410f937145648))
* **Button:** render to prop as plain <a href> for SSR compatibility ([81ba471](https://github.com/nubisco/ui/commit/81ba471974252ca3912430c432563863f6d31028))
* **button:** take the hover border from a semantic role, not a brand ramp ([c93533d](https://github.com/nubisco/ui/commit/c93533d28c1e68894bc994152d88efd7abdaccd9))
* card dragging works with Vue reactive re-renders, unclip ports ([aa40a7c](https://github.com/nubisco/ui/commit/aa40a7c8647208a8be0ba10dcec5e658aad0c424))
* **ci:** move build-script approval to pnpm-workspace.yaml ([9196854](https://github.com/nubisco/ui/commit/9196854c40d69e723226b1f2f202d9c640c5c758))
* clip accent bar to card radius, drive selection via prop not DOM ([bbae370](https://github.com/nubisco/ui/commit/bbae37013b35f3141063b408b3b80edbf9837406))
* clip accent bar with inner wrapper, semicircle ports, selected+hover border ([f828f5e](https://github.com/nubisco/ui/commit/f828f5e7dee69a2d47036d77f7296e374b31aad6))
* **data-table:** align with Carbon, drop invented controls, stop reflow ([becefe2](https://github.com/nubisco/ui/commit/becefe2ffae05a6aa819ae75719caefba482b62c))
* **docs:** contain z-index in preview wrapper to prevent NbShell overlap ([ee72ac6](https://github.com/nubisco/ui/commit/ee72ac60e64e9e8db043eac9b4e075b51b36af91))
* **docs:** format VitePress config for Prettier compliance ([8d97873](https://github.com/nubisco/ui/commit/8d978730c5c285621eb83a284ac58769d8b9b9a4))
* **docs:** move sitemap config to top level so VitePress generates sitemap.xml ([d293bf9](https://github.com/nubisco/ui/commit/d293bf9b749ff40b4f8105e51b6ec797a795d8f1))
* **docs:** reformat Plausible script tag to satisfy Prettier line length ([efc96da](https://github.com/nubisco/ui/commit/efc96dab5f111251accbb321575da26b56b74418))
* **docs:** resolve design tokens 404 in production by respecting base path ([01a3433](https://github.com/nubisco/ui/commit/01a34333907a7de29b12f34afe1168fe318b3529))
* **docs:** write tokens.json to docs/public so VitePress copies it to dist ([6cef877](https://github.com/nubisco/ui/commit/6cef8771e32e1dca6be8d84c048fa96f9ecf0120))
* **exports:** NbAiLabel, NbFileUploader, NbForm and NbImageCropper were never exported ([421293d](https://github.com/nubisco/ui/commit/421293d72866a25c378ff3b745cd7033f877d187))
* **file-uploader:** replace all wildcard characters in MIME type check ([9489be5](https://github.com/nubisco/ui/commit/9489be5a02f7cd019626acbbf12947e4c59c634f))
* format config.ts to pass prettier check ([60e4d2b](https://github.com/nubisco/ui/commit/60e4d2b361e26c5247a15f249d68d83c61618b81))
* **forms:** normalize label-to-field gap across form controls ([#5](https://github.com/nubisco/ui/issues/5)) ([79de70f](https://github.com/nubisco/ui/commit/79de70f8c16f41c31e19b08ffd248ead365164e5))
* install NbCommandPalettePlugin automatically from the main plugin ([aafabc1](https://github.com/nubisco/ui/commit/aafabc12dec239616d43447680b83e8293c65f74))
* **logo:** fix the project logo path in README.md re [#1](https://github.com/nubisco/ui/issues/1) ([7a9caf7](https://github.com/nubisco/ui/commit/7a9caf745b4c482dd4c9a0cbcb2fb9da0ecc2113))
* make NbIcon clickable/hoverable optional and harden pre-commit hook ([ffbcb07](https://github.com/nubisco/ui/commit/ffbcb07f06361a8ebc2a8a649ca653c4002647c7))
* **Menu:** clamp max-height to available viewport space ([717eaf6](https://github.com/nubisco/ui/commit/717eaf611f538fb667a382a58a8911873c23f89b))
* **modal:** one counted page-scroll lock, shared by everything that locks ([85032a7](https://github.com/nubisco/ui/commit/85032a7957fb25011b940d5855acc3bc9adc2ba3))
* point analytics script to self-hosted NAS endpoint ([d3663e3](https://github.com/nubisco/ui/commit/d3663e3208078b660e35041952df942f08eaf72c))
* register components explicitly to fix global registration in library builds ([cad8008](https://github.com/nubisco/ui/commit/cad8008e67caccfe232dfdeaefa548c0cfbcb32a))
* **release:** republish after stuck npm ingestion ([6c3ba21](https://github.com/nubisco/ui/commit/6c3ba2190ec0b0e5f8f50fb609bbb14f20df072a))
* remove inline pin labels, use color-coded dots with tooltips ([b928551](https://github.com/nubisco/ui/commit/b928551e3d5d379e091d11314f558dd204a8c6e5))
* set vitepress base to /ui/ for github pages deployment ([aaa8fe5](https://github.com/nubisco/ui/commit/aaa8fe5fc00a4b38d783544f3d58d72fb1fd79fe))
* **shell-panel:** dim panels squeezed to header-only by a maximized sibling ([32534fb](https://github.com/nubisco/ui/commit/32534fbd6cc6a848b4e15f6aaa31ef4d4d4bf79c))
* **shell:** maximize the bottom panel over the main area ([de5e9e0](https://github.com/nubisco/ui/commit/de5e9e0d37d5cdebe40caa02b93f34b75289bcea))
* **shell:** stop empty slot wrappers from doubling the header rule ([a534b45](https://github.com/nubisco/ui/commit/a534b45cecbd8f3d91f43b9c9a215d8054173184))
* sort command palette groups and items alphabetically for consistent arrow-key navigation ([f76d0c5](https://github.com/nubisco/ui/commit/f76d0c51733c7f6f43e44037772848edff31aeb9))
* ssr bundle vue-i18n for vitepress static build; drop node 20 from ci matrix ([dd6f640](https://github.com/nubisco/ui/commit/dd6f6409c31d49f59684c0bd379d5e213b8c0ab7))
* **styles:** declare unplugin-fonts as an optional peer dependency ([0fe38e2](https://github.com/nubisco/ui/commit/0fe38e2f41efc3b59959ba923d84817e3a5987f4))
* **styles:** scope .nb-inspector two-column rows to labeled fields ([57120c6](https://github.com/nubisco/ui/commit/57120c69c672adb934d1c4748f64166807777d07))
* **text-input:** keep a multiline field within its container ([be7e8b0](https://github.com/nubisco/ui/commit/be7e8b0355b12460f56769edac800fb42814ab6e))
* **theme:** adapt more components to the layer system ([7e848f6](https://github.com/nubisco/ui/commit/7e848f64a977aa98f4e7f58857cd764d3b3722f4))
* **theme:** make component theme tokens overridable from :root and system-derived ([3a05874](https://github.com/nubisco/ui/commit/3a05874133b79a197c2af76446e9c56b5dd8fa95))
* **tooltip:** clamp position to viewport so chips don't render offscreen ([baad420](https://github.com/nubisco/ui/commit/baad4201aa679825e54951874572767d20d82c52))
* **tooltip:** dismiss orphans, flip across all sides, re-aim arrow ([447e37e](https://github.com/nubisco/ui/commit/447e37e7199b3d29f450625bdfea255367bd3fa2))
* **tooltip:** stop orphan chips and per-render forced layout ([1b348e6](https://github.com/nubisco/ui/commit/1b348e6141bc2654bb3ab7ee59b17e221f620d05))
* **treenode:** change direction of chevrons on folders ([a332411](https://github.com/nubisco/ui/commit/a332411ec8c3ed0de750ce92805cd29bfd6139a7))
* **TreeNode:** toggle expand/collapse on row click, not just chevron ([8ce3fac](https://github.com/nubisco/ui/commit/8ce3fac817eb7d583c42e567ba8a89331cfce37e))
* **types:** add NbShell and NbSidebarLink to global component type declarations ([8042cc9](https://github.com/nubisco/ui/commit/8042cc9535332f8ee428e680a7c17566da19f6e8))
* **types:** emit the global augmentation as GlobalComponents ([265b710](https://github.com/nubisco/ui/commit/265b7108c3c41b660e44dc323a648b8e6db05155))
* **types:** ship the hand-written declaration modules ([12db605](https://github.com/nubisco/ui/commit/12db6058901f96228ffec1810237db48b353d70e))
* use input step as minimum gap between neighbor points in InterpolationChart ([bbbf04d](https://github.com/nubisco/ui/commit/bbbf04da88155d4dce46f5c69552e7f3bf36116f))
* **user-menu:** square the panel and run its rows edge to edge ([8c30e5e](https://github.com/nubisco/ui/commit/8c30e5e91a051c41eb2a8dcd6a323f6b9f8043d7))


### Features

* add card dragging, multi-selection, alignment, distribution, and auto-layout to Blueprint ([d7e1e35](https://github.com/nubisco/ui/commit/d7e1e35d0a3098d7ea1ef00cbed12aa03a4f8567))
* add creatable option to NbSelect for user-defined entries ([47a2efc](https://github.com/nubisco/ui/commit/47a2efce487f3d77b09a8b6dd1ef24b244160ea4))
* add fitToView and resetView to Blueprint, make ambient gradients themeable ([026f8d8](https://github.com/nubisco/ui/commit/026f8d8e5260db94a55248118371cf32969b0ee5))
* add GanttChart component with dependencies, milestones, and status indicators ([dfa9c08](https://github.com/nubisco/ui/commit/dfa9c08ee4e4b4d03111b81b458ad5db03f55854))
* add Google Analytics support via VITE_GA_ID env variable ([fbd9471](https://github.com/nubisco/ui/commit/fbd9471c8aa1a8317c454cafc59701e0597fd89e))
* add labs Spreadsheet, verbose Shell sidebar, icon registry, RouterLink support ([934bac9](https://github.com/nubisco/ui/commit/934bac998884e631c1a3ea58085d1d728018fc1b))
* add multi I/O to blueprint card ([1947bfc](https://github.com/nubisco/ui/commit/1947bfc6849ca817e97a91fc8b1baed6c435bb06))
* add NbBoard kanban component with drag-and-drop and swim lanes ([19a80f2](https://github.com/nubisco/ui/commit/19a80f25eae5f8e5437ce74c8471f665cb438e41))
* add NbCalendar and NbDatePicker components ([8765ee4](https://github.com/nubisco/ui/commit/8765ee47fca231c242c57ac24dcad0f31342956a))
* add NbInterpolationChart component ([8ef158c](https://github.com/nubisco/ui/commit/8ef158c62ca2e23a180a58f8e66ed96ec70b47f2))
* add NbShellPanel component, shell docs for menu slots, fix MenuBar toggle and Slider validation ([1560d6e](https://github.com/nubisco/ui/commit/1560d6e56bfe9d10bfac6195ed5e203f6b1ad488)), closes [#bottom](https://github.com/nubisco/ui/issues/bottom)
* **analytics:** remove GA and keep Nubisco Analytics only ([e8eb98d](https://github.com/nubisco/ui/commit/e8eb98d2c5bfb34e501aac96e6c53cf796289900))
* **banner:** add NbBanner, the page-level message the shell had no component for ([fc734b9](https://github.com/nubisco/ui/commit/fc734b940f013f3770570c010519b8630932a4bc)), closes [#notification](https://github.com/nubisco/ui/issues/notification) [#fef3c7](https://github.com/nubisco/ui/issues/fef3c7) [#92400e](https://github.com/nubisco/ui/issues/92400e)
* **blueprint-card:** always-rendered channel pins and inline port labels ([16970bd](https://github.com/nubisco/ui/commit/16970bdeb35f80099aac498b040e192a0bfffae8))
* **blueprint-card:** collapsed cards merge port pins into one combined pin ([0d247b3](https://github.com/nubisco/ui/commit/0d247b3522c0e69854f4f36e285c7012fd6bd709))
* **blueprint:** add getCamera / setCamera ([9808498](https://github.com/nubisco/ui/commit/980849894850d02d5726bac77e3f04c1604d3343))
* **blueprint:** add NbBlueprintBackground component and #background slot ([5b7fa5d](https://github.com/nubisco/ui/commit/5b7fa5ddc2243952ead8ee877aab3baa4d002a95)), closes [#background](https://github.com/nubisco/ui/issues/background) [#background](https://github.com/nubisco/ui/issues/background)
* **blueprint:** analog and digital ports, told apart by texture not shape ([16c2ce9](https://github.com/nubisco/ui/commit/16c2ce93a9887d24a27c315598f88af7ae0c0b84))
* **blueprint:** drag wire endpoints to re-attach without delete ([f782dc6](https://github.com/nubisco/ui/commit/f782dc65103a481915d74e98e9dfa2388566931a))
* **blueprint:** drop the diamond pin shape ([d25afea](https://github.com/nubisco/ui/commit/d25afeae5e27b3ff4874c930584debd064e397af))
* **blueprint:** let fitToView frame a subset of cards ([83f3206](https://github.com/nubisco/ui/commit/83f3206fb671c2a0716068eabe41e9293d0addeb))
* **blueprint:** move ports outside the card and anchor wires to the pin ([23fd947](https://github.com/nubisco/ui/commit/23fd947a2183bc055a0252cc56e46ae8e6d9b8f5))
* **blueprint:** port glow means live signal, not just connected ([fa4233a](https://github.com/nubisco/ui/commit/fa4233a106e577e483280fee1789a9f1456d6495))
* **blueprint:** port signal-flow auto-layout into the library ([a66ba99](https://github.com/nubisco/ui/commit/a66ba991ad38d35c5de90ce166cefd5f98f07d54))
* **blueprint:** re-land per-wire + per-pin signal-activity indicators ([b36c88c](https://github.com/nubisco/ui/commit/b36c88ca82329ab3236452011808cf252fcbe34f))
* **blueprint:** restore the three-element port ([9fad537](https://github.com/nubisco/ui/commit/9fad537500d2c6288eb5dbb7b18a08e3be9b2abd))
* **blueprint:** selectable activity styles (flow / pulse / vibrate) ([4dab844](https://github.com/nubisco/ui/commit/4dab8447039c4223aaab8c2463e8e07b4e3cf9ad))
* **blueprint:** self-wiring drag-to-connect + right-click wire menu ([5e5ff0a](https://github.com/nubisco/ui/commit/5e5ff0a72f6cb79d4bd2b47d057c5cac7d30f950))
* **blueprint:** WebGL render-on-demand renderer, controls/minimap, live-data channel ([#3](https://github.com/nubisco/ui/issues/3)) ([fef70eb](https://github.com/nubisco/ui/commit/fef70ebaecc46a343317d9bad9910f1fff8f5901)), closes [hi#frequency](https://github.com/hi/issues/frequency)
* **blueprint:** wheel passes through to card-internal controls ([9c1ef93](https://github.com/nubisco/ui/commit/9c1ef9363a3597b75c7a379b3119a06b69d3dd50))
* **blueprint:** wheelMode, levels animation, drop-on-wire gesture ([10c6b6c](https://github.com/nubisco/ui/commit/10c6b6cd8a37521af28cda1a95a7c8dbf7ab4316))
* **blueprint:** wider wire hit-region + marquee no longer steals wire grabs ([088bb86](https://github.com/nubisco/ui/commit/088bb8679a31dbd2e6413cf46589c057ca277522))
* **blueprint:** wire + pin signal-activity visualisation ([717396f](https://github.com/nubisco/ui/commit/717396f69bee37d92e3063862af5ee5dbc507d63))
* **blueprint:** wire-mouseover / wire-mouseout events for hover tooltips ([35c37c2](https://github.com/nubisco/ui/commit/35c37c2338326d16a653908d1e4feb7d894e13fb))
* **button:** accept the full xxs-xxl size scale ([7431465](https://github.com/nubisco/ui/commit/7431465bcc263c83b13876b0e9848d5b79b52a40))
* **Button:** add `to` prop for Vue Router navigation ([5ce6730](https://github.com/nubisco/ui/commit/5ce67307f5b88c8659c89b03554cb71c1e39f396))
* **charts:** add Bar, Line and Pie chart components with documentation ([a3e2e59](https://github.com/nubisco/ui/commit/a3e2e59aefdc08660ced0a784f45ff283bba0b53))
* **charts:** add NbSparkline component for inline dashboard charts ([4e7e3c4](https://github.com/nubisco/ui/commit/4e7e3c40e1fc6d263da78688bef0d920d8d71c21))
* **charts:** semantic colour roles, so a themed product is not stuck with our ramps ([7ab427c](https://github.com/nubisco/ui/commit/7ab427c05107a3a6c83494f38bc223465efbf59b))
* **checkbox:** align checkbox and radio with Carbon specs, add NbCheckboxGroup ([0db59c2](https://github.com/nubisco/ui/commit/0db59c27e137d486ee54584e1bd624a4800801df))
* **components:** add Menu system, MenuBar, and Command Palette ([d09db6e](https://github.com/nubisco/ui/commit/d09db6e2ba9ed0555009bffcd2beea110fa2e18a)), closes [#menubar](https://github.com/nubisco/ui/issues/menubar)
* **components:** add NbAccordion, NbCardGrid, NbDefinitionList, NbReorderList and NbEmptyState ([bf48a9b](https://github.com/nubisco/ui/commit/bf48a9b0279cf1fab25d74e5e8f2bed50577a72f))
* **components:** add NbBottomPanel, NbBlueprint, NbBlueprintCard ([f48c2b8](https://github.com/nubisco/ui/commit/f48c2b8a46986d84d265d15f91e13d3602a1f2a5)), closes [#bottom](https://github.com/nubisco/ui/issues/bottom) [#bottom](https://github.com/nubisco/ui/issues/bottom)
* **components:** add Tree and TreeNode components ([76c56b2](https://github.com/nubisco/ui/commit/76c56b26a13565e9407c08c85abdc893c756faca))
* **confirm:** NbConfirm and useConfirm(), one answer to "are you sure?" ([0d742a8](https://github.com/nubisco/ui/commit/0d742a81a42d3dc1fc40e43a0c9d2e7736185472))
* **data-table:** add NbDataTable and NbPagination components ([568c2d8](https://github.com/nubisco/ui/commit/568c2d84d989ef135b125d219e0390ee0e52f696))
* **data-table:** add opt-in `fill` prop for contained, internally-scrolling tables ([#6](https://github.com/nubisco/ui/issues/6)) ([a0b9fb4](https://github.com/nubisco/ui/commit/a0b9fb4e8880f33cb1bce5e4a5243fc2985903f7))
* **date-picker:** align with Carbon date picker guidelines ([de53772](https://github.com/nubisco/ui/commit/de53772069c7a9e078caae60999f406bc62170a4))
* distinguish focus vs selection, themeable marquee, cleaner selected state ([65cd1aa](https://github.com/nubisco/ui/commit/65cd1aa82a6ef50eeb3748c4c6102ce78f4bc0c1))
* **docs:** add design token pipeline and live token reference page ([52c324d](https://github.com/nubisco/ui/commit/52c324d23de3f64207edd888aa6bc90f80ca92c9))
* **docs:** add Plausible analytics for docs.nubisco.io ([a0fce43](https://github.com/nubisco/ui/commit/a0fce43e86de0066cfc9d14bf9d595281c8a14fb))
* evolve BlueprintCard with typed pins, collapse, status indicator ([749d126](https://github.com/nubisco/ui/commit/749d1267aa2939691f51f76f3995f8f304ac2cc3))
* **field:** add NbField labeled-row primitive + inspector treatment ([b66c02d](https://github.com/nubisco/ui/commit/b66c02d4a24aab1c3af97c45f2e364c65f16015a))
* **fields:** add xs size for dense surfaces ([dcf7a80](https://github.com/nubisco/ui/commit/dcf7a80033f47ae7b9f5c5debe6f2938f2fb1b42))
* **json-tree:** add NbJsonTree documentation page ([134ddea](https://github.com/nubisco/ui/commit/134ddea1b339ac819d9461561bfab37d0aef15ff))
* **loading:** NbSpinner, NbInlineLoading and NbSkeleton ([cb74171](https://github.com/nubisco/ui/commit/cb74171a731dfd82f379aee6d7ecd3a9c2f2c8a9))
* **message:** add a success variant ([c4cc1f6](https://github.com/nubisco/ui/commit/c4cc1f64f8085485a47572da447cc4d0ae9954b6))
* **modal:** add xl and immersive sizes for content-heavy dialogs ([12075d5](https://github.com/nubisco/ui/commit/12075d529c5b32c2aa24878c6683d9fdc230bbf0))
* **modal:** size now caps height as well as width, scale shifted up ([1bc0716](https://github.com/nubisco/ui/commit/1bc071606afaa4253ea45b288baaee0ee2c6f255))
* NbShell layout redesign — outer-menu, inner-menu, auto-hide sidebar ([56083d4](https://github.com/nubisco/ui/commit/56083d4592ca6d2c5504198fdfeae2804bd27edc))
* new nubisco analytics integration ([ed9ccb2](https://github.com/nubisco/ui/commit/ed9ccb2281a2d2f229a600ffc341374b23daca95))
* **notification-center:** NbNotificationCenter ([1dc2960](https://github.com/nubisco/ui/commit/1dc2960ac9d79f448995b6f9d89e5ef4b7a93fb5))
* **nubisco-mark:** ship the mark as a component and as a file ([5fa3c0d](https://github.com/nubisco/ui/commit/5fa3c0d92f3082bff10f8f16f935fd08a47f666d)), closes [#brand](https://github.com/nubisco/ui/issues/brand)
* **nubisco-platform-mark:** add the platform mark and put it in the lockup ([31edbce](https://github.com/nubisco/ui/commit/31edbce4f2496b5807b2bcecd7d6256325a86b0b))
* **onboarding:** add NbInfoHint and NbWalkthrough ([#7](https://github.com/nubisco/ui/issues/7)) ([4ab4fa2](https://github.com/nubisco/ui/commit/4ab4fa296798a5e42ab255dec94230730deb7de5))
* persistent marching-ants selection box, cards expand only on focus ([e79d535](https://github.com/nubisco/ui/commit/e79d53599b4e9c46eab246288d6db0f106c24a64))
* **progress-bar:** add NbProgressBar following Carbon guidelines ([feb38af](https://github.com/nubisco/ui/commit/feb38af91348d302ccdbcb8bd853b43c8afbf2b7))
* redesign Blueprint cards with top accent, structured rows, animated wires ([bb544e2](https://github.com/nubisco/ui/commit/bb544e26d2409a7bafa6b89e2ffbfa280e39fec1))
* render command palette shortcuts as individual keycaps, remove namespace pills ([d98c479](https://github.com/nubisco/ui/commit/d98c47958cc1748fa1d560edf15b0faf65b40f6f))
* **shell-panel:** dim the header of collapsed panels ([4315d63](https://github.com/nubisco/ui/commit/4315d63697699b0b73a7b1dfd82fca470ec73d65))
* **Shell:** add inspectorSize prop with xs, sm, md, lg, xl variants ([0dee3ed](https://github.com/nubisco/ui/commit/0dee3ed5c3ee0caef1de5b1df5ede93b16945b80))
* **shell:** add NbShell layout and NbSidebarLink navigation components ([e66ac2c](https://github.com/nubisco/ui/commit/e66ac2c5bdca3e9a171fa715282022ce05f744b1))
* **shell:** add notification slot and component documentation ([6dfda75](https://github.com/nubisco/ui/commit/6dfda754e35d759be981ff0ded8e772df8d1a360))
* **shell:** make the main region the page ground ([072d7c8](https://github.com/nubisco/ui/commit/072d7c81038cb39a48235585254c3918eca41d05)), closes [#e7e8e9](https://github.com/nubisco/ui/issues/e7e8e9)
* **shell:** render fixedbar from route slot and hide empty shell bar ([1683499](https://github.com/nubisco/ui/commit/168349956b5135d82b87b2a9bf74659c67b2cfcd))
* **shell:** resizable inspector ([b8f178d](https://github.com/nubisco/ui/commit/b8f178d4e17ef45b10fd17611f356fb406a1e735))
* **shell:** useShellSlot(), an empty topbar that hides, a panel that fills ([c0a8bf9](https://github.com/nubisco/ui/commit/c0a8bf957f069f85d752e4cbee8fb4763f05b32c))
* **slider:** round the readout to the step precision ([988bf8d](https://github.com/nubisco/ui/commit/988bf8dd4cf1cb4cae87cfa39cd8f380e5268cbc))
* split two-finger scroll (pan) from pinch-to-zoom ([fcb5ecd](https://github.com/nubisco/ui/commit/fcb5ecd570fad4282274d35b8439777ed4b2e5f9))
* **stepper:** NbStepper for linear flows ([b097ee2](https://github.com/nubisco/ui/commit/b097ee2ad5f664f45ce363185b22280ebedd16eb))
* **styles:** add .nb-inspector pattern for two-column inspectors ([6fda810](https://github.com/nubisco/ui/commit/6fda8105395cc6c6590f6018a71ef519170e96cc))
* **styles:** self-host default fonts via a configurable fonts() plugin ([3e4e425](https://github.com/nubisco/ui/commit/3e4e425299b8413e088039b76c814c13c6c4b485))
* **tabs:** add NbTabs with line and contained variants ([68fa32a](https://github.com/nubisco/ui/commit/68fa32aeef4ca42f8d87b7c51c3c913ab054c8a8))
* **theme:** add layer system for visual depth ([ad1bd8e](https://github.com/nubisco/ui/commit/ad1bd8e7a027b37ba9e5c827eb8e9f666686d01a))
* **theme:** add useTheme, the light/dark preference the apps were copying ([79891be](https://github.com/nubisco/ui/commit/79891be0f5ebc4783c3ab733c7a3ef3d9a1050c9))
* **theme:** cover the remaining surfaces, document the ramp, guard it in CI ([310e1bf](https://github.com/nubisco/ui/commit/310e1bfadfe51cdd097d0aa00e63c4d99c7c9adf))
* **theme:** derive layer depth from nesting instead of declaring it ([142b904](https://github.com/nubisco/ui/commit/142b904e3f06ed4c7a6cdc45ee9ebfb44547455b))
* **theme:** port, status and node-row tokens, plus a radius `none` step ([85fbb29](https://github.com/nubisco/ui/commit/85fbb298c9647c2e36a465f18ebb817fca37b9de))
* **toast:** NbToaster and useToast(), the host the docs said we would not ship ([563fbd9](https://github.com/nubisco/ui/commit/563fbd9166d6cc5be93c3d3fa4a273083af93a5f))
* **tooltip:** usable on any element, with a controlled mode ([2077e62](https://github.com/nubisco/ui/commit/2077e62fc1f2570ab82839102e735fe09a76c013))
* **types:** accept string literals on every template-facing prop ([03313b2](https://github.com/nubisco/ui/commit/03313b25235711dc205efdfef52c5f67dae7e65b))
* **user-menu:** sign the panel with the Nubisco Platform lockup ([e226111](https://github.com/nubisco/ui/commit/e2261113f4c8e8eff4a66b4d60ff0874cd6d9aff)), closes [#brand](https://github.com/nubisco/ui/issues/brand)
* **user-menu:** standardized ecosystem user menu ([f710cce](https://github.com/nubisco/ui/commit/f710cce3d858dece02450cbc7689a2fb5cd933c1))


### Performance Improvements

* **Blueprint:** cache port centre positions, invalidate per-card ([afeae6f](https://github.com/nubisco/ui/commit/afeae6f5dbf2ef735f3e16ae169a26d62d879f34)), closes [#2](https://github.com/nubisco/ui/issues/2)
* **Blueprint:** cache port DOM lookups + skip wireKey++ on pan ([a9e3233](https://github.com/nubisco/ui/commit/a9e32331add39901ed8e79259af05fe41753e707))
* **Blueprint:** cache resolveWireColor per port element ([17e2a7f](https://github.com/nubisco/ui/commit/17e2a7f7ab6a1a1a076738942f03b41dbfb1e661))
* **Blueprint:** cull off-screen wires and add windowed card rendering ([81ef1b2](https://github.com/nubisco/ui/commit/81ef1b21392165bb892f298b85c7e1d1c423345c))
* **Blueprint:** drop per-wire drop-shadow filter ([fe40de7](https://github.com/nubisco/ui/commit/fe40de70a94c0de1ffc42850d63d54c27151c5ea))
* **Blueprint:** GPU-promote the canvas during pan/zoom ([51e6989](https://github.com/nubisco/ui/commit/51e698928ff8ad82e6f8f94949fe80f946ac0a52))
* **Blueprint:** ignore in-card style mutations in the wire observer ([67edeb0](https://github.com/nubisco/ui/commit/67edeb0e16c073b12f50cad68c2279ac958de6e0))
* **Blueprint:** position cards via left/top, not transform ([9ba7dd7](https://github.com/nubisco/ui/commit/9ba7dd7fa2b05720c260c4649274116332e3e71b))
* **blueprint:** render a port as one element instead of three ([355b0fd](https://github.com/nubisco/ui/commit/355b0fdf646dc8ec3b1f8cdcd6f99a1f0baf78f9))


### Reverts

* Revert "feat(blueprint): wire + pin signal-activity visualisation" ([8c69c17](https://github.com/nubisco/ui/commit/8c69c1744eb9437f7f486d1a824321a3840fdfc6))


### BREAKING CHANGES

* **blueprint:** `TBlueprintPortShape` no longer includes `'diamond'`. It is
now `'pill' | 'square' | 'circle'`. A TypeScript consumer passing
`shape: 'diamond'` will fail to compile; at runtime the pin falls back to the
default pill. Use `signal` to express what a port carries, or `'square'` /
`'circle'` to separate a port from its immediate neighbours.
* every --nb-c-layer-*, --nb-c-text, --nb-c-text-muted,
--nb-c-field-bg and --nb-c-field-border value changes in dark. Consumers
overriding these should re-check their screens. --nb-c-bg and --nb-c-bg-soft
now follow layer 0 and layer 1 rather than carrying independent values.

Verify with: node scripts/audit-contrast.mjs

Claude-Session: https://claude.ai/code/session_01Y7TcyQomARVtzTXfRkYngD
* the light theme's layer direction is inverted. The page ground
is now the lightest surface and panels get progressively darker as they nest,
where previously the page was grey and panels were white. Consumers who set
--nb-c-layer-* or relied on the old direction should re-check their screens.
The alternative was tested: a variant preserving the old direction hit every
target and still lost a blind comparison, because alternation makes layer 2
identical to layer 0 and leaves deep nesting with no fill cue at all.

Verify with: node scripts/audit-contrast.mjs

Dark is unchanged here and lands separately.

Claude-Session: https://claude.ai/code/session_01Y7TcyQomARVtzTXfRkYngD

# [3.3.0](https://github.com/nubisco/ui/compare/v3.2.0...v3.3.0) (2026-09-04)


### Bug Fixes

* **button:** take the hover border from a semantic role, not a brand ramp ([98fdd72](https://github.com/nubisco/ui/commit/98fdd72b5aee62989809c614072e538cb97d3679))
* **exports:** NbAiLabel, NbFileUploader, NbForm and NbImageCropper were never exported ([243c473](https://github.com/nubisco/ui/commit/243c47372b6cd5b0a739a9d3c77ebeed7db5530e))
* **modal:** one counted page-scroll lock, shared by everything that locks ([ab8ab74](https://github.com/nubisco/ui/commit/ab8ab744da99e1431983fb9ed54c5c244b13cb0d))


### Features

* **charts:** semantic colour roles, so a themed product is not stuck with our ramps ([75493fb](https://github.com/nubisco/ui/commit/75493fb96ec55d63b4c939b8475de103760db343))
* **confirm:** NbConfirm and useConfirm(), one answer to "are you sure?" ([ed662fd](https://github.com/nubisco/ui/commit/ed662fd370eadf5716705ecbef203c483a3a8fc4))
* **loading:** NbSpinner, NbInlineLoading and NbSkeleton ([2073db7](https://github.com/nubisco/ui/commit/2073db7e2a497b578c025511ca86ac57ccb9afbe))
* **notification-center:** NbNotificationCenter ([e348971](https://github.com/nubisco/ui/commit/e348971be31b9efa8494a6cbf8bed324c9b90db4))
* **shell:** useShellSlot(), an empty topbar that hides, a panel that fills ([5e84c45](https://github.com/nubisco/ui/commit/5e84c451b1401601b3a8cbeab454326c2055c7c9))
* **stepper:** NbStepper for linear flows ([eeb7663](https://github.com/nubisco/ui/commit/eeb7663784e894fbd8f8a072b30561e21bb1f805))
* **toast:** NbToaster and useToast(), the host the docs said we would not ship ([c129aa9](https://github.com/nubisco/ui/commit/c129aa9a5b683b62a8dc0e7f0a9e345b28af7c4c))
* **tooltip:** usable on any element, with a controlled mode ([9a38936](https://github.com/nubisco/ui/commit/9a389361a96032a239b17a7b0953689cf293501a))

# [3.2.0](https://github.com/nubisco/ui/compare/v3.1.0...v3.2.0) (2026-09-03)


### Features

* **blueprint:** restore the three-element port ([3d61c03](https://github.com/nubisco/ui/commit/3d61c0393ac2fd97cc26a2c343c0844fc0263ffb))

# [3.1.0](https://github.com/nubisco/ui/compare/v3.0.3...v3.1.0) (2026-09-02)


### Features

* **components:** add NbAccordion, NbCardGrid, NbDefinitionList, NbReorderList and NbEmptyState ([c6218c9](https://github.com/nubisco/ui/commit/c6218c90de6177ed639bfedc916a7f6ad62f45c4))

## [3.0.3](https://github.com/nubisco/ui/compare/v3.0.2...v3.0.3) (2026-09-02)


### Bug Fixes

* **breadcrumbs:** no separator when the slot renders nothing ([8625ada](https://github.com/nubisco/ui/commit/8625ada42ccc8c1bf1bfd638a32ab755d50b34df))

## [3.0.2](https://github.com/nubisco/ui/compare/v3.0.1...v3.0.2) (2026-09-02)


### Bug Fixes

* **button:** an icon-only button is the same width as a link ([2c17109](https://github.com/nubisco/ui/commit/2c17109c27a26a398c7cc2ea5ecd483745104c27))

## [3.0.1](https://github.com/nubisco/ui/compare/v3.0.0...v3.0.1) (2026-09-02)


### Performance Improvements

* **blueprint:** render a port as one element instead of three ([6645bb4](https://github.com/nubisco/ui/commit/6645bb4c02dd0376fcddf0b8d03b889d9383ce7e))

# [3.0.0](https://github.com/nubisco/ui/compare/v2.9.0...v3.0.0) (2026-09-02)


### Features

* **blueprint:** drop the diamond pin shape ([a1c6371](https://github.com/nubisco/ui/commit/a1c63718791b32a11194249738722fa33931e733))


### BREAKING CHANGES

* **blueprint:** `TBlueprintPortShape` no longer includes `'diamond'`. It is
now `'pill' | 'square' | 'circle'`. A TypeScript consumer passing
`shape: 'diamond'` will fail to compile; at runtime the pin falls back to the
default pill. Use `signal` to express what a port carries, or `'square'` /
`'circle'` to separate a port from its immediate neighbours.

# [2.9.0](https://github.com/nubisco/ui/compare/v2.8.1...v2.9.0) (2026-09-02)


### Features

* **blueprint:** analog and digital ports, told apart by texture not shape ([141b764](https://github.com/nubisco/ui/commit/141b76410c012b75efed7560255ae8e170c910c8))

## [2.8.1](https://github.com/nubisco/ui/compare/v2.8.0...v2.8.1) (2026-09-02)


### Bug Fixes

* **blueprint:** make live pins readable and stop them erasing the meter ([4d1a666](https://github.com/nubisco/ui/commit/4d1a666db264622e6db1779a12ca08e2b16876e1))

# [2.8.0](https://github.com/nubisco/ui/compare/v2.7.0...v2.8.0) (2026-09-02)


### Bug Fixes

* **blueprint:** grow a card to contain its own port column ([386e8a3](https://github.com/nubisco/ui/commit/386e8a3952d50976d60e887606819a324078559b))


### Features

* **blueprint:** move ports outside the card and anchor wires to the pin ([b43fe5b](https://github.com/nubisco/ui/commit/b43fe5bb631816bdfce95c70b3672f84d6352582))
* **theme:** port, status and node-row tokens, plus a radius `none` step ([27c99c9](https://github.com/nubisco/ui/commit/27c99c939459e75aba203e4e2081775f727e18d9))

# [2.7.0](https://github.com/nubisco/ui/compare/v2.6.0...v2.7.0) (2026-09-01)


### Bug Fixes

* **banner:** centre the row when it carries action controls ([cf80c18](https://github.com/nubisco/ui/commit/cf80c183ae679460aa6f1350066363041315f566))
* **banner:** status bar, filled icons, and a close button that is not purple ([9569b8b](https://github.com/nubisco/ui/commit/9569b8b060fa289ab780755441bf683885d1654d))
* **banner:** stop the host's paragraph styles inflating the body ([5a79f77](https://github.com/nubisco/ui/commit/5a79f771270090757703b9c640bb60566a2838a9))


### Features

* **banner:** add NbBanner, the page-level message the shell had no component for ([5ac0aa1](https://github.com/nubisco/ui/commit/5ac0aa12a0e0024e9739a251aedb95071be15b21)), closes [#notification](https://github.com/nubisco/ui/issues/notification) [#fef3c7](https://github.com/nubisco/ui/issues/fef3c7) [#92400e](https://github.com/nubisco/ui/issues/92400e)
* **theme:** add useTheme, the light/dark preference the apps were copying ([3081395](https://github.com/nubisco/ui/commit/3081395ff96da04373572b67abedc03679ec11ee))

# [2.6.0](https://github.com/nubisco/ui/compare/v2.5.0...v2.6.0) (2026-09-01)


### Features

* **shell:** make the main region the page ground ([86bf3bb](https://github.com/nubisco/ui/commit/86bf3bb4965d1365b3092e8cbb1918c9c7f59d16)), closes [#e7e8e9](https://github.com/nubisco/ui/issues/e7e8e9)

# [2.5.0](https://github.com/nubisco/ui/compare/v2.4.0...v2.5.0) (2026-09-01)


### Features

* **modal:** add xl and immersive sizes for content-heavy dialogs ([18347bf](https://github.com/nubisco/ui/commit/18347bfa08f8e7dbfe7eca9fa0b96c703b885382))

# [2.4.0](https://github.com/nubisco/ui/compare/v2.3.0...v2.4.0) (2026-09-01)


### Features

* **nubisco-platform-mark:** add the platform mark and put it in the lockup ([bb382f4](https://github.com/nubisco/ui/commit/bb382f40cdefc43e8579ec4e822e712410fdc89d))

# [2.3.0](https://github.com/nubisco/ui/compare/v2.2.0...v2.3.0) (2026-09-01)


### Bug Fixes

* **user-menu:** square the panel and run its rows edge to edge ([39e66ab](https://github.com/nubisco/ui/commit/39e66ab356225eb924f5807bd31d18585186ad1c))


### Features

* **nubisco-mark:** ship the mark as a component and as a file ([edc6409](https://github.com/nubisco/ui/commit/edc6409bdc3a5c86cb9e2ec40c79ed9ea4c5d650)), closes [#brand](https://github.com/nubisco/ui/issues/brand)

# [2.2.0](https://github.com/nubisco/ui/compare/v2.1.0...v2.2.0) (2026-09-01)


### Features

* **user-menu:** sign the panel with the Nubisco Platform lockup ([7710198](https://github.com/nubisco/ui/commit/7710198c3830e3f16ef8df45a9fc38fdd8b035d8)), closes [#brand](https://github.com/nubisco/ui/issues/brand)

# [2.1.0](https://github.com/nubisco/ui/compare/v2.0.1...v2.1.0) (2026-08-31)


### Features

* **onboarding:** add NbInfoHint and NbWalkthrough ([#7](https://github.com/nubisco/ui/issues/7)) ([814f87e](https://github.com/nubisco/ui/commit/814f87e27776356d7d9b829e10fc3eb1ced9e5f1))

## [2.0.1](https://github.com/nubisco/ui/compare/v2.0.0...v2.0.1) (2026-08-30)


### Bug Fixes

* **build:** stop publishing sourcemaps and verify the release is installable ([caa6fcf](https://github.com/nubisco/ui/commit/caa6fcf26a98b73d190c87c099bc5bf4c0aa5f27))

# [2.0.0](https://github.com/nubisco/ui/compare/v1.61.0...v2.0.0) (2026-08-30)


* fix(theme)!: rebuild the dark layer ramp for AAA on every surface ([8febc45](https://github.com/nubisco/ui/commit/8febc455abd4c0698eef83b5f25465a2c03488b5)), closes [#6f6f6f](https://github.com/nubisco/ui/issues/6f6f6f) [#5e5e5e](https://github.com/nubisco/ui/issues/5e5e5e)
* fix(theme)!: rebuild the light layer ramp for AAA on every surface ([fa17d38](https://github.com/nubisco/ui/commit/fa17d381120f6b3101ad4490260ace8362cb4d21))


### Features

* **theme:** cover the remaining surfaces, document the ramp, guard it in CI ([80749c0](https://github.com/nubisco/ui/commit/80749c0d2d525cf4be83bcd407a492566063f073))
* **theme:** derive layer depth from nesting instead of declaring it ([b7aa84a](https://github.com/nubisco/ui/commit/b7aa84a48d959e4adc3a09f44f745e180aef0c93))


### BREAKING CHANGES

* every --nb-c-layer-*, --nb-c-text, --nb-c-text-muted,
--nb-c-field-bg and --nb-c-field-border value changes in dark. Consumers
overriding these should re-check their screens. --nb-c-bg and --nb-c-bg-soft
now follow layer 0 and layer 1 rather than carrying independent values.

Verify with: node scripts/audit-contrast.mjs

Claude-Session: https://claude.ai/code/session_01Y7TcyQomARVtzTXfRkYngD
* the light theme's layer direction is inverted. The page ground
is now the lightest surface and panels get progressively darker as they nest,
where previously the page was grey and panels were white. Consumers who set
--nb-c-layer-* or relied on the old direction should re-check their screens.
The alternative was tested: a variant preserving the old direction hit every
target and still lost a blind comparison, because alternation makes layer 2
identical to layer 0 and leaves deep nesting with no fill cue at all.

Verify with: node scripts/audit-contrast.mjs

Dark is unchanged here and lands separately.

Claude-Session: https://claude.ai/code/session_01Y7TcyQomARVtzTXfRkYngD

# [1.61.0](https://github.com/nubisco/ui/compare/v1.60.2...v1.61.0) (2026-08-27)


### Features

* **data-table:** add opt-in `fill` prop for contained, internally-scrolling tables ([#6](https://github.com/nubisco/ui/issues/6)) ([cbf5f83](https://github.com/nubisco/ui/commit/cbf5f836ec78b8581922bf67b8299e7b734091f7))

## [1.60.2](https://github.com/nubisco/ui/compare/v1.60.1...v1.60.2) (2026-08-27)


### Bug Fixes

* **release:** republish after stuck npm ingestion ([aaa347d](https://github.com/nubisco/ui/commit/aaa347ddf3bb235a801358f9f4e33b51cebf37b2))

## [1.60.1](https://github.com/nubisco/ui/compare/v1.60.0...v1.60.1) (2026-08-27)


### Bug Fixes

* **forms:** normalize label-to-field gap across form controls ([#5](https://github.com/nubisco/ui/issues/5)) ([09dec28](https://github.com/nubisco/ui/commit/09dec28cfa625a4453b142ccf5ce70d8a2a0fcb4))

# [1.60.0](https://github.com/nubisco/ui/compare/v1.59.1...v1.60.0) (2026-08-20)


### Features

* **tabs:** add NbTabs with line and contained variants ([cd5d1a7](https://github.com/nubisco/ui/commit/cd5d1a76ed811f5ba447a0539067be4d7fd722f9))

## [1.59.1](https://github.com/nubisco/ui/compare/v1.59.0...v1.59.1) (2026-08-16)


### Bug Fixes

* **shell:** stop empty slot wrappers from doubling the header rule ([450b7cd](https://github.com/nubisco/ui/commit/450b7cd1812d98367a06559cf6e979cf60ecc002))

# [1.59.0](https://github.com/nubisco/ui/compare/v1.58.0...v1.59.0) (2026-08-15)


### Features

* **blueprint:** add getCamera / setCamera ([4ef3023](https://github.com/nubisco/ui/commit/4ef3023a909784f1cca6738751a26ee4ae686c38))

# [1.58.0](https://github.com/nubisco/ui/compare/v1.57.1...v1.58.0) (2026-08-14)


### Features

* **blueprint:** let fitToView frame a subset of cards ([fb30cb5](https://github.com/nubisco/ui/commit/fb30cb5d433f5d186b60d67fbeaa9cda04f4a5a1))

## [1.57.1](https://github.com/nubisco/ui/compare/v1.57.0...v1.57.1) (2026-08-14)


### Bug Fixes

* **blueprint:** don't deselect when the mousedown lands on chrome ([712c374](https://github.com/nubisco/ui/commit/712c374f1e6d56774900fc3da9fcb3f57cf4c2d7)), closes [#chrome](https://github.com/nubisco/ui/issues/chrome)

# [1.57.0](https://github.com/nubisco/ui/compare/v1.56.1...v1.57.0) (2026-08-10)


### Features

* **message:** add a success variant ([6b6f78e](https://github.com/nubisco/ui/commit/6b6f78eb58c10d2d6ec21b0be130170e952205d9))

## [1.56.1](https://github.com/nubisco/ui/compare/v1.56.0...v1.56.1) (2026-08-10)


### Bug Fixes

* **types:** emit the global augmentation as GlobalComponents ([26fa757](https://github.com/nubisco/ui/commit/26fa7578a427797bae8b28d3302b5d01bf27dd77))

# [1.56.0](https://github.com/nubisco/ui/compare/v1.55.0...v1.56.0) (2026-08-09)


### Features

* **types:** accept string literals on every template-facing prop ([3227f93](https://github.com/nubisco/ui/commit/3227f933a7d9f30885cf4a9253ab30721c134988))

# [1.55.0](https://github.com/nubisco/ui/compare/v1.54.0...v1.55.0) (2026-08-09)


### Features

* **button:** accept the full xxs-xxl size scale ([ae52210](https://github.com/nubisco/ui/commit/ae522104a705f4a3e94a7fc5bba50eab156a46d0))

# [1.54.0](https://github.com/nubisco/ui/compare/v1.53.2...v1.54.0) (2026-08-05)


### Features

* **blueprint:** add NbBlueprintBackground component and #background slot ([40a3c2e](https://github.com/nubisco/ui/commit/40a3c2e77d8a84cb85ede42798b4668bb2f0f565)), closes [#background](https://github.com/nubisco/ui/issues/background) [#background](https://github.com/nubisco/ui/issues/background)

## [1.53.2](https://github.com/nubisco/ui/compare/v1.53.1...v1.53.2) (2026-08-02)


### Bug Fixes

* **treenode:** change direction of chevrons on folders ([67722a4](https://github.com/nubisco/ui/commit/67722a436fd5176e2c0d648f0a4f6650d3e6cf3b))

## [1.53.1](https://github.com/nubisco/ui/compare/v1.53.0...v1.53.1) (2026-07-30)


### Bug Fixes

* **types:** ship the hand-written declaration modules ([d5b72ad](https://github.com/nubisco/ui/commit/d5b72ad12840ec3646dc7834afb0c8e0dbeb588a))

# [1.53.0](https://github.com/nubisco/ui/compare/v1.52.0...v1.53.0) (2026-07-29)


### Bug Fixes

* **text-input:** keep a multiline field within its container ([b52a3b4](https://github.com/nubisco/ui/commit/b52a3b4b9576ce584eccf413123b739f6aacf853))


### Features

* **field:** add NbField labeled-row primitive + inspector treatment ([62a8064](https://github.com/nubisco/ui/commit/62a8064154c4fb167b7a48936e244962266bd71d))

# [1.52.0](https://github.com/nubisco/ui/compare/v1.51.0...v1.52.0) (2026-07-29)


### Bug Fixes

* **shell-panel:** dim panels squeezed to header-only by a maximized sibling ([803fba8](https://github.com/nubisco/ui/commit/803fba8ecc52a33a6e5f265d496023fa7d14b3d8))
* **styles:** scope .nb-inspector two-column rows to labeled fields ([876f8f5](https://github.com/nubisco/ui/commit/876f8f5a16004777644f68499ff55a7b7951f15f))


### Features

* **shell:** resizable inspector ([121a6b6](https://github.com/nubisco/ui/commit/121a6b65e269ab0ef18eb98475c827dc512c9ba2))
* **slider:** round the readout to the step precision ([9cb8d34](https://github.com/nubisco/ui/commit/9cb8d34a60687eab47eb1e81e7b0d349dc276ea3))

# [1.51.0](https://github.com/nubisco/ui/compare/v1.50.0...v1.51.0) (2026-07-29)


### Features

* **styles:** add .nb-inspector pattern for two-column inspectors ([feb2648](https://github.com/nubisco/ui/commit/feb26487661d0f2dccd81c25dab479561ff31309))

# [1.50.0](https://github.com/nubisco/ui/compare/v1.49.0...v1.50.0) (2026-07-29)


### Bug Fixes

* **data-table:** align with Carbon, drop invented controls, stop reflow ([ed7e16e](https://github.com/nubisco/ui/commit/ed7e16e875d232972d11eb892b5de3e86e3d248a))


### Features

* **data-table:** add NbDataTable and NbPagination components ([c889ec7](https://github.com/nubisco/ui/commit/c889ec752b946ba54f7335a071189f3be2b41f46))

# [1.49.0](https://github.com/nubisco/ui/compare/v1.48.2...v1.49.0) (2026-07-29)


### Features

* **fields:** add xs size for dense surfaces ([089b5d0](https://github.com/nubisco/ui/commit/089b5d0ad71d1f582c50f5021b360372a2b27e16))
* **shell-panel:** dim the header of collapsed panels ([062df98](https://github.com/nubisco/ui/commit/062df9869ee3969a1ecf053f924a6e59767042f1))

## [1.48.2](https://github.com/nubisco/ui/compare/v1.48.1...v1.48.2) (2026-07-25)


### Bug Fixes

* **tooltip:** stop orphan chips and per-render forced layout ([167d244](https://github.com/nubisco/ui/commit/167d244e7c1adc6646c3c02cfe3b160c480856f9))

## [1.48.1](https://github.com/nubisco/ui/compare/v1.48.0...v1.48.1) (2026-07-21)


### Bug Fixes

* **blueprint:** run the vibrate wire wave source-to-dest at a fixed wavelength ([9c4d406](https://github.com/nubisco/ui/commit/9c4d406e6e0e66582f3d20dce5e2bd2c4133f239))

# [1.48.0](https://github.com/nubisco/ui/compare/v1.47.1...v1.48.0) (2026-07-20)


### Features

* **user-menu:** standardized ecosystem user menu ([693ed7f](https://github.com/nubisco/ui/commit/693ed7f21018f7fb03ca7cdc5392af41fbfe8dfe))

## [1.47.1](https://github.com/nubisco/ui/compare/v1.47.0...v1.47.1) (2026-07-20)


### Bug Fixes

* **blueprint:** keep selection box glued to cards during pan/zoom ([b454160](https://github.com/nubisco/ui/commit/b454160039a8e0ebba8816915b01e0bf51051ed6))

# [1.47.0](https://github.com/nubisco/ui/compare/v1.46.0...v1.47.0) (2026-07-13)


### Features

* **date-picker:** align with Carbon date picker guidelines ([0d33ff2](https://github.com/nubisco/ui/commit/0d33ff242a1a0f2d6b6abd2ca026a77e910eaf45))

# [1.46.0](https://github.com/nubisco/ui/compare/v1.45.1...v1.46.0) (2026-07-11)


### Features

* **blueprint:** port signal-flow auto-layout into the library ([9410b62](https://github.com/nubisco/ui/commit/9410b62c02c8230eea6d365455c03a9bcf7983f8))

## [1.45.1](https://github.com/nubisco/ui/compare/v1.45.0...v1.45.1) (2026-07-10)


### Bug Fixes

* **blueprint:** require pixi.js peer + shape the port ping like the pin ([38c33f7](https://github.com/nubisco/ui/commit/38c33f7c006a66b84ee3c125e5c07a93e4ed2d19))

# [1.45.0](https://github.com/nubisco/ui/compare/v1.44.0...v1.45.0) (2026-07-10)


### Bug Fixes

* **blueprint:** activity gated on real signal; separate levels from activity ([3b2e803](https://github.com/nubisco/ui/commit/3b2e803b91e11834910eb405a47b093b70becee3))
* **blueprint:** compositor-only port glow (was animating box-shadow) ([6a27fce](https://github.com/nubisco/ui/commit/6a27fce078132126b347c2314ec3fcd82b54e26c))
* **blueprint:** port signal = compositor-only ping (not box-shadow); align >9-port labels ([2e2b8ec](https://github.com/nubisco/ui/commit/2e2b8ec8b9f2c4c97a9fbb981bfab0eeaacaa91e))
* **blueprint:** stop text/element selection on the canvas ([cf67759](https://github.com/nubisco/ui/commit/cf6775978cf6bf1b154bc7dd0f2bf2b8a98db56e))
* **blueprint:** tighter/faster vibrate; reset wire shape on style/mode switch ([daa4b8e](https://github.com/nubisco/ui/commit/daa4b8e2c09b8c9700cfa190d93972aa7a718d6b))


### Features

* **blueprint:** port glow means live signal, not just connected ([31bb53d](https://github.com/nubisco/ui/commit/31bb53d038e2ff714d232cb188fc84e2f1bb55ab))
* **blueprint:** selectable activity styles (flow / pulse / vibrate) ([83af833](https://github.com/nubisco/ui/commit/83af8333de5b1c4239552ec02bb49c9933a90fcd))

# [1.45.0](https://github.com/nubisco/ui/compare/v1.44.0...v1.45.0) (2026-07-10)


### Bug Fixes

* **blueprint:** activity gated on real signal; separate levels from activity ([3b2e803](https://github.com/nubisco/ui/commit/3b2e803b91e11834910eb405a47b093b70becee3))
* **blueprint:** compositor-only port glow (was animating box-shadow) ([6a27fce](https://github.com/nubisco/ui/commit/6a27fce078132126b347c2314ec3fcd82b54e26c))
* **blueprint:** port signal = compositor-only ping (not box-shadow); align >9-port labels ([2e2b8ec](https://github.com/nubisco/ui/commit/2e2b8ec8b9f2c4c97a9fbb981bfab0eeaacaa91e))
* **blueprint:** stop text/element selection on the canvas ([cf67759](https://github.com/nubisco/ui/commit/cf6775978cf6bf1b154bc7dd0f2bf2b8a98db56e))
* **blueprint:** tighter/faster vibrate; reset wire shape on style/mode switch ([daa4b8e](https://github.com/nubisco/ui/commit/daa4b8e2c09b8c9700cfa190d93972aa7a718d6b))


### Features

* **blueprint:** port glow means live signal, not just connected ([31bb53d](https://github.com/nubisco/ui/commit/31bb53d038e2ff714d232cb188fc84e2f1bb55ab))
* **blueprint:** selectable activity styles (flow / pulse / vibrate) ([83af833](https://github.com/nubisco/ui/commit/83af8333de5b1c4239552ec02bb49c9933a90fcd))

# [1.44.0](https://github.com/nubisco/ui/compare/v1.43.0...v1.44.0) (2026-07-07)


### Features

* **modal:** size now caps height as well as width, scale shifted up ([60ac86d](https://github.com/nubisco/ui/commit/60ac86dd73ff3bb8c5c7fdcc1b1028d909100b2e))

# [1.43.0](https://github.com/nubisco/ui/compare/v1.42.0...v1.43.0) (2026-07-07)


### Features

* **progress-bar:** add NbProgressBar following Carbon guidelines ([444a7d1](https://github.com/nubisco/ui/commit/444a7d1ba1b7f3119bb0d6d5d9f9981f026e766b))

# [1.42.0](https://github.com/nubisco/ui/compare/v1.41.1...v1.42.0) (2026-07-07)


### Features

* **checkbox:** align checkbox and radio with Carbon specs, add NbCheckboxGroup ([9819c16](https://github.com/nubisco/ui/commit/9819c1691716628a40f49c3f56842002f09a228a))

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
