console.log('Ncore extension has started...');

const content = document.querySelector('#main_tartalom');

// Parse torrents from nCore
const torrents = parseTorrents().then((torrents)=>{
    console.log('Parsed Torrents:',torrents);

    getEachTorrentDetails(torrents).then((response)=>{
            console.log('ALL TORRENT DETAILS DONE');
        getEachTorrentNfo(torrents).then((response)=>{
            console.log('ALL TORRENT NFOS DONE');
        });
    });



    // Create the table
    const table = makeTable(torrents);
    content.insertBefore(table, document.querySelector(".lista_all"));

    // Additional things
    cleanup();
    addStylesheetRules();
})


async function parseTorrents(){
    const $torrents_rows = document.querySelectorAll(".box_torrent_all .box_torrent");
    let torrents = [];
    if ($torrents_rows) {
        for(let $row of $torrents_rows){
            console.log('row:', $row);
            let torrent = {};
            const $torrent_link = $row.querySelector(".torrent_txt a") ? $row.querySelector(".torrent_txt a") : $row.querySelector(".torrent_txt2 a");
            const $upload_time_field = $row.querySelector(".box_feltoltve2");
            const $upload_size_field = $row.querySelector(".box_meret2");
            const $imdb_link = $row.querySelector(".infolink");



            torrent.title = $torrent_link.getAttribute('title');
            torrent.url = $torrent_link.getAttribute('href');
            for(match of torrent.url.matchAll(/id=(?<id>.*?)([^0-9]|$)/g)){
                torrent.id = match.groups.id;
                break;
            }
            // const torrent_details_html = await getTorrentDetails(torrent.id);
            //console.log('torrent_details_html',torrent_details_html);

            torrent.size = $upload_size_field.textContent;

            for(match of $upload_time_field.textContent.matchAll(/(?<date>\d{4}\-\d{2}\-\d{2})(?<time>\d{2}\:\d{2}\:\d{2})/g)){
                torrent.date = match.groups.date;
                torrent.time = match.groups.time;
                break;
            }

            // IMDB
            // console.log('$imdb_link', $imdb_link.getAttribute('href'), $imdb_link.textContent);
            if($imdb_link){
                torrent.imdb = { url: $imdb_link.getAttribute('href') }
                for( match of $imdb_link.textContent.matchAll(/\[imdb:\s?(?<imdb>\d+(?:\.\d)?)\]/gi) ){
                    torrent.imdb.score = match.groups.imdb;
                }
            }

            torrents.push(torrent);
        }

    }

    return torrents;
}

function makeTable(torrents){
    const table = document.createElement('table');
    table.classList.add('torrents');

    table.style.width = '100%';
    // table.style.border = '1px solid #2e2e30';
    table.style.whiteSpace = 'nowrap';

    for(const key in torrents){
        const torrent = torrents[key];
        let tr, td, a;

        // Title row
        tr = table.insertRow();

        td = tr.insertCell();
        td.classList.add('title');
        td.setAttribute('colspan',6)
        a = document.createElement('a');
        a.setAttribute('href', torrent.url);
        a.setAttribute('title', torrent.title);
        a.setAttribute('target', '_blank');
        a.innerHTML = parseTitle(torrent.title);
        td.appendChild(a);

        // Add one more row for the details
        tr = table.insertRow();
        tr.classList.add('torrent-'+torrent.id);
        tr.classList.add('torrent-details');

        // IMDB
        td = tr.insertCell();
        a = document.createElement('a');
        a.setAttribute('href', torrent.imdb?.url || '');
        a.innerHTML =  'IMDB: '+(torrent.imdb?.score || '-');
        a.setAttribute('title', 'IMDB: '+(torrent.imdb?.score || '-'));
        a.setAttribute('target', '_blank');
        td.appendChild(a);
        td.classList.add('date');

        // Date
        td = tr.insertCell();
        td.appendChild(document.createTextNode(torrent.date));
        td.classList.add('date');

        // Files
        td = tr.insertCell();
        td.innerHTML = '<a style="cursor: pointer"> Files: <span class="num-of-files">?</span></a>';
        td.classList.add('files');
        td.addEventListener('click', (event) => {
            console.log('event', event);
            // Remove the previously opened items
            for($banner of document.querySelectorAll(".files-row")){
                $banner.remove()
            };

            nextRow = event.target.closest('tr').nextSibling;
            parentTable = event.target.closest('tbody');
            console.log('aa', nextRow, parentTable);

            getTorrentFiles(torrent.id).then( (response)=>{
                response.text().then( (html)=>{
                    console.log('insertRow',key,(+key*2)+2)
                    //const filesRow = table.insertRow((+key*2)+2);
                    const filesRow = document.createElement('tr');
                    filesRow.classList.add('files-row')
                    filesRow.innerHTML = "<td colspan='6'>" + html + "</td>";
                    parentTable.insertBefore(filesRow, nextRow);
                })
            })
        });

        // Comments
        td = tr.insertCell();
        td.innerHTML = '<a href=""> Comments: <span class="num-of-comments">?</span></a>';
        td.classList.add('comments');

        // Download Torrent Button
        td = tr.insertCell();
        a = document.createElement('a');
        a.innerHTML = '-';
        a.classList.add('torrent-'+torrent.id);
        td.appendChild(a);
        td.classList.add('download-col');

        // NFO Button
        td = tr.insertCell();
        a = document.createElement('a');
        a.setAttribute('href','https://ncore.pro/ajax.php?action=nfo&id='+torrent.id);
        a.setAttribute('title', 'NFO');
        a.setAttribute('target', '_blank');
        a.innerHTML = 'NFO';
        a.classList.add('torrent-'+torrent.id);
        td.appendChild(a);
        td.classList.add('nfo-col');
    }

    return table;
}

