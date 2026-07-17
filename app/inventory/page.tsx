import { listInventoryOverview } from "@/lib/data/inventory";
import { CreateInventoryControl, InventoryRecordControls } from "./inventory-crud";
import { deviceRole } from "@/lib/device-role";

export const dynamic = "force-dynamic";

const num = new Intl.NumberFormat("id-ID");

export default async function InventoryPage() {
  if ((await deviceRole()) !== "VOLUNTEER") {
    return (
      <div className="nadi-product-page">
        <h1 className="text-2xl font-semibold tracking-tight">Inventaris Posko</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Pengelolaan Inventaris hanya tersedia di perangkat Volunteer.
        </p>
      </div>
    );
  }

  const items = await listInventoryOverview();

  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }
  const categories = [...byCategory.keys()];
  const units = [...new Set(items.map((item) => item.unit))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="nadi-product-page flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventaris Posko</h1>
        <p className="mt-1 max-w-2xl text-sm text-graphite">
          Membedakan <strong>resupply</strong> dari <strong>redistribusi</strong>:
          stok di pool pusat menunggu dialokasikan (pool tipis berarti perlu
          pasokan dari luar), sementara stok yang sudah di Tenda hanya bisa
          dipindahkan antar-Tenda.
        </p>
      </div>

      <CreateInventoryControl categories={categories} units={units} />

      {[...byCategory.entries()].map(([category, list]) => (
        <section
          key={category}
          className="nadi-table-section"
        >
          <h2 className="border-b border-fog px-4 py-3 text-sm font-semibold">
            {category}
          </h2>
          <div className="nadi-table-scroll">
            <table className="nadi-data-table text-sm">
              <thead>
                <tr className="text-left text-ash">
                  <th className="px-4 py-2 font-medium">Stok</th>
                  <th className="px-4 py-2 text-right font-medium">Pool pusat</th>
                  <th className="px-4 py-2 text-right font-medium">Di Tenda</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Kkal / satuan</th>
                  <th className="px-4 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2">
                      {i.name}
                      {i.isHighProtein && (
                        <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          protein
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {num.format(i.central)} {i.unit}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-ash">
                      {num.format(i.allocated)} {i.unit}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {num.format(i.total)} {i.unit}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-ash">
                      {num.format(i.kcalPerUnit)}
                    </td>
                    <td className="px-4 py-2 text-right align-top">
                      <InventoryRecordControls
                        id={i.id}
                        name={i.name}
                        quantity={i.central}
                        unit={i.unit}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
