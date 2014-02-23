$(document).ready(function() {

	//Connect to our server-side
	window.socket = io.connect('http://localhost:3000');

	//Real-time: send search requests as the user types
	$('.search').keyup(function(e) {
		var searchQuery = encodeURIComponent($('.search').val());
		window.socket.emit('search', {
			query: searchQuery
		});
		console.log('sent search');
	});

	window.socket.on('results', function(data) {
		console.log('got results');
	});

});


function newSearch() {
	if($('.search').val().length > 2) {
		$('title').html(encodeURIComponent($('.search').val()));

		$('.insertion-point').slideUp('fast');
		$('.loader').show();

		$('.insertion-point').load('get_search.php', 'q=' + encodeURIComponent($('.search').val().toLowerCase()), function() {
			if($(this).html().length > 5) {
				$('.loader').hide();
				$('.insertion-point').slideDown('fast');
				if($('.result').length > 3) {
					opacityLevel = 1;
					for(var i = 3; i <= $('.result').length; i++) {
						opacityLevel = 1 - (i / $('.result').length);
						$('.result').eq(i).css('opacity', opacityLevel);
					}
				}
			} else {
				$('.insertion-point').html('<div class="result" style="text-align: center;">That returned nothing.</div>');
				$('.loader').hide();
				$('.insertion-point').slideDown('fast');
			}
		});
	}
}