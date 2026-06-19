import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, LevelFormat
} from 'docx';

const GOLD = "B8860B";
const NAVY = "0D1B2A";
const GRAY = "555555";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder };

function sectionHeader(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: NAVY, font: "Arial" })]
  });
}
function jobTitle(t) {
  return new Paragraph({ spacing: { before: 140, after: 30 }, children: [new TextRun({ text: t, bold: true, size: 22, color: NAVY, font: "Arial" })] });
}
function jobMeta(t) {
  return new Paragraph({ spacing: { before: 0, after: 50 }, children: [new TextRun({ text: t, size: 20, color: GRAY, italics: true, font: "Arial" })] });
}
function bullet(t) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text: t, size: 20, font: "Arial", color: "333333" })]
  });
}
function para(t, opts = {}) {
  return new Paragraph({
    spacing: { before: 50, after: 50 },
    children: [new TextRun({ text: t, size: opts.size || 20, font: "Arial", color: opts.color || "333333", bold: opts.bold, italics: opts.italic })]
  });
}
function spacer(before = 80) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}

function buildDoc(cv) {
  const children = [];

  // Header
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 },
      children: [new TextRun({ text: (cv.name || "").toUpperCase(), bold: true, size: 50, font: "Arial", color: NAVY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 50 },
      children: [new TextRun({ text: cv.title || "", size: 21, font: "Arial", color: GRAY })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 40 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
      children: [new TextRun({
        text: [cv.email, cv.phone, cv.location].filter(Boolean).join("   |   "),
        size: 19, font: "Arial", color: GRAY
      })]
    }),
    spacer(100)
  );

  // Summary
  if (cv.summary) {
    children.push(sectionHeader("Professional Summary"), spacer(50), para(cv.summary), spacer(80));
  }

  // Core Competencies (two column skills)
  if (cv.skillsLeft?.length || cv.skillsRight?.length) {
    children.push(sectionHeader("Core Competencies"), spacer(50));
    children.push(new Table({
      width: { size: 9706, type: WidthType.DXA },
      columnWidths: [4853, 4853],
      borders: noBorders,
      rows: [new TableRow({ children: [
        new TableCell({ borders: noBorders, width: { size: 4853, type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 0, right: 100 },
          children: [
            new Paragraph({ children: [new TextRun({ text: (cv.skillsLeftLabel || "TECHNICAL SKILLS"), bold: true, size: 19, color: GOLD, font: "Arial" })] }),
            ...(cv.skillsLeft || []).map(bullet)
          ]}),
        new TableCell({ borders: noBorders, width: { size: 4853, type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 100, right: 0 },
          children: [
            new Paragraph({ children: [new TextRun({ text: (cv.skillsRightLabel || "LEADERSHIP & SOFT SKILLS"), bold: true, size: 19, color: GOLD, font: "Arial" })] }),
            ...(cv.skillsRight || []).map(bullet)
          ]}),
      ]})]
    }), spacer(80));
  }

  // Experience
  if (cv.experience?.length) {
    children.push(sectionHeader("Professional Experience"), spacer(50));
    cv.experience.forEach((job, i) => {
      children.push(jobTitle(job.title || ""));
      children.push(jobMeta([job.company, job.location, job.dates].filter(Boolean).join("  |  ")));
      (job.bullets || []).forEach(b => children.push(bullet(b)));
      if (i < cv.experience.length - 1) children.push(spacer(70));
    });
    children.push(spacer(80));
  }

  // Early career table
  if (cv.earlyCareer?.length) {
    children.push(sectionHeader("Early Career History"), spacer(50));
    if (cv.earlyCareerNote) children.push(para(cv.earlyCareerNote, { italic: true, color: GRAY }), spacer(50));

    children.push(new Table({
      width: { size: 9706, type: WidthType.DXA },
      columnWidths: [3200, 4000, 2506],
      rows: [
        new TableRow({ children: ["Role", "Organization", "Period"].map((h, idx) =>
          new TableCell({ borders, width: { size: idx === 0 ? 3200 : idx === 1 ? 4000 : 2506, type: WidthType.DXA },
            margins: { top: 70, bottom: 70, left: 120, right: 120 },
            shading: { fill: "E5E5E5", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 19, font: "Arial", color: NAVY })] })]
          })
        )}),
        ...cv.earlyCareer.map((row, i) => new TableRow({ children: [row.role, row.org, row.period].map((val, idx) =>
          new TableCell({ borders, width: { size: idx === 0 ? 3200 : idx === 1 ? 4000 : 2506, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            shading: { fill: i % 2 === 0 ? "FFFFFF" : "F7F7F7", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: val || "", size: 19, font: "Arial", color: "333333" })] })]
          })
        )}))
      ]
    }), spacer(80));
  }

  // Education
  if (cv.education?.length) {
    children.push(sectionHeader("Education"), spacer(50));
    cv.education.forEach(ed => {
      children.push(new Paragraph({ spacing: { before: 50, after: 40 }, children: [
        new TextRun({ text: ed.degree || "", bold: true, size: 21, font: "Arial", color: NAVY }),
        new TextRun({ text: "   |   " + [ed.institution, ed.year].filter(Boolean).join("   |   "), size: 20, font: "Arial", color: GRAY })
      ]}));
    });
    children.push(spacer(80));
  }

  // Languages
  if (cv.languages?.length) {
    children.push(sectionHeader("Languages"), spacer(50));
    const colSize = Math.floor(9706 / cv.languages.length);
    children.push(new Table({
      width: { size: 9706, type: WidthType.DXA },
      columnWidths: cv.languages.map(() => colSize),
      borders: noBorders,
      rows: [new TableRow({ children: cv.languages.map(lang =>
        new TableCell({ borders: noBorders, width: { size: colSize, type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 60, right: 60 },
          shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lang, size: 19, font: "Arial", color: "333333" })] })]
        })
      )})]
    }), spacer(100));
  }

  // Certifications
  if (cv.certifications?.length) {
    children.push(sectionHeader("Certifications"), spacer(50));
    cv.certifications.forEach(c => children.push(bullet(c)));
    children.push(spacer(80));
  }

  // Footer
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 100, after: 0 },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 6 } },
    children: [new TextRun({ text: "References available upon request", size: 18, italics: true, font: "Arial", color: GRAY })]
  }));

  return new Document({
    numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] }] },
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, right: 1000, bottom: 900, left: 1000 } } },
      children
    }]
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const cv = req.body;
    if (!cv || !cv.name) return res.status(400).json({ error: 'Missing CV data' });

    const doc = buildDoc(cv);
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${(cv.name || 'CV').replace(/[^a-zA-Z0-9]/g, '_')}_CV.docx"`);
    return res.status(200).send(buffer);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
