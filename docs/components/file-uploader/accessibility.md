---
layout: nubisco
title: File Uploader
intro: '`NbFileUploader` lets users select or drag files into your app. It replaces the native `<input type="file">` with a consistent, accessible widget that includes heading, description, upload states (loading, success, error), and drag-and-drop support.'
source: src/components/FileUploader.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The trigger is a real `NbButton`, so it is reached with Tab and activated
  with Enter or Space. It opens the native file picker, which the browser and
  assistive technology already know how to drive.
- Each file row has a remove button labelled `Remove <file name>`.
- While `disabled`, the trigger, the file input and the remove buttons are
  natively disabled. They leave the tab order and are announced as
  unavailable, and a drop does nothing.
