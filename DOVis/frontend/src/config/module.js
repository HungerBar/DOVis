import IsoSurfaceModule from '../modules/IsoSurfaceModule';
import HypoxiaModule from '../modules/HypoxiaModule';

export const moduleConfig = [
  {
    id: 'iso',
    title: 'IsoSurface',
    component: IsoSurfaceModule,
    props: {},
  },

  {
    id: 'hypoxia', 
    title: 'Hypoxia', 
    component: HypoxiaModule, 
    props: {} 
  },

];

