import ClientPage from './ClientPage';

export async function generateStaticParams() {
  return [{ productId: 'demo' }];
}

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ClientPage productId={productId} />;
}
