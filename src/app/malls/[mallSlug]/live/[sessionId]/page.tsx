import React from 'react';
import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [
    { mallSlug: 'demo', sessionId: 'demo' },
    { mallSlug: 'demo-store', sessionId: 'demo-live' },
  ];
}

export default function Page({
  params,
}: {
  params: Promise<{ mallSlug: string; sessionId: string }>;
}) {
  const { mallSlug, sessionId } = React.use(params);
  return <ClientPage mallSlug={mallSlug} sessionId={sessionId} />;
}
