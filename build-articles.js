const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://onlinestopwatch24.com';
const POSTS_DIR = path.join(__dirname, 'posts');
const ARTICLES_DIR = path.join(__dirname, 'articles');

// Ensure articles output directory exists
if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR);

// --- Minimal Markdown Parser (no dependencies) ---
function parseMarkdown(md) {
  let html = md;

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2ecc71;">$1</a>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> not already inside <ul> into <ol>
  html = html.replace(/(<li>.*<\/li>\n?)(?!<\/ul>)/g, (match) => {
    return match;
  });

  // Paragraphs — wrap remaining lines
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<pre') || block.startsWith('<li')) {
      return block;
    }
    return `<p>${block}</p>`;
  }).join('\n\n');

  // Clean up any remaining single newlines within paragraphs
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
    return `<p>${content.replace(/\n/g, ' ')}</p>`;
  });

  return html;
}

// --- Parse Frontmatter ---
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  });

  return { meta, body: match[2] };
}

// --- Article HTML Template ---
function articleTemplate(meta, contentHtml, slug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="../style.css">
    <link rel="canonical" href="${DOMAIN}/articles/${slug}.html" />
    <title>${meta.title} | OnlineStopwatch24</title>
    <meta name="description" content="${meta.description || ''}">
    <meta name="keywords" content="${meta.keywords || ''}">

    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description || ''}">
    <meta property="og:url" content="${DOMAIN}/articles/${slug}.html">
    <meta property="og:site_name" content="OnlineStopwatch24">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description || ''}">

    <style>
        :root { --bg: #f8fafc; --primary: #2ecc71; --text: #1e293b; --secondary: #64748b; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; color: var(--text); line-height: 1.8; }

        nav { background: white; padding: 1rem 5%; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .logo { font-weight: 800; color: var(--primary); text-decoration: none; font-size: 1.5rem; }
        .nav-links a { margin-left: 20px; text-decoration: none; color: var(--text); font-weight: 500; font-size: 0.9rem; }

        .article-container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
        .article-card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .article-meta { color: var(--secondary); font-size: 0.9rem; margin-bottom: 25px; }
        .article-card h1 { color: var(--text); font-size: 2rem; margin-top: 0; }
        .article-card h2 { color: var(--primary); margin-top: 30px; }
        .article-card h3 { color: var(--text); margin-top: 25px; }
        .article-card ul, .article-card ol { padding-left: 20px; }
        .article-card li { margin-bottom: 8px; }
        .article-card a { color: var(--primary); text-decoration: none; font-weight: 500; }
        .article-card a:hover { text-decoration: underline; }
        .back-link { display: inline-block; margin-bottom: 20px; color: var(--primary); text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>

<nav>
    <a href="../index.html" class="logo">\u23F1 OnlineStopwatch</a>
    <div class="nav-links">
        <a href="../index.html">Stopwatch</a>
        <a href="../timer.html">Timer</a>
        <a href="../countdown.html">Countdown</a>
        <a href="../articles.html">Articles</a>
        <a href="../about.html">About</a>
        <a href="../help.html">How to Use</a>
    </div>
</nav>

<div class="article-container">
    <a href="../articles.html" class="back-link">\u2190 Back to Articles</a>
    <article class="article-card">
        <h1>${meta.title}</h1>
        <div class="article-meta">Published: ${meta.date || 'Unknown'} | ${meta.readTime || ''} read</div>
        ${contentHtml}
    </article>
</div>

<footer style="padding: 40px 0; border-top: 1px solid #e2e8f0; text-align: center;">
    <a href="../help.html" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 0.85rem;">Help</a> |
    <a href="../about.html" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 0.85rem;">About</a> |
    <a href="../contact.html" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 0.85rem;">Contact</a> |
    <a href="../terms.html" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 0.85rem;">Terms</a> |
    <a href="../privacy.html" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 0.85rem;">Privacy</a>
    <p style="color: #cbd5e1; margin-top: 20px;">&copy; 2026 OnlineStopwatch24</p>
</footer>

</body>
</html>`;
}

// --- Articles Listing Page Template ---
function articlesPageTemplate(articles) {
  const articleCards = articles.map((a, i) => `
        <article class="card" style="text-align: left; max-width: 900px; margin: 0 auto 40px auto; padding: 40px;">
            <h2 style="color: var(--text);"><a href="articles/${a.slug}.html" style="color: var(--text); text-decoration: none;">${i + 1}. ${a.meta.title}</a></h2>
            <p style="color: var(--secondary); font-size: 0.9rem; margin-bottom: 20px;">Published: ${a.meta.date || 'Unknown'} | ${a.meta.readTime || ''} read</p>
            <p>${a.meta.description || ''}</p>
            <a href="articles/${a.slug}.html" style="color: var(--primary); font-weight: 600; text-decoration: none;">Read more &rarr;</a>
        </article>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="style.css">
    <link rel="canonical" href="${DOMAIN}/articles.html" />
    <title>Time Management Articles & Productivity Guides | OnlineStopwatch24</title>
    <meta name="description" content="Expert guides on Pomodoro Technique, time boxing, Parkinson's Law, and athletic training timing. Boost your productivity with proven time management strategies.">
    <meta name="keywords" content="time management, pomodoro technique, productivity tips, time boxing, athletic training timing, deep work">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Time Management Articles & Productivity Guides">
    <meta property="og:description" content="Expert guides on Pomodoro Technique, time boxing, and athletic training timing. Boost your productivity.">
    <meta property="og:url" content="${DOMAIN}/articles.html">
    <meta property="og:site_name" content="OnlineStopwatch24">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Time Management Articles & Productivity Guides">
    <meta name="twitter:description" content="Expert guides on Pomodoro Technique, time boxing, and athletic training timing. Boost your productivity.">
</head>
<body>
    <nav>
        <div class="nav-container">
            <a href="index.html" class="logo">\u23F1 OnlineStopwatch</a>
            <div class="nav-links">
                <a href="index.html">Stopwatch</a>
                <a href="timer.html">Timer</a>
                <a href="countdown.html">Countdown</a>
                <a href="articles.html">Articles</a>
                <a href="about.html">About</a>
                <a href="help.html">How to Use</a>
            </div>
        </div>
    </nav>

    <div class="container" style="flex-direction: column; align-items: flex-start; justify-content: flex-start; overflow-y: auto;">

        <header style="margin-bottom: 40px; width: 100%; max-width: 900px; margin-left: auto; margin-right: auto;">
            <h1 style="color: var(--primary); font-size: 2.5rem;">Insights & Time Management Guides</h1>
            <p style="color: var(--secondary); font-size: 1.1rem;">Expert advice on boosting productivity, mastering the Pomodoro technique, and optimizing your daily schedule.</p>
        </header>

${articleCards}

    </div>

    <footer style="text-align: center; padding: 40px 0; color: var(--secondary); border-top: 1px solid #eee;">
        <p>&copy; 2026 OnlineStopwatch24. All rights reserved.</p>
        <div style="margin-top: 10px;">
            <a href="help.html" style="color: inherit; text-decoration: none; margin: 0 10px;">Help</a> |
            <a href="about.html" style="color: inherit; text-decoration: none; margin: 0 10px;">About</a> |
            <a href="contact.html" style="color: inherit; text-decoration: none; margin: 0 10px;">Contact</a> |
            <a href="terms.html" style="color: inherit; text-decoration: none; margin: 0 10px;">Terms</a> |
            <a href="privacy.html" style="color: inherit; text-decoration: none; margin: 0 10px;">Privacy</a>
        </div>
    </footer>
</body>
</html>`;
}

// --- Main Build ---
function build() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No posts found in posts/ directory.');
    return;
  }

  const articles = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = file.replace('.md', '');
    const contentHtml = parseMarkdown(body);

    // Write individual article HTML
    const articleHtml = articleTemplate(meta, contentHtml, slug);
    fs.writeFileSync(path.join(ARTICLES_DIR, `${slug}.html`), articleHtml);

    articles.push({ slug, meta, file });
    console.log(`  Built: articles/${slug}.html`);
  }

  // Sort by date (newest first)
  articles.sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));

  // Generate articles listing page
  const listingHtml = articlesPageTemplate(articles);
  fs.writeFileSync(path.join(__dirname, 'articles.html'), listingHtml);
  console.log(`  Built: articles.html (${articles.length} articles listed)`);

  // Write articles manifest for sitemap generator
  const manifest = articles.map(a => ({
    slug: a.slug,
    title: a.meta.title,
    date: a.meta.date,
    description: a.meta.description
  }));
  fs.writeFileSync(path.join(__dirname, 'articles-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`  Built: articles-manifest.json`);

  console.log(`\nDone! ${articles.length} articles built.`);
}

build();
