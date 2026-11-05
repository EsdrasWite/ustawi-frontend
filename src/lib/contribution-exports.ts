import { Member } from "./members";
import { Contributions, formatMonthShort } from "./store";
import { deliverMemberExport } from "./member-exports";

export type ContributionExportFormat = "xlsx" | "pdf";

export type ContributionExportInput = {
  members: Member[];
  contributions: Contributions;
  months: string[];
  currency: string;
  periodLabel: string;
  filterLabel: string;
  // Cellules masquées par le filtre actif (affichées "—" dans le tableau)
  isVisible: (memberId: string, monthKey: string) => boolean;
};

const money = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export async function createContributionExport(
  input: ContributionExportInput,
  format: ContributionExportFormat,
): Promise<Blob> {
  const {
    members,
    contributions,
    months,
    currency,
    periodLabel,
    filterLabel,
    isVisible,
  } = input;
  const headers = ["Membre", ...months.map(formatMonthShort), "Total"];
  const rows = members.map((m) => {
    let total = 0;
    const cells = months.map((mk) => {
      if (!isVisible(m.id, mk)) return "—";
      const v = contributions[m.id]?.[mk] || 0;
      total += v;
      return v ? money(v) : "0";
    });
    return [m.name, ...cells, money(total)];
  });
  const monthTotals = months.map((mk) =>
    members.reduce(
      (sum, m) =>
        isVisible(m.id, mk) ? sum + (contributions[m.id]?.[mk] || 0) : sum,
      0,
    ),
  );
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
  const footer = ["Total / mois", ...monthTotals.map(money), money(grandTotal)];
  const exportedAt = new Date().toLocaleDateString("fr-FR");
  const meta = `${periodLabel} | ${filterLabel} | Devise : ${currency} | Exporté le ${exportedAt}`;

  if (format === "xlsx") {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    workbook.creator = "Ustawi";
    const sheet = workbook.addWorksheet("Contributions", {
      views: [{ state: "frozen", xSplit: 1, ySplit: 2 }],
    });
    sheet.addRow([`Ustawi | Contributions — ${meta}`]);
    sheet.mergeCells(1, 1, 1, headers.length);
    sheet.getRow(1).font = {
      name: "Arial",
      size: 12,
      bold: true,
      color: { argb: "FF137A59" },
    };
    sheet.getRow(1).height = 24;
    sheet.addRow(headers);
    rows.forEach((row) => sheet.addRow(row));
    sheet.addRow(footer);
    const last = sheet.rowCount;
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = {
          name: "Arial",
          size: 10,
          bold: index === 2 || index === last,
          color: { argb: index === 2 ? "FFFFFFFF" : "FF172B25" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: Number(cell.col) === 1 ? "left" : "right",
        };
        if (index === 2)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF137A59" },
          };
        else if (index === last)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD8EEE5" },
          };
        else if (index % 2 === 1)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F6F3" },
          };
      });
    });
    sheet.getColumn(1).width = 26;
    for (let i = 2; i <= headers.length; i++) sheet.getColumn(i).width = 12;
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setProperties({ title: "Ustawi — Contributions", author: "Ustawi" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Ustawi | Contributions", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(meta, 268) as string[], 14, 23);
  autoTable(doc, {
    head: [headers],
    body: rows,
    foot: [footer],
    startY: 30,
    margin: { left: 14, right: 14, bottom: 14, top: 14 },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [23, 43, 37],
    },
    headStyles: { fillColor: [19, 122, 89], textColor: [255, 255, 255] },
    footStyles: {
      fillColor: [216, 238, 229],
      textColor: [23, 43, 37],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [240, 246, 243] },
    columnStyles: { 0: { cellWidth: 34, halign: "left" } },
    rowPageBreak: "avoid",
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.text(`Ustawi • ${doc.getNumberOfPages()}`, 14, 203);
    },
  });
  return doc.output("blob");
}

export async function exportContributions(
  input: ContributionExportInput,
  format: ContributionExportFormat,
) {
  const blob = await createContributionExport(input, format);
  const stamp = new Date().toISOString().slice(0, 10);
  await deliverMemberExport(blob, `Ustawi-contributions-${stamp}.${format}`);
}
