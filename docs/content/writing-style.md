---
layout: nubisco
title: Writing style
description: 'The ruling for every string in a Nubisco UI surface: casing, person, tense, punctuation, numbers, dates, terminology, bias-free wording, translation, errors, loading and the accessibility of copy.'
---

Strings are a component. They ship, they regress, and they are the part of the
product a user actually reads. This page is the ruling for every string that
appears in a Nubisco UI surface: labels, titles, helper text, toasts, banners,
confirmations, empty states, errors, accessible names.

It is written to be applied mechanically. Where two options are defensible, one
of them is chosen here so that every product does not choose separately. If you disagree with a ruling, change this page. Do not fork it in
your view.

::: tip What this page is for
An agent or a developer should be able to open a view, read this page, and
rewrite every string in that view without asking anyone a question. If a
question comes up that this page cannot answer, that is a bug in this page.
:::

::: info Claims about the library
Claims about this library's own props, defaults and behaviour are read out of
`src/` and are true of the version you have checked out. Where the library
contradicts a ruling on this page, the contradiction is named in place.
:::

## The rulings, in one screen

| Question                                      | Ruling                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Capitalisation                                | Sentence case, always, everywhere. Never title case. Never typed uppercase.                                                                                                                                                                                              |
| Person                                        | Second person (`you`, `your`) when ownership matters, otherwise none. Never `we`, never `I`, never `my`.                                                                                                                                                                 |
| Tense                                         | Imperative for actions, past for outcomes, present for state.                                                                                                                                                                                                            |
| Period                                        | Full sentences take one. Labels, titles, headings, button text and single-fragment toasts do not.                                                                                                                                                                        |
| Exclamation marks                             | Never.                                                                                                                                                                                                                                                                   |
| Ellipsis                                      | Only on a control that opens a dialog asking for more before it can act (`Export...`), written as three ASCII periods. Never on a progress label (`Saving`, not `Saving...`). A confirmation is a guard, not more input, so a `Delete` that raises a confirm takes none. |
| Spelling                                      | User-facing strings are en-US: `Minimize`, `Center`, `Customize`, `Color`. This covers the library's own defaults and every product's UI. Documentation prose may stay en-GB.                                                                                            |
| Retry                                         | `Try again`, never `Retry`. The full verb register is [Action labels](./action-labels.md).                                                                                                                                                                               |
| Numbers                                       | Numerals, always, including zero through nine.                                                                                                                                                                                                                           |
| Dates                                         | Formatted by the browser from a `Date`, never typed as a literal string.                                                                                                                                                                                                 |
| Errors                                        | Three parts, in order: what happened, why, what to do next.                                                                                                                                                                                                              |
| `alert()`                                     | Never.                                                                                                                                                                                                                                                                   |
| Raw exception text                            | Never shown to a user. Logged, and summarised for the user.                                                                                                                                                                                                              |
| Em dashes                                     | Never, anywhere, including in strings. Use a comma, a period, parentheses or a colon.                                                                                                                                                                                    |
| Gendered third person                         | Never. Rewrite to second person, then to plural, then drop the pronoun. Singular `they` only when none of those work.                                                                                                                                                    |
| Disability as a metaphor                      | Never. No `sanity check`, `blind spot`, `crippled`, `insane`, `dumb`, `lame`.                                                                                                                                                                                            |
| `master` / `slave`, `whitelist` / `blacklist` | Never. `primary` / `replica`, `allowlist` / `blocklist`.                                                                                                                                                                                                                 |
| Sentences built by concatenation              | Never. One string, one sentence, named placeholders.                                                                                                                                                                                                                     |
| Plurals                                       | `Intl.PluralRules`. Never a ternary, never `(s)`.                                                                                                                                                                                                                        |

Action verbs (`Save` against `Done`, `Close` against `Cancel`, `Delete` against
`Remove`, `Try again` against `Retry`) follow one rule: the button says the verb
of the thing it does. [Action labels](./action-labels.md) is the register of
those verbs. This page governs everything else.

## Voice

The product speaks like a competent colleague who is doing the task with you,
not a system reporting on itself and not a brand talking at you.

Three properties, in priority order when they conflict:

1. **Accurate.** The string must be true of what just happened. A toast that
   says `Saved` when the request is still in flight is a lie the user will act
   on. `NbInlineLoading` exists so that a save has three honest states
   (`active`, `finished`, `error`) instead of one optimistic one.
