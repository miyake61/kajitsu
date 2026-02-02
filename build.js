// このスクリプトは microCMS からデータ (news, rooms, photo) を取得し、
// そのデータを使って index.html の特定箇所（予約席？）を書き換えるものです。
// 以下に要点を整理します。

const fs = require('fs');

// --- microCMSの設定（あなたの情報を直接入れています） ---
const SERVICE_ID = "aizu-tsurugajo-inn";
const API_KEY = "N0DjcWDusrLYS2MsJBrmptKGPtt1G0dbkbwv";

async function build() {
    console.log("調理開始（ビルド中）...");
    const headers = { "X-MICROCMS-API-KEY": API_KEY };
    
    try {
        // 1. microCMSから news, rooms, photo データを取得
        console.log("データを取得しています...");
        const newsData = await (await fetch(`https://${SERVICE_ID}.microcms.io/api/v1/news`, { headers })).json();
        const roomsData = await (await fetch(`https://${SERVICE_ID}.microcms.io/api/v1/rooms`, { headers })).json();
        const photoData = await (await fetch(`https://${SERVICE_ID}.microcms.io/api/v1/photo`, { headers })).json();

        // 2. 取得したデータを HTML の一部として変換
        // 新着情報
        const newsHtml = newsData.contents.map(item => {
            const date = new Date(item.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
            return `<li class="news-item">
                <div class="news-date">${date}</div>
                <div class="news-content"><a href="news-detail.html?id=${item.id}" class="news-link">${item.title}</a></div>
            </li>`;
        }).join('');

        // お部屋情報
        const roomsHtml = roomsData.contents.map(room => `
            <div class="room-item">
                <img src="${room.image.url}" alt="${room.title}" onclick="openModal('${room.image.url}', '${room.title}')">
                <h3>${room.title}</h3>
                <p>${room.description.replace(/\n/g, '<br>')}</p>
            </div>
        `).join('');

        // フォトギャラリー
        const photoHtml = photoData.contents.map((photo, index) => {
            const text = photo.caption || "";
            return `
                <div class="photo-item ${index < 3 ? 'is-visible' : ''}">
                    <img src="${photo.image.url}" alt="${text}" onclick="openModal('${photo.image.url}', '${text}')">
                    ${text ? `<div class="photo-caption">${text}</div>` : ""}
                </div>
            `;
        }).join('');

        // 3. index.html を読み込んで “どこか” を取得したデータで置き換える
        // コメントによると「予約席を書き換える」となっているが、実際には
        // html.replace('', newsHtml); など空文字部分をまとめて上書きしているので
        // index.html の特定の空の挿入部が予約席なのであれば、その部分を書き換えている。
        // （通常、<!-- NEWS_PLACEHOLDER --> などで場所特定するが、ここでは空文字になっている）

        console.log("HTMLを組み立てています...");
        let html = fs.readFileSync('index.html', 'utf8');
        // 3つの空文字に順に、newsHtml, roomsHtml, photoHtml を入れることで挿入している
                html = html.replace('<!-- NEWS_LIST -->', newsHtml);
                html = html.replace('<!-- ROOMS_LIST -->', roomsHtml);
                html = html.replace('<!-- PHOTO_LIST -->', photoHtml);

        // 4. 完成品を dist フォルダに出力
        if (!fs.existsSync('dist')) fs.mkdirSync('dist');
        fs.writeFileSync('dist/index.html', html);
        
        // 必要な静的ファイルも dist にコピー
        if (fs.existsSync('style.css')) fs.copyFileSync('style.css', 'dist/style.css');
        if (fs.existsSync('news-detail.html')) fs.copyFileSync('news-detail.html', 'dist/news-detail.html');

        console.log("調理完了！ dist フォルダに爆速版サイトが出来上がりました。");
    } catch (error) {
        console.error("エラーが発生しました:", error);
    }
}

build();