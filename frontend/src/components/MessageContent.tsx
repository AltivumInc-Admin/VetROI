import React from 'react'
import ReactMarkdown from 'react-markdown'

interface MessageContentProps {
  content: string
  role: 'user' | 'assistant' | 'system'
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, role }) => {
  // For user messages, render plain text
  if (role === 'user') {
    return <div className="message-text">{content}</div>
  }

  // For assistant messages, render markdown
  return (
    <div className="message-markdown">
      <ReactMarkdown 
        components={{
        // Custom renderers for better styling
        h1: ({children}) => <h3 className="message-heading-1">{children}</h3>,
        h2: ({children}) => <h4 className="message-heading-2">{children}</h4>,
        h3: ({children}) => <h5 className="message-heading-3">{children}</h5>,
        strong: ({children}) => <strong className="message-bold">{children}</strong>,
        em: ({children}) => <em className="message-italic">{children}</em>,
        ul: ({children}) => <ul className="message-list">{children}</ul>,
        ol: ({children}) => <ol className="message-list message-list-ordered">{children}</ol>,
        li: ({children}) => <li className="message-list-item">{children}</li>,
        p: ({children}) => <p className="message-paragraph">{children}</p>,
        code: ({children}) => {
          const inline = !String(children).includes('\n')
          return inline 
            ? <code className="message-code-inline">{children}</code>
            : <pre className="message-code-block"><code>{children}</code></pre>
        },
        blockquote: ({children}) => <blockquote className="message-quote">{children}</blockquote>,
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}