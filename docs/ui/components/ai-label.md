---
layout: nubisco
title: AI Label
tabs: ['Usage']
---

<doc-tab name="Usage">

The AI Label should be present whenever there's Artificial Inteligence content in the UI. Being it a modified string, or any other element which resulted from direct AI influence.

## Live Demo

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbAiLabel v-bind="resultingProps" />
</preview>

::: code-group

```js [config.js]
/**
 * @type {import('vitepress').UserConfig}
 */
const config = {
  // ...
}

export default config
```

```ts [config.ts]
import type { UserConfig } from 'vitepress'

const config: UserConfig = {
  // ...
}

export default config
```

:::

> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action.

</doc-tab>

<script lang="ts" setup>
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const availableProps: PreviewPropDef[] = [
  {
    name: 'variant',
    type: 'single',
    label: 'Variant',
    placeholder: 'Variant of the component',
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'inline', label: 'Inline' },
    ],
  },
]
</script>
