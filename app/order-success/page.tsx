import { OrderSuccessPage } from "@/components/checkout/OrderSuccessPage";

type OrderSuccessRouteProps = {
    searchParams: Promise<{ orderId?: string }>;
};

export default async function OrderSuccessRoute({ searchParams }: OrderSuccessRouteProps) {
    const resolved = await searchParams;
    return <OrderSuccessPage orderId={resolved.orderId} />;
}
