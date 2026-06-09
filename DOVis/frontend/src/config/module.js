import IsoSurfaceModule from '../modules/IsoSurfaceModule';
import HypoxiaModule from '../modules/HypoxiaModule';

export const moduleConfig = [
  {
    id: 'iso',
    title: 'IsoSurface',
    component: IsoSurfaceModule,
    props: {},
    policy: {
      x: 16,
      y: 60,
      width: 420,
      height: 520,
    },
  },

  {
    id: 'hypoxia',
    title: 'Hypoxia',
    component: HypoxiaModule,
    props: {},
    policy: {
      x: typeof window !== 'undefined' ? window.innerWidth - 376 : 900,
      y: 60,
      width: 360,
      height: 520,
    },
  },
];
