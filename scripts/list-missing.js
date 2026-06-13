// scripts/list-missing.js - 列出所有缺失海报的影视条目
var path = require('path');
var fs = require('fs');

process.env.LH_DATA_DIR = path.join(__dirname, '..', 'data');

var ROOT = path.join(__dirname, '..');
var SHARED = path.join(ROOT, 'electron', 'shared-legacy');

var posterFetcher = require(path.join(SHARED, 'poster-fetcher.js'));
var yearCatalog = require(path.join(SHARED, 'year-catalog.js'));
var animeCatalog = require(path.join(SHARED, 'anime-catalog.js'));
var jpMovies = [];
var krMovies = [];
try { jpMovies = require(path.join(ROOT, 'jp-movie-catalog.json')); } catch (e) {}
try { krMovies = require(path.join(ROOT, 'kr-movie-catalog.json')); } catch (e) {}

var allShows = [];
for (var type of ['tv', 'movie', 'anime']) {
  var cat = yearCatalog.CATALOG[type];
  if (!cat) continue;
  for (var sub of Object.keys(cat)) {
    for (var item of cat[sub]) {
      allShows.push({ name: item.name, year: item.year, type: type, sub: sub, source: 'year-catalog' });
    }
  }
}
for (var item of animeCatalog.HOT_ANIME) {
  allShows.push({ name: item.name, year: item.year, type: 'anime', sub: item.cat, source: 'anime-catalog' });
}
for (var item of jpMovies) {
  allShows.push({ name: item.name, year: null, type: 'movie', sub: 'jp', source: 'jp-movie-catalog' });
}
for (var item of krMovies) {
  allShows.push({ name: item.name, year: null, type: 'movie', sub: 'kr', source: 'kr-movie-catalog' });
}

var missing = [];
for (var show of allShows) {
  var cached = posterFetcher.getCachedPoster(show.name, show.year);
  if (!cached) {
    missing.push(show);
  }
}

var modules = [
  { label: '📺 电视剧', filter: function(s) { return s.type === 'tv'; } },
  { label: '🎬 电影 (year-catalog)', filter: function(s) { return s.type === 'movie' && s.source === 'year-catalog'; } },
  { label: '🎌 动漫 (year-catalog)', filter: function(s) { return s.type === 'anime' && s.source === 'year-catalog'; } },
  { label: '🎌 动漫 (anime-catalog)', filter: function(s) { return s.source === 'anime-catalog'; } },
  { label: '🇯🇵 日本电影 (外部)', filter: function(s) { return s.source === 'jp-movie-catalog'; } },
  { label: '🇰🇷 韩国电影 (外部)', filter: function(s) { return s.source === 'kr-movie-catalog'; } },
];

for (var m = 0; m < modules.length; m++) {
  var mod = modules[m];
  var items = missing.filter(mod.filter);
  if (items.length === 0) continue;

  console.log('\n' + mod.label + ' (' + items.length + ' 部):');
  console.log('─'.repeat(50));

  var bySub = {};
  for (var i = 0; i < items.length; i++) {
    var sub = items[i].sub || '(无)';
    if (!bySub[sub]) bySub[sub] = [];
    bySub[sub].push(items[i]);
  }

  for (var sub of Object.keys(bySub)) {
    var list = bySub[sub];
    if (Object.keys(bySub).length > 1) console.log('  [' + sub + ']');
    for (var j = 0; j < list.length; j++) {
      var yr = list[j].year ? ' (' + list[j].year + ')' : '';
      console.log('    ' + (j + 1) + '. ' + list[j].name + yr);
    }
  }
}

console.log('\n═══════════════════════════════');
console.log('合计: ' + missing.length + ' 部缺失海报');
