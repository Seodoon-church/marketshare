import { Metadata } from 'next';
import FranchiseClientPage from './ClientPage';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ mallSlug: 'demo' }, { mallSlug: 'demo-store' }];
}

export const metadata: Metadata = {
  title: '가맹점 분양 신청',
  description: '가맹점 분양 신청 페이지입니다.',
};

export default async function MallFranchisePage({ params }: { params: Promise<{ mallSlug: string }> }) {
  const { mallSlug } = await params;
  return <FranchiseClientPage paramSlug={mallSlug} />;
}
