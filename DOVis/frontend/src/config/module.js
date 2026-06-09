import IsoSurfaceModule from '../modules/IsoSurfaceModule';
import ProfileModule from '../modules/ProfileModule';
import EOFModule from '../modules/eofModule';

export const moduleConfig = [
  {
    id: 'iso',
    title: 'IsoSurface',
    component: IsoSurfaceModule,
    props: {},
  },
  {
    id: 'profile',
    title: 'Vertical Profile',
    component: ProfileModule,
    props: {},
  },
  {
    id: 'eof',
    title: 'EOF',
    component: EOFModule,
    props: {},
  },
];