"use client";

import React from "react";
import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

/**
 * Renders mixed text containing display math ($$...$$) and inline math ($...$ or \$ escaped dollars)
 * using KaTeX.
 */
export function MathText({ text, className = "", block = false }: MathTextProps) {
  if (!text) return null;

  // Placeholder for escaped dollar signs \$
  const ESCAPED_DOLLAR = "\u0000DOLLAR\u0000";
  const normalized = text.replace(/\\\$/g, ESCAPED_DOLLAR);

  // Split by display math $$...$$ or inline math $...$
  const tokenRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  const parts = normalized.split(tokenRegex);

  const Wrapper = block ? "div" : "span";

  return (
    <Wrapper className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;

        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
          const latex = part.slice(2, -2).replaceAll(ESCAPED_DOLLAR, "\\$").trim();
          try {
            const html = katex.renderToString(latex, {
              displayMode: true,
              throwOnError: false,
              strict: false,
            });
            return (
              <span
                key={idx}
                className="math-display"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={idx}>{latex}</code>;
          }
        }

        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const latex = part.slice(1, -1).replaceAll(ESCAPED_DOLLAR, "\\$").trim();
          try {
            const html = katex.renderToString(latex, {
              displayMode: false,
              throwOnError: false,
              strict: false,
            });
            return (
              <span
                key={idx}
                className="math-inline"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={idx}>{latex}</code>;
          }
        }

        const plainText = part.replaceAll(ESCAPED_DOLLAR, "$");
        return <React.Fragment key={idx}>{plainText}</React.Fragment>;
      })}
    </Wrapper>
  );
}

export function FormulaBlock({ latex }: { latex: string }) {
  try {
    const html = katex.renderToString(latex, {
      displayMode: true,
      throwOnError: false,
      strict: false,
    });
    return (
      <div
        className="formula-banner"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <pre className="formula-banner">{latex}</pre>;
  }
}
