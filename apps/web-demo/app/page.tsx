import { DemoShell } from '@/src/demo/demo-shell';
import { getDemoHomeModel } from '@/src/demo/example-repository';

export default async function HomePage() {
  const model = await getDemoHomeModel();

  return <DemoShell initialModel={model} />;
}
