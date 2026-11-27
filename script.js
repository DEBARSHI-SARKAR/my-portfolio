const socialMenuToggle = document.querySelector('#socialMenuToggle');
const socialMenu = document.querySelector('#socialMenu');

if (socialMenuToggle && socialMenu) {
  const closeSocialMenu = () => {
    socialMenu.hidden = true;
    socialMenuToggle.setAttribute('aria-expanded', 'false');
  };

  socialMenuToggle.addEventListener('click', () => {
    const isOpen = socialMenuToggle.getAttribute('aria-expanded') === 'true';
    socialMenu.hidden = isOpen;
    socialMenuToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.social-menu')) closeSocialMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSocialMenu();
      socialMenuToggle.focus();
    }
  });
}


// Load the three newest public articles from the DEV Community API.
const devArticlesContainer = document.querySelector('#devArticles');

if (devArticlesContainer) {
  const DEV_ARTICLES_API = 'https://dev.to/api/articles?username=debarshis&per_page=3';

  const makeElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const formatPublishedDate = (dateString) => {
    if (!dateString) return 'Recently published';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Recently published';
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
  };

  // DEV can return a YouTube page URL as a cover instead of a direct image.
  // Convert common YouTube URL formats into their public thumbnail image URL.
  const getYouTubeThumbnail = (value) => {
    if (!value || typeof value !== 'string') return null;

    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      let videoId = null;

      if (host === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0];
      } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
        videoId = url.searchParams.get('v');
        if (!videoId) {
          const parts = url.pathname.split('/').filter(Boolean);
          if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) videoId = parts[1];
        }
      }

      return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : null;
    } catch {
      return null;
    }
  };

  const getArticleImageCandidates = (article) => {
    const rawCandidates = [article.cover_image, article.social_image];
    const candidates = [];

    rawCandidates.forEach((value) => {
      if (typeof value !== 'string' || !value.trim()) return;
      const youtubeThumbnail = getYouTubeThumbnail(value);
      // Try the generated YouTube thumbnail before the original page URL.
      if (youtubeThumbnail) candidates.push(youtubeThumbnail);
      candidates.push(value);
    });

    return [...new Set(candidates)];
  };

  const renderArticle = (article) => {
    const card = makeElement('article', 'article-card');
    const imageCandidates = getArticleImageCandidates(article);

    if (imageCandidates.length) {
      const cover = makeElement('img', 'article-cover');
      cover.alt = article.title ? `Cover image for ${article.title}` : '';
      cover.loading = 'lazy';
      cover.decoding = 'async';
      cover.referrerPolicy = 'no-referrer';

      let imageIndex = 0;
      cover.addEventListener('error', () => {
        imageIndex += 1;
        if (imageIndex < imageCandidates.length) {
          cover.src = imageCandidates[imageIndex];
        } else {
          cover.replaceWith(makeElement('div', 'article-cover-placeholder', '</>'));
        }
      });
      cover.src = imageCandidates[imageIndex];
      card.append(cover);
    } else {
      card.append(makeElement('div', 'article-cover-placeholder', '</>'));
    }

    const content = makeElement('div', 'article-content');
    const title = makeElement('a', 'article-title', article.title || 'Untitled article');
    title.href = article.url;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    content.append(title);

    if (article.description) {
      content.append(makeElement('p', 'article-description', article.description));
    }

    const meta = makeElement('div', 'article-meta');
    meta.append(makeElement('span', '', formatPublishedDate(article.published_at)));
    if (Number.isFinite(article.reading_time_minutes)) {
      meta.append(makeElement('span', '', `${article.reading_time_minutes} min read`));
    }
    if (Number.isFinite(article.public_reactions_count)) {
      meta.append(makeElement('span', '', `${article.public_reactions_count} reactions`));
    }
    content.append(meta);

    const tags = Array.isArray(article.tag_list) ? article.tag_list.slice(0, 3) : [];
    if (tags.length) {
      const tagList = makeElement('div', 'article-tags');
      tags.forEach((tag) => tagList.append(makeElement('span', '', `#${tag}`)));
      content.append(tagList);
    }

    card.append(content);
    return card;
  };

  const loadDevArticles = async () => {
    try {
      const response = await fetch(DEV_ARTICLES_API, {
        headers: { Accept: 'application/vnd.forem.api-v1+json' }
      });
      if (!response.ok) throw new Error(`DEV API returned ${response.status}`);

      const articles = await response.json();
      if (!Array.isArray(articles) || articles.length === 0) {
        throw new Error('No public articles were returned for this DEV username.');
      }

      articles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      devArticlesContainer.replaceChildren(...articles.slice(0, 3).map(renderArticle));
    } catch (error) {
      console.error('Could not load DEV Community articles:', error);
      const message = makeElement('p', 'feed-state error', 'Could not load articles right now. You can still find my writing on DEV.');
      devArticlesContainer.replaceChildren(message);
    } finally {
      devArticlesContainer.setAttribute('aria-busy', 'false');
    }
  };

  loadDevArticles();
}

// Featured research carousel: fetch only the three articles selected for this portfolio.
const researchCarousel = document.querySelector('#researchCarousel');

