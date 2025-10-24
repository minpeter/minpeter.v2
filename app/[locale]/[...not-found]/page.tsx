import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function NotFoundCatchAllPage() {
  await connection;
  notFound();
}
