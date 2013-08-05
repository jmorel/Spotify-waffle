// APP STRUCTURES
var nbSlots = 16; // number of slots in the jukebox
var artPieces = [
	{'folder': 'bagarre', 'name': 'Bagarre', 'author': 'trouduc'}, 
	{'folder': 'bagarre-bw', 'name': 'B&W', 'author': 'ducon'},
	{'folder': 'inanimate', 'name': '08-25-2010', 'author': 'Andy Gilmore'}];
var artID = 0;
/*var emptySlotBG; // will contain the default background
var dropHereBG;*/
var store; // local storage (html5)
var slots = Array();
var labelState; // possible values: 'ON' / 'OFF'
var togglelabelsswitch;

require(['$api/models'], function(models) {
	models.application.load('arguments').done(init);
	models.application.addEventListener('arguments', jukeboxkeyinput);
	models.application.addEventListener('dropped', function() {
		console.log(models.application.dropped);
	});

function init() {

	/*// set up reset button
	var resetbutton = document.getElementById("reset");
	resetbutton.onclick = reset;*/
	
	// set up toggle labels
	togglelabelsswitch = document.getElementById("labels-switch");
	togglelabelsswitch.onclick = togglelabels;

	// set up background art management
	document.getElementById('arrow-left').onclick = previousArt;
	document.getElementById('arrow-right').onclick = nextArt;
	
	/*// set up garbage bin
	var garbagebinarea = document.getElementById("garbagebin");
	garbagebinarea.addEventListener("dragenter", function (e) {
			e.dataTransfer.dropEffect = 'move';
			e.target.className = 'garbagebinover';
			e.preventDefault();
			e.stopPropagation();}, 
		false);
	garbagebinarea.addEventListener("dragleave", function (e) {
			e.target.className = 'garbagebin';
			e.preventDefault();
			e.stopPropagation();}, 
		false);
	garbagebinarea.addEventListener("dragover", function (e) {
			e.preventDefault();
			e.stopPropagation();}, 
		false);
	garbagebinarea.addEventListener("drop", function (e) {
			e.target.className = 'garbagebin';
			var slot = slots[e.dataTransfer.getData('text')];
			resetSlot(slot);
			save();
			refresh();
			},
		false);*/
	
	// set up local storage
	store = window.localStorage;
	
	// setup slots
	for(var id=1; id<=nbSlots; id++) {
		slots[id] = new Slot(id);
		setupDragNDrop(slots[id])
	}
	// recall previously saved data
	load();
	// refresh display
	refresh();
}

function nextArt() {
	artID++;
	if(artID >= artPieces.length) { artID = 0; }
	save();
	refresh();
}
function previousArt() {
	artID--;
	if(artID < 0) { artID = artPieces.length-1; }
	save();
	refresh();
}

function refresh() {

	// update art
	document.getElementById('art-name').innerHTML = artPieces[artID]['name'];
	document.getElementById('art-author').innerHTML = 'art by <a href="test.html">'+artPieces[artID]['author']+'</a>';

	// update background
	document.body.style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/bg.png')";

	/*document.getElementById('cell-1').innerHTML = "<span class=\"playlist-name\">Feelin' good</span> <hr> <span class=\"playlist-artist\">Various Artists</span>";
	document.getElementById('cell-1').style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/1-on.png')";
	document.getElementById('cell-2').innerHTML = "<span class=\"playlist-name\">Tetra</span> <hr> <span class=\"playlist-artist\">C2C</span>";
	document.getElementById('cell-2').style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/2-on.png')";
	document.getElementById('cell-3').innerHTML = "<span class=\"playlist-name\">Le tigre</span> <hr> <span class=\"playlist-artist\">Le tigre</span>";
	document.getElementById('cell-3').style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/3-on.png')";
	document.getElementById('cell-4').innerHTML = "<span class=\"playlist-name\">My horse likes you</span> <hr> <span class=\"playlist-artist\">Bonaparte</span>";
	document.getElementById('cell-4').style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/4-on.png')";
*/
	// update labels
	
	for(var id=1; id <=nbSlots; id++) {
		slot = slots[id];
		if(labelState == 'ON') {
			slot.dom.innerHTML = "<span class=\"playlist-name\">?</span>";
			slot.dom.style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/"+id+"-on.png')";
			console.log(slot.playlist);
			if(slot.playlist) {
				slot.playlist.load(['name', 'tracks']).done(function (metadata) {
					// check whether this playlist is actually an album (same album, same artist)
					// only then will we be able to update the display
					metadata.tracks.snapshot().done(function(t) {
						var tracks = t.toArray();

						var album = undefined;
						var artist = undefined;

						/*for(var i=0; i<tracks.length; i++){
							track = tracks[i];
							console.log(track);
							if(!album) { album = track.album.name; }
							if(!artist) { artist = track.artist.name; }
							if(album != track.album.name || artist != track.artist.name) { break; }
						}
						console.log('playlist #'+id);
						console.log(album);
						console.log(artist);*/

						if (!album) { album = metadata.name.decodeForHtml(); }
						if (!artist) { artist = 'various artists'};

						slot.dom.innerHTML = "<span class=\"playlist-name\">" + 
							album + 
							"</span> <hr> <span class=\"playlist-artist\">" + 
							artist + 
							"</span>";
						});
					});
			}
		} else {
			slot.dom.innerHTML = "";
			slot.dom.style.backgroundImage = "url('art/"+artPieces[artID]['folder']+"/"+id+"-off.png')";
		}
	}

	// update switch
	var on = document.getElementById("on");
	var off = document.getElementById("off");
	if(labelState == 'ON') {
		on.style.color = 'white';
		off.style.color = 'grey';
	} else {
		on.style.color = 'grey';
		off.style.color = 'white';
	}

}

function save() {
	// saving slots
	for(var id=1; id<=nbSlots; id++) {
		if(slots[id].playlist != '') {
			store.setItem('slot-'+id, slots[id].playlist.uri); }
		else { store.setItem('slot-'+id, ''); }
	}
	// saving label state
	store.setItem('labelState', labelState);
	// saving art selection
	store.setItem('artID', artID);
}

function load() {
	// recall slots playlists
	for(var id=1; id<=nbSlots; id++) {
		var playlistUri = store.getItem('slot-'+id);
		if(playlistUri != null && playlistUri != '') {
			slots[id].playlist = models.Playlist.fromURI(playlistUri);
		}
	}
	// recall labelState
	labelState = store.getItem('labelState');
	if(labelState != 'ON' && labelState != 'OFF') {labelState = 'ON';}
	// recall artID
	artID = store.getItem('artID');
	if(!artID) {artID=0;}

}

function changePlaylist(slot, playlistUri) {
	slot.playlist = models.Playlist.fromURI(playlistUri);
	refresh();
}

function setupDragNDrop(slot) {
	// allow draggable
	slot.dom.setAttribute('draggable', 'true');
	
	slot.dom.addEventListener('dragstart', function(e) {
			// data transfer properties
			e.dataTransfer.setData('text', slot.id);
		}, 
		false);
	slot.dom.addEventListener('drag', function(e) {
			// TODO
		}, 
		false);
	slot.dom.addEventListener("dragenter", function (e) {
			e.preventDefault();
			e.stopPropagation();}, 
		false);
	slot.dom.addEventListener("dragleave", function (e) {
			e.preventDefault();
			e.stopPropagation();}, 
		false);
	slot.dom.addEventListener("dragover", function (e) {
			e.preventDefault();
			e.stopPropagation();}, 
		false);
	slot.dom.addEventListener("drop", function (e) {
			e.preventDefault();
			var url = e.dataTransfer.getData('url');

			// identify current node
			var id = -1;
			var node = e.target;
			if(node.tagName == "DIV") {
				id = node.getAttribute('id').slice(5);
			} else {
				id = node.parentNode.getAttribute('id').slice(5);
			}

			if(url != undefined) { 
				// source is not from the app but from elsewhere in spotify
				var playlistUri = e.dataTransfer.getData("url");
				changePlaylist(slots[id], playlistUri);
			} /*else {
				// from another slot
				var sourceSlot = slots[e.dataTransfer.getData('text')];
				var destinationSlot = slots[id];
				if(sourceSlot.id != destinationSlot.id) {
					changePlaylist(destinationSlot, sourceSlot.playlist.uri);
					resetSlot(sourceSlot);
				}
			}*/
			save();
			refresh();},
		false);
	slot.dom.addEventListener('dragend', function(e) {
			this.parentNode.style.opacity = '1';
		}, 
		false);
}




function jukeboxkeyinput(e) {
	var args = models.application.arguments;
	console.log(args);
	if(args.length == 0) { return; }
	
	var action = args[0];
	switch(action) {
		case 'slot':
			if(args.length >= 2) { 
				playslot(args[1]); }
			break;
		/*case 'playpause':
			playpause();
			break;
		case 'toggleshuffle':
			toggleshuffle();
			break;
		case 'playnext':
			playnext();
			break;
		case 'playprevious':
			playprevious();
			break;*/
	}
}

function togglelabels() {
	if(labelState == 'ON') { labelState = 'OFF'; } 
	else { labelState = 'ON'; }
	refresh();
	save();
}
/*
function reset() {
	for(var id=1; id <=nbSlots; id++) {
		resetSlot(slots[id]);
	}
	store.clear();
}*/

function playslot(id) {
	var slot = slots[id];
	if(slot.playlist) {
		models.player.playContext(slot.playlist);
	}
}

/*true playpause() {
	player.playing = !(player.playing);
}

function toggleshuffle() {
	player.shuffle = !(player.shuffle);
}

function playnext() {
	player.next();
}

function playprevious() {
	player.previous();
}*/

function Slot(id) {
	this.id = id;
	this.playlist = '';
	this.dom = document.getElementById("cell-"+id);
}

function resetSlot(slot) {
	slot.playlist = '';
	slot.dom.innerHTML = '<span class="playlist-name">?</span>';
}

});