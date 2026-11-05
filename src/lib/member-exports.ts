import { Member, memberColumns, memberValue, MemberFilters } from "./members";

export type MemberExportFormat = "xlsx" | "pdf";
export async function createMemberExport(
  members: Member[],
  format: MemberExportFormat,
  filters: MemberFilters,
): Promise<Blob> {
  const headers = [...memberColumns.map((c) => c.label), "Date d’adhésion"];
  const rows = members.map((m) => [
    ...memberColumns.map((c) => memberValue(m, c.key)),
    new Date(m.createdAt).toLocaleDateString("fr-FR"),
  ]);
  if (format === "xlsx") {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    workbook.creator = "Ustawi";
    const sheet = workbook.addWorksheet("Membres", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    sheet.addRow(headers);
    rows.forEach((row) => sheet.addRow(row));
    sheet.columns.forEach((col, i) => {
      col.width = [22, 22, 20, 15, 22, 32, 26, 15, 20][i];
    });
    sheet.eachRow((row, index) => {
      row.height = 28;
      row.eachCell((cell) => {
        cell.font = {
          name: "Arial",
          size: 11,
          bold: index === 1,
          color: { argb: index === 1 ? "FFFFFFFF" : "FF172B25" },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
        if (index === 1)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF137A59" },
          };
        else if (index % 2 === 0)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F6F3" },
          };
      });
    });
    sheet.autoFilter = { from: "A1", to: "I1" };
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
  doc.setProperties({ title: "Ustawi — Liste des membres", author: "Ustawi" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Ustawi | Membres", 14, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `${members.length} membre(s) | ${new Date().toLocaleDateString("fr-FR")}`,
    14,
    24,
  );
  const filterText = `Statut : ${filters.status === "all" ? "Tous" : filters.status} | Fonction : ${filters.function === "all" ? "Toutes" : filters.function}${filters.search ? ` | Recherche : ${filters.search}` : ""}`;
  const lines = doc.splitTextToSize(filterText, 268) as string[];
  doc.text(lines, 14, 30);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35 + (lines.length - 1) * 4,
    margin: { left: 14, right: 14, bottom: 16, top: 14 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      textColor: [23, 43, 37],
    },
    headStyles: { fillColor: [19, 122, 89], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 246, 243] },
    columnStyles: {
      0: { cellWidth: 31 },
      1: { cellWidth: 29 },
      2: { cellWidth: 28 },
      3: { cellWidth: 20 },
      4: { cellWidth: 34 },
      5: { cellWidth: 43 },
      6: { cellWidth: 33 },
      7: { cellWidth: 23 },
      8: { cellWidth: 28 },
    },
    rowPageBreak: "avoid",
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.text(`Ustawi • ${doc.getNumberOfPages()}`, 14, 203);
    },
  });
  return doc.output("blob");
}
export async function deliverMemberExport(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (
    matchMedia("(pointer: coarse)").matches &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
