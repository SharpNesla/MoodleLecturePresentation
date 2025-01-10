import {createRoot} from 'react-dom/client'
import {ActionIcon, MantineProvider, Stack} from "@mantine/core";
import "@mantine/core/styles.css";
import '@mantine/code-highlight/styles.css';
import {IconPresentation} from "@tabler/icons-react";
import {Presentation} from "./Presentation.tsx";
import {useState} from "react";
import {useHotkeys} from "@mantine/hooks";

const pageWrapperDisplay = document.getElementById('page-wrapper')?.style.display;

export const App = () => {
  const [active, setActive] = useState(false);

  const toggleActive = () => {
    setActive(!active);
    const wrapperElement = document.getElementById('page-wrapper');
    if (wrapperElement) {
      wrapperElement.style.display = active && pageWrapperDisplay ? pageWrapperDisplay : 'none';
    }

  };

  useHotkeys([['Escape', toggleActive]]);

  return (
    <Stack c={'var(--mantine-color-text)'} bg={'var(--mantine-color-body)'}>
      <ActionIcon pos={'fixed'} size="xl" radius="xl" left={30} bottom={30}
                  style={{zIndex: 100002}}
                  onClick={toggleActive}>
        <IconPresentation/>
      </ActionIcon>
      {active && <Presentation/>}
    </Stack>
  );
};

createRoot(document.getElementById('react-root')!).render(
  <MantineProvider defaultColorScheme="dark">
    <App></App>
  </MantineProvider>,
)
