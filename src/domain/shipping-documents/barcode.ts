/**
 * Minimal Code 39-style barcode bars for printable labels.
 * Not a certified symbology — enough for demo tracking visuals.
 */
const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '*': 'nwnnwnwnn',
}

function encodeSymbol(char: string): string {
  return CODE39[char] ?? CODE39['-']!
}

/** Returns an SVG path of vertical bars for `value` (alphanumeric). */
export function barcodeBars(value: string): Array<{ x: number; width: number }> {
  const payload = `*${value.toUpperCase().replace(/[^A-Z0-9\-.\s]/g, '')}*`
  const narrow = 1
  const wide = 2.4
  const gap = 1
  const bars: Array<{ x: number; width: number }> = []
  let x = 0

  for (const char of payload) {
    const pattern = encodeSymbol(char)
    for (let i = 0; i < pattern.length; i += 1) {
      const isBar = i % 2 === 0
      const width = pattern[i] === 'w' ? wide : narrow
      if (isBar) bars.push({ x, width })
      x += width
    }
    x += gap
  }

  return bars
}

export function barcodeViewBox(value: string): { width: number; height: number } {
  const bars = barcodeBars(value)
  const last = bars[bars.length - 1]
  return { width: last ? last.x + last.width + 4 : 100, height: 48 }
}
