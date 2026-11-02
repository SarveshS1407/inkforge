import { NextRequest } from "next/server";
import { ImportService } from "@/lib/services/import.service";
import { requireAuthor } from "@/lib/auth/guard";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    await requireAuthor(req);
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        throw new ValidationError("No manuscript file was uploaded.");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError(
          `Manuscript file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed 25MB limit.`
        );
      }

      const filename = file.name || "manuscript";
      const buffer = Buffer.from(await file.arrayBuffer());

      // Stage file for permanent archival upon book creation
      const { stagedFileKey, fileSize } = await ImportService.stageUploadedFile(buffer, filename);

      if (filename.toLowerCase().endsWith(".docx")) {
        const result = await ImportService.parseDocx(buffer, filename);
        return apiSuccess({
          ...result,
          stagedFileKey,
          fileSize,
        });
      } else if (filename.toLowerCase().endsWith(".pdf")) {
        const result = await ImportService.parsePdf(buffer, filename);
        return apiSuccess({
          ...result,
          stagedFileKey,
          fileSize,
        });
      } else {
        throw new ValidationError(
          "Unsupported file type. Please upload a Microsoft Word (.docx) or PDF (.pdf) file."
        );
      }
    } else {
      // JSON Paste manuscript analysis
      const body = await req.json();
      const rawText = body.text || "";
      const title = body.title || "Pasted Manuscript";

      if (!rawText.trim()) {
        throw new ValidationError("Pasted manuscript text cannot be empty.");
      }

      const result = ImportService.segmentText(rawText, title);
      return apiSuccess({
        ...result,
        fileSize: Buffer.byteLength(rawText, "utf-8"),
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
