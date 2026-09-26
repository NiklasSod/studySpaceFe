export interface InternalLinkRef {
  type: 'activity' | 'resource'
  id: number
  path: string
}

/**
 * Matches hand-written references such as `/activities/5` or `/resources/9`
 * in rich-text descriptions. Teachers type these references and the frontend
 * turns them into links to the dedicated activity/resource views.
 */
const REFERENCE_REGEX = /\/activities\/(\d+)\b|\/resources\/(\d+)\b/g

/** Strips HTML tags so references can be found in raw description markup. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

/** A reference must not be glued to a word character or another slash. */
function isBoundaryChar(char: string | undefined): boolean {
  if (char === undefined) return true
  return !/[\w/]/.test(char)
}

export function extractInternalLinks(
  html: string | null | undefined,
): InternalLinkRef[] {
  const text = stripHtml(html ?? '')
  const refs: InternalLinkRef[] = []
  const seen = new Set<string>()
  let match: RegExpExecArray | null

  REFERENCE_REGEX.lastIndex = 0
  while ((match = REFERENCE_REGEX.exec(text)) !== null) {
    if (!isBoundaryChar(text[match.index - 1])) continue

    let type: 'activity' | 'resource'
    let id: number
    if (match[1] !== undefined) {
      type = 'activity'
      id = Number(match[1])
    } else if (match[2] !== undefined) {
      type = 'resource'
      id = Number(match[2])
    } else {
      continue
    }

    const key = `${type}:${id}`
    if (seen.has(key)) continue
    seen.add(key)

    refs.push({ type, id, path: match[0] })
  }

  return refs
}

/** True when an anchor href is an internal activity/resource reference. */
export function isInternalLinkPath(href: string | null | undefined): boolean {
  if (!href) return false
  return /^\/(activities|resources)\/\d+\/?$/.test(href)
}
