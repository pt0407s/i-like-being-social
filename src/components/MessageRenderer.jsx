import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

function MessageRenderer({ content, isMarkdown }) {
  if (!content) return null

  if (isMarkdown) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        className="prose prose-invert prose-sm max-w-none"
        components={{
          // Custom styling for markdown elements
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline">
              {children}
            </a>
          ),
          code: ({ inline, className, children }) => {
            if (inline) {
              return <code className="bg-dark-800 px-1.5 py-0.5 rounded text-sm text-accent-400">{children}</code>
            }
            return <code className={className}>{children}</code>
          },
          pre: ({ children }) => (
            <pre className="bg-dark-900 p-3 rounded-lg overflow-x-auto my-2 border border-dark-700">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-500 pl-4 py-1 my-2 italic text-dark-300">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-2">{children}</h3>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-dark-700">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-dark-700 px-3 py-2 bg-dark-800 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-dark-700 px-3 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    )
  }

  // Regular text with basic formatting
  return <div className="whitespace-pre-wrap break-words">{content}</div>
}

export default MessageRenderer
