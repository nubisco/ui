import Unfonts from 'unplugin-fonts/vite'

export const fonts = () =>
  Unfonts({
    google: {
      injectTo: 'head-prepend',

      families: [
        {
          name: 'Plus+Jakarta+Sans',
          styles: 'ital,wght@0,200..800;1,200..800',
        },
        {
          name: 'Fira+Code',
          styles: 'wght@300..700',
        },
      ],
    },
  })
