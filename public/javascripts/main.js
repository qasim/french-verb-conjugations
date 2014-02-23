$(document).ready(function() {

	//Connect to our server-side
	window.socket = io.connect('http://localhost:3000');

	//Real-time: send search requests as the user types
	$('.search').keyup(function(e) {
		if(e.keyCode == 13) {
			$('.insertion-point').html('');
			$('.loader').show();
			var searchQuery = encodeURIComponent($('.search').val());
			window.socket.emit('search', {
				query: searchQuery
			});
			console.log('sent search');
		}
	});

	window.socket.on('result', function(data) {
		console.log(data);
		$('.loader').hide();
		$('.insertion-point').append('<div class="result" id="_' + data._id + '"><b>' + data.verb + '</b><br />' + data.nature + '</div>');
		$('#_' + data._id).fadeIn('fast');
	});

	window.socket.on('no-results', function() {
		$('.loader').hide();
		$('.insertion-point').append('<div class="result" id="_0">Nothing was returned.</div>');
		$('#_0').fadeIn('fast');
	});

});