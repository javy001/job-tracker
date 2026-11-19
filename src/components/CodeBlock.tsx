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
          className={`m-0 overflow-x-auto rounded-md border bg-[#0e0f11] px-4 py-3 font-mono text-xs leading-relaxed text-[#e7e8ea] ${className}`}
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
