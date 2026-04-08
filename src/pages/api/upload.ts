import formidable from "formidable";
import { readFileSync } from "fs";
import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "~/server/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });

  const [, files] = await form.parse(req);

  const fileArray = files.file;
  if (!fileArray?.[0]) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const file = fileArray[0];

  if (!file.mimetype?.startsWith("image/")) {
    res.status(400).json({ error: "File must be an image" });
    return;
  }

  const buffer = readFileSync(file.filepath);
  const base64 = buffer.toString("base64");

  const image = await db.uploadedImage.create({
    data: {
      filename: file.originalFilename ?? "upload",
      mimeType: file.mimetype,
      base64,
    },
  });

  res.status(200).json({
    id: image.id,
    dataUrl: `data:${image.mimeType};base64,${image.base64}`,
  });
}
