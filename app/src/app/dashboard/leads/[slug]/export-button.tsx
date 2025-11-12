"use client";

interface ExportButtonProps {
  leads: Array<{
    id: string;
    created_at: string;
    form_data: Record<string, unknown> | null;
  }>;
  slug: string;
}

export function ExportButton({ leads, slug }: ExportButtonProps) {
  const handleExport = () => {
    if (!leads || leads.length === 0) return;

    // Get all unique keys from all leads
    const allKeys = new Set<string>();
    leads.forEach((lead) => {
      if (lead.form_data && typeof lead.form_data === 'object') {
        Object.keys(lead.form_data).forEach((key) => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys);
    const csv = [
      ['Date', ...headers].join(','),
      ...leads.map((lead) => {
        const row = [
          new Date(lead.created_at).toLocaleString('fr-FR'),
          ...headers.map((h) => {
            const value = lead.form_data?.[h];
            if (value === null || value === undefined) return '';
            // Escape commas and quotes in CSV
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }),
        ];
        return row.join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${slug}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!leads || leads.length === 0}
      className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      Exporter CSV
    </button>
  );
}

