const templateEreigniskarte = `
  <li class="ereigniskarte card is-scaleable">

    <figure class="flex flex-col h-full">


      <figcaption class="card-body flex flex-col">
        <h3 class="card-title pb-4">{{title}}</h3>
          <a href="{{url}}" target="_blank"></a>
        <div class="ereigniskarte__desc">
          {{{desc}}}
        </div>
        <dl class="border-t border-t-2 pt-4 border-pink-600">
          {{#points}}
          <dt class="inline">Punkte</dt>
          <dd class="inline">{{points}}</dd>
          {{/points}}
        </dl>
      </figcaption>
    </figure>
  </li>
`;

const templateAktionen = `
  <li class="aktionskarte card">

    <figure class="flex flex-col h-full">
    
      <figcaption class="card-body flex flex-col">
        <h3 class="card-title pb-4"><a href="{{url}}" target="_blank" class="btn btn-primary mt-4">{{title}}</a></h3>
        
        <div class="flex-grow pb-5">{{{body}}}</div>

        <dl class="border-t border-t-2 pt-4 border-pink-600">
          {{#points}}
          <dt class="inline"><span class="text-xl">⏱️</span> Punkte:</dt>
          <dd class="inline">{{points}}</dd>
          {{/points}}

          {{#teamSize}}
          <dt class="inline"><span class="text-xl">👫</span> Teamgröße:</dt>
          <dd class="inline">{{teamSize}}</dd>
          {{/teamSize}}
        </dl>

      </figcaption>
    </figure>
  </li>
`;

const templateAktionenBacklog = `
  <li class="aktionskarte card">

    <figure class="flex flex-col h-full">
    
      <figcaption class="card-body flex flex-col">
        <h3 class="card-title pb-4"><a href="{{url}}" target="_blank" class="btn btn-primary mt-4">{{title}}</a></h3>
        
        <div class="flex-grow pb-5">{{{body}}}</div>

        <dl class="border-t border-t-2 pt-4 border-pink-600">
          {{#points}}
          <dt class="inline"><span class="text-xl">⏱️</span> Punkte:</dt>
          <dd class="inline">{{points}}</dd>
          {{/points}}

          {{#teamSize}}
          <dt class="inline"><span class="text-xl">👫</span> Teamgröße:</dt>
          <dd class="inline">{{teamSize}}</dd>
          {{/teamSize}}
        </dl>

      </figcaption>
    </figure>
  </li>
`;

const templates = {
  ereigniskarten: templateEreigniskarte,
  aktionen: templateAktionen,
  aktionenBacklog: templateAktionenBacklog
}

async function fetchItemsFromApi() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error('Fehler beim Laden der Daten von der API');
  }

  const items = await response.json();
  return items;
}

function truncate(str, max = 250) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function getBodyText(body) {
  if (!body) return '';

  // bild entfernen
  const bodyWithoutImage = body.replace(/!\[.*?\]\(.*?\)/g, '');
  return bodyWithoutImage;
}

function getImageFromBody(body) {
  if (!body) return '';

  // Bild-URL extrahieren
  const imageMatch = body.match(/!\[.*?\]\((.*?)\)/);
  if (imageMatch && imageMatch[1]) {
    const imageUrl = imageMatch[1];
    return imageUrl;
  } else {
    return '';
  }
}

const prepareBodyText = (bodyText) => {
  if (!bodyText) return '';

  const textShort = truncate(bodyText, 250);
  const textWithProperHeadlines = textShort.replace(/## /gm, '#### ' );
  return textWithProperHeadlines;
};


function renderItems(items, target) {

  const targetElement = document.getElementById(target);
  const template = templates[target];

  items.forEach(item => {
    if (!item.content) return;
    
    const content = item.content;
    if (!content) return;

    const md = markdownit()
    const title = content.title;
    const url = content.url;
    const bodyText = prepareBodyText(content.body);
    const body = md.render(bodyText);
    const labels = content.labels.nodes;
    const desc = getBodyText(body);
    const image = getImageFromBody(body);

    const tags = labels.map(label => {
      return {
        name: label.name,
        color: label.color
      };
    });
    
    const points = labels.filter(label => {
      return label.name.match(/Points/);
    }).map(label => {
      const match = label.name.match(/\: (.*)/); // erste Zahl suchen
      const number = match ? match[1] : 0;
      return number;
    });

    const teamSizeArray = labels.filter(label => {
      return label.name.match(/Teamsize/);
    }).map(label => {
      const match = label.name.match(/\: (.*)/); // erste Zahl suchen
      const number = match ? match[1] : 0;
      return number;
    });

    const teamSize = teamSizeArray.join(', ');
    
    const itemData = {
      title,
      url,
      desc,
      tags,
      points,
      teamSize,
      image,
      body
    };

    const renderedItem = Mustache.render(template, itemData);
    targetElement.innerHTML += renderedItem;
  });
}


function processItems(itemStack) {
  renderItems(itemStack.ereigniskarten, 'ereigniskarten');
  renderItems(itemStack.verifizierteAktionen, 'aktionen');
  renderItems(itemStack.aktionenBacklog, 'aktionenBacklog');
}

function assignItems(items) {

  const ereigniskarten = items.filter(item => {
    return item.content.labels.nodes.some(node => {
      return node.name === 'Ereigniskarte';
    });
  });

  const aktionskarten = items.filter(item => {

    return !item.content.labels.nodes.some(node => {
      return node.name === 'Ereigniskarte';
    });
  });

  const verifizierteAktionen = aktionskarten.filter(item => {
    return item.fieldValues.nodes.some(node => {
      return node.name && node.name === "Verified";
    });
  });

  const aktionenBacklog = aktionskarten.filter(item => {
    return item.fieldValues.nodes.some(node => {
      return node.name && node.name === "ToBeVerified";
    });
  });



  return { ereigniskarten, verifizierteAktionen, aktionenBacklog };
}

fetchItemsFromApi()
  .then(assignItems)
  .then(processItems)
  .catch(err => console.error('Fehler beim Laden:', err));
