import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import NbStepper from '../src/components/Stepper.vue'
import NbStepperStep from '../src/components/StepperStep.vue'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { compileStyle, parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'

interface IStepFixture {
  label: string
  description?: string
  complete?: boolean
  invalid?: boolean
  disabled?: boolean
}

const defaultSteps: IStepFixture[] = [
  { label: 'Account' },
  { label: 'Workspace' },
  { label: 'Members' },
  { label: 'Review' },
]

// Mounted through a host so the steps are real children in the default slot,
// which is how a consumer writes them and the only way registration order is
// exercised.
const createWrapper = (
  props: Record<string, unknown> = {},
  steps: IStepFixture[] = defaultSteps,
) => {
  const host = defineComponent({
    props: { stepper: { type: Object, default: () => ({}) } },
    setup(hostProps) {
      return () =>
        h(NbStepper, hostProps.stepper, {
          default: () => steps.map((s) => h(NbStepperStep, { ...s })),
        })
    },
  })

  return mount(host, { props: { stepper: props }, attachTo: document.body })
}

const items = (wrapper: ReturnType<typeof createWrapper>) =>
  wrapper.findAll('li')

const statuses = (wrapper: ReturnType<typeof createWrapper>) =>
  items(wrapper).map((li) => li.attributes('data-status'))

const labels = (wrapper: ReturnType<typeof createWrapper>) =>
  items(wrapper).map((li) => li.find('.nb-stepper__label').text())

// What the marker reads as: its number, or the glyph name once the step is
// complete or invalid.
const markers = (wrapper: ReturnType<typeof createWrapper>) =>
  items(wrapper).map((li) => {
    const marker = li.find('.nb-stepper__marker')
    const icon = marker.find('[data-name]')
    return icon.exists() ? `:${icon.attributes('data-name')}` : marker.text()
  })

describe('Stepper', () => {
  describe('structure', () => {
    it('renders an ordered list with one item per step', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('ol.nb-stepper__list').exists()).toBe(true)
      expect(items(wrapper)).toHaveLength(4)
      expect(labels(wrapper)).toEqual([
        'Account',
        'Workspace',
        'Members',
        'Review',
      ])
    })

    it('keeps the list semantics an <ol> loses to list-style: none', () => {
      // Safari with VoiceOver drops list semantics from a list whose markers
      // are removed, which is every stepper. Without this the "sequence of
      // five things" the accessibility docs promise is not conveyed at all.
      expect(createWrapper().find('ol').attributes('role')).toBe('list')
    })

    it('names the list so the sequence is findable, defaulting to the label set', () => {
      expect(createWrapper().find('ol').attributes('aria-label')).toBe(
        'Progress',
      )
      expect(
        createWrapper({ ariaLabel: 'Onboarding' })
          .find('ol')
          .attributes('aria-label'),
      ).toBe('Onboarding')
    })

    it('numbers the markers by position, not by prop', () => {
      expect(markers(createWrapper({ modelValue: 0 }))).toEqual([
        '1',
        '2',
        '3',
        '4',
      ])
    })

    it('draws a connector out of every step', () => {
      // Every step renders one; the last one's is removed by CSS, which is
      // the only place the "am I last" question can be answered without a
      // tick of wrong markup. The rule itself is asserted below.
      const wrapper = createWrapper()
      expect(wrapper.findAll('.nb-stepper__line')).toHaveLength(4)
    })

    it('renders the description only when there is one', () => {
      const wrapper = createWrapper({}, [
        { label: 'Account', description: 'Optional' },
        { label: 'Review' },
      ])
      expect(items(wrapper)[0].find('.nb-stepper__description').text()).toBe(
        'Optional',
      )
      expect(items(wrapper)[1].find('.nb-stepper__description').exists()).toBe(
        false,
      )
    })

    it('degrades to an empty named list rather than throwing', () => {
      const wrapper = createWrapper({}, [])
      expect(wrapper.find('ol').attributes('aria-label')).toBe('Progress')
      expect(items(wrapper)).toHaveLength(0)
    })
  })

  // ── The bug this component shipped in round one ─────────────────────
  //
  // Steps used to be numbered by the order their setup() ran, which is DOM
  // order exactly once: on the first render. The docs recommend a v-for, and a
  // v-for is the case where mount order stops being document order. Every
  // derived value hangs off the index, so getting it wrong renumbers the
  // markers, flips complete against incomplete and moves aria-current onto the
  // wrong step.
  describe('dynamic children', () => {
    const dynamicHost = (initial: {
      show?: boolean
      order?: string[]
      modelValue?: number
    }) => {
      const host = defineComponent({
        props: {
          show: { type: Boolean, default: false },
          order: { type: Array as () => string[], default: null },
          modelValue: { type: Number, default: 0 },
        },
        setup(p) {
          return () =>
            h(
              NbStepper,
              { modelValue: p.modelValue, navigable: true, furthest: 9 },
              {
                default: () =>
                  p.order
                    ? p.order.map((label) =>
                        h(NbStepperStep, { key: label, label }),
                      )
                    : [
                        h(NbStepperStep, { label: 'Account' }),
                        p.show ? h(NbStepperStep, { label: 'Billing' }) : null,
                        h(NbStepperStep, { label: 'Review' }),
                      ],
              },
            )
        },
      })
      return mount(host, { props: initial, attachTo: document.body })
    }

    const settle = async () => {
      await nextTick()
      await nextTick()
    }

    it('renumbers when a step is inserted into the middle after mount', async () => {
      const wrapper = dynamicHost({ show: false, modelValue: 1 })
      expect(labels(wrapper)).toEqual(['Account', 'Review'])

      await wrapper.setProps({ show: true })
      await settle()

      expect(labels(wrapper)).toEqual(['Account', 'Billing', 'Review'])
      // Registration order here is Account, Review, Billing. Document order is
      // what the reader sees, so document order is what the markers say:
      // step 1 is behind the current one and shows its check, not "3".
      expect(markers(wrapper)).toEqual([':check', '2', '3'])
    })

    it('derives status from document order for a late-inserted step', async () => {
      const wrapper = dynamicHost({ show: false, modelValue: 2 })
      await wrapper.setProps({ show: true })
      await settle()

      expect(statuses(wrapper)).toEqual(['complete', 'complete', 'current'])
      expect(items(wrapper).map((li) => li.attributes('aria-current'))).toEqual(
        [undefined, undefined, 'step'],
      )
    })

    it('renumbers when a step is removed from the middle', async () => {
      const wrapper = dynamicHost({ show: true, modelValue: 0 })
      await settle()
      expect(labels(wrapper)).toEqual(['Account', 'Billing', 'Review'])

      await wrapper.setProps({ show: false })
      await settle()

      expect(labels(wrapper)).toEqual(['Account', 'Review'])
      expect(markers(wrapper)).toEqual(['1', '2'])
      expect(statuses(wrapper)).toEqual(['current', 'incomplete'])
    })

    it('follows a keyed v-for that reorders, where nothing re-registers', async () => {
      // The hardest case: the components are reused, so register() never runs
      // again. Only re-reading document position can get this right.
      const wrapper = dynamicHost({
        order: ['Account', 'Billing', 'Review'],
        modelValue: 1,
      })
      await settle()
      expect(statuses(wrapper)).toEqual(['complete', 'current', 'incomplete'])

      await wrapper.setProps({ order: ['Review', 'Account', 'Billing'] })
      await settle()

      expect(labels(wrapper)).toEqual(['Review', 'Account', 'Billing'])
      // Position, not identity: Review moved to the front, so Review is the
      // step that is now behind the current one.
      expect(markers(wrapper)).toEqual([':check', '2', '3'])
      expect(statuses(wrapper)).toEqual(['complete', 'current', 'incomplete'])
    })

    it('keeps the click target pointing at the step the reader sees', async () => {
      const wrapper = dynamicHost({ show: false, modelValue: 2 })
      await wrapper.setProps({ show: true })
      await settle()

      // Account and Billing are behind the current step, so both are buttons.
      const buttons = wrapper.findAll('button')
      expect(buttons.map((b) => b.find('.nb-stepper__label').text())).toEqual([
        'Account',
        'Billing',
      ])
      await buttons[1].trigger('click')
      expect(
        wrapper.findComponent(NbStepper).emitted('update:modelValue'),
      ).toEqual([[1]])
    })
  })

  describe('status', () => {
    it('derives complete, current and incomplete from position', () => {
      const wrapper = createWrapper({ modelValue: 1 })
      expect(statuses(wrapper)).toEqual([
        'complete',
        'current',
        'incomplete',
        'incomplete',
      ])
    })

    it('marks exactly one step as the current one for assistive tech', () => {
      const wrapper = createWrapper({ modelValue: 2 })
      expect(items(wrapper).map((li) => li.attributes('aria-current'))).toEqual(
        [undefined, undefined, 'step', undefined],
      )
    })

    it('lets a step ahead of the current one be marked complete', () => {
      const wrapper = createWrapper({ modelValue: 0 }, [
        { label: 'Account' },
        { label: 'Workspace' },
        { label: 'Members', complete: true },
      ])
      expect(statuses(wrapper)).toEqual(['current', 'incomplete', 'complete'])
    })

    it('shows invalid over current, so a rejected step never looks normal', () => {
      const wrapper = createWrapper({ modelValue: 1 }, [
        { label: 'Account' },
        { label: 'Workspace', invalid: true },
        { label: 'Review' },
      ])
      expect(statuses(wrapper)[1]).toBe('invalid')
      // Still where the user is: the error does not move the flow.
      expect(items(wrapper)[1].attributes('aria-current')).toBe('step')
    })

    it('shows disabled over everything, including position', () => {
      const wrapper = createWrapper({ modelValue: 2 }, [
        { label: 'Account' },
        { label: 'Billing', disabled: true },
        { label: 'Review' },
      ])
      expect(statuses(wrapper)).toEqual(['complete', 'disabled', 'current'])
    })

    it('swaps the number for a glyph once a step is done or rejected', () => {
      const wrapper = createWrapper({ modelValue: 1 }, [
        { label: 'Account' },
        { label: 'Workspace', invalid: true },
        { label: 'Review' },
      ])
      const icon = (at: number) =>
        items(wrapper)
          [at].find('.nb-stepper__marker [data-name]')
          .attributes('data-name')
      expect(icon(0)).toBe('check')
      expect(icon(1)).toBe('warning')
      // Not started: the number is the only thing worth showing.
      expect(
        items(wrapper)[2].find('.nb-stepper__marker [data-name]').exists(),
      ).toBe(false)
      expect(items(wrapper)[2].find('.nb-stepper__marker').text()).toBe('3')
    })

    it('announces the status as text, since colour alone carries it visually', () => {
      const wrapper = createWrapper({ modelValue: 1 })
      expect(
        items(wrapper).map((li) => li.find('.nb-stepper__status').text()),
      ).toEqual(['Complete', 'Current step', 'Not started', 'Not started'])
    })

    it('takes translated status words from labels', () => {
      const wrapper = createWrapper({
        modelValue: 1,
        labels: { current: 'Etapa atual', progress: 'Progresso' },
      })
      expect(wrapper.find('ol').attributes('aria-label')).toBe('Progresso')
      expect(items(wrapper)[1].find('.nb-stepper__status').text()).toBe(
        'Etapa atual',
      )
      // Unspecified words keep their default rather than going blank.
      expect(items(wrapper)[0].find('.nb-stepper__status').text()).toBe(
        'Complete',
      )
    })
  })

  // Nothing else tells a screen-reader user that the flow moved: no focus
  // changes, and the only visible signal is a marker changing colour.
  describe('announcing the move', () => {
    const region = (wrapper: ReturnType<typeof createWrapper>) =>
      wrapper.find('.nb-stepper__announcement')

    it('ships a polite live region that starts empty', () => {
      const wrapper = createWrapper({ modelValue: 0 })
      expect(region(wrapper).attributes('role')).toBe('status')
      expect(region(wrapper).attributes('aria-live')).toBe('polite')
      // Silent on mount: nothing has changed yet.
      expect(region(wrapper).text()).toBe('')
    })

    it('names the new step, its number and the total when the flow advances', async () => {
      const wrapper = createWrapper({ modelValue: 0 })
      await wrapper.setProps({ stepper: { modelValue: 1 } })
      expect(region(wrapper).text()).toBe('Step 2 of 4: Workspace')
    })

    it('takes a translated template with the same placeholders', async () => {
      const wrapper = createWrapper({
        modelValue: 0,
        labels: { announcement: 'Etapa {step} de {total}: {label}' },
      })
      await wrapper.setProps({
        stepper: {
          modelValue: 2,
          labels: { announcement: 'Etapa {step} de {total}: {label}' },
        },
      })
      expect(region(wrapper).text()).toBe('Etapa 3 de 4: Members')
    })

    it('stays silent when the flow already moves focus itself', async () => {
      const wrapper = createWrapper({ modelValue: 0, announce: false })
      await wrapper.setProps({ stepper: { modelValue: 1, announce: false } })
      expect(region(wrapper).text()).toBe('')
    })
  })

  describe('accessible name', () => {
    const withDescriptions = () =>
      createWrapper({ modelValue: 2, navigable: true, furthest: 3 }, [
        { label: 'Account', description: 'Name and email' },
        { label: 'Workspace', description: 'Pick a region' },
        { label: 'Members' },
        { label: 'Review' },
      ])

    it('names a clickable step after its label alone', () => {
      // Left to the button's own content the name is the whole subtree:
      // "Account Name and email Complete". In a rotor that is three steps
      // that all read like sentences and none that read like a step.
      const wrapper = withDescriptions()
      const button = items(wrapper)[0].find('button')
      const labelId = items(wrapper)[0]
        .find('.nb-stepper__label')
        .attributes('id')

      expect(button.attributes('aria-labelledby')).toBe(labelId)
      expect(
        wrapper.find(`#${labelId}`).text(),
        'the name is the label and nothing else',
      ).toBe('Account')
    })

    it('keeps the description and the status word as description, not name', () => {
      const wrapper = withDescriptions()
      const step = items(wrapper)[0]
      const described = step.find('button').attributes('aria-describedby') ?? ''
      const ids = described.split(' ').filter(Boolean)

      expect(ids).toHaveLength(2)
      expect(ids.map((id) => wrapper.find(`#${id}`).text())).toEqual([
        'Name and email',
        'Complete',
      ])
    })

    it('never points aria-describedby at a description that is not rendered', () => {
      // A dangling idref is not a small bug: some screen readers announce
      // nothing at all for the whole element rather than skip the missing id.
      const wrapper = withDescriptions()
      // "Review" has no description, and at furthest 3 it is still clickable.
      const step = items(wrapper)[3]
      const described = step.find('button').attributes('aria-describedby') ?? ''
      for (const id of described.split(' ').filter(Boolean)) {
        expect(wrapper.find(`#${id}`).exists(), `${id} does not exist`).toBe(
          true,
        )
      }
      expect(step.find('.nb-stepper__description').exists()).toBe(false)
    })

    it('leaves the non-clickable step to reading order', () => {
      // A <div> with no role has no accessible name to get wrong: its
      // children are read in order, which is already label, description,
      // status. Overriding that would only remove the description.
      const wrapper = createWrapper({}, [
        { label: 'Account', description: 'Name and email' },
      ])
      const body = wrapper.find('.nb-stepper__body')
      expect(body.element.tagName).toBe('DIV')
      expect(body.attributes('aria-labelledby')).toBeUndefined()
      expect(body.attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('navigation', () => {
    it('renders no buttons at all when not navigable', () => {
      const wrapper = createWrapper({ modelValue: 2 })
      expect(wrapper.findAll('button')).toHaveLength(0)
    })

    it('turns only already-visited steps into buttons', () => {
      const wrapper = createWrapper({ modelValue: 2, navigable: true })
      const buttons = wrapper.findAll('button')
      expect(buttons.map((b) => b.find('.nb-stepper__label').text())).toEqual([
        'Account',
        'Workspace',
      ])
      // The current step is not a control: it is where you already are.
      expect(items(wrapper)[2].find('button').exists()).toBe(false)
      expect(items(wrapper)[3].find('button').exists()).toBe(false)
    })

    it('never makes a disabled step clickable, however far the user got', () => {
      const wrapper = createWrapper({ modelValue: 2, navigable: true }, [
        { label: 'Account' },
        { label: 'Billing', disabled: true },
        { label: 'Review' },
      ])
      expect(items(wrapper)[1].find('button').exists()).toBe(false)
    })

    it('emits the picked index on click', async () => {
      const wrapper = createWrapper({ modelValue: 2, navigable: true })
      await wrapper.findAll('button')[0].trigger('click')
      const stepper = wrapper.findComponent(NbStepper)
      expect(stepper.emitted('update:modelValue')).toEqual([[0]])
      expect(stepper.emitted('change')).toEqual([[0]])
    })

    it('keeps the steps behind unlocked after going back (high-water mark)', async () => {
      const wrapper = createWrapper({ navigable: true })
      const stepper = wrapper.findComponent(NbStepper)
      // Uncontrolled: walk forward through the flow, then back to the start.
      await wrapper.setProps({ stepper: { navigable: true, modelValue: 2 } })
      await wrapper.setProps({ stepper: { navigable: true, modelValue: 0 } })
      expect(
        stepper
          .findAll('button')
          .map((b) => b.find('.nb-stepper__label').text()),
      ).toEqual(['Workspace', 'Members'])
      // Step 4 was never reached, so it is still closed.
      expect(items(wrapper)[3].find('button').exists()).toBe(false)
    })

    it('takes furthest from the consumer when a saved flow is resumed', () => {
      const wrapper = createWrapper({
        modelValue: 0,
        furthest: 3,
        navigable: true,
      })
      expect(wrapper.findAll('button')).toHaveLength(3)
    })

    it('moves without a model value, so the stepper works uncontrolled', async () => {
      const wrapper = createWrapper({ navigable: true, furthest: 3 })
      await wrapper.findAll('button')[1].trigger('click')
      expect(statuses(wrapper)).toEqual([
        'complete',
        'complete',
        'current',
        'incomplete',
      ])
    })
  })

  describe('keyboard', () => {
    const navigable = () =>
      createWrapper({ modelValue: 3, navigable: true, furthest: 3 })

    it('gives the group a single tab stop', () => {
      const wrapper = navigable()
      const buttons = wrapper.findAll('button')
      expect(buttons.map((b) => b.attributes('tabindex'))).toEqual([
        '0',
        '-1',
        '-1',
      ])
    })

    it('moves the tab stop to wherever focus went', async () => {
      // Arrow to the third step, Tab away, come back: you should land where
      // you left, not at the start of the group.
      const wrapper = navigable()
      const buttons = wrapper.findAll('button')
      buttons[0].element.focus()
      await wrapper.find('ol').trigger('keydown', { key: 'End' })
      await nextTick()
      expect(document.activeElement).toBe(buttons[2].element)
      expect(
        wrapper.findAll('button').map((b) => b.attributes('tabindex')),
      ).toEqual(['-1', '-1', '0'])
    })

    it('falls back to the first reachable step when the flow moves under it', async () => {
      const wrapper = navigable()
      // Focus the first step, which holds the tab stop, then send the flow
      // back to it: it becomes the current step and stops being a button, so
      // the stop has to move somewhere that still exists.
      wrapper.findAll('button')[0].element.focus()
      await nextTick()
      await wrapper.setProps({
        stepper: { modelValue: 0, navigable: true, furthest: 3 },
      })
      expect(
        wrapper.findAll('button').map((b) => b.attributes('tabindex')),
      ).toEqual(['0', '-1', '-1'])
    })

    it('moves focus, not just the tab stop, when the focused step stops being a button', async () => {
      // The real failure the tabindex assertion above cannot see. `<component
      // :is>` replaces the focused <button> with a <div>, and a removed
      // element takes focus with it: without a handoff, activeElement is
      // <body> and the next Tab restarts at the top of the page.
      const wrapper = navigable()
      wrapper.findAll('button')[0].element.focus()
      await nextTick()
      await wrapper.setProps({
        stepper: { modelValue: 0, navigable: true, furthest: 3 },
      })
      await nextTick()
      await nextTick()

      expect(document.activeElement).not.toBe(document.body)
      const buttons = wrapper.findAll('button')
      expect(document.activeElement).toBe(buttons[0].element)
      expect(buttons[0].attributes('tabindex')).toBe('0')
    })

    it('still restores focus when the browser reports the loss as focusout with no relatedTarget', async () => {
      // The round 3 fix was written against jsdom, which fires nothing when a
      // focused element is removed. Firefox does: focusout with a null
      // relatedTarget, which is indistinguishable from "focus went to the
      // void" if relatedTarget is all you look at. Reading the null as a
      // deliberate departure switched the repair off in the one browser that
      // reports the case the repair exists for. This replays that event by
      // hand, because no test environment will produce it for us.
      const wrapper = navigable()
      const first = wrapper.findAll('button')[0].element
      first.focus()
      await nextTick()
      await wrapper.find('ol').trigger('focusout', { relatedTarget: null })

      await wrapper.setProps({
        stepper: { modelValue: 0, navigable: true, furthest: 3 },
      })
      await nextTick()
      await nextTick()

      expect(document.activeElement).toBe(wrapper.findAll('button')[0].element)
    })

    it('does not steal focus back from wherever the flow deliberately sent it', async () => {
      // A wizard that focuses the new step's heading has done the right
      // thing. Dragging focus back into the indicator would interrupt a
      // screen reader mid-sentence to say less.
      const wrapper = navigable()
      const heading = document.createElement('h2')
      heading.tabIndex = -1
      document.body.appendChild(heading)

      wrapper.findAll('button')[0].element.focus()
      await nextTick()
      await wrapper.find('ol').trigger('focusout', { relatedTarget: heading })
      heading.focus()

      await wrapper.setProps({
        stepper: { modelValue: 0, navigable: true, furthest: 3 },
      })
      await nextTick()
      await nextTick()

      expect(document.activeElement).toBe(heading)
      heading.remove()
    })

    it('leaves focus alone when the group never had it', async () => {
      // Advancing a wizard must not yank focus into the indicator from
      // whatever the user was actually typing in.
      const wrapper = navigable()
      const outside = document.createElement('input')
      document.body.appendChild(outside)
      outside.focus()

      await wrapper.setProps({
        stepper: { modelValue: 0, navigable: true, furthest: 3 },
      })
      await nextTick()
      await nextTick()

      expect(document.activeElement).toBe(outside)
      outside.remove()
    })

    it('moves focus with the arrow keys along the reading direction', async () => {
      const wrapper = navigable()
      const buttons = wrapper.findAll('button')
      buttons[0].element.focus()
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(buttons[1].element)
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(buttons[0].element)
      // Up and down belong to a vertical stepper, not this one.
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(buttons[0].element)
    })

    it('moves focus with up and down when vertical', async () => {
      const wrapper = createWrapper({
        modelValue: 3,
        navigable: true,
        orientation: 'vertical',
      })
      const buttons = wrapper.findAll('button')
      buttons[0].element.focus()
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowDown' })
      expect(document.activeElement).toBe(buttons[1].element)
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(buttons[1].element)
    })

    it('wraps at the ends and jumps with Home and End', async () => {
      const wrapper = navigable()
      const buttons = wrapper.findAll('button')
      await wrapper.find('ol').trigger('keydown', { key: 'End' })
      expect(document.activeElement).toBe(buttons[2].element)
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(buttons[0].element)
      await wrapper.find('ol').trigger('keydown', { key: 'Home' })
      expect(document.activeElement).toBe(buttons[0].element)
    })

    it('moves focus without selecting, so an arrow key cannot leave a form', async () => {
      const wrapper = navigable()
      await wrapper.find('ol').trigger('keydown', { key: 'ArrowRight' })
      expect(
        wrapper.findComponent(NbStepper).emitted('update:modelValue'),
      ).toBeUndefined()
    })
  })

  describe('layout', () => {
    it('carries the orientation and size on the root, not on each step', () => {
      const wrapper = createWrapper({ orientation: 'vertical', size: 'sm' })
      const root = wrapper.find('.nb-stepper')
      expect(root.classes()).toContain('nb-stepper--vertical')
      expect(root.classes()).toContain('nb-stepper--sm')
    })

    it('stamps the orientation onto every step so the scoped sheet can reach it', async () => {
      // The step's own layout, including the connector, selects on this.
      // Reading it off the parent's class instead needs :global(), which the
      // scoped compiler eats.
      const wrapper = createWrapper()
      expect(
        items(wrapper).map((li) => li.attributes('data-orientation')),
      ).toEqual(['horizontal', 'horizontal', 'horizontal', 'horizontal'])

      await wrapper.setProps({ stepper: { orientation: 'vertical' } })
      expect(
        items(wrapper).map((li) => li.attributes('data-orientation')),
      ).toEqual(['vertical', 'vertical', 'vertical', 'vertical'])
    })
  })

  // Asserted on the compiled output, not the source, for the reason
  // tests/sfc-styles.test.ts exists: a rule that never reaches the
  // stylesheet is indistinguishable from one that was never written.
  describe('styles', () => {
    // Sass first, then Vue's scoped transform, because the browser only ever
    // sees the second one. Round 2 asserted on the sass output alone and
    // certified rules that the scoped compiler had already deleted:
    // `:global(.a) .b { ... }` compiles to `.a { ... }`, so every orientation
    // rule, the connector's geometry and the floor width were being dropped
    // onto the consumer's wrapper while this block reported them present.
    const SCOPE = 'data-v-stepper'

    const css = (file: string) => {
      const src = readFileSync(
        join(__dirname, '../src/components', file),
        'utf8',
      )
      const { descriptor } = parse(src)
      const sass = compileString(
        descriptor.styles.map((s) => s.content).join('\n'),
        { syntax: 'scss' },
      ).css
      const compiled = compileStyle({
        source: sass,
        filename: file,
        id: SCOPE,
        scoped: descriptor.styles.some((s) => s.scoped),
      })
      expect(compiled.errors).toEqual([])
      return compiled.code
    }

    const rules = (sheet: string) =>
      sheet
        .split('}')
        .map((chunk) => chunk.trim())
        .filter(Boolean)

    it('is asserting on what the scoped compiler emits, not on raw sass', () => {
      // Guards the guard. If this stops holding, every assertion below is
      // measuring a stylesheet no browser receives.
      expect(css('StepperStep.vue')).toContain(`[${SCOPE}]`)
    })

    it('drives orientation off the step, never off an ancestor class', () => {
      const step = css('StepperStep.vue')

      // The exact shape of the round 2 defect: `:global(.nb-stepper--x) .y`
      // survives as a bare rule on the root wrapper and nothing reaches a
      // step. A scoped sheet for a step has no business styling the parent.
      for (const rule of rules(step)) {
        const selector = rule.split('{')[0]
        expect(
          /\.nb-stepper--(horizontal|vertical)\s*$/.test(selector.trim()),
          `orientation leaked onto the wrapper: ${selector.trim()}`,
        ).toBe(false)
      }
      expect(step).not.toContain(':global')

      // ...and the rules that replaced it do land on the step.
      expect(step).toMatch(
        /\.nb-stepper__step\[data-orientation=.?horizontal.?\]\[data-v-stepper\][^{]*\{[^}]*flex: 1 1 0/s,
      )
      expect(step).toMatch(
        /\.nb-stepper__step\[data-orientation=.?vertical.?\]\[data-v-stepper\]/,
      )
    })

    it('gives the connector a size in both orientations', () => {
      // The connector is the component: without geometry it is a zero-size
      // absolutely positioned span and the row reads as four loose labels.
      const step = css('StepperStep.vue')
      const line = rules(step).filter((r) =>
        r.split('{')[0].includes('.nb-stepper__line'),
      )

      const horizontal = line.find((r) =>
        /data-orientation=.?horizontal/.test(r),
      )
      expect(horizontal, 'no horizontal connector geometry').toBeTruthy()
      expect(horizontal).toContain('block-size: var(--nb-stepper-line)')
      // Runs from the far edge of the marker to the far edge of the step, in
      // the reading direction, whichever way that runs.
      expect(horizontal).toContain(
        'inset-inline: calc(var(--nb-stepper-marker) + var(--nb-stepper-gap)) 0',
      )

      const vertical = line.find((r) => /data-orientation=.?vertical/.test(r))
      expect(vertical, 'no vertical connector geometry').toBeTruthy()
      expect(vertical).toContain('inline-size: var(--nb-stepper-line)')
    })

    it('survives dir="rtl": no physical inline geometry anywhere', () => {
      // The connector, the marker-to-label gap and the step's floor width are
      // all measured along the reading direction. Pinned with left/right or
      // padding-right, an Arabic or Hebrew locale gets the rule drawn on the
      // side the sequence came from and the label padding on the wrong edge,
      // which is worse than useless because the docs sell `labels` as the
      // localisation hook.
      const declared = css('StepperStep.vue') + css('Stepper.vue')
      const banned =
        /(^|[;{\s])(left|right|padding-left|padding-right|margin-left|margin-right|border-left|border-right|text-align:\s*(left|right))\s*:/g
      const found = [...declared.matchAll(banned)].map((m) => m[2])
      expect(
        found,
        `physical inline properties in a component that must run both ways: ${found.join(', ')}`,
      ).toEqual([])
    })

    it('removes the trailing connector on the last step', () => {
      const rule = css('StepperStep.vue')
        .split('}')
        .find(
          (r) =>
            r.includes('.nb-stepper__step:last-child') &&
            r.includes('.nb-stepper__line'),
        )
      expect(rule, 'no :last-child rule for the connector').toBeTruthy()
      expect(rule).toContain('display: none')
    })

    it('gives every step a floor width and lets the row scroll past it', () => {
      // The narrow-viewport contract: five steps in a 360px viewport scroll
      // rather than becoming five 70px columns.
      const step = css('StepperStep.vue')
      expect(step).toContain('min-inline-size: var(--nb-stepper-step-min)')

      const list = css('Stepper.vue')
      expect(list).toContain('--nb-stepper-step-min:')
      const scroller = list
        .split('}')
        .find((r) => r.includes('.nb-stepper--horizontal .nb-stepper__list'))
      expect(scroller).toContain('overflow-x: auto')
    })

    it('honours every custom property it documents as an override', () => {
      // Two of these were consumed only inside the discarded :global() rules,
      // so the docs offered a branding knob that did nothing. A documented
      // custom property that no surviving declaration reads is a lie.
      const sheets = css('StepperStep.vue') + css('Stepper.vue')
      for (const token of [
        '--nb-stepper-marker',
        '--nb-stepper-gap',
        '--nb-stepper-line',
        '--nb-stepper-step-min',
      ]) {
        expect(
          sheets.includes(`var(${token}`),
          `${token} is documented but never read`,
        ).toBe(true)
      }
    })

    it('never truncates a label, because a clipped step cannot be identified', () => {
      const step = css('StepperStep.vue')
      expect(step).not.toContain('text-overflow')
      expect(step).toMatch(/\.nb-stepper__label[^}]*overflow-wrap: anywhere/s)
    })

    it('stands down its transitions under prefers-reduced-motion', () => {
      expect(css('StepperStep.vue')).toContain('prefers-reduced-motion: reduce')
    })

    it('only guards motion it actually sets', () => {
      // A reduced-motion block that turns off a property nothing turns on is
      // worse than no block: it is a claim in the docs that nothing backs.
      // The list scrolls itself when the flow advances past the visible
      // steps, so scroll-behavior is set, and therefore worth cancelling.
      const list = css('Stepper.vue')
      expect(list).toMatch(
        /\.nb-stepper--horizontal[^{]*\.nb-stepper__list[^{]*\{[^}]*scroll-behavior: smooth/s,
      )
      const guarded = list.slice(list.indexOf('prefers-reduced-motion'))
      expect(guarded).toContain('scroll-behavior: auto')
    })

    it('takes every font weight from the type scale, never a raw number', () => {
      // The scale is light/regular/semibold/bold. There is no 500, so a label
      // that wants "a bit heavier" gets semibold rather than a number a
      // branded product cannot reweight.
      const declared = css('StepperStep.vue') + css('Stepper.vue')
      const raw = [...declared.matchAll(/font-weight:\s*([^;]+);/g)]
        .map((m) => m[1].trim())
        .filter((value) => !value.startsWith('var(--nb-font-weight-'))
      expect(raw, `hardcoded font weights: ${raw.join(', ')}`).toEqual([])
    })

    it('takes every colour from a semantic token, never a brand ramp', () => {
      // A white-label consumer retheming --nb-c-primary must not find a
      // Nubisco colour name hardcoded here, which is the defect Button.vue
      // line 257 shipped.
      const declared = css('StepperStep.vue') + css('Stepper.vue')
      expect(declared).not.toMatch(
        /grape-hyacinth|emerald-reflection|phoenix-flames|chicken-comb|nouveau-gray/,
      )
      expect(declared).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    })
  })

  /**
   * A component that is not exported and not registered does not exist: the
   * plugin never sees it, `<NbStepper>` resolves to nothing, and every live
   * preview on the docs page renders blank. NbBanner shipped once as a named
   * export nobody added to components/index.ts and every build and type check
   * still passed.
   *
   * Two earlier rounds of this block were satisfied by a component that
   * shipped nowhere. Round 2 asserted `inMain === inIndex`, true when the name
   * is in neither. Round 3 accepted "declared in a pending JSON manifest",
   * which is a note to a future agent, not a shipped component, and it read
   * that manifest from an absolute path baked into the spec. Both let a green
   * suite certify a component no application could import. What follows reads
   * the three files a consumer's build actually reads, and nothing else.
   *
   * Read as text rather than imported: src/main.ts pulls in `virtual:icons`,
   * which only exists under the library's own vite config.
   */
  describe('shipping', () => {
    const root = resolve(__dirname, '..')
    const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
    const mainSrc = read('src/main.ts')
    const indexSrc = read('src/components/index.ts')
    const names = ['NbStepper', 'NbStepperStep']

    it.each(names)('%s is exported from src/main.ts', (name) => {
      expect(
        new RegExp(`export\\s*\\{\\s*default as ${name}\\s*\\}`).test(mainSrc),
        `${name} is not exported from src/main.ts, so nothing can import it`,
      ).toBe(true)
    })

    it.each(names)(
      '%s is registered in src/components/index.ts, so app.use(NubiscoUI) resolves the tag',
      (name) => {
        expect(
          new RegExp(`^import ${name} from '\\./\\w+\\.vue'$`, 'm').test(
            indexSrc,
          ),
          `src/components/index.ts never imports ${name}`,
        ).toBe(true)
        expect(
          new RegExp(`^\\s{2}${name},\\s*$`, 'm').test(indexSrc),
          `${name} is imported but never added to the registered object, ` +
            'so the global tag resolves to nothing at runtime',
        ).toBe(true)
      },
    )

    it('declares nothing globally that it does not also register', () => {
      // src/global.d.ts is what makes the failure silent: with the tag in the
      // global component map, vue-tsc passes on markup that renders blank.
      // A name may only appear there once it is genuinely registered.
      const globals = read('src/global.d.ts')
      for (const name of names) {
        if (!new RegExp(`\\b${name}:`).test(globals)) continue
        expect(
          new RegExp(`^\\s{2}${name},\\s*$`, 'm').test(indexSrc),
          `${name} is declared in src/global.d.ts but not registered: ` +
            'type-check green, runtime blank, which is the worst of both',
        ).toBe(true)
      }
    })

    it('is reachable from the docs sidebar', () => {
      expect(read('docs/.vitepress/config.ts')).toContain(
        "link: '/ui/components/stepper'",
      )
    })

    it('has the docs page the sidebar points at, using only shipped tags', () => {
      const page = resolve(root, 'docs/ui/components/stepper.md')
      expect(existsSync(page)).toBe(true)
      const md = readFileSync(page, 'utf8')
      const tags = new Set([...md.matchAll(/<(Nb[A-Za-z]+)/g)].map((m) => m[1]))
      for (const tag of tags) {
        if (!tag.startsWith('NbStepper')) continue
        expect(
          names.includes(tag) &&
            new RegExp(`^\\s{2}${tag},\\s*$`, 'm').test(indexSrc),
          `${tag} is used in the docs but is not registered, so that preview renders blank`,
        ).toBe(true)
      }
    })
  })
})
