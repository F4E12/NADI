import { formatDateTime } from "@/lib/format";
import { buildExportReport } from "@/lib/data/report";
import { ExportDocument } from "./export-document";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const report = await buildExportReport();
  const generatedAt = formatDateTime(new Date());

  return <ExportDocument report={report} generatedAt={generatedAt} />;
}
