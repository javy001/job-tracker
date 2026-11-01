import { Highlight, themes } from 'prism-react-renderer';

interface Props {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'python' }: Props) {
  return (
    <Highlight code={code} language={language} theme={themes.oneDark}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        // Keep the panel's own background; the theme supplies token colors
        <pre
          className={`flashcards-solution ${className}`}
          style={{ ...style, background: undefined }}
        >
          <code>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}
