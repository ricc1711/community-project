const templateEreigniskarte = `
  <li class="ereigniskarte card">

    <figure class="flex flex-col h-full">
      <img src="{{image}}" alt="Bild">

      <figcaption class="card-body flex flex-col">
        <h3 class="card-title pb-4 flex-grow">{{title}}</h3>
          <a href="{{url}}" target="_blank"></a>
        <div class="ereigniskarte__desc">
          {{desc}}
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
        <h3 class="card-title pb-4 flex-grow">{{title}}</h3>
          <a href="{{url}}" target="_blank"></a>
        <div class="">
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

const templates = {
  ereigniskarten: templateEreigniskarte,
  aktionen: templateAktionen
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

  

function renderItems(items, target) {

  const targetElement = document.getElementById(target);
  const template = templates[target];
  console.log(target)
  items.forEach(item => {
    
    const content = item.content;
    if (!content) return;

    const title = content.title;
    const url = content.url;
    const body = content.body;
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
    }
    ).map(label => {
      const match = label.name.match(/\: (.*)/); // erste Zahl suchen
      const number = match ? match[0] : null;
      return number;
    });

    const itemData = {
      title,
      url,
      desc,
      tags,
      points,
      image
    };

    console.log(itemData)
    
    const renderedItem = Mustache.render(template, itemData);
    targetElement.innerHTML += renderedItem;
  });
}


function processItems(itemStack) {
  renderItems(itemStack.ereigniskarten, 'ereigniskarten');
  renderItems(itemStack.aktionskarten, 'aktionen');

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

  return {ereigniskarten, aktionskarten};
}

fetchItemsFromApi()
  .then(assignItems)
  .then(processItems)
  .catch(err => console.error('Fehler beim Laden:', err));
