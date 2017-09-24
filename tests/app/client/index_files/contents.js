var commandQueue = new CommandQueue(
	{
		'gpiBridge': function(params, chunk, done){
			$.ajax({
				'url': '/apis/commandQueue',
				'data': {
					'params': params
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
var terminal = commandQueue.createTerminal( document.getElementById('finder1') );
console.log(commandQueue);
