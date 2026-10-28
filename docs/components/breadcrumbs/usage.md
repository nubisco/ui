---
layout: nubisco
title: Breadcrumbs
intro: '`NbBreadcrumbs` shows where the person is and the way back up. A crumb that stands for one of several siblings (a company, a client, a repository, a year) can also switch to another one, in place.'
source: src/components/Breadcrumbs.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Switching in place

Some crumbs are not a level but a choice. "Acme" in a trail is one company of
several, and the person who wants another should not have to climb out to a list
to pick it. Give that crumb `options` and a small up and down chevron appears
after its label. It opens the siblings in a searchable list under the crumb, with
a check on the current one.

<preview>
  <NbBreadcrumbs :items="trail" @switch="onSwitch" />
</preview>

It works on any crumb, the current one included. The label and the chevron are
two controls: a crumb that links still links, and the chevron only switches.

Use it for a sibling the person would plausibly go to next. A crumb with two
options is a button elsewhere on the page, and a crumb with no siblings has no
chevron at all.

## On a phone

With `collapse="phone"`, the trail shows only the last crumb. If that crumb has
options, its chevron stays, so the person on a phone can still switch.

<!--@include: ./_shared.md-->
