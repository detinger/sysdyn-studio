import { MathJax } from 'better-react-mathjax';

const OPTIONS = { fn: 'tex2chtml' };

/**
 * TeX rendered by MathJax in "pre" mode: the TeX string is converted to markup
 * directly. This avoids the async DOM-typesetting race of "post" mode, which
 * throws when an element unmounts before typesetting finishes.
 */
export default function Tex({ tex, inline = false }) {
  return <MathJax renderMode="pre" typesettingOptions={OPTIONS} text={tex} inline={inline} dynamic />;
}
