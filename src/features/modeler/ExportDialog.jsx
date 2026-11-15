import { useMemo, useState } from 'react';
import { Copy, Check, Download, FileCode } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-r';
import Dialog from '../../components/ui/Dialog';
import { downloadText } from '../../utils/download';

/** Generated Python/R code with copy and download. Highlighting uses theme tokens. */
export default function ExportDialog({ lang, code, filename, onClose }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => Prism.highlight(code, Prism.languages[lang === 'r' ? 'r' : 'python'], lang), [code, lang]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Dialog
      title={lang === 'r' ? 'R code (deSolve)' : 'Python code (SciPy)'}
      icon={<FileCode size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />}
      onClose={onClose}
      width={860}
      footer={(
        <>
          <button className="btn" onClick={() => downloadText(filename, code)}><Download size={16} /> Download {filename}</button>
          <button className="btn btn-primary" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy code'}</button>
        </>
      )}
    >
      <p className="hint" style={{ marginTop: 0 }}>
        {lang === 'r'
          ? 'Uses deSolve with the same fixed-step method and time grid as the app, so it should reproduce the in-app run.'
          : 'Uses scipy.integrate.odeint (adaptive LSODA). Results agree with the app within numerical tolerance, not digit for digit.'}
      </p>
      {/* Prism escapes the source text before adding token markup. */}
      <pre className="code" aria-label={`${lang} source code`}><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </Dialog>
  );
}
