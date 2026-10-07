export interface InternalLinkRef {
  type: 'activity' | 'resource'
  id: number
  path: string
  /** Custom link text from `[label](/activities/5)` syntax, if provided. */
  label?: string
}

export interface ParsedReference {
  start: number
  end: number
  text: string
  ref: InternalLinkRef
}

/**
 * Matches hand-written references in rich-text descriptions:
 * - `/activities/5` / `/resources/9`
 * - `[read pages 4-5](/activities/5)` — custom link text
 */
const REFERENCE_SOURCE =
  /\[([^\]]+)\]\s*\(\s*\/\s*(activities|resources)\s*\/\s*(\d+)\s*\)|\/(activities|resources)\/(\d+)\b/g

/** Extracts plain text so references can be found in raw description markup. */
function extractText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}

/** A reference must not be glued to a word character or another slash. */
function isBoundaryChar(char: string | undefined): boolean {
  if (char === undefined) return true
  return !/[\w/]/.test(char)
}

export function parseInternalReferences(text: string): ParsedReference[] {
  const references: ParsedReference[] = []
  const regex = new RegExp(REFERENCE_SOURCE.source, 'g')
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (!isBoundaryChar(text[match.index - 1])) continue

    let plural: 'activities' | 'resources'
    let id: number
    let label: string | undefined

    if (match[1] !== undefined) {
      plural = match[2] as 'activities' | 'resources'
      id = Number(match[3])
      label = match[1].trim() || undefined
    } else if (match[4] !== undefined) {
      plural = match[4] as 'activities' | 'resources'
      id = Number(match[5])
    } else {
      continue
    }

    const type = plural === 'activities' ? 'activity' : 'resource'

    references.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
      ref: { type, id, path: `/${plural}/${id}`, label },
    })
  }

  return references
}

export function extractInternalLinks(
  html: string | null | undefined,
): InternalLinkRef[] {
  const text = extractText(html ?? '')
  const refs: InternalLinkRef[] = []
  const seen = new Set<string>()

  for (const { ref } of parseInternalReferences(text)) {
    const key = `${ref.type}:${ref.id}`
    if (seen.has(key)) continue
    seen.add(key)
    refs.push(ref)
  }

  return refs
}

/** True when an anchor href is an internal activity/resource reference. */
export function isInternalLinkPath(href: string | null | undefined): boolean {
  if (!href) return false
  return /^\/(activities|resources)\/\d+\/?$/.test(href)
}
