import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Button } from 'react-bootstrap'
import { CheckLg, Link45deg } from 'react-bootstrap-icons'

interface CopyReferenceButtonProps {
  /** The reference to copy, e.g. `/activities/5` or `/resources/9`. */
  value: string
  className?: string
}

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall through to the execCommand fallback.
    }
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  } catch {
    return false
  }
}

/**
 * Copies an internal link reference (`/activities/5`, `/resources/9`) to the
 * clipboard so a teacher can paste it into a rich-text description.
 */
export default function CopyReferenceButton({
  value,
  className,
}: CopyReferenceButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const ok = await copyText(value)
    if (!ok) return

    setCopied(true)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      className={`py-0 px-2 small ${className ?? ''}`.trim()}
      title={`Copy ${value}`}
      aria-label={`Copy link reference ${value}`}
      onClick={handleClick}
    >
      {copied ? <CheckLg /> : <Link45deg />}
    </Button>
  )
}
