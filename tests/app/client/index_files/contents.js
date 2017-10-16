var terminal = commandQueue.createTerminal( document.getElementById('finder1') );
// console.log(commandQueue);

function createNewTerminal(tags){
    var $target = $('#subTerminal');
    var terminal = document.createElement('div');
    $target.html('').append(terminal);
    var terminal1 = commandQueue.createTerminal( terminal,{
        'tags': tags
    } );
    $(terminal).addClass('terminal');
}

function createNewQueueIdTerminal(){
    commandQueue.addQueueItem(['ls', '-la'], {
        'done': function(queueId){
            var $target = $('#subTerminal');
            var terminal = document.createElement('div');
            $target.html('').append(terminal);
            var terminal1 = commandQueue.createTerminal( terminal,{
                'queueId': queueId
            } );
            $(terminal).addClass('terminal');
        }
    });
}
