---
layout: nubisco
title: Banner
intro: '`NbBanner` is a page-level message: a filled block that states something about the page or the task, sitting above or at the top of the content it concerns.'
source: src/components/Banner.vue
tab: usage
pageTabs: ['usage', 'code']
---

It is the third of three things that look superficially alike, and picking the wrong one is the usual mistake:

| Use         | When                                                               |
| ----------- | ------------------------------------------------------------------ |
| `NbBanner`  | Something is true about this page or task, and it stays on screen. |
| `NbMessage` | A single form field has something to say about its own value.      |
| `NbToast`   | Something just happened, and the news expires by itself.           |

<preview>
  <div class="banner-stack">
    <NbBanner status="info" title="Draft saved">Visitors still see the published version.</NbBanner>
    <NbBanner status="success" title="Published">All 20 routes are serving this release.</NbBanner>
    <NbBanner status="warning" title="Rebuild queued but NOT confirmed">A hook accepted is the start of a build, not the end of one.</NbBanner>
    <NbBanner status="error" title="The rebuild did not reach the live site">Content is live in the API and the site still serves the old HTML.</NbBanner>
    <NbBanner status="neutral" title="Read-only">You have viewer access to this site.</NbBanner>
  </div>
</preview>

```vue
<template>
  <NbBanner status="warning" title="Rebuild queued but NOT confirmed">
    A hook accepted is the start of a build, not the end of one.
  </NbBanner>
</template>
```

## Writing the message

Follow the same discipline the status colours imply. Say what happened in the `title`, without a full stop, and what to do about it in the body.

- **Do**: `title="Rebuild not confirmed"`, body `The content is live in the API; the site may still serve old HTML.`
- **Don't**: `title="Warning!"`, body `Something went wrong. Please try again.`

Never use colour as the only signal. Every status ships an icon for exactly this reason, and `hideIcon` should be reserved for banners whose meaning is already unambiguous from the text.

<!--@include: ./_shared.md-->
