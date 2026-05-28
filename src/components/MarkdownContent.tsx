import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  source: string;
  className?: string;
}

export function MarkdownContent({ source, className }: MarkdownContentProps) {
  const classes = ['app-markdown', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          )
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
