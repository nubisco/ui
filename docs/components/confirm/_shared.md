<script setup lang="ts">
import { ref } from 'vue'
import { useConfirm } from '../../../src'

const confirm = useConfirm()

const basicAnswer = ref('not asked yet')
const subjectAnswer = ref('not asked yet')
const asyncAnswer = ref('not asked yet')
const typedAnswer = ref('not asked yet')
const hungAnswer = ref('not asked yet')
const neutralAnswer = ref('not asked yet')

const say = (value: boolean) => (value ? 'confirmed' : 'cancelled')

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runBasic() {
  basicAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'staging-eu',
      message: 'Every entry, release and API key in it is deleted.',
      confirmLabel: 'Delete environment',
    }),
  )
}

async function runSubject() {
  subjectAnswer.value = say(
    await confirm({
      title: 'Revoke API key',
      subjectLabel: 'Key',
      subject: 'nb_live_7f3a91c0',
      message: 'Any integration still using this key stops working immediately.',
      confirmLabel: 'Revoke key',
    }),
  )
}

async function runAsync() {
  asyncAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'staging-eu',
      message: 'Try clicking Delete twice while it runs.',
      confirmLabel: 'Delete environment',
      busyLabel: 'Deleting...',
      onConfirm: () => wait(2000),
    }),
  )
}

async function runFailing() {
  asyncAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'production',
      confirmLabel: 'Delete environment',
      busyLabel: 'Deleting...',
      onConfirm: async () => {
        await wait(900)
        throw new Error('Environment is locked by an active release.')
      },
    }),
  )
}

async function runHung() {
  hungAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'staging-eu',
      message: 'This request never comes back. The dialog gives up after 4s.',
      confirmLabel: 'Delete environment',
      busyLabel: 'Deleting...',
      onConfirm: () => new Promise(() => {}),
      timeout: 4000,
      timeoutMessage: 'The API did not answer. It may still be running.',
    }),
  )
}

async function runTyped() {
  typedAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'production',
      message: 'This deletes 1,204 entries, 38 releases and 4 API keys.',
      confirmLabel: 'Delete environment',
      typeToConfirm: 'production',
      typeToConfirmHelper: 'Case sensitive.',
    }),
  )
}

async function runNeutral() {
  neutralAnswer.value = say(
    await confirm({
      title: 'Publish release',
      tone: 'neutral',
      subjectLabel: 'Release',
      subject: '2026.9.0',
      message: 'The release becomes visible to every reader immediately.',
      confirmLabel: 'Publish release',
    }),
  )
}
</script>
