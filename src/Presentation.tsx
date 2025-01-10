import {
  Box,
  Center,
  Container,
  ScrollArea,
  Stack,
  Title,
  TypographyStylesProvider,
  useComputedColorScheme,
} from '@mantine/core';
import {useHotkeys} from '@mantine/hooks';
import {parsePagesFromDocument} from './parsePages';
import {ReactNode, useEffect, useState} from 'react';
import {ColorSchemeSelector} from './ColorSchemeSelector.tsx';
import {nprogress} from '@mantine/nprogress';
import hljs from 'highlight.js';

export const SlideTitle = ({children}: { children: ReactNode }) => (
  <Container size={'xl'}>
    <Title ta="start" fz={60}>
      {children}
    </Title>
  </Container>
);

// Функция, которая подставляет нужную тему highlight.js
function useHighlightJsTheme() {
  const colorScheme = useComputedColorScheme('dark', {getInitialValueInEffect: true});

  useEffect(() => {
    let linkEl = document.getElementById('highlight-theme-link') as HTMLLinkElement | null;
    if (!linkEl) {
      // Если нет, создаём
      linkEl = document.createElement('link');
      linkEl.id = 'highlight-theme-link';
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }

    if (colorScheme === 'dark') {
      linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/darcula.min.css';
    } else {
      linkEl.href = 'https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.css';
    }
  }, [colorScheme]);

  // Возвращаем значение (пригодится, если надо менять логику кода)
  return colorScheme;
}

// Подкомпонент: титульный слайд (type: 'title')
function TitleSlide({page} : {page: any}) {
  return (
    <Center h="100%">
      <Title fz={80}>{page.title}</Title>
    </Center>
  );
}

// Подкомпонент: слайд с параграфами/списками (type: 'htmlGroup')
function HtmlGroupSlide({page} : {page: any}) {
  const colorScheme = useHighlightJsTheme();

  useEffect(() => {
    const container = document.querySelector('.htmlgroup-slide');
    if (!container) return;
    container.querySelectorAll('code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
      (block as HTMLElement).style.display = 'inherit';
      (block as HTMLElement).style.fontSize = '1.4rem';
      (block as HTMLElement).style.border = '1px var(--mantine-color-default-border)';
    });
    container.querySelectorAll('pre').forEach((block) => {
      (block as HTMLElement).style.display = 'inherit';
      (block as HTMLElement).style.padding = '0';
      (block as HTMLElement).style.textWrap = 'wrap';
      (block as HTMLElement).style.background = 'transparent';
    });
  }, [page.content, colorScheme]);

  return (
    <Stack fz={30} gap="xl" align={'stretch'} h="100%">
      <SlideTitle>{page.title}</SlideTitle>
      <ScrollArea h={800} offsetScrollbars>
        <Center h={'100%'}>
          <Container size="xl">
            <TypographyStylesProvider>
              {/* Класс .htmlgroup-slide нужен для поиска <pre><code> */}
              <div
                className="htmlgroup-slide"
                dangerouslySetInnerHTML={{__html: page.content}}
              />
            </TypographyStylesProvider>
          </Container>
        </Center>
      </ScrollArea>
    </Stack>
  );
}

// Подкомпонент: изображение (type: 'image')
function ImageSlide({page} : {page: any}) {
  useHighlightJsTheme(); // Чтобы темизация обновлялась, если нужно

  return (
    <Stack fz={30} gap="xl" h="100%">
      <SlideTitle>{page.title}</SlideTitle>
      <ScrollArea h={800} offsetScrollbars>
        <Center flex={1}>
          <Container size="xl">
            <img
              src={page.src}
              alt={page.alt}
              style={{maxWidth: '100%', height: 'auto', marginTop: '1rem'}}
            />
          </Container>
        </Center>
      </ScrollArea>
    </Stack>
  );
}

// Подкомпонент: таблица (type: 'table')
function TableSlide({page} : {page: any}) {
  useHighlightJsTheme(); // Аналогично, чтобы при переключении темы таблица не ломалась

  return (
    <Center h="100%" p="xl">
      <SlideTitle>{page.title}</SlideTitle>
      <Box>
        <TypographyStylesProvider>
          <div dangerouslySetInnerHTML={{__html: page.content}}/>
        </TypographyStylesProvider>
      </Box>
    </Center>
  );
}

// Главный компонент, переключающий слайды по типу
function SlideRenderer({page} : {page: any}) {
  switch (page.type) {
    case 'title':
      return <TitleSlide page={page}/>;
    case 'htmlGroup':
      return <HtmlGroupSlide page={page}/>;
    case 'image':
      return <ImageSlide page={page}/>;
    case 'table':
      return <TableSlide page={page}/>;
    default:
      return null;
  }
}

export function Presentation() {
  const pages = parsePagesFromDocument();
  const [currentPage, setCurrentPage] = useState(0);

  // Горячие клавиши «стрелка влево» и «стрелка вправо»
  useHotkeys([
    ['ArrowLeft', () => setCurrentPage((prev) => Math.max(prev - 1, 0))],
    ['ArrowRight', () => setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1))],
  ]);

  // Обновление индикатора nprogress
  useEffect(() => {
    nprogress.set((currentPage + 1) / pages.length);
  }, [currentPage, pages]);

  if (!pages.length) {
    return <div>Нет данных для отображения</div>;
  }

  const page = pages[currentPage];

  // Переход «назад» и «вперёд»
  const handleClickLeft = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };
  const handleClickRight = () => {
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
  };

  return (
    <Box
      h="100vh"
      py={60}
      fz={30}
      style={{position: 'relative', overflow: 'hidden'}}
    >
      <ColorSchemeSelector/>
      <Box pos="absolute" bottom={30} right={30}>
        {currentPage + 1}/{pages.length}
      </Box>

      {/* Две «прозрачные» зоны, каждая занимает 50% по горизонтали */}
      {/* Левая отвечает за «назад», правая — за «вперёд» */}
      <Box
        onClick={handleClickLeft}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '50%',
          height: '100%',
          cursor: 'pointer',
        }}
      />
      <Box
        onClick={handleClickRight}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '50%',
          height: '100%',
          cursor: 'pointer',
        }}
      />

      <SlideRenderer page={page}/>
    </Box>
  );
}
