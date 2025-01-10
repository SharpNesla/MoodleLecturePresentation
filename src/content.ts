// Проверка, является ли текущая страница Moodle
function isMoodlePage() {
  // Вариант 1: проверять домен
  // return window.location.hostname.includes('moodle');

  // Вариант 2: искать характерный DOM-элемент
  // Например, Moodle часто содержит блок #page или navbar с классами вроде .navbar-nav
  // Можно заменить на любой селектор, специфичный для вашего Moodle
  const moodleElement = document.querySelector('#page-mod-lesson-edit');
  return Boolean(moodleElement);
}

if (isMoodlePage()) {
  // Создаём корневой контейнер для React
  const appRoot = document.createElement('div');
  appRoot.id = 'react-root';
  document.body.appendChild(appRoot);

  // Загружаем React-приложение
  import('../src/main.tsx')
    .then(() => {
      console.log('Moodle-страница обнаружена. React-приложение загружено.');
    })
    .catch((err) => {
      console.error('Ошибка при загрузке React-приложения:', err);
    });
} else {
  console.log('Текущая страница не похожа на Moodle, расширение не запускается.');
}
