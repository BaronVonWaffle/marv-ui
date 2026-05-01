import { BRAND } from './colors';

const sans = 'Arial, sans-serif';
const mono = "'JetBrains Mono', monospace";

// Minimal markdown renderer used by Desk Intelligence surfaces (HouseView,
// AnalystTeamBlock). Handles:
//   - bullet lines starting with "-" or "·"
//   - paragraph breaks on blank lines
//   - **bold** and `inline code` inline emphasis
//   - lines starting with "**Label**" are rendered as definition-style rows
// Does NOT handle links, headings, nested lists, tables. Keep small —
// the analyst-team content is written in a constrained format.

function renderInline(text) {
  // Split by ** for bold and ` for code, preserving the delimiters so we
  // can render them. Very simple token walk.
  const parts = [];
  let buf = '';
  let i = 0;
  while (i < text.length) {
    if (text.slice(i, i + 2) === '**') {
      if (buf) parts.push({ t: 'text', v: buf });
      buf = '';
      const end = text.indexOf('**', i + 2);
      if (end < 0) {
        buf = text.slice(i);
        i = text.length;
      } else {
        parts.push({ t: 'bold', v: text.slice(i + 2, end) });
        i = end + 2;
      }
    } else if (text[i] === '`') {
      if (buf) parts.push({ t: 'text', v: buf });
      buf = '';
      const end = text.indexOf('`', i + 1);
      if (end < 0) {
        buf = text.slice(i);
        i = text.length;
      } else {
        parts.push({ t: 'code', v: text.slice(i + 1, end) });
        i = end + 1;
      }
    } else {
      buf += text[i];
      i++;
    }
  }
  if (buf) parts.push({ t: 'text', v: buf });
  return parts.map((p, j) => {
    if (p.t === 'bold') {
      return (
        <strong key={j} style={{ color: BRAND.text, fontWeight: 700 }}>
          {p.v}
        </strong>
      );
    }
    if (p.t === 'code') {
      return (
        <code
          key={j}
          style={{
            fontFamily: mono,
            fontSize: '0.94em',
            background: BRAND.altRow,
            color: BRAND.text,
            padding: '1px 4px',
            borderRadius: 2,
          }}
        >
          {p.v}
        </code>
      );
    }
    return <span key={j}>{p.v}</span>;
  });
}

export default function renderMarkdown(md, opts = {}) {
  if (!md || !md.trim()) return null;
  const bulletSize = opts.bulletSize || 11;
  const paraSize = opts.paraSize || 11.5;
  const paraColor = opts.paraColor || BRAND.text;

  const lines = md.replace(/\r\n/g, '\n').split('\n');

  const blocks = [];
  let currentList = null;
  let currentPara = [];

  const flushPara = () => {
    if (currentPara.length) {
      blocks.push({ type: 'p', text: currentPara.join(' ').trim() });
      currentPara = [];
    }
  };
  const flushList = () => {
    if (currentList) {
      blocks.push({ type: 'ul', items: currentList });
      currentList = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const bullet = line.match(/^[-·]\s+(.+)/);
    if (bullet) {
      flushPara();
      if (!currentList) currentList = [];
      currentList.push(bullet[1]);
    } else {
      flushList();
      currentPara.push(line);
    }
  }
  flushPara();
  flushList();

  return blocks.map((b, i) => {
    if (b.type === 'p') {
      return (
        <p
          key={i}
          style={{
            margin: '0 0 10px 0',
            fontFamily: sans,
            fontSize: paraSize,
            color: paraColor,
            lineHeight: 1.65,
          }}
        >
          {renderInline(b.text)}
        </p>
      );
    }
    return (
      <ul
        key={i}
        style={{
          margin: '0 0 12px 0',
          paddingLeft: 20,
          listStyle: 'disc',
        }}
      >
        {b.items.map((item, j) => (
          <li
            key={j}
            style={{
              marginBottom: 6,
              fontFamily: sans,
              fontSize: bulletSize,
              color: BRAND.text,
              lineHeight: 1.55,
            }}
          >
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
  });
}
