import { Readable } from "node:stream";

const defaultMaterialsBaseUrls = {
  session5: "https://wwg-5.oss-cn-qingdao.aliyuncs.com/materials",
  thinking: "https://wwg-thinking.oss-cn-beijing.aliyuncs.com/materials",
};

export default async function handler(request, response) {
  const materialId = request.query.materialId;
  const collection = request.query.collection || "session5";

  if (
    typeof materialId !== "string" ||
    !/^[a-z0-9-]+$/.test(materialId) ||
    typeof collection !== "string" ||
    !/^(session5|thinking)$/.test(collection)
  ) {
    response.status(400).send("Invalid material id");
    return;
  }

  const configuredBaseUrl =
    collection === "thinking"
      ? process.env.VITE_THINKING_MATERIALS_BASE_URL
      : process.env.VITE_MATERIALS_BASE_URL;
  const baseUrl =
    configuredBaseUrl?.trim() || defaultMaterialsBaseUrls[collection];
  const pdfUrl = `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(
    materialId,
  )}/document.pdf`;
  const upstreamResponse = await fetch(pdfUrl);

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    response.status(upstreamResponse.status || 502).send("Unable to load PDF");
    return;
  }

  response.status(upstreamResponse.status);
  response.setHeader(
    "Content-Type",
    upstreamResponse.headers.get("content-type") || "application/pdf",
  );
  response.setHeader(
    "Content-Disposition",
    `inline; filename="${materialId}.pdf"`,
  );
  response.setHeader("Cache-Control", "public, max-age=3600");

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    response.setHeader("Content-Length", contentLength);
  }

  Readable.fromWeb(upstreamResponse.body).pipe(response);
}
