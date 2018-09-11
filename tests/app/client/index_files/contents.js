cmdQueue.createTerminal( document.getElementById('finder1') );
cmdQueue.createTerminal( null, {
    'name': 'headlessTerminal',
    'write': function(message){
        console.info(message);
    }
} );
// console.log(cmdQueue);

function createNewTerminal(tags){
    var $target = $('#subTerminal');
    var terminal = document.createElement('div');
    $target.html('').append(terminal);
    cmdQueue.createTerminal( terminal,{
        'name': 'newTerminal',
        'tags': tags
    } );
    $(terminal).addClass('terminal');
}

function createNewQueueIdTerminal(){
    cmdQueue.addQueueItem(['ls', '-la'], {
        'accept': function(queueId){
            var $target = $('#subTerminal');
            var terminal = document.createElement('div');
            $target.html('').append(terminal);
            cmdQueue.createTerminal( terminal,{
                'name': 'newTerminal',
                'queueId': queueId
            } );
            $(terminal).addClass('terminal');
        },
        'open': function(message){},
        'stdout': function(message){},
        'stderr': function(message){},
        'close': function(message){
            console.info('Completed.', message);
        }
    });
}
