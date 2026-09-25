import { useEffect, type ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  BackgroundColor,
  Color,
  FontSize,
  TextStyle,
} from '@tiptap/extension-text-style'
import { Button, ButtonGroup, Form } from 'react-bootstrap'
import {
  TypeBold,
  TypeItalic,
  TypeUnderline,
  TypeStrikethrough,
  TypeH1,
  TypeH2,
  TypeH3,
  ListUl,
  ListOl,
  Paragraph,
  Eraser,
  XLg,
} from 'react-bootstrap-icons'
import './richText.css'

interface RichTextEditorProps {
  value?: string | null
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '16px' },
  { label: 'Large', value: '20px' },
  { label: 'Extra large', value: '28px' },
  { label: 'Heading', value: '36px' },
]

interface ToolbarButtonProps {
  title: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      variant="outline-secondary"
      size="sm"
      className="rich-text-toolbar-btn"
      active={active}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  )
}

const EMPTY_HTML = '<p></p>'

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 140,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      BackgroundColor,
      FontSize,
    ],
    content: value ?? '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html === EMPTY_HTML ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content',
        style: `min-height: ${minHeight}px`,
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = value ?? ''
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) {
    return <div className="rich-text-editor" style={{ minHeight }} />
  }

  const fontSize = editor.getAttributes('textStyle').fontSize || ''

  return (
    <div className="rich-text-editor">
      <div
        className="rich-text-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <ButtonGroup size="sm" className="me-1 mb-1">
          <ToolbarButton
            title="Paragraph"
            active={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Paragraph />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <TypeH1 />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <TypeH2 />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <TypeH3 />
          </ToolbarButton>
        </ButtonGroup>

        <ButtonGroup size="sm" className="me-1 mb-1">
          <ToolbarButton
            title="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <TypeBold />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <TypeItalic />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <TypeUnderline />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <TypeStrikethrough />
          </ToolbarButton>
        </ButtonGroup>

        <ButtonGroup size="sm" className="me-1 mb-1">
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <ListUl />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOl />
          </ToolbarButton>
        </ButtonGroup>

        <Form.Select
          size="sm"
          className="rich-text-size-select me-1 mb-1"
          value={fontSize}
          onChange={(e) => {
            const size = e.target.value
            if (size) {
              editor.chain().focus().setFontSize(size).run()
            } else {
              editor.chain().focus().unsetFontSize().run()
            }
          }}
          aria-label="Font size"
        >
          <option value="">Font size</option>
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </Form.Select>

        <div className="rich-text-color-control me-1 mb-1">
          <input
            type="color"
            className="rich-text-color-input"
            defaultValue="#000000"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            title="Text color"
            aria-label="Text color"
          />
          <Button
            variant="outline-secondary"
            size="sm"
            className="rich-text-toolbar-btn"
            title="Clear text color"
            aria-label="Clear text color"
            onClick={() => editor.chain().focus().unsetColor().run()}
          >
            <XLg />
          </Button>
        </div>

        <div className="rich-text-color-control me-1 mb-1">
          <input
            type="color"
            className="rich-text-color-input"
            defaultValue="#ffff00"
            onChange={(e) =>
              editor.chain().focus().setBackgroundColor(e.target.value).run()
            }
            title="Highlight color"
            aria-label="Highlight color"
          />
          <Button
            variant="outline-secondary"
            size="sm"
            className="rich-text-toolbar-btn"
            title="Clear highlight"
            aria-label="Clear highlight"
            onClick={() => editor.chain().focus().unsetBackgroundColor().run()}
          >
            <XLg />
          </Button>
        </div>

        <ToolbarButton
          title="Clear formatting"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <Eraser />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
