import {
  createElement,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useNavigate, type NavigateFunction } from 'react-router-dom'
import { sanitizeRichText } from '../../utils/richTextSanitize'
import { useAuth } from '../../auth/AuthContext'

interface LinkedRichTextProps {
  html?: string | null
  className?: string
}

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

const REFERENCE_REGEX = /\/activities\/(\d+)\b|\/resources\/(\d+)\b/g

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

function isBoundaryChar(char: string | undefined): boolean {
  if (char === undefined) return true
  return !/[\w/]/.test(char)
}

function splitTextIntoNodes(
  text: string,
  base: string,
  navigate: NavigateFunction,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  REFERENCE_REGEX.lastIndex = 0
  while ((match = REFERENCE_REGEX.exec(text)) !== null) {
    if (!isBoundaryChar(text[match.index - 1])) continue

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const path = match[0]
    nodes.push(
      createElement(
        'a',
        {
          key: `ref-${match.index}`,
          href: `${base}${path}`,
          className: 'internal-link',
          onClick: (event: React.MouseEvent) => {
            event.preventDefault()
            event.stopPropagation()
            navigate(`${base}${path}`)
          },
        },
        path,
      ),
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

function domToReact(
  node: Node,
  base: string,
  navigate: NavigateFunction,
  key: number,
): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const nodes = splitTextIntoNodes(node.nodeValue ?? '', base, navigate)
    if (nodes.length === 0) return null
    if (nodes.length === 1) return nodes[0]
    return createElement('span', { key }, nodes)
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const element = node as Element
  const tag = element.tagName.toLowerCase()

  const children: ReactNode[] = []
  element.childNodes.forEach((child, index) => {
    const rendered = domToReact(child, base, navigate, index)
    if (rendered !== null && rendered !== undefined) {
      children.push(rendered)
    }
  })

  const style = styleStringToObject(element.getAttribute('style'))

  if (!ALLOWED_TAGS.has(tag)) {
    return createElement('span', { key }, children)
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
 * Renders sanitized rich text and turns hand-written `/activities/{id}` and
 * `/resources/{id}` references into clickable links that navigate to the
 * dedicated detail views (role-aware).
 */
export default function LinkedRichText({
  html,
  className,
}: LinkedRichTextProps) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const base = role === 'student' ? '/student' : '/teacher'

  const nodes = useMemo(() => {
    const clean = sanitizeRichText(html)
    const doc = new DOMParser().parseFromString(clean, 'text/html')
    const children: ReactNode[] = []
    doc.body.childNodes.forEach((node, index) => {
      const rendered = domToReact(node, base, navigate, index)
      if (rendered !== null && rendered !== undefined) {
        children.push(rendered)
      }
    })
    return children
  }, [html, base, navigate])

  return (
    <div className={`rich-text-display ${className ?? ''}`.trim()}>{nodes}</div>
  )
}
