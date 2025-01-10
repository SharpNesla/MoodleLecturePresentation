import {ActionIcon, useMantineColorScheme, useComputedColorScheme} from '@mantine/core';
import {IconSun, IconMoon} from '@tabler/icons-react';

export const ColorSchemeSelector = () => {
  const {setColorScheme} = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark', {getInitialValueInEffect: true});

  return (
    <ActionIcon
      pos={'fixed'} size="xl" radius="xl" left={30} bottom={90}
      style={{zIndex: 100002}}
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'dark' ? <IconSun stroke={1.5}/> : <IconMoon stroke={1.5}/>}

    </ActionIcon>
  );
}
