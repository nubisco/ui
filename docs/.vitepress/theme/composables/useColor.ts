import tinycolor from 'tinycolor2'
import { str2kebab } from '@nubisco/ui/utils/str2kebab.helper'

export function useColor() {
  const getColorName = async (color) => {
    return await fetch(
      `https://api.color.pizza/v1/?values=${color.replace('#', '')}`,
    )
      .then((response) => {
        return response.json()
      })
      .then((response) => {
        return str2kebab(response.paletteTitle)
      })
  }

  const getColorKey = (value, colorObject) => {
    for (const key in colorObject) {
      if (colorObject[key].replace('#', '') === value.replace('#', '')) {
        return key
      }
    }
    return null // Return null if the value is not found
  }

  const lightness = (color) => {
    const result = tinycolor(color).toHsl().l * 100
    return result
  }

  const changeColor = (color, options) => {
    const { h, s } = tinycolor(color).toHsl()
    const result = tinycolor({ h, s, l: options.l }).toHex()
    return result
  }

  const colorLevel = (color) => {
    return Math.min(
      Math.max(Math.round((100 - lightness(color) / 1) / 10) * 100, 100),
      900,
    )
  }

  const mix = (color1, color2, amount) => {
    return tinycolor.mix(color1, color2, amount)
  }

  const makeShades = (color1, color2 = null) => {
    let level1 = colorLevel(color1)
    let shades = {}

    if (color2 === null || typeof color2 !== 'string') {
      for (let i = 2; i <= 18; i++) {
        const step = i * 50
        if (step === level1) {
          shades[step] = color1.replace('#', '')
        } else {
          shades[step] = changeColor(color1, { l: 100 - i * 5 })
        }
      }
    } else {
      let level2 = colorLevel(color2)

      if (level2 < level1) {
        ;[color1, color2] = [color2, color1]
        ;[level1, level2] = [level2, level1]
      }

      if (level1 > 100) {
        for (let i = 2; i <= level1 / 50; i++) {
          shades[i * 50] = changeColor(color1, { l: 100 - i * 5 })
        }
      }

      shades[level1] = color1

      for (let i = level1 / 50 + 1; i <= level2 / 50; i++) {
        const weight =
          100 - ((i - level1 / 50) / (level2 / 50 - level1 / 50)) * 100
        shades[i * 50] = mix(color1, color2, weight)
      }

      shades[level2] = color2

      if (level2 < 900) {
        for (let i = level2 / 50 + 1; i <= 18; i++) {
          shades[i * 50] = changeColor(color2, { l: 100 - i * 5 })
        }
      }
    }

    const defaultColorCode = getColorKey(color1, shades)

    const newShades = {}
    Object.keys(shades).forEach((colorKey) => {
      newShades[colorKey] = {
        original: shades[colorKey],
        a11y: tinycolor
          .mostReadable(
            shades[colorKey],
            [
              shades[100],
              shades[150],
              shades[200],
              shades[250],
              shades[300],
              shades[350],
              shades[400],
              shades[450],
              shades[500],
              shades[550],
              shades[600],
              shades[650],
              shades[700],
              shades[750],
              shades[800],
              shades[850],
              shades[900],
            ],
            {
              includeFallbackColors: true,
            },
          )
          .toHexString()
          .replace('#', ''),
      }
    })

    return {
      all: newShades,
      default: defaultColorCode,
    }
  }

  return {
    getColorName,
    makeShades,
  }
}
