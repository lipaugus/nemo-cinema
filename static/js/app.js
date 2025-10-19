// static/js/app.js
// Loads movies.json and renders the list. Converts Google Drive links to web preview URLs
// to reduce chances of the mobile OS opening the Drive app. Uses window.open on click.

(function () {
  const listEl = document.getElementById('movie-list');
  const emptyEl = document.getElementById('empty');

  // Normalize poster id/value coming from JSON
  function normalizePoster(p) {
    if (!p && p !== 0) return '';
    let s = String(p).trim();
    s = s.replace(/^\/+/, ''); // remove leading slashes
    s = s.replace(/\.jpg$/i, ''); // remove .jpg if present
    return s;
  }

  // Build TMDB poster URL from normalized poster id
  function buildPosterUrl(posterNormalized) {
    if (!posterNormalized) return '';
    return `https://image.tmdb.org/t/p/w600_and_h900_bestv2/${posterNormalized}.jpg`;
  }

  // Convert various Google Drive share links to a web-friendly preview URL.
  // Returns original URL if it can't parse an ID.
  function toDriveWebUrl(url) {
    if (!url || !url.trim()) return '';
    const s = url.trim();

    // If already a preview or uc url, return it (normalize)
    if (/\/preview$/.test(s) || /\/file\/d\/[a-zA-Z0-9_-]+\/preview/.test(s) || /uc\?export=/.test(s)) {
      return s;
    }

    // Try extracting /d/FILEID/ pattern
    const match1 = s.match(/\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/);
    if (match1 && match1[1]) {
      const id = match1[1];
      // Use preview by default for better in-browser viewing
      return `https://drive.google.com/file/d/${id}/preview`;
      // If you prefer forcing download, use:
      // return `https://drive.google.com/uc?export=download&id=${id}`;
    }

    // Try extracting id=... from query string
    const match2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) {
      const id = match2[1];
      return `https://drive.google.com/file/d/${id}/preview`;
    }

    // Fallback: return original url
    return s;
  }

  // Create a single movie list item DOM node
  function createMovieItem(row) {
    const movie = row['Movie'] ?? row.Movie ?? '';
    const year = row['Year'] ?? row.Year ?? '';
    const posterRaw = row['Poster'] ?? row.Poster ?? '';
    const driveRaw = row['URL Drive'] ?? row['URL drive'] ?? row['URL'] ?? row['URLDrive'] ?? row['URL_Drive'] ?? '';

    const posterNorm = normalizePoster(posterRaw);
    const imgSrc = buildPosterUrl(posterNorm);
    const driveUrl = toDriveWebUrl(String(driveRaw || '').trim());

    const li = document.createElement('li');
    li.className = 'movie-item';

    // Wrapper: anchor if we have a drive url, otherwise a non-clickable div
    let wrapper;
    if (driveUrl) {
      const a = document.createElement('a');
      a.className = 'poster-link';
      a.href = driveUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${movie} — abrir enlace en nueva pestaña`);
      a.title = movie;

      // Intercept click and use window.open to favor opening in browser tab
      a.addEventListener('click', function (ev) {
        try {
          ev.preventDefault();
          // Use window.open with noopener; this reduces some platform intents that open apps
          window.open(driveUrl, '_blank', 'noopener');
        } catch (err) {
          // Fallback to default navigation if window.open fails
          // (e.g., some browsers block window.open in certain contexts)
          window.location.href = driveUrl;
        }
      });

      wrapper = a;
    } else {
      const div = document.createElement('div');
      div.className = 'poster-link';
      wrapper = div;
    }

    const img = document.createElement('img');
    img.className = 'poster';
    img.alt = movie || 'Póster';
    img.loading = 'lazy';

    if (imgSrc) {
      img.src = imgSrc;
      // basic error handler to show placeholder if the image fails to load
      img.addEventListener('error', function () {
        this.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
            <rect width="100%" height="100%" fill="#141416"/>
            <text x="50%" y="50%" fill="#8b949e" font-family="Arial,sans-serif" font-size="20" dominant-baseline="middle" text-anchor="middle">Sin imagen</text>
          </svg>
        `);
      });
    } else {
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
          <rect width="100%" height="100%" fill="#141416"/>
          <text x="50%" y="50%" fill="#8b949e" font-family="Arial,sans-serif" font-size="20" dominant-baseline="middle" text-anchor="middle">Sin imagen</text>
        </svg>
      `);
    }

    wrapper.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const titleEl = document.createElement('p');
    titleEl.className = 'title';
    titleEl.textContent = movie;

    const yearEl = document.createElement('p');
    yearEl.className = 'year';
    yearEl.textContent = year ? String(year) : '';

    meta.appendChild(titleEl);
    if (year) meta.appendChild(yearEl);

    li.appendChild(wrapper);
    li.appendChild(meta);

    return li;
  }

  function showError(msg) {
    emptyEl.hidden = false;
    emptyEl.textContent = msg;
  }

  // Main: fetch movies.json and render
  fetch('movies.json')
    .then(resp => {
      if (!resp.ok) throw new Error('Could not load movies.json: ' + resp.status);
      return resp.json();
    })
    .then(rows => {
      if (!Array.isArray(rows) || rows.length === 0) {
        showError('Sin películas para mostrar.');
        return;
      }
      rows.forEach(row => {
        const li = createMovieItem(row);
        listEl.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Error loading movies.json', err);
      showError('Ha ocurrido un error cargando la base de datos.');
    });
})();
