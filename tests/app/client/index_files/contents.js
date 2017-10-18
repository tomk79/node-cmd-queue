var terminal = cmdQueue.createTerminal( document.getElementById('finder1') );
// console.log(cmdQueue);

function createNewTerminal(tags){
    var $target = $('#subTerminal');
    var terminal = document.createElement('div');
    $target.html('').append(terminal);
    var terminal1 = cmdQueue.createTerminal( terminal,{
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
            var terminal1 = cmdQueue.createTerminal( terminal,{
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
