import { Suspense } from "react";
import { FocusOsApp } from "@/components/os/focus/FocusOsApp";

export default function FocusOsPage() {
  return (
    <Suspense fallback={null}>
      <FocusOsApp />
    </Suspense>
  );
}
