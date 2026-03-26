import { PERFUMES } from "@/data/perfumes";

const imageByName = new Map<string, string>();

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

for (const perfume of PERFUMES) {
  const key = normalizeLabel(perfume.name);
  if (!imageByName.has(key)) {
    imageByName.set(key, perfume.image);
  }
}

export function resolveProductImage(productName: string): string {
  const key = normalizeLabel(productName);
  return imageByName.get(key) ?? "/placeholder.webp";
}
