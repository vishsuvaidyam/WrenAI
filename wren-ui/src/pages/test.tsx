import dynamic from 'next/dynamic';

const SimpleTextComponent = dynamic(
  () => import('@/components/pages/svaindex/index'),
  {
    ssr: false,
  },
);

export default function TestPage() {
  return <SimpleTextComponent />;
}
