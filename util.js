function bold(text) {
  return `<b>${text}</b>`;
}

function italize(text) {
  return `<i>${text}</i>`;
}

function capitalize(text) {
  const strArr = text.split(' ');
  for (let i = 0; i < strArr.length; i++) {
    strArr[i] = strArr[i][0].toUpperCase() + strArr[i].substring(1);
  }
  return strArr.join(' ');
}

function cleanUnderscore(text) {
  return text.split('_').join(' ');
}

function parseMenu(rawData, hiddenFood) {
  let menu = '';
  for (let key in rawData) {
    if (key === 'day' || key === 'date' || key === '_id' || hiddenFood[key]) {
      continue;
    }
    console.log(key);
    menu += `${bold(capitalize(cleanUnderscore(key)))}\n`;
    const items = rawData[key];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item === 'OR') {
        menu += `${italize(item)}\n`;
      } else {
        menu += `${item}\n`;
      }
    }
    menu += '\n';
  }
  return menu;
}

function parseCallback(data) {
  return data.split('.', 2);
}

module.exports = { bold, parseMenu, capitalize, parseCallback, cleanUnderscore };
