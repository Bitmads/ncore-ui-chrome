console.log('Ncore NFO formatter extension has started...');

let html = document.documentElement.innerHTML;

html = html.replace( /(<([^>]+)>)/ig, '');
html = html.replace( /[^A-Z0-9áéűúőóí\.\,\\\/,\*\+\+\ \-\_\s\n\t\r]*/igm, '');
html = html.replace( /([^A-Z0-9\s]){2,999}/igm, '');
html = html.replace( /(^.\s*?\n)/ig, '');
html = html.replace( /(\n\s*){2,999}/ig, '\n');
html = html.replace( /\n/ig, '<br/>');

//Highlights
html = html.replace(/(Sub(?:s|(?:titles?))?)/gi,'<span class="badge" style="color: #BB86FC; ">$1</span>');
html = html.replace(/(Felirat(ok)?)/gi,'<span class="badge" style="color: #BB86FC; ">$1</span>');
html = html.replace(/(Audio)/gi,'<span class="badge" style="color: #BB86FC; ">$1</span>');

html = html.replace(/(Eng(lish)?)/gi,'<span class="badge" style="color: green; ">$1</span>');
html = html.replace(/(Hun(?:gar[iy](?:an)?)?)/gi,'<span class="badge" style="color: green; ">$1</span>');
html = html.replace(/(Magyar?)/gi,'<span class="badge" class="badge" style="color: green;">$1</span>');

document.documentElement.innerHTML = html;

addGoogleFonts();
addStylesheetRules();

function addGoogleFonts () {
    let $link = document.createElement('link');
    $link.setAttribute('rel', 'stylesheet');
    $link.setAttribute('href', 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed&family=IBM+Plex+Sans:wght@100;400&display=swap');
    document.head.appendChild($link);
}




function addStylesheetRules () {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    const styleSheet = styleEl.sheet;
    styleSheet.insertRule('body { color: #e3e3e3; background-color: #121212; font-size: 22px; line-height: 1.6; font-family:\'IBM Plex Sans Condensed\', sans-serif;, serif;}', 0);
    styleSheet.insertRule('.badge { background-color: #363636; padding: 2px 4px; margin: 2px 3px; border-radius: 3px; }', 1);
}