const xmlEscape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const createExcelReport = (rows) => {
  const body = rows
    .map(
      (row) => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(row.studentCode)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.studentName)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.batchName)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.className)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.sessionTopic)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.status)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.checkInAt)}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(row.evaluationSummary)}</Data></Cell>
      </Row>`
    )
    .join("");

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Laporan Absensi">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Kode Siswa</Data></Cell>
        <Cell><Data ss:Type="String">Nama Siswa</Data></Cell>
        <Cell><Data ss:Type="String">Angkatan</Data></Cell>
        <Cell><Data ss:Type="String">Kelas</Data></Cell>
        <Cell><Data ss:Type="String">Topik Sesi</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
        <Cell><Data ss:Type="String">Check In</Data></Cell>
        <Cell><Data ss:Type="String">Evaluasi</Data></Cell>
      </Row>
      ${body}
    </Table>
  </Worksheet>
</Workbook>`;
};

const escapePdfText = (text) =>
  String(text ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");

export const createPdfBuffer = (title, rows) => {
  const lines = [
    title,
    "",
    ...rows.map(
      (row) =>
        `${row.studentName} | ${row.className} | ${row.sessionTopic} | ${row.status} | ${row.checkInAt}`
    )
  ];

  let cursorY = 780;
  const content = lines
    .slice(0, 34)
    .map((line) => {
      const command = `BT /F1 12 Tf 48 ${cursorY} Td (${escapePdfText(line)}) Tj ET`;
      cursorY -= 20;
      return command;
    })
    .join("\n");

  const objects = [];
  const addObject = (body) => {
    const index = objects.length + 1;
    objects.push(`${index} 0 obj\n${body}\nendobj`);
    return index;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const pageId = addObject(
    `<< /Type /Page /Parent 4 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`
  );
  const pagesId = addObject(`<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return Buffer.from(pdf, "binary");
};
