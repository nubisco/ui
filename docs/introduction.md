# Introduction

## The Nubisco UI Component Library

Welcome to **Nubisco UI**.

Nubisco UI is a Vue 3 component library focused on accessibility, predictable APIs, and practical styling customization.

## Key Features

- Accessible, production-ready components
- TypeScript-first APIs
- SCSS tokens for theme customization
- Tree-shakeable imports
- Responsive grid utilities

## Quick Example

<ClientOnly>
  <div class="demo-preview">
    <NbPanel style="padding: 16px;">
      <h3>Welcome</h3>
      <p>Build consistent interfaces with simple components.</p>
      <NbButton variant="primary">Primary Action</NbButton>
    </NbPanel>
  </div>
</ClientOnly>

## Components

Explore the component library:

- [**Modal**](/ui/components/modal) - Dialogs and overlays
- [**Panel**](/ui/components/panel) - Surface containers for content grouping
- [**Message**](/ui/components/message) - Contextual feedback blocks

## Design Philosophy

The goal is a library that is easy to adopt and easy to maintain:

- **Clear contracts**: explicit props and events
- **Composability**: components work well together
- **A11y by default**: keyboard and screen reader support
- **Customization**: use your own tokens and brand styles

## Explore More

<div class="feature-grid">
  <a href="/ui/components/modal" class="feature-card">
    <h3>Modal</h3>
    <p>Dialogs with slots for header, body, and footer.</p>
  </a>

  <a href="/ui/components/panel" class="feature-card">
    <h3>Panel</h3>
    <p>Simple surface wrappers for grouping content.</p>
  </a>

  <a href="/ui/components/message" class="feature-card">
    <h3>Message</h3>
    <p>Helper, warning, and error messaging patterns.</p>
  </a>
</div>

---

Check the component pages for interactive examples and API details.

<style scoped>
.demo-preview {
  margin: 2rem 0;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 12px;
}

.demo-preview h3 {
  margin-top: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.feature-card {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}

.feature-card:hover {
  border-color: var(--vp-c-brand);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin-top: 0;
  color: var(--vp-c-brand);
}

.feature-card p {
  margin-bottom: 0;
  color: var(--vp-c-text-2);
}
</style>
