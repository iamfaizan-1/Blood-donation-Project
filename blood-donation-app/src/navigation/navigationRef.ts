import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  } else {
    // If navigation isn't mounted yet, retry shortly
    setTimeout(() => {
      if (navigationRef.isReady()) {
        (navigationRef.navigate as any)(name, params);
      }
    }, 500);
  }
}
