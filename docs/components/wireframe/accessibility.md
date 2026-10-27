---
layout: nubisco
title: Wireframe
intro: '`NbWireframe` draws a schematic thumbnail of a layout: bars for copy, pills for buttons, boxes for media, on a 12-column grid. Use it where someone has to pick a layout before it exists, such as a block picker or a template gallery. A name and a description cannot show a shape at a glance, and a wireframe can.'
source: src/components/Wireframe.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

Without a `label` the wireframe is decorative (`aria-hidden`). With one it is an image with that name. Give it a label when nothing next to it already names the layout.
