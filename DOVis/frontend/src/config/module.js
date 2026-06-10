import IsoSurfaceModule from '../modules/IsoSurfaceModule';
import ProfileModule from '../modules/ProfileModule';
import EOFModule from '../modules/eofModule';
import HypoxiaModule from '../modules/HypoxiaModule';

export const moduleConfig = [
  {
    id: 'iso',
    title: 'IsoSurface',
    component: IsoSurfaceModule,
    props: {},
    policy: {
      x: 0,
      y: 52,
    },
  },
  {
    id: 'profile',
    title: 'Vertical Profile',
    component: ProfileModule,
    props: {},
    policy: {
      x: 0,
      y: 52,
    },
  },
  {
    id: 'eof',
    title: 'EOF',
    component: EOFModule,
    props: {},
    policy: {
      x: typeof window !== 'undefined' ? window.innerWidth - 700 : 740,
      y: 52,
    },
  },
  {
    id: 'hypoxia',
    title: 'Hypoxia',
    component: HypoxiaModule,
    props: {},
    policy: {
      x: typeof window !== 'undefined' ? window.innerWidth - 700 : 740,
      y: 52,
    },
  },
];
