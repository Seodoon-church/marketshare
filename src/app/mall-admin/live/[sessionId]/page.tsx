import React from 'react';
import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ sessionId: 'demo' }];
}

export default function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = React.use(params);
  return <ClientPage sessionId={sessionId} />;
}
