import { Plugin } from 'vite'

export const VitePlugin = <T extends Plugin>(p: T): Plugin & T => p
