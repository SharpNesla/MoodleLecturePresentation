// parsePagesFromDocument.js
// @ts-nocheck
const CHARS_PER_LINE = 80;
const MIN_LINES = 7;
const MAX_LINES = 15;

/**
 * Оценивает количество «условных строк» на основе CHARS_PER_LINE символов.
 */
function measureLinesOfText(text) {
  const length = text.trim().length;
  return Math.ceil(length / CHARS_PER_LINE);
}

/**
 * Удаляет style и class у элемента node и всех его потомков.
 */
function removeStylesAndClassesFromElement(node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    node.removeAttribute('style');
    node.removeAttribute('class');
    node.childNodes.forEach((child) => removeStylesAndClassesFromElement(child));
  }
}

/**
 * Извлекает структуру слайдов из Moodle-лекции.
 * Для каждой таблицы .generaltable создаётся титульный слайд (из thead tr th).
 * Содержимое tbody группируется по следующим правилам:
 *  - параграфы, заголовки, списки => htmlBlock (но изображения внутри параграфа выделяются отдельными image-блоками)
 *  - таблицы => table
 *  - изображения => image
 *  - заголовки (h2/h3/h4) тоже идут в htmlBlock, не выносятся отдельно
 */
export function parsePagesFromDocument() {
  const lectureTables = document.querySelectorAll('.generaltable');
  const pages = [];

  lectureTables.forEach((table) => {
    // 1. Заголовок всего раздела
    const headerCell = table.querySelector('thead tr th');
    const lecturePageTitle = headerCell ? headerCell.textContent.trim() : 'Без названия';

    // Добавляем титульный слайд (type: 'title')
    pages.push({
      type: 'title',
      title: lecturePageTitle,
      content: '',
    });

    // 2. Извлекаем контент из tbody
    const contentCell = table.querySelector('tbody tr td .no-overflow');
    if (!contentCell) {
      return;
    }

    // Собираем блоки (htmlBlock, image, table)
    const blocks = [];
    Array.from(contentCell.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.nodeName.toLowerCase();
        const clonedNode = node.cloneNode(true);
        removeStylesAndClassesFromElement(clonedNode);

        // Для удобства вынесем в отдельную функцию логику «извлечь изображения из параграфа»
        const extractImagesAndTextBlocks = (element) => {
          const result = [];
          // Ищем все <img> внутри <p> (или любого контейнера)
          const imgNodes = element.querySelectorAll('img');

          // Если внутри есть <img>, клонируем их в отдельные image-блоки
          imgNodes.forEach((img) => {
            result.push({
              type: 'image',
              src: img.getAttribute('src') || '',
              alt: img.getAttribute('alt') || '',
            });
            // Удаляем из исходного DOM, чтобы не мешал дальнейшему тексту
            img.remove();
          });

          // После удаления <img> может остаться текст
          const leftoverText = element.textContent.trim();
          if (leftoverText) {
            result.push({
              type: 'htmlBlock',
              html: element.outerHTML, // Текст без уже удалённых <img>
              text: leftoverText,
            });
          }
          return result;
        };

        // Учитываем теги h2, h3, h4, p, ul, ol
        if (
          tagName === 'h2' ||
          tagName === 'h3' ||
          tagName === 'h4' ||
          tagName === 'p' ||
          tagName === 'ul' ||
          tagName === 'ol'
        ) {
          // Извлекаем изображения (если они есть внутри параграфа)
          const subBlocks = extractImagesAndTextBlocks(clonedNode);
          blocks.push(...subBlocks);
        } else if (tagName === 'table') {
          blocks.push({
            type: 'table',
            content: clonedNode.outerHTML,
          });
        } else if (tagName === 'img') {
          blocks.push({
            type: 'image',
            src: clonedNode.getAttribute('src') || '',
            alt: clonedNode.getAttribute('alt') || '',
          });
        } else {
          // Любой другой элемент — как htmlBlock
          const rawText = clonedNode.textContent.trim();
          if (rawText) {
            blocks.push({
              type: 'htmlBlock',
              html: clonedNode.outerHTML,
              text: rawText,
            });
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Обычный текст вне тегов
        const rawText = node.textContent.trim();
        if (rawText) {
          blocks.push({
            type: 'htmlBlock',
            html: rawText,
            text: rawText,
          });
        }
      }
    });

    // 3. Группировка абзацев/списков/заголовков (htmlBlock) в пределах 7–15 строк
    //    Изображения (image) и таблицы (table) идут отдельными слайдами
    let currentBlocks = [];
    let currentLines = 0;

    function finalizeCurrentSlide() {
      if (currentBlocks.length > 0) {
        const combinedHTML = currentBlocks.map((b) => b.html).join('\n');
        pages.push({
          type: 'htmlGroup',
          title: lecturePageTitle,
          content: combinedHTML,
        });
      }
      currentBlocks = [];
      currentLines = 0;
    }

    blocks.forEach((block) => {
      if (block.type === 'htmlBlock') {
        const lines = measureLinesOfText(block.text);
        // Если слишком большой фрагмент
        if (lines > MAX_LINES) {
          finalizeCurrentSlide();
          pages.push({
            type: 'htmlGroup',
            title: lecturePageTitle,
            content: block.html,
          });
        } else {
          if (currentLines + lines <= MAX_LINES) {
            currentLines += lines;
            currentBlocks.push(block);
          } else {
            // Превышен предел
            if (currentLines >= MIN_LINES) {
              finalizeCurrentSlide();
              currentLines = lines;
              currentBlocks.push(block);
            } else {
              currentLines += lines;
              currentBlocks.push(block);
              finalizeCurrentSlide();
            }
          }
        }
      } else if (block.type === 'image') {
        finalizeCurrentSlide();
        pages.push({
          type: 'image',
          title: lecturePageTitle,
          src: block.src,
          alt: block.alt,
        });
      } else if (block.type === 'table') {
        finalizeCurrentSlide();
        pages.push({
          type: 'table',
          title: lecturePageTitle,
          content: block.content,
        });
      }
    });

    // Завершаем последний набор
    finalizeCurrentSlide();
  });

  return pages;
}
