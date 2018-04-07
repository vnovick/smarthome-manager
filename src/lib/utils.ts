export function distinct(items: object[], prop: String) {
  const unique: any = []
  const distinctItems: any = []

  items.forEach((item: any) => {
    const uqItem = item[`${prop}`]
    if (!unique.includes(uqItem)) {
      distinctItems.push(item)
    }
    unique[uqItem] = 0
  })
  return distinctItems
}

export function camelize(str: String) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    })
    .replace(/\s+/g, '')
}

export const NOOP = () => {
  return
}
