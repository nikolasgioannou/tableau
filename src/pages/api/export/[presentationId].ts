import { type NextApiRequest, type NextApiResponse } from "next";
import puppeteer from "puppeteer";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { presentationId } = req.query;
  if (typeof presentationId !== "string") {
    res.status(400).json({ error: "Invalid presentation ID" });
    return;
  }

  const presentation = await db.presentation.findUnique({
    where: { id: presentationId },
    include: { slides: { orderBy: { index: "asc" } } },
  });

  if (!presentation) {
    res.status(404).json({ error: "Presentation not found" });
    return;
  }

  const browser = await puppeteer.launch({ headless: true });

  try {
    const pdfBuffers: Buffer[] = [];

    for (const slide of presentation.slides) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      const htmlDoc = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head>
<body style="margin:0;padding:0;width:1280px;height:720px;overflow:hidden;">
${slide.html}
</body>
</html>`;

      await page.setContent(htmlDoc, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        width: "1280px",
        height: "720px",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      pdfBuffers.push(Buffer.from(pdf));
      await page.close();
    }

    // If only one slide, just return its PDF
    // For multiple slides, we'll combine by rendering all into one page sequence
    // Since puppeteer generates one page per PDF, we'll use a single page approach
    if (pdfBuffers.length === 0) {
      res.status(400).json({ error: "No slides to export" });
      return;
    }

    // Re-render all slides in a single page for a proper multi-page PDF
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const combinedHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: 1280px 720px; margin: 0; }
  body { margin: 0; padding: 0; }
  .slide { width: 1280px; height: 720px; overflow: hidden; page-break-after: always; position: relative; }
  .slide:last-child { page-break-after: auto; }
</style>
</head>
<body>
${presentation.slides.map((s) => `<div class="slide">${s.html}</div>`).join("\n")}
</body>
</html>`;

    await page.setContent(combinedHtml, { waitUntil: "networkidle0" });

    const finalPdf = await page.pdf({
      width: "1280px",
      height: "720px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await page.close();

    const safeName = presentation.name.replace(/[^a-zA-Z0-9-_ ]/g, "");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}.pdf"`,
    );
    res.send(Buffer.from(finalPdf));
  } finally {
    await browser.close();
  }
}
