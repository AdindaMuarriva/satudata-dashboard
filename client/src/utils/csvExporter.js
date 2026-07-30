export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    return;
  }
  const header = Object.keys(rows[0]).join(',');
  const csv = rows.map(row => {
    return Object.values(row).map(value => {
      const strValue = String(value ?? '');
      // Handle commas and quotes in values
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(',');
  }).join('\n');

  const csvContent = `data:text/csv;charset=utf-8,${header}\n${csv}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}