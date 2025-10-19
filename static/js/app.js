// app.js - carga movies.json y renderiza lista
// Formato esperado: array de objetos con keys: Movie, Year, Poster, "URL Drive"

(function(){
  const listEl = document.getElementById('movie-list');
  const emptyEl = document.getElementById('empty');

  function normalizePoster(p){
    if(!p && p !== 0) return '';
    let s = String(p).trim();
    s = s.replace(/^\/+/, '');        // quitar slash inicial si existe
    s = s.replace(/\.jpg$/i, '');     // quitar .jpg si lo trae
    return s;
  }

  function buildPosterUrl(posterNormalized){
    if(!posterNormalized) return '';
    return `https://image.tmdb.org/t/p/w600_and_h900_bestv2/${posterNormalized}.jpg`;
  }

  function createMovieItem(row){
    const movie = row['Movie'] ?? row.Movie ?? '';
    const year = row['Year'] ?? row.Year ?? '';
    const posterRaw = row['Poster'] ?? row.Poster ?? '';
    const driveUrl = row['URL Drive'] ?? row['URL drive'] ?? row['URL'] ?? row['URLDrive'] ?? row['URL_Drive'] ?? '';

    const posterNorm = normalizePoster(posterRaw);
    const imgSrc = buildPosterUrl(posterNorm);

    const li = document.createElement('li');
    li.className = 'movie-item';

    // wrapper: si hay URL la imagen es link, si no, solo contenedor
    let wrapper;
    if (driveUrl && driveUrl.trim()) {
      const a = document.createElement('a');
      a.className = 'poster-link';
      a.href = driveUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${movie} — abrir enlace`);
      a.title = movie;
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

    if(imgSrc){
      img.src = imgSrc;
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
    if(year) meta.appendChild(yearEl);

    li.appendChild(wrapper);
    li.appendChild(meta);

    return li;
  }

  function showError(msg){
    emptyEl.hidden = false;
    emptyEl.textContent = msg;
  }

  // MAIN: fetch movies.json (ruta relativa)
  fetch('movies.json')
    .then(resp => {
      if (!resp.ok) throw new Error('No se pudo cargar movies.json: ' + resp.status);
      return resp.json();
    })
    .then(rows => {
      if(!Array.isArray(rows) || rows.length === 0){
        showError('Sin películas para mostrar.');
        return;
      }
      rows.forEach(row => {
        const li = createMovieItem(row);
        listEl.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Error cargando movies.json', err);
      showError('Ha ocurrido un error cargando la base de datos.');
    });
})();
