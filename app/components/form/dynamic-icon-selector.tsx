import dynamic from 'next/dynamic';
import { Spinner } from '../ui/spinner';

export const IconSelector = dynamic(() => import('../form/icon-selector').then((mod) => mod.IconSelector), {
  ssr: false,
  loading: () => <Spinner className="mx-auto size-7" />
});
