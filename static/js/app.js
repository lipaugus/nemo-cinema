// app.js - minimalista, lectura de moviesDriveDB.xlsx y renderizado
// Asume columnas: Movie, Year, Poster, URL Drive

(async function(){
  const listEl = document.getElementById('movie-list');
  const emptyEl = document.getElementById('empty');

  function normalizePoster(p){
    if(!p && p !== 0) return '';
    let s = String(p).trim();
    // quitar slashes iniciales
    s = s.replace(/^\/+/, '');
    // quitar extensión si viene con .jpg para evitar dobles .jpg
    s = s.replace(/\.jpg$/i, '');
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

    // link envuelve imagen para click hacia Drive
    const a = document.createElement('a');
    a.className = 'poster-link';
    a.href = driveUrl || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `${movie} — abrir enlace de reproducción`);
    a.title = `${movie}`;

    const img = document.createElement('img');
    img.className = 'poster';
    img.alt = movie || 'Póster';
    img.loading = 'lazy';

    // fallback si no hay poster
    if(imgSrc){
      img.src = imgSrc;
    } else {
      // placeholder SVG data URI (minimal)
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
          <rect width="100%" height="100%" fill="#141416"/>
          <text x="50%" y="50%" fill="#8b949e" font-family="Arial,sans-serif" font-size="20" dominant-baseline="middle" text-anchor="middle">Sin imagen</text>
        </svg>
      `);
    }

    a.appendChild(img);

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

    li.appendChild(a);
    li.appendChild(meta);

    return li;
  }

  async function loadXLSX(path){
    try{
      const resp = await fetch(path);
      if(!resp.ok) throw new Error('No se pudo cargar el archivo: ' + resp.status);
      const arrayBuffer = await resp.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {type:'array'});
      // tomar la primera hoja
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
      return rows;
    } catch(err){
      console.error('Error leyendo XLSX', err);
      throw err;
    }
  }

  // MAIN
  try{
    const rows = await loadXLSX('/moviesDriveDB.xlsx'); // archivo en la raiz del repo
    if(!rows || rows.length === 0){
      emptyEl.hidden = false;
      return;
    }
    // renderizar en orden
    rows.forEach(row=>{
      const li = createMovieItem(row);
      listEl.appendChild(li);
    });
  } catch(err){
    emptyEl.hidden = false;
    emptyEl.textContent = 'Ha ocurrido un error cargando la base de datos.';
  }
})();
