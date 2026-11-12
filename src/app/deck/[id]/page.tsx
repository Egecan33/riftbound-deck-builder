import { Builder } from './Builder';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Builder id={id} />;
}
