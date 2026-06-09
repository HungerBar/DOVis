import IsoSurfaceModule from '../modules/IsoSurfaceModule';
import ProfileModule from '../modules/ProfileModule';

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
];