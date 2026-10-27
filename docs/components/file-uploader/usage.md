---
layout: nubisco
title: File Uploader
intro: '`NbFileUploader` lets users select or drag files into your app. It replaces the native `<input type="file">` with a consistent, accessible widget that includes heading, description, upload states (loading, success, error), and drag-and-drop support.'
source: src/components/FileUploader.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

The color accent follows the `variant` prop, which maps directly to `NbButton` variants, so the button, drop zone, and status icons all stay visually coherent.

## Live demo

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

## Drag and Drop

Dragging any file over the component reveals the drop zone: a dashed bordered area with a prompt to drop. Releasing the file triggers the same validation and file-list logic as clicking the button.

The drop zone accent color matches the active `variant`.
