var commandQueue = new CommandQueue(
	document.getElementById('finder1'),
	{
		'gpiBridge': function(params, chunk, done){
			$.ajax({
				'url': '/apis/commandQueue',
				'data': {
					cmd: params
				},
				'success': function(data){
					chunk(data);
				},
				'complete': function(){
					done();
				}
			});
		}
	}
);
console.log(commandQueue);
