---
layout: nubisco
title: File Uploader
tabs: ['Usage']
---

<doc-tab name="Usage">

`NbFileUploader` lets users select or drag files into your app. It replaces the native `<input type="file">` with a consistent, accessible widget that includes heading, description, upload states (loading, success, error), and drag-and-drop support.

The color accent follows the `variant` prop, which maps directly to `NbButton` variants, so the button, drop zone, and status icons all stay visually coherent.

## Basic Usage

<preview>
  <div class="demo-container">
    <NbFileUploader
      heading="Upload files"
      description="Max file size is 500 KB. Supported file types are .jpg, .png, and .pdf."
      button-label="Add file"
      accept=".jpg,.png,.pdf"
      :max-size="512000"
    />
  </div>
</preview>

```vue
<template>
  <NbFileUploader
    heading="Upload files"
    description="Max file size is 500 KB. Supported file types are .jpg, .png, and .pdf."
    button-label="Add file"
    accept=".jpg,.png,.pdf"
    :max-size="512000"
  />
</template>
```

## Variants

The `variant` prop sets the accent color on the button and the drag-over drop zone. Every NbButton variant is supported.

<preview>
  <div class="demo-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
    <NbFileUploader heading="Primary (default)" button-label="Add file" variant="primary" />
    <NbFileUploader heading="Danger" button-label="Add file" variant="danger" />
    <NbFileUploader heading="Success" button-label="Upload" variant="success" />
  </div>
</preview>

```vue
<template>
  <NbFileUploader variant="primary" button-label="Add file" />
  <NbFileUploader variant="danger" button-label="Add file" />
  <NbFileUploader variant="success" button-label="Upload" />
</template>
```

## Multiple Files

Set `multiple` to allow selecting more than one file at a time.

```vue
<template>
  <NbFileUploader multiple button-label="Add files" />
</template>
```

## Drag and Drop

Dragging any file over the component reveals the drop zone: a dashed bordered area with a prompt to drop. Releasing the file triggers the same validation and file-list logic as clicking the button.

The drop zone accent color matches the active `variant`.

## File States

Each file in the list can be in one of three states, controlled via the `setFileStatus` method on the component instance:

| State     | Visual                              |
| --------- | ----------------------------------- |
| `idle`    | Filename with X to remove           |
| `loading` | Animated spinner (no remove button) |
| `success` | Filled checkmark icon               |

Validation errors (size, type) are shown immediately on drop/select with a red border and error message below the filename.

```vue
<template>
  <NbFileUploader ref="uploader" button-label="Add file" :max-size="512000" />
</template>
```

```ts
// After starting your upload request:
uploader.value.setFileStatus(0, 'loading')

// On success:
uploader.value.setFileStatus(0, 'success')

// On server-side error:
uploader.value.setFileStatus(0, 'idle', 'Upload failed. Please try again.')
```

## Validation

Client-side validation runs automatically on file select and drop:

- **maxSize** - rejects files larger than the specified number of bytes.
- **accept** - rejects files whose extension does not match the accept string.

Rejected files are still added to the list with an error state so the user can see what went wrong and remove them.

```vue
<template>
  <NbFileUploader accept=".jpg,.png" :max-size="204800" />
</template>
```

</doc-tab>

<doc-tab name="Api">

## Events

| Event    | Payload  | Description                                             |
| -------- | -------- | ------------------------------------------------------- |
| `change` | `File[]` | Emitted after any file add or remove (valid files only) |
| `remove` | `File`   | Emitted when a file is removed from the list            |

```vue
<template>
  <NbFileUploader @change="onFilesChanged" @remove="onFileRemoved" />
</template>
```

## Props

| Prop          | Type                                                                        | Default      | Description                                  |
| ------------- | --------------------------------------------------------------------------- | ------------ | -------------------------------------------- |
| `heading`     | `string`                                                                    | -            | Bold heading above the component             |
| `description` | `string`                                                                    | -            | Helper text with a left border accent        |
| `buttonLabel` | `string`                                                                    | `'Add file'` | Label for the upload trigger button          |
| `variant`     | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'success' \| 'warning'` | `'primary'`  | Accent color from NbButton variants          |
| `accept`      | `string`                                                                    | -            | Native `accept` attribute (e.g. `.jpg,.pdf`) |
| `multiple`    | `boolean`                                                                   | `false`      | Allow selecting multiple files               |
| `maxSize`     | `number`                                                                    | -            | Max file size in bytes for client validation |

## Exposed

| Name            | Type                              | Description                            |
| --------------- | --------------------------------- | -------------------------------------- |
| `files`         | `Ref<FileItem[]>`                 | Reactive list of file items            |
| `setFileStatus` | `(index, status, error?) => void` | Programmatically update a file's state |

</doc-tab>
