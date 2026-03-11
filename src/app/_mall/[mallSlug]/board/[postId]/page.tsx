import React from 'react';
import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ mallSlug: 'demo', postId: 'demo' }];
}

export default function Page({ params }: { params: Promise<{ mallSlug: string; postId: string }> }) {
  const { mallSlug, postId } = React.use(params);
  return <ClientPage mallSlug={mallSlug} postId={postId} />;
}