if (researchCarousel) {
  const selectedResearch = [
    { username: 'debarshis', slug: 'heterogeneous-ai-super-clusterhasc-20lm' },
    { username: 'debarshis', slug: 'ps3-rsx-52k8' },
    { username: 'debarshis', slug: 'vulkan-computing-with-fp16-on-ps4-gpu-429l' }
  ];

  const researchElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const researchYouTubeThumbnail = (value) => {
    if (!value || typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      let videoId = null;
      if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0];
      else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
        videoId = url.searchParams.get('v');
        if (!videoId) {
          const parts = url.pathname.split('/').filter(Boolean);
          if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) videoId = parts[1];
        }
      }
      return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : null;
    } catch {
      return null;
    }
  };

  const researchImageCandidates = (article) => {
    const values = [article.cover_image, article.social_image];
    const result = [];
    values.forEach((value) => {
      if (typeof value !== 'string' || !value.trim()) return;
      const youtube = researchYouTubeThumbnail(value);
      if (youtube) result.push(youtube);
      result.push(value);
    });
    return [...new Set(result)];
  };

  const formatResearchDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const renderResearchSlide = (article, index, total) => {
    const slide = researchElement('section', 'research-slide');
    slide.setAttribute('aria-label', `Research article ${index + 1} of ${total}`);

    const imageWrap = researchElement('div', 'research-cover-wrap');
    const candidates = researchImageCandidates(article);
    if (candidates.length) {
      const image = researchElement('img', 'research-cover');
      image.alt = article.title ? `Cover image for ${article.title}` : 'Research article cover';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      let imageIndex = 0;
      image.addEventListener('error', () => {
        imageIndex += 1;
        if (imageIndex < candidates.length) image.src = candidates[imageIndex];
        else image.replaceWith(researchElement('div', 'research-cover-placeholder', '</>'));
      });
      image.src = candidates[0];
      imageWrap.append(image);
    } else {
      imageWrap.append(researchElement('div', 'research-cover-placeholder', '</>'));
    }
    slide.append(imageWrap);

    const body = researchElement('div', 'research-slide-body');
    const title = researchElement('a', 'research-title', article.title || 'Untitled research article');
    title.href = article.url || `https://dev.to/${selectedResearch[index].username}/${selectedResearch[index].slug}`;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    body.append(title);

    if (article.description) body.append(researchElement('p', 'research-description', article.description));

    const tags = Array.isArray(article.tag_list) ? article.tag_list.slice(0, 4) : [];
    if (tags.length) {
      const tagWrap = researchElement('div', 'research-tags');
      tags.forEach((tag) => tagWrap.append(researchElement('span', '', `#${tag}`)));
      body.append(tagWrap);
    }

    slide.append(body);
    return slide;
  };

  const loadResearchArticles = async () => {
    try {
      const articles = await Promise.all(selectedResearch.map(async ({ username, slug }) => {
        const endpoint = `https://dev.to/api/articles/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
        const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.forem.api-v1+json' } });
        if (!response.ok) throw new Error(`DEV API returned ${response.status} for ${slug}`);
        return response.json();
      }));

      let activeIndex = 0;
      const stage = researchElement('div', 'research-stage');
      const controls = researchElement('div', 'research-controls');
      const previous = researchElement('button', 'research-arrow', '←');
      previous.type = 'button';
      previous.setAttribute('aria-label', 'Previous research article');
      const dots = researchElement('div', 'research-dots');
      const next = researchElement('button', 'research-arrow', '→');
      next.type = 'button';
      next.setAttribute('aria-label', 'Next research article');
      const counter = researchElement('span', 'research-counter');

      const showSlide = (index) => {
        activeIndex = (index + articles.length) % articles.length;
        stage.replaceChildren(renderResearchSlide(articles[activeIndex], activeIndex, articles.length));
        [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === activeIndex)));
        counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(articles.length).padStart(2, '0')}`;
      };

      previous.addEventListener('click', () => showSlide(activeIndex - 1));
      next.addEventListener('click', () => showSlide(activeIndex + 1));
      articles.forEach((_, index) => {
        const dot = researchElement('button', 'research-dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show research article ${index + 1}`);
        dot.addEventListener('click', () => showSlide(index));
        dots.append(dot);
      });

      controls.append(previous, dots, next, counter);
      researchCarousel.replaceChildren(stage, controls);
      showSlide(0);
    } catch (error) {
      console.error('Could not load selected DEV research articles:', error);
      const fallback = researchElement('p', 'feed-state error', 'Could not load the selected research articles right now. Try refreshing, or open them directly on DEV.');
      const links = researchElement('div', 'research-fallback-links');
      selectedResearch.forEach(({ slug }) => {
        const link = researchElement('a', 'research-open', slug.replaceAll('-', ' '));
        link.href = `https://dev.to/debarshis/${slug}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        links.append(link);
      });
      researchCarousel.replaceChildren(fallback, links);
    } finally {
      researchCarousel.setAttribute('aria-busy', 'false');
    }
  };

  loadResearchArticles();
}