2. **Specific.** Name the thing. `Delete environment` beats `Delete item`, and
   `Loading invoices` beats `Loading`. `NbSpinner`'s `label` prop is the
   accessible name and should carry the noun. **Named contradiction:**
   `Spinner.vue` line 64 defaults that prop to `label: 'Loading'`, which is the
   exact string this rule bans. The default exists so the component never
   announces an empty name, not as a licence to leave it. Always pass a noun.
   The default is drift to be fixed in the component, listed in
   [Where the library contradicts this page](#where-the-library-contradicts-this-page).
3. **Short.** Cut every word that survives removal without changing the meaning.
   Cut `please`, `simply`, `just`, `successfully`, `currently`, `in order to`.

What that rules out:

| Do not write                                             | Write                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Your changes have been successfully saved.`             | `Changes saved`                                                                             |
| `Oops! Something went wrong.`                            | `Could not save the entry. The server is unreachable. Check your connection and try again.` |
| `Please note that this action cannot be undone.`         | `This cannot be undone.`                                                                    |
| `The system is currently unable to process your request` | `The request timed out`                                                                     |
| `Are you sure?`                                          | `Delete environment` (the title states the action, see `NbConfirm`)                         |

Humour, exclamation marks, emoji in product strings and second-person praise
(`Nice work!`) are out. A person meets these strings on their hundredth day, not
their first, and usually while something is going wrong.

## Tone follows stakes, and the component already knows the stakes

Tone is not a free choice per string. The component you picked has already
declared the stakes; the string matches it. Every row below is a real prop of a
real component in this library.

| Surface                                                   | Stakes                                                       | Tone                                          | Length                                            | At most                            |
| --------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------- | ---------------------------------- |
| `NbToast` `variant="success"` (4s)                        | Routine, already done                                        | Flat, past tense                              | One fragment, no period                           | One line                           |
| `NbToast` `variant="error"` (persistent, `duration` 0)    | Something failed                                             | Direct, actionable                            | One or two sentences, periods                     | Under three lines                  |
| `NbBanner` `variant="inline"`                             | Outcome of a page-level action                               | Declarative                                   | Title plus one sentence                           | Two lines                          |
| `NbBanner` `variant="callout"`                            | A standing fact (trial expiring, non-production environment) | Neutral, no urgency                           | One sentence                                      | Two lines                          |
| `NbConfirm` `tone="danger"`                               | Irreversible                                                 | Blunt, names the loss                         | Title is the verb phrase, message is one sentence | Three lines of message             |
| `NbConfirm` `tone="neutral"`                              | Consequential, reversible                                    | Matter of fact                                | Same shape, softer message                        | Three lines of message             |
| `NbEmptyState` `kind="empty"`                             | Nothing has gone wrong                                       | Forward-looking                               | Title plus one or two sentences                   | Three lines                        |
| `NbEmptyState` `kind="error"`                             | Something has gone wrong                                     | Same three-part error rule as everywhere else | Title plus one sentence                           | Three lines (a page error)         |
| `NbMessage` `variant="error"` under a field               | One field is wrong                                           | Corrective, no blame                          | One fragment                                      | Two lines (a form or inline error) |
| Any action label (`NbButton`, a menu item, a toast `cta`) | Whatever the action carries                                  | Imperative verb                               | The verb, plus a noun when it needs one           | One or two words                   |

The four toast durations are declared in
`src/composables/useToast.composable.ts` as `NB_TOAST_DURATIONS`: `success`
4000, `info` 6000, `warning` 8000, `error` 0. Copy length has to fit the clock.
Four seconds is roughly one short line read once. If a success message needs
two sentences, it is not a success message, it is a banner. An error is 0,
meaning it stays until dismissed, so an error is the one variant where a second
sentence is affordable.

The line counts are measured at the component's default width, and they are
ceilings, not targets. The more urgent the surface, the shorter its ceiling:
an `assertive` live region (an error toast, a field error) is read out over
whatever the user was doing, so every extra line is spoken at them. If the
copy will not fit, it belongs on a bigger surface, not in a longer string.

## Sentence case, everywhere

Capitalise the first letter of the string and nothing else, except proper nouns
and things that are already capitalised for other reasons (see the table below).

This applies to page titles, section headings, tab labels, button labels, form
labels, table headers, menu items, toast titles, banner titles, tooltips,
placeholders, helper text, empty-state titles, notification titles and every
`aria-label`.

```
Add file            not   Add File
Items per page:     not   Items Per Page:
Mark all as read    not   Mark All As Read
Delete environment  not   Delete Environment
```

Those four are not invented examples. They are the shipped default values of
`NbFileUploader`'s `buttonLabel`, `NbPagination`'s `pageSizeLabel`,
`NbNotificationCenter`'s `markAllLabel`, and the canonical confirm label. The
library is already in sentence case, and so is every string you write.

Title case is banned because it cannot be applied consistently by several teams:
it requires a shared judgement about which words are "important", and that
judgement is never shared. Sentence case needs no judgement at all,
which is exactly why it is the ruling.

### Uppercase is styling, never authoring

Some surfaces render uppercase. `NbSidebarMenuGroup` headings, the record kind
strip inside `NbConfirm` (`.nb-confirm__subject-kind`), `NbCommandPalette` group
headings and inspector field labels all apply `text-transform: uppercase` in
their own SFC style block.

That is a visual treatment, not a content rule. **Type the string in sentence
case and let CSS shout.** Passing `subject-label="ENVIRONMENT"` produces the same
pixels today and a broken string the moment the styling changes, and screen
readers may spell out a fully capitalised word letter by letter.

There is no case in this library where you type an uppercase string. If you find
one, it is a defect.

### What does take a capital

| Category                                 | Examples                                                      |
| ---------------------------------------- | ------------------------------------------------------------- |
| Product and service names                | Nubisco, Nubisco UI, Stagewright, Verba, Keystone, OpenBridge |
| Companies and organisations              | Cloudflare, GitHub                                            |
| Initialisms and acronyms                 | API, CMS, CSV, JSON, OAuth, SSO, URL, UTC                     |
| Names of people, places, languages       | Lisbon, Portuguese                                            |
| A UI element quoted by its own label     | `Open the Environments page`, `Select Delete from the menu`   |
| The first word of a sentence or fragment | Everything                                                    |

Everything else is lowercase, including our own feature and component names in
prose. Write `the command palette`, `the notification centre`, `the inspector`,
not `the Command Palette`. `NbCommandPalette` is the component; the thing on
screen is a command palette.

Non-standard capitalisation in third-party names is preserved exactly as the
owner writes it: `GitHub`, `JavaScript`, `npm`, `pnpm`, `macOS`, `iPhone`.

## Person

| Rule                        | Ruling                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Second person               | Use `you` and `your` only when it disambiguates ownership: `your API keys` when other people's keys exist in the same view. Otherwise drop it: `API keys`. |
| First person plural         | Never. `We could not save your changes` makes the failure a party with an excuse. Write `Could not save your changes`.                                     |
| First person singular       | Never. No `My account`, no `My projects`. Write `Account`, `Projects`.                                                                                     |
| Addressing the user by role | Never in UI strings. No `Admins can...` inside a control the user is holding. Say what this user can do.                                                   |

`My` is common and it is banned here for a concrete reason: a sidebar
containing `My projects`, `Projects` and `All projects` has three labels and two
meanings. If a view
shows only the user's own records, the plain noun is correct and the scope
belongs in the page description, not the label.

## Tense

| Situation                            | Tense                           | Example                                                           |
| ------------------------------------ | ------------------------------- | ----------------------------------------------------------------- |
| A control that does something        | Imperative                      | `Save changes`, `Invite member`                                   |
| An outcome that has already happened | Past                            | `Draft saved`, `Member invited`, `2 files uploaded`               |
| An outcome that failed               | Past                            | `Could not save the draft`                                        |
| Something in progress                | Present participle, no ellipsis | `Saving`, `Uploading 3 of 8`                                      |
| A standing state                     | Present                         | `This environment is not production`, `Your trial ends in 4 days` |
| A consequence of confirming          | Present                         | `Every entry, release and API key in it is deleted`               |

`IToastOptions.message` documents the past-tense rule in the type itself:
`The news, in one sentence. Written in the past tense: "Draft saved"`.
`NbInlineLoading` ships `label: 'Saving'`, `finishedLabel: 'Saved'`,
`errorLabel: 'Could not save'`, which is the same three tenses in one component.

Never write a future promise for something that already happened
(`Your changes will be saved`) and never write the passive to hide the actor
where the actor matters (`The comment was deleted` when you deleted it: write
`Comment deleted`).

## Punctuation

### When a period belongs

This is the rule that drifts most, so it is a table, not a principle.

| String                                                               | Period?                                                                          |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Button label                                                         | No                                                                               |
| Menu item                                                            | No                                                                               |
| Form field label                                                     | No                                                                               |
| Table header                                                         | No                                                                               |
| Page title, section heading, tab                                     | No                                                                               |
| `NbBanner` `title`                                                   | No (the prop's own docs say `short and declarative, no full stop`)               |
| `NbConfirm` `title`                                                  | No                                                                               |
| `NbEmptyState` `title`                                               | No                                                                               |
| `NbToast` `title`                                                    | No                                                                               |
| Placeholder text                                                     | No                                                                               |
| A one-fragment toast message (`Draft saved`)                         | No                                                                               |
| A toast message that is a full sentence                              | Yes                                                                              |
| `NbConfirm` `message`                                                | Yes                                                                              |
| `NbEmptyState` `description`                                         | Yes                                                                              |
| Helper text under a field (`NbField` `hint`, `NbTextInput` `helper`) | Yes if it is a sentence, no if it is a fragment such as `Maximum 200 characters` |
| Field validation error                                               | No if a fragment (`Required`), yes if a sentence                                 |
| Any string of two or more sentences                                  | Yes, on all of them, including the last                                          |

The rule underneath the table: a period ends a sentence. It does not end a
label. Mixed lists are the failure mode, so decide per string, and never leave
one item in a list of six with a stray period.

### Everything else

| Mark                                | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Em dash                             | Banned. Comma, period, parentheses or colon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| En dash                             | **Banned**, exactly like the em dash, in prose and in ranges. A numeric range is written with an ASCII hyphen and no spaces: `10-50`. `NbPagination` writes its range this way (`11-20 of 95 items`).                                                                                                                                                                                                                                                                                                                                                                                                     |
| Colon                               | Only on an inline label that introduces a value or a control on the same line, as `NbPagination` does with `Items per page:`. Never at the end of a standalone heading or a field label above a control.                                                                                                                                                                                                                                                                                                                                                                                                  |
| Ellipsis                            | Three ASCII periods (`...`), never the single `…` character. Allowed in exactly one place: a control that opens a dialog asking for more before it can act (`Export...`, `Rename...`). Never on a progress label: `Deleting`, not `Deleting...`, because the spinner already says the work is ongoing, and `NbConfirm`'s `busyLabel` default is `Working` for that reason. Never on a placeholder (`NbSelect` searches with `Search`). A control that raises a confirmation takes none, and neither does any static label. The worked cases are in [Action labels](./action-labels.md#the-ellipsis-rule). |
| Exclamation mark                    | Banned in product strings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Question mark                       | Only in a genuine question put to the user. `NbConfirm` titles are not questions: the title is the action, so it takes no question mark.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Quotation marks                     | Do not wrap user data in quotes to distinguish it. Use `NbConfirm`'s `subject` prop, or `<code>`, which is what the dialog does with a monospaced subject strip. Quotes around a name that itself contains quotes is unreadable.                                                                                                                                                                                                                                                                                                                                                                          |
| Ampersand                           | Only inside a name that contains one. Write `and`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Slashes                             | Avoid. `Save/Apply` means the writer did not decide. Decide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Contractions                        | Allowed and preferred where natural: `can't`, `won't`, `doesn't`. They shorten the string and read as speech. Do not mix within one surface.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Parentheses                         | For a genuine aside, at most one per string. Not for optionality: mark optional fields on the field, not in the label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Trailing whitespace inside a string | Never. Spacing is CSS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Do not use `&nbsp;`, manual line breaks or `<br>` to shape a string. If the
wrap is wrong, the container is wrong.

## Numbers

| Rule                                                         | Example                                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Numerals for all quantities, including under ten             | `3 files`, not `three files`                                                                                               |
| Spell out a number only when it starts a sentence, or reword | `Three keys expired` or better `3 keys expired` after rewording                                                            |
| Zero is `0`, and a zero count is worth stating               | `0 results` beats a blank cell                                                                                             |
| Thousands separators come from the locale, not from you      | Format with `Intl.NumberFormat`, do not concatenate commas                                                                 |
| A unit is separated from its number by a space               | `24 MB`, `250 ms`, `3 days`                                                                                                |
| Byte units are uppercase and unambiguous                     | `KB`, `MB`, `GB`. Never `Kb` for kilobytes                                                                                 |
| Percentages use the symbol, no space                         | `48%`                                                                                                                      |
| Ranges use a hyphen with no spaces                           | `10-50 items`. `NbPagination` ships a U+2013 here and is the one known violation in the library, see the en dash row above |
| Ordinals are not used in UI counts                           | `Step 2 of 5`, not `2nd step`                                                                                              |
| Truncated large counts state the cut                         | `99+` only when the exact number is unavailable                                                                            |
| Currency comes from the data, formatted by the locale        | Never hardcode a symbol next to a raw number                                                                               |

Counts that change with singular and plural must not be built by appending `(s)`.
Write both forms and pick, or reword to a form that does not inflect
(`Selected: 1`, `Selected: 4`). `NbPagination` deliberately exposes `itemLabel`
(default `items`) so a product can supply its own noun rather than hardcoding one.

## Dates and times

**Never type a date format into a string.** `NbDatePicker` and `NbCalendar` both
resolve their locale as `props.locale || navigator.language || 'en'` and hand
the value to `toLocaleDateString`. A hardcoded `dd/mm/yyyy` in your view is wrong
for every user whose locale writes dates another way.

| Situation                                                            | Ruling                                                                                                                                                     |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A date shown in a table or a field                                   | Format from a `Date` via `toLocaleDateString` with an explicit `locale`, or pass `locale` to `NbDatePicker`                                                |
| A date format hint under an input                                    | Do not write one. `NbDatePicker` derives its hint from the resolved locale                                                                                 |
| A timestamp within the last week                                     | Relative, as `NbNotificationCenterItem` does with `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })`, which yields `yesterday` rather than `1 day ago` |
| A timestamp older than that                                          | Absolute date, locale formatted                                                                                                                            |
| A precise moment where the exact time matters (audit logs, releases) | Absolute date and time, with the zone named                                                                                                                |
| Time zone                                                            | Name it when the reader could be in another one: `14:30 UTC`. Otherwise render in the user's zone and do not label it                                      |
| Duration                                                             | `4 min 20 s` or `4m 20s`, consistently within a product. Not `260 seconds`                                                                                 |
| A deadline                                                           | State the date, not only the delta: `Your trial ends on 14 March` beats `Your trial ends soon`                                                             |

Never invent a relative string by hand (`2 days ago` built with subtraction and
concatenation). It will not translate and it will not agree with the notification
centre sitting next to it.

## Terminology

One word per concept, product-wide. These are the terms that most often split
across synonyms. The left column is the word to use; the right column is what it
means and what it replaces.

| Term                    | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sign in / sign out      | The user's session. Never `log in`, `login` (as a verb), `logout`. `Login` as a noun is banned entirely. The reason is collision, not taste: `log` is already a noun in many products (audit logs, request logs, delivery logs), so `Log in` and `View logs` end up in one menu spelled the same way, and `Login` as a noun is indistinguishable from the verb in a label. The usual argument for `Log in` is that `Sign in` sits too close to `Sign up`. This page answers that by banning `Sign up` outright, see the next row. |
| create account          | Registration. Never `Sign up`, `Register` or `Join`. It is a `Create <noun>` like every other, it removes the `Sign in` / `Sign up` collision, and it does not read as a mailing list.                                                                                                                                                                                                                                                                                                                                            |
| delete                  | Destroys the record permanently.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| remove                  | Detaches a record from this context while it continues to exist elsewhere. Removing a member from a project does not delete the person.                                                                                                                                                                                                                                                                                                                                                                                           |
| entry                   | A single content record. Never `item` when a specific noun exists.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| environment             | A named deployment target holding its own content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| API key / client secret | Distinct things. Do not call either one a `token` in a label.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| release                 | A published set of changes. Never `deploy` in user-facing copy unless the product's own domain is deployment.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| draft                   | Unpublished, editable. Never `unsaved` for the same idea.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| user / member           | `user` is a person with an account. `member` is a user inside a specific organisation or project. Pick per context and stay with it.                                                                                                                                                                                                                                                                                                                                                                                              |
| folder                  | A container in a tree. Never `directory` in UI copy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| settings                | The place you configure something. Never `preferences`, `options` or `config` in a label.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| notification            | An item in the notification centre. A `toast` is a transient message and is never called a notification in user-facing copy.                                                                                                                                                                                                                                                                                                                                                                                                      |
| upload / download       | Transfer verbs. `import` and `export` mean transformation between formats, not transfer.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| filter                  | Narrows a visible set. `search` matches text. They are not synonyms and should not share a label.                                                                                                                                                                                                                                                                                                                                                                                                                                 |

When a product needs a term not in this table, add it here rather than deciding
locally. That is the entire mechanism that stops the next six-phrasing drift.

Do not use internal names in user-facing copy. Component names (`NbShellPanel`),
route names, database table names and enum values (`no-results`) are for us.

## Bias-free terminology

The rules above make strings consistent. These make them safe to ship to
someone who is not like the person who wrote them. They are rulings, not
sensitivities: every one of them has a mechanical consequence, and most of them
are also a translation or a search problem.

### Never write a gendered third person

You cannot know a user's gender, and most data has no field for it.
Do not guess, do not write `he/she`, and do not write `(s)he`.

| Do not write                               | Write                                     | Why                                        |
| ------------------------------------------ | ----------------------------------------- | ------------------------------------------ |
| `The user must confirm his email address.` | `Confirm your email address.`             | Second person removes the problem entirely |
| `Ask the owner if he approved it.`         | `Ask the owner whether they approved it.` | Singular `they` for an unknown person      |
| `Each member can edit his or her profile.` | `Members can edit their own profiles.`    | Plural removes the pronoun                 |
| `Invite him/her`                           | `Invite this person`                      | Slashed pairs are unreadable aloud         |

In order of preference: rewrite to second person, rewrite to plural, rewrite to
drop the pronoun, and only then use singular `they`. Singular `they` is correct
English and is the ruling where a pronoun is unavoidable, but the first three
rewrites are shorter, which is why they come first.

A person's own pronouns, where a product stores them, are data. Render them as
given, never inferred from a name, a title or an avatar.

### Never use a disability as a metaphor

These are not banned to avoid offence in the abstract. They are banned because
they are metaphors, and a metaphor is the least precise word available for a
technical statement.

| Do not write                                                    | Write                                      |
| --------------------------------------------------------------- | ------------------------------------------ |
| `sanity check`                                                  | `check`, `validation`, `precondition`      |
| `blind spot`                                                    | `gap`, `unmonitored area`                  |
| `cripples`, `crippled`                                          | `degrades`, `blocks`, `slows`              |
| `dumb`, `lame`, `crazy`, `insane` (of a value, a limit, a bug)  | `unexpected`, `incorrect`, `very large`    |
| `tone deaf`                                                     | `unaware`, `mismatched`                    |
| `paralysed`, `blind to`, `deaf to`                              | `stopped`, `not checking`, `ignoring`      |
| `OCD about`, `bipolar`, `schizophrenic` (of software behaviour) | `strict about`, `inconsistent`, `unstable` |
| `commit suicide` (of a process)                                 | `exits`, `terminates`                      |

Note what the right column has in common: it is more specific. `The importer
went crazy` and `The importer retried 4,000 times in 30 seconds` are the same
event, and only one of them can be acted on.

`View`, `see`, `hear`, `watch` and `read` are all fine as ordinary verbs, and so
is `screen reader`. The ban is on disability as a figure of speech, not on
sensory vocabulary.

### Never use ownership or exclusion metaphors that name people

| Do not write                                        | Write                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `master` / `slave`                                  | `primary` / `replica`, `leader` / `follower`, `controller` / `worker` |
| `master` (of a branch or a copy)                    | `main`, `default branch`, `source of truth`                           |
| `whitelist` / `blacklist`                           | `allowlist` / `blocklist`, or `allowed` / `blocked`                   |
| `grandfathered`                                     | `exempt`, `on a legacy plan`                                          |
| `native` (of a feature or a speaker)                | `built in`, `first-class`, or the actual language                     |
| `man hours`, `manned`, `manpower`                   | `person hours`, `staffed`, `people`                                   |
| `guys` (addressing users)                           | Second person, or nothing                                             |
| `dummy data`, `dummy value`                         | `sample data`, `placeholder`                                          |
| `kill`, `nuke`, `hang`, `abort` in user-facing copy | `stop`, `delete`, `stops responding`, `cancel`                        |

`allowlist` and `blocklist` are also self-defining, which `whitelist` and
`blacklist` are not: nothing in the word `blacklist` says what the list does.
That is a usability argument before it is anything else.

Kill, hang and abort stay legal in code identifiers and in log lines; this page
governs strings a user reads. Where a third-party API name contains a banned
word (a `master` branch, an upstream `blacklist` field), quote the API's name
exactly in the place that names the API, and use our word everywhere else.

### Do not describe people by a condition or an age

Write `a person who uses a screen reader`, not `a screen reader user` where the
sentence is about the person; write `people with low vision`, not `the visually
impaired`; write `people who cannot use a mouse`, not `motor impaired users`.
Never use age, gender, nationality or ability as a proxy for skill level:
`new to the product` is the thing you actually meant, and it is testable.

### The words for our own users

`admin`, `member`, `owner`, `viewer` are roles: they name a permission set, not
a kind of person, and they take no article of judgement (`a mere viewer`).
Never write `power user`, `non-technical user` or `end user` in product copy.
The user reading it is one of those, and being told so is not information.

## Writing for translation

Nothing in this library translates itself, and nothing in it blocks
translation. Every user-facing string in every component is a prop, a slot, or
an entry in the strings catalogue, each with an en-US default. The visible
labels are props: `NbPagination` ships `pageSizeLabel: 'Items per page:'` and
`itemLabel: 'items'`, `NbConfirm` ships `busyLabel: 'Working'`, `NbToast` ships
`closeLabel: 'Close'`. The strings with no prop of their own (accessible names
such as `Previous page` and a modal's `Close`, icon-button titles, chart
fallbacks, the toast status words) come from the catalogue, which
[Localising the library](#localising-the-library) describes. There is no
bundled translation. The rulings below are what makes a string translatable
later without rewriting the view.

| Rule                                                           | Ruling                                                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One string is one sentence                                     | Never build a sentence by concatenating fragments in code. `t('deleted') + ' ' + count + ' ' + t('entries')` is untranslatable: word order, gender and agreement all differ by language       |
| Interpolate with named placeholders                            | `Could not upload {file}. The limit is {limit}.` The placeholder keeps its name across languages; positional `%s` does not survive reordering                                                 |
| Never split a string across markup                             | One string per sentence, with the markup applied to the whole. Do not emit `<b>3</b> entries selected` as three nodes a translator sees separately                                            |
| Plurals go through `Intl.PluralRules`, never through a ternary | English has two plural forms. Polish has four, Arabic six. `count === 1 ? 'entry' : 'entries'` is correct for exactly one language family. `pluralize()` from the package does it in one call |
| Never build a plural with `(s)`                                | Ruled already under [Numbers](#numbers), and it is worse in translation: many languages have no suffix that works                                                                             |
| Never reuse one string in two grammatical roles                | `Filter` as a button and `Filter` as a column heading are one noun and one verb, and most languages spell them differently. Two keys                                                          |
| Do not embed a number's formatting                             | Pass the number, format it with `Intl.NumberFormat` at render. Ruled under [Numbers](#numbers) for the same reason                                                                            |
| Do not embed a date's formatting                               | Ruled under [Dates and times](#dates-and-times). The library already resolves `props.locale \|\| navigator.language \|\| 'pt-PT'` in `NbDatePicker` and `NbCalendar`                          |
| Do not use word order to carry meaning                         | `Sort by: name` survives translation. `Name: sort by` does not, and neither does a label whose meaning depends on sitting to the left of its control                                          |
| Do not translate our product names                             | Nubisco, Stagewright, Verba, Keystone, OpenBridge stay as written, in every locale                                                                                                            |
| Do not put a string in an image                                | It cannot be translated and it cannot be read aloud                                                                                                                                           |

### Layout must survive text expansion

Translated UI text is routinely longer than English. Budget for **+50% on a
short label and +100% on a word of five characters or fewer**, plus longer
individual words in German, Finnish and Hungarian.

The consequences are layout consequences, so they are rules for the view, not
for the writer:

- A button's width comes from its content. Never fix a button width to fit the
  English word.
- A label that must not wrap needs a container that can grow, not
  `white-space: nowrap` and a truncation.
- Truncation with an ellipsis is a last resort, and when it is used the full
  string must still be reachable: a `title`, a tooltip, or the accessible name.
- Never lay out two labels so they read as one line (`Items per page:` next to
  a select is one string plus one control, which is why `NbPagination` exposes
  `pageSizeLabel` including its colon rather than composing it).
- Test at 200% browser zoom with the longest string you have. That is a WCAG
  1.4.4 requirement anyway.

### What a shorter string buys you

Every rule on this page that cuts words (`please`, `simply`, `successfully`,
`in order to`) also cuts translation cost and expansion risk. That is not the
reason for those rules, but it is the reason not to relax them for a product
that is currently English-only. Any product is one contract away from not
being.

## Localising the library

The library's own strings are en-US: `Minimize`, `Center`, `Color`. That is the
ruling for every user-facing string, so a product in English needs
nothing. A product in another language passes its strings once.

**Visible labels are props.** Pass them where the component is used:
`page-size-label`, `item-label`, `confirm-label`, `close-label`. A prop always
wins over the catalogue.

**Everything else is the catalogue.** `provideNbStrings()` takes any subset of
`INbStrings` and merges it over the defaults (`NB_DEFAULT_STRINGS`). A string
that carries a value is a function, so the translation decides where the value
goes:

```ts
import { createApp, ref } from 'vue'
import { provideNbStrings, pluralize } from '@nubisco/ui'

const strings = ref({
  paginationPrevious: 'Vorherige Seite',
  paginationNext: 'Nächste Seite',
  paginationPageOf: (page: number, total: number) =>
    `Seite ${page} von ${total}`,
  modalClose: 'Schließen',
  boardCardsSelected: (count: number) =>
    pluralize(
      count,
      { one: '{count} Karte ausgewählt', other: '{count} Karten ausgewählt' },
      'de',
    ),
})

const app = createApp(App)
provideNbStrings(strings, app)
```

| Called                         | Reaches                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| With an `app`                  | The whole application                                                                         |
| Inside a component's `setup()` | That component's subtree, merged over whatever an ancestor provided                           |
| Anywhere else                  | The global fallback, which is also what hosts the library mounts itself (`useConfirm()`) read |

The argument may be a ref, so switching language is one assignment. Read the
current strings in your own components with `useNbStrings()`.

**Plurals** go through `pluralize(count, { one, other }, locale)`, which picks
the form with `Intl.PluralRules` and formats `{count}` with
`Intl.NumberFormat`. Give it every form the language has (`few` and `many` for
Polish); a missing one falls back to `other`.

**Dates** in `NbDatePicker`, `NbCalendar` and `NbGanttChart` follow their
`locale` prop, then `navigator.language`, then `en`. Set the prop when the
product's language is not the browser's.

## Errors

An `alert()` carrying raw exception text is the worst content defect there is:
it is unstyled, unthemed,
modal, uncloseable by keyboard convention, invisible to the toast queue, and it
shows the user a stack of implementation detail they cannot act on.

### The three parts

Every error string has up to three parts, in this order:

1. **What happened**, from the user's point of view, in the past tense, naming
   the thing. `Could not publish the release.`
2. **Why**, if you actually know and the reason is meaningful to the user.
   `The environment has unresolved links.`
3. **What to do next**, as an imperative. `Resolve them and publish again.`

Part 1 is mandatory. Parts 2 and 3 are included when they are true and useful.
Never invent a cause. `Something went wrong` is part 1 with the noun removed,
which makes it useless; `Please try again later` on its own is part 3 with no
part 1, which makes it unactionable.

```
Could not publish the release. The environment has unresolved links. Resolve
them and publish again.

Could not upload avatar.png. The file is 12 MB and the limit is 5 MB. Choose a
smaller file.

Could not load invoices. The request timed out. Try again.
```

### Where an error goes

| Scope of the failure                          | Surface                                                                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One field                                     | `NbTextInput` `error` prop, or `NbMessage` `variant="error"`                            | Anchored to the control. `NbTextInput` already ships `error` and `warning`. Bind them, or errors end up in alerts                                                                                                                                                                                                                                                                                                                                                                      |
| One action the user just fired                | `NbToast` `variant="error"`                                                             | `duration` resolves to 0 from `NB_TOAST_DURATIONS`, so it stays until dismissed. Give it a `cta` for the retry                                                                                                                                                                                                                                                                                                                                                                         |
| An action fired from inside a dialog          | `NbConfirm` `error` prop, or `formatError` if you raised the dialog with `useConfirm()` | The dialog stays open with the failure visible so the user can retry or cancel. Which of the two you write is decided for you: `IConfirmOptions` omits `open`, `busy` and `error` from `IConfirmProps`, because the composable owns all three. A `useConfirm()` caller therefore never sets `error`. It rejects from `onConfirm` and maps the rejection with `formatError`, which lands in the same place on screen. Setting `error` yourself is only for a hand-mounted `<NbConfirm>` |
| The whole page failed to load                 | `NbEmptyState` `kind="error"`                                                           | Never `kind="empty"`: one element for both loading and empty makes a failed fetch read as `No contacts yet`                                                                                                                                                                                                                                                                                                                                                                            |
| A standing problem the page must keep showing | `NbBanner` `status="error"` `variant="callout"`                                         | Not dismissible, because dismissing it would not make it untrue                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Anything                                      | `alert()`                                                                               | Banned                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Raw exception text

Never render an exception message, a stack, a status line or a JSON error body
to a user. Log it, and map it. `useConfirm`'s options include `formatError`
precisely so the mapping happens in one place per call site rather than by
interpolating `String(error)` into a sentence.

A reasonable default mapping:

| Condition                             | User-facing copy                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Network failure, no response          | `Could not reach the server. Check your connection and try again.`                      |
| 400 with field detail                 | Put the message on the field, not in a toast                                            |
| 401                                   | `Your session expired. Sign in again.`                                                  |
| 403                                   | `You do not have permission to do this. Ask an admin for access.`                       |
| 404 on a record the user navigated to | `NbEmptyState` `kind="error"`, `This entry no longer exists. It may have been deleted.` |
| 409 conflict                          | `Someone else changed this entry while you were editing. Reload to see their version.`  |
| 413 / size limit                      | `<file> is <size>. The limit is <limit>. Choose a smaller file.`                        |
| 429                                   | `Too many requests. Wait a minute and try again.`                                       |
| 5xx                                   | `Could not <verb> the <noun>. The server failed. Try again in a moment.`                |
| Timeout                               | `Could not <verb> the <noun>. The request timed out. Try again.`                        |
| Unknown                               | `Could not <verb> the <noun>. Try again, and contact support if it keeps failing.`      |

Every row uses the same skeleton, so a rewrite is substitution, not authorship.

### Field validation copy

| Rule                                                                                         | Example                                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Say what is wrong, not that the input is bad                                                 | `Enter an email address`, not `Invalid input`                                        |
| Name the constraint with its number                                                          | `Use at least 12 characters`                                                         |
| Do not blame                                                                                 | `Enter a name`, not `You forgot the name`                                            |
| Do not repeat the field label                                                                | Under `Email address`, write `Enter a valid address`, not `Email address is invalid` |
| Validate on blur and on submit, not on every keystroke, so the copy is not shouting mid-word |                                                                                      |
| Warnings (`NbTextInput` `warning`) are for accepted-but-risky values                         | `This key has never been used`                                                       |

## Loading and progress

A product left to itself renders the literal string `Loading` under a
different class name on every screen. The ruling:

| Situation                                  | Component                           | Copy                                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A whole region loading for the first time  | `NbSkeleton`                        | No copy at all. A skeleton says it better than a word                                                                                                                                                                 |
| A blocking wait with no layout to preserve | `NbSpinner` with `label`            | `Loading invoices`, naming the noun. The `label` prop is the accessible name, `showLabel` decides whether it is visible too. Pass it: without it the spinner falls back to `Loading content` and warns in development |
| A control the user just pressed            | `NbInlineLoading`                   | Its defaults are already correct: `Saving`, `Saved`, `Could not save`. Override the nouns, not the tenses                                                                                                             |
| Determinate work                           | `NbProgressBar`                     | `Uploading 3 of 8`, with the counts                                                                                                                                                                                   |
| A dialog acting on confirm                 | `NbConfirm` `busy` plus `busyLabel` | Default `Working`. Override with the verb: `Deleting`. No ellipsis                                                                                                                                                    |

Never write `Please wait`, never write `Loading, please wait...`, and never
leave a save with no visible state at all.

## Accessibility

Most of this library's accessibility is content. A label is the accessible
name. A message is what a live region says out loud. Nothing on this page is
decoration, and this section is the part of it that a screen reader, a voice
control user or a magnifier user meets directly.

### Politeness is already decided, and the copy has to fit it

You do not choose `aria-live`. The component you picked chose it, from the
severity you passed. These are the values in the source today:

| Surface                        | What the component sets                                                                                                                                                                             | What that means for your string                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `NbMessage` `variant="error"`  | `role="status"`, `aria-live="assertive"`                                                                                                                                                            | Interrupts whatever is being read. One fragment: `Enter an email address`                                                               |
| `NbMessage`, any other variant | `role="status"`, `aria-live="polite"`                                                                                                                                                               | Waits its turn. A sentence is affordable                                                                                                |
| `NbBanner` `status="error"`    | `role="alert"`, `aria-live="assertive"`                                                                                                                                                             | Title plus one sentence, no more                                                                                                        |
| `NbBanner`, any other status   | `role="status"`, `aria-live="polite"`                                                                                                                                                               | Same shape, no urgency in the wording either                                                                                            |
| `NbToast` `variant="error"`    | `aria-live="assertive"` (overridable with the `ariaLive` prop)                                                                                                                                      | Stays until dismissed, so it can carry the full three-part error                                                                        |
| `NbToast`, any other variant   | `aria-live="polite"`                                                                                                                                                                                | It will be gone in 4 to 8 seconds. One fragment                                                                                         |
| `NbToaster`                    | Two fixed regions, one `role="status"` `aria-live="polite"` and one `role="alert"` `aria-live="assertive"`, each `aria-atomic="true"`; the toasts themselves render `role="none"` `aria-live="off"` | The region announces the whole toast in one go, so write it as one utterance and do not split the news across the title and the message |
| `NbInlineLoading`              | `role="status"`, and `aria-live` computed from `status`: `off` when inactive, `assertive` on `error`, `polite` otherwise                                                                            | The three labels are announced in sequence, so they must read as a sequence: `Saving`, `Saved`, `Could not save`                        |
| `NbSpinner`, not `decorative`  | `role="status"`, `aria-live="polite"`, and the `label` is the announcement                                                                                                                          | Name the noun. `Loading invoices`, not `Loading`                                                                                        |
| `NbSpinner` `decorative`       | No role, no live region, `aria-hidden="true"`                                                                                                                                                       | It has no copy at all. Use it only when an ancestor already announces, which is what `NbInlineLoading` does with the spinner inside it  |
| `NbPagination` range           | `aria-live="polite"` on the range text                                                                                                                                                              | The range is announced on every page change, so it stays short and keeps its noun (`itemLabel`)                                         |

Three rules follow from that table:

1. **An assertive string has to be worth interrupting for.** If it is not,
   you picked the wrong severity, not the wrong words.
2. **Do not type the severity into the message.** `NbToaster` already prepends
   a visually hidden severity word per variant from `NB_TOAST_STATUS_LABELS`
   (`Success`, `Error`, `Warning`, `Information`). Writing `Error: could not
save the draft` gets announced as `Error Error: could not save the draft`.
3. **Never let the icon or the colour carry the meaning.** The icons in
   `NbBanner`, `NbMessage` and `NbTextInput` are all `aria-hidden="true"`. If
   removing the icon leaves the string ambiguous, the string is incomplete,
   which is a plain WCAG 1.4.1 failure and not a style preference.

### Label in name

If a control shows text, its accessible name must contain that text, in the
same order (WCAG 2.5.3). This constrains the `aria-label` rule in
An `aria-label` on a control
that already displays a label may extend the visible text, never replace it.

```
Visible: Delete        aria-label="Delete Production"     legal, extends it
Visible: Delete        aria-label="Remove environment"    breaks 2.5.3
Visible: (icon only)   aria-label="Delete environment"    legal, it is the name
```

The second row is not a theoretical failure. Voice control users say the word
they can see: `click Delete` matches nothing when the name is `Remove
environment`, and the control becomes unoperable by voice while looking
perfectly labelled to everyone else.

### The two names a spinner has

`NbSpinner` has `label` and `showLabel`, and they are not the same job.
`label` is the accessible name and is always announced. `showLabel` decides
whether that same string is also drawn on screen. So write one string that
works both ways: `Loading invoices` reads correctly out loud and reads
correctly as visible text. `Please wait while we load your invoices` fails as
both.

### Focus order is part of the copy

`NbConfirm` puts initial focus on **Cancel**, not on the confirming button
(`Confirm.vue` focuses the cancel element on mount and on open, and cancel is
the ghost button while confirm carries the danger variant). A screen reader
user therefore hears, in this order: the title (via `aria-labelledby`), the
message (via `aria-describedby`), then `Cancel`.

That order is why the destructive-dialog strings are shaped the way they are.
The title has to be the action, because it is heard first and nothing before it
explains the dialog. The `cancelLabel` has to read as an answer to the title:
`Keep editing` answers `Discard changes`, and `No` answers nothing. And the
confirm label is heard last, out of context, which is the argument for the verb
phrase: the confirm button says the verb.

### Link text

A link's text is its accessible name, and screen reader users pull a list of
links exactly as they pull a list of actions.

| Do not write                                   | Write                            |
| ---------------------------------------------- | -------------------------------- |
| `Learn more`                                   | `Read the release checklist`     |
| `Click here`                                   | `Open the environment settings`  |
| `here`, `this page`, `more`                    | The destination, named           |
| `https://docs.nubisco.io/...` as the link text | The title of the page it goes to |

Two links with the same text must go to the same place, and one destination
should not be reached by two different phrasings on one page. A link that
leaves the product says so in words (`Cloudflare dashboard`), not only with an
external-link icon, which is `aria-hidden` wherever we draw one. Link text
takes no trailing period even when it ends a sentence: the period is outside
the link.

### Headings, and the order they are read in

Headings are navigation before they are typography. One `h1` per view, and it
names the view rather than the product. Do not skip a level to get a smaller
font, and do not use a heading as a label for a single control. A heading with
no content under it is a label that has been styled wrongly.

### Alternative text

| Image                                             | Alt                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Decorative, or already described by adjacent text | `alt=""`, so it is skipped rather than announced as a filename                                                  |
| An icon inside a labelled control                 | Nothing. Our icons are `aria-hidden="true"`; the control carries the name                                       |
| A meaningful image                                | Describe the information it carries, not the picture: `Signal path from input to the compressor`, not `Diagram` |
| A chart                                           | State the finding, not the shape: `Requests peaked at 4.2k on 14 March, then fell steadily`                     |
| A screenshot in documentation                     | What the reader is meant to notice in it                                                                        |

Never start alt text with `Image of` or `Graphic of`, and never repeat a
caption that is already on the page in the alt as well: the reader hears it
twice.

### Do not encode meaning in case or in punctuation

Uppercase is styling (see [Uppercase is styling, never
authoring](#uppercase-is-styling-never-authoring)), and some screen readers
spell out a fully capitalised word letter by letter. Asterisks, colons and
parentheses do not mark required, optional or disabled to a screen reader: the
control's own state and helper text do. If a field is optional, say so in words
where the reader will meet it.

## Where the library contradicts this page

This page rules on the library, and the library is not yet fully compliant with
it. Every known divergence is listed here rather than quietly tolerated, so
that a reader who finds one in the source knows whether it is a carve-out (none
of them are) or a defect (all of them are).

| Where                      | What it does                                                                                         | Ruling                                                                         | What to do today                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `NbConfirm` `confirmLabel` | Defaults to `Confirm`, a word [Action labels](./action-labels.md#ban-list) bans on a confirm button  | The confirm button says the verb                                               | Always pass the verb phrase. The default exists only so the button is never empty |
| `NbSpinner` `label`        | Falls back to `Loading content`, which names no noun                                                 | Loading copy names the noun, see [Loading and progress](#loading-and-progress) | Always pass `label`. The spinner warns in development when you do not             |
| `NbToaster` `hotkeyHint`   | Defaults to `Press Alt plus T to reach it.`, naming a key the operating system may label differently | Name what the user sees                                                        | Override it on macOS-first products (`Option plus T`)                             |

These were fixed in 5.48.0 and are listed so a reader of older code knows what
changed: `NbBanner` closes with `Close`, not `Dismiss`. `NbPagination` writes
its range with a hyphen, not an en dash. `NbSelect` searches with `Search`, not
`Search…`. `NbConfirm` shows `Working`, not `Working...`. `useConfirm()` no
longer shows `error.message` or `Something went wrong.` when `formatError` is
missing. `NbModal`, `NbPagination`, `NbDatePicker`, `NbDataTable`,
`NbNumberInput`, `NbBoard`, `NbBottomPanel`, the Blueprint controls and the
charts take their unprompted strings from the [catalogue](#localising-the-library).
`NbDatePicker` and `NbCalendar` no longer fall back to a fixed non-English
locale.

If you find a divergence that is not in this table, add it. A page that rules on
a library is only credible while its list of known failures is complete.

## The mechanical rewrite

Applied to one view, in order. Each step is checkable.

1. Collect every literal string in the template and the script, including every
   `aria-label`, `title`, `placeholder` and thrown message.
2. Delete every `alert()`, `confirm()` and `prompt()`. Route them to `NbToast`,
   `useConfirm()` and a real field respectively.
3. Recase every string to sentence case. Search for a second capital letter that
   is not part of a proper noun from the table above.
4. Remove every typed uppercase string. If the design wants uppercase, the SFC
   style block does it.
5. Apply the period table. Buttons, labels, titles and headings lose theirs;
   sentences keep theirs.
6. Delete `please`, `simply`, `just`, `successfully`, `Oops`, every exclamation
   mark and every emoji.
7. Replace `we` and `my`. Replace `log in` with `sign in`.
8. Replace every gendered third-person pronoun, every disability metaphor
   (`sanity check`, `blind spot`, `crippled`, `insane`) and every
   `master`/`slave`, `whitelist`/`blacklist`, `dummy` or `man hours` using the
   [bias-free tables](#bias-free-terminology). Grep for the words; they do not
   appear in context by accident.
9. Replace every `Loading` string using the loading table. Every `NbSpinner`
   gets an explicit `label`, because its default is one of the strings you are
   removing.
10. Break every concatenated sentence into one interpolated string with named
    placeholders, and replace every `count === 1 ? ... : ...` plural with
    `Intl.PluralRules`. Delete every `(s)`.
11. Rewrite every error to the three-part form, mapping status codes with the
    table above. No exception text survives.
12. Replace every hardcoded date format with a locale-formatted one, and every
    hand-formatted number with `Intl.NumberFormat`.
13. Rewrite every link whose text is `Learn more`, `here` or a bare URL to name
    its destination, and check that no `aria-label` replaces text the control
    already shows.
14. Check every button says its verb, and that none of them says `OK`,
    `Yes`, `Done` or `Dismiss`.
15. Read the result out loud in order. If a string cannot be spoken as a
    sentence or a label, it is neither, and it needs rewriting.

## Checklist

- [ ] Every string is sentence case, and no string is typed uppercase.
- [ ] No em dashes anywhere.
- [ ] Periods follow the table, consistently within each list.
- [ ] No exclamation marks, no `please`, no `Oops`, no emoji.
- [ ] Second person only where ownership is ambiguous. No `we`, no `My`.
- [ ] Imperative for actions, past for outcomes, present for state.
- [ ] Numerals for all counts. Units spaced. No `(s)` plurals.
- [ ] No hardcoded date or number formats.
- [ ] Terminology matches the table, one word per concept.
- [ ] Every error names what happened, and adds why and what next when known.
- [ ] No `alert()`, no raw exception text.
- [ ] Loading copy names the noun, or is a skeleton with no copy.
- [ ] Every `aria-label` reads as a name a person would say out loud, and where
      the control also shows text, the name contains that text verbatim.
- [ ] No string repeats a severity the live region already announces, and no
      string depends on an icon or a colour to be understood.
- [ ] No link text is `Learn more`, `Click here` or a raw URL.
- [ ] Decorative images have `alt=""`; meaningful ones describe the information.
- [ ] No gendered third-person pronoun, no `he/she`, no `(s)he`.
- [ ] No disability used as a metaphor: no `sanity check`, `blind spot`,
      `crippled`, `insane`, `dumb`, `lame`.
- [ ] No `master`/`slave`, `whitelist`/`blacklist`, `grandfathered`,
      `man hours`, `dummy data`, `guys`, `power user` or `end user`.
- [ ] No sentence is built by concatenation, and every interpolation uses a
      named placeholder.
- [ ] Every plural goes through `Intl.PluralRules`, never a ternary and never
      `(s)`.
- [ ] No layout depends on the English string's length; the longest label still
      fits at 200% zoom.
- [ ] Every `NbSpinner` passes an explicit `label`, and every `NbBanner` passes
      `close-label="Close"`.
