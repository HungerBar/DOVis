import { useContext } from 'react';
import CesiumAPIContext from '../context/CesiumAPIContext';

export default function useCesiumAPI() {
  return useContext(CesiumAPIContext);
}