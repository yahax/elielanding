import { redirect } from "next/navigation";
import { PACK_ORDER } from "@/lib/packs";

type PackPageProps = {
    params: Promise<{ pack: string }>;
};

export async function generateStaticParams() {
    return PACK_ORDER.map((pack) => ({ pack }));
}

export default async function PackPage({ params }: PackPageProps) {
    await params;
    redirect("/");
}
