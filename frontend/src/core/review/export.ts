import type { PdfAnnotation } from '@/core/annotations/types';

export function exportReviewJson(annotations: PdfAnnotation[]): void {
  const data = JSON.stringify(annotations, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `review-summary-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportReviewText(annotations: PdfAnnotation[]): void {
  const lines: string[] = [];
  lines.push('REVIEW SUMMARY');
  lines.push('==============');
  lines.push('');

  const sorted = [...annotations].sort((a, b) => a.pageNumber - b.pageNumber || b.updatedAt - a.updatedAt);

  for (const ann of sorted) {
    const author = ann.data.author || 'Unknown';
    const status = ann.data.reviewStatus || 'open';
    const text = ann.data.text || `[${ann.type}]`;
    const date = new Date(ann.createdAt).toLocaleString();

    lines.push(`Page ${ann.pageNumber} - ${status.toUpperCase()} (by ${author} at ${date})`);
    if (ann.data.category) {
      lines.push(`Category: ${ann.data.category}`);
    }
    lines.push(`Comment: ${text}`);

    if (Array.isArray(ann.data.replies) && ann.data.replies.length > 0) {
      lines.push('Replies:');
      for (const reply of ann.data.replies) {
        const rDate = new Date(reply.createdAt).toLocaleString();
        lines.push(`  - ${reply.author} (${rDate}): ${reply.text}`);
      }
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `review-summary-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
