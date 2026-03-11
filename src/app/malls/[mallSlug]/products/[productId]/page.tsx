import React from 'react';
import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [
    { mallSlug: 'demo', productId: 'demo' },
    { mallSlug: 'demo-store', productId: 'demo' },
  ];
}

export default function Page({ params }: { params: Promise<{ mallSlug: string; productId: string }> }) {
  const { mallSlug, productId } = React.use(params);
  return <ClientPage mallSlug={mallSlug} productId={productId} />;
}
