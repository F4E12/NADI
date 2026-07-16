import { listInventoryOverview } from "@/lib/data/inventory";

export const dynamic = "force-dynamic";

const num = new Intl.NumberFormat("id-ID");

export default async function InventoryPage() {
  const items = await listInventoryOverview();

  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventaris Posko</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Membedakan <strong>resupply</strong> dari <strong>redistribusi</strong>:
          stok di pool pusat menunggu dialokasikan (pool tipis berarti perlu
          pasokan dari luar), sementara stok yang sudah di Tenda hanya bisa
          dipindahkan antar-Tenda.
        </p>
      </div>

      {[...byCategory.entries()].map(([category, list]) => (
        <section
          key={category}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
            {category}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="px-4 py-2 font-medium">Stok</th>
                <th className="px-4 py-2 text-right font-medium">Pool pusat</th>
                <th className="px-4 py-2 text-right font-medium">Di Tenda</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2">
                    {i.name}
                    {i.isHighProtein && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        protein
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {num.format(i.central)} {i.unit}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                    {num.format(i.allocated)} {i.unit}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">
                    {num.format(i.total)} {i.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
