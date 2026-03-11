import React from 'react';
import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ mallSlug: 'demo' }];
}

export default function Page({ params }: { params: Promise<{ mallSlug: string }> }) {
  const { mallSlug } = React.use(params);
  return <ClientPage mallSlug={mallSlug} />;
}
