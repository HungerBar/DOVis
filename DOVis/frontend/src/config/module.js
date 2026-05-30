import IsoSurfaceModule from '../modules/IsoSurfaceModule';

import EOFModule from '../modules/eofModule';

export const moduleConfig = [
  {
    id: 'iso',
    title: 'IsoSurface',
    component: IsoSurfaceModule,
    props: {},
  },

  {
    id: 'eof',
    title: 'EOF',
    component: EOFModule,
    props: {},
  },
];