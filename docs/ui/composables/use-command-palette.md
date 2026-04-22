---
layout: nubisco
title: useCommandPalette
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`useCommandPalette` is a composable that provides access to the command palette state. It requires `NbCommandPalettePlugin` to be installed on the Vue app.

See the [Command Palette component docs](/ui/components/command-palette) for full setup instructions and usage examples.

## Quick start

```ts
import { createApp } from 'vue'
import { NbCommandPalettePlugin } from '@nubisco/ui'

const app = createApp(App)
app.use(NbCommandPalettePlugin)
```

Then in any component:

```vue
<script setup>
import { useCommandPalette } from '@nubisco/ui'

const palette = useCommandPalette()

palette.register({
  id: 'app.settings',
  label: 'Open Settings',
  icon: 'gear',
  namespace: 'Application',
  shortcut: 'Cmd+,',
  handler: () => router.push('/settings'),
})
</script>
```

## Cleanup

Commands are stored globally. If a component that registered commands is unmounted and the commands should no longer be available, call `unregister` in `onBeforeUnmount`.

```vue
<script setup>
import { onBeforeUnmount } from 'vue'
import { useCommandPalette } from '@nubisco/ui'

const palette = useCommandPalette()

palette.register({ id: 'editor.save', label: 'Save', handler: save })

onBeforeUnmount(() => {
  palette.unregister('editor.save')
})
</script>
```

</doc-tab>

<doc-tab name="Api">

## Return value

See the [Command Palette API tab](/ui/components/command-palette) for the full API reference including `ICommand` shape and all methods.

| Method         | Signature                                | Description                |
| -------------- | ---------------------------------------- | -------------------------- |
| `register`     | `(command: ICommand) => void`            | Register a single command  |
| `registerMany` | `(commands: ICommand[]) => void`         | Register multiple commands |
| `unregister`   | `(id: string) => void`                   | Remove a command by ID     |
| `open`         | `(filter?: string) => void`              | Open the palette           |
| `close`        | `() => void`                             | Close the palette          |
| `setContext`   | `(context: string \| undefined) => void` | Set active context         |

| Property        | Type                    | Description             |
| --------------- | ----------------------- | ----------------------- |
| `commands`      | `Map<string, ICommand>` | All registered commands |
| `isOpen`        | `boolean`               | Palette visibility      |
| `activeContext` | `string \| undefined`   | Active context filter   |

</doc-tab>
