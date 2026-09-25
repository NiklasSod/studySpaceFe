import { createElement, useMemo, type CSSProperties, type ReactNode } from 'react'
import { sanitizeRichText } from '../../utils/richTextSanitize'
import InlineAudioPlayer from './InlineAudioPlayer'

interface ResourceDescriptionProps {
  html?: string | null
  audioUrls?: string[]
  className?: string
}

const AUDIO_MARKER_SOURCE = '\\[\\[audio:(\\d+)\\]\\]'

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'a',
  'span',
])

function styleStringToObject(style: string | null): CSSProperties | undefined {
  if (!style) return undefined

  const result: Record<string, string> = {}
  for (const part of style.split(';')) {
    const separator = part.indexOf(':')
    if (separator === -1) continue
    const rawKey = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (!rawKey || !value) continue
    const key = rawKey.replace(/-([a-z])/g, (_, char: string) =>
      char.toUpperCase(),
    )
    result[key] = value
  }
  return result as CSSProperties
}

function splitTextIntoNodes(
  text: string,
  audioUrls: string[] | undefined,
): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = new RegExp(AUDIO_MARKER_SOURCE, 'g')
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const index = Number(match[1])
    const url = audioUrls?.[index]
    if (
      Number.isInteger(index) &&
      typeof url === 'string' &&
      url.startsWith('https://')
    ) {
      nodes.push(<InlineAudioPlayer key={`audio-${match.index}`} src={url} />)
    } else {
      nodes.push(match[0])
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function domToReact(
  node: Node,
  audioUrls: string[] | undefined,
  key: number,
): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const nodes = splitTextIntoNodes(node.nodeValue ?? '', audioUrls)
    if (nodes.length === 0) return null
    if (nodes.length === 1) return nodes[0]
    return <span key={key}>{nodes}</span>
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const element = node as Element
  const tag = element.tagName.toLowerCase()

  const children: ReactNode[] = []
  element.childNodes.forEach((child, index) => {
    const rendered = domToReact(child, audioUrls, index)
    if (rendered !== null && rendered !== undefined) {
      children.push(rendered)
    }
  })

  const style = styleStringToObject(element.getAttribute('style'))

  if (!ALLOWED_TAGS.has(tag)) {
    return <span key={key}>{children}</span>
  }

  if (tag === 'br') {
    return createElement('br', { key })
  }

  const props: Record<string, unknown> = { key }
  if (style) props.style = style
  if (tag === 'a') {
    props.href = element.getAttribute('href') ?? undefined
  }

  return createElement(tag, props, ...children)
}

/**
 * Renders a sanitized resource description, replacing `[[audio:N]]` markers
 * with compact inline play/pause buttons that reference `audioUrls[N]`.
 * Out-of-range or non-HTTPS URLs are left as plain marker text.
 */
export default function ResourceDescription({
  html,
  audioUrls,
  className,
}: ResourceDescriptionProps) {
  const children = useMemo(() => {
    const clean = sanitizeRichText(html)
    const doc = new DOMParser().parseFromString(clean, 'text/html')
    const nodes: ReactNode[] = []
    doc.body.childNodes.forEach((node, index) => {
      const rendered = domToReact(node, audioUrls, index)
      if (rendered !== null && rendered !== undefined) {
        nodes.push(rendered)
      }
    })
    return nodes
  }, [html, audioUrls])

  return (
    <div className={`rich-text-display ${className ?? ''}`.trim()}>{children}</div>
  )
}
