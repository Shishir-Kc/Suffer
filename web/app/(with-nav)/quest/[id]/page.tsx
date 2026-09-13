import { QuestScreen } from "@/components/screens/QuestScreen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuestScreen id={id} />;
}