function cleanup(){
   for($banner of document.querySelectorAll(".banner")){
       $banner.remove()
   };
   //document.querySelector('.lista_all').remove();

}

async function getTorrentDetails(id) {
    const response = await fetch('https://ncore.pro/ajax.php?action=torrent_drop&id='+id, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    });

    // Update Download button with the link we get from another endpoint (with signature)
    const $downloadBtnA = document.querySelector('.download-col a.torrent-'+id);
    const parser = new DOMParser();
    const $torrentDetails = parser.parseFromString(await response.text(), 'text/html');

    const download_link = $torrentDetails.querySelector('.letoltve_txt a').getAttribute('href');
    $downloadBtnA.setAttribute('href', download_link);
    $downloadBtnA.innerHTML = 'Download';

    // Update the number of files data
    const num_of_files_text = $torrentDetails.querySelector('.fajlok_txt a').textContent;
    const $numOfFiles = document.querySelector('tr.torrent-'+id+' .num-of-files');
    const num_of_files = +(num_of_files_text.match(/\d+/g)[0]);
    $numOfFiles.textContent = num_of_files || '-';
    $numOfFiles.setAttribute('data-torrent-id', id);
    $numOfFiles.style.color = num_of_files > 3 ? 'yellow' : 'inherit';
    $numOfFiles.style.color = num_of_files > 6 ? 'red' : $numOfFiles.style.color;

    // Update the number of comments data
    const num_of_comments_text = $torrentDetails.querySelector('.t_comments_txt a').textContent;
    const $numOfComments = document.querySelector('tr.torrent-'+id+' .num-of-comments');
    $numOfComments.textContent = num_of_comments_text.match(/\d+/g)[0] || '-';



    return response; // parses JSON response into native JavaScript objects
}

async function getEachTorrentDetails(torrents){
    for(const torrent of torrents){
        getTorrentDetails(torrent.id);
        await new Promise(r => setTimeout(r, 80)); // sleep
    }
}

async function getTorrentNfo(id) {
    const response = await fetch('https://ncore.pro/ajax.php?action=nfo&id='+id, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    });

    return response;
}

async function getTorrentFiles(id) {
    const response = await fetch('https://ncore.pro/ajax.php?action=files&id='+id, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    });

    return response;
}

async function getEachTorrentNfo(torrents){
    for(const torrent of torrents){
        getTorrentNfo(torrent.id).then( (nfo)=>{
            nfo.text().then((html)=>{
                html = html.replace( /(<([^>]+)>)/ig, '');
                html = html.replace( /&#x\d{1,5};/ig, '');
                html = html.replace( /(\n\s*){2,999}/ig, '');

                html = html.replace( /\n{2,999}/ig, '<br/>');

                //Highlights
                html = html.replace(/(Subtitles?)/gi,'<span style="color: yellow">$1</span>');
                html = html.replace(/(Felirat(ok)?)/gi,'<span style="color: yellow">$1</span>');
                html = html.replace(/(Audio)/gi,'<span style="color: yellow">$1</span>');

                torrent.nfo = html;
            })
        })

        await new Promise(r => setTimeout(r, 90)); // sleep
    }
}

function parseTitle(title){
    // Warnings
    title = title.replace(/(Dolby[\W_]Vision)/gi,'<span style="color: yellow">$1</span>');
    title = title.replace(/(dovi)/gi,'<span style="color: yellow">$1</span>');
    title = title.replace(/(TrueHD)/gi,'<span style="color: yellow">$1</span>');
    title = title.replace(/(7\.1)/gi,'<span style="color: yellow">$1</span>');
    title = title.replace(/(HDR)/gi,'<span style="color: yellow">$1</span>');
    title = title.replace(/(720p?)/gi,'<span style="color: red">$1</span>');

    // Requirements
    title = title.replace(/(Atmos)/gi,'<span style="color: green">$1</span>');
    title = title.replace(/(5\.1)/gi,'<span style="color: green">$1</span>');

    // Quality
    title = title.replace(/(2160p?)/gi,'<span style="color: green">$1</span>');
    title = title.replace(/(1080p?)/gi,'<span style="color: greenyellow">$1</span>');

    return title;
}

function addStylesheetRules () {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    const styleSheet = styleEl.sheet;
    styleSheet.insertRule('table.torrents { background-color: #222326; border-collapse: collapse; }', 0);
    styleSheet.insertRule('table.listrow_table { white-space: break-spaces }', 0);
    styleSheet.insertRule('table.torrents td { border: none; padding: 14px 14px 0 14px;  font-size: 16px;}', 1);
    styleSheet.insertRule('table.torrents td.title a { color: #CFD1D5 }', 1);
    styleSheet.insertRule('table.torrents tr.torrent-details td { padding-bottom: 16px; padding-top: 5px;  border-bottom: 1px solid #2e2e30;  font-size: 13px; color: #8C8F94;  }', 2);
}
