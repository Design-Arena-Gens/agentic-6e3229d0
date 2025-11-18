"use client";

import dynamic from "next/dynamic";

const PoliceParkingGame = dynamic(
  () => import("../components/PoliceParkingGame").then(mod => mod.PoliceParkingGame),
  { ssr: false }
);

export default function Page() {
  return <PoliceParkingGame />;
}
